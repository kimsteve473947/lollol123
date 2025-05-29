import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { Colors } from '../constants/colors';
import { CreditPackage, PaymentMethod, startPayment } from '../store/slices/paymentSlice';
import { addCredits } from '../store/slices/userSlice';

const CreditChargeScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const { creditPackages, paymentMethods } = useAppSelector((state) => state.payment);
  const { currentUser } = useAppSelector((state) => state.user);
  const [selectedPackage, setSelectedPackage] = useState<CreditPackage | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const handlePackageSelect = (pkg: CreditPackage) => {
    setSelectedPackage(pkg);
  };

  const handlePaymentMethodSelect = (method: PaymentMethod) => {
    setSelectedPaymentMethod(method);
  };

  const handlePurchase = async () => {
    if (!selectedPackage || !selectedPaymentMethod || !currentUser) {
      Alert.alert('오류', '패키지와 결제 방법을 선택해주세요.');
      return;
    }

    setLoading(true);
    try {
      // 결제 시작
      const paymentId = `payment_${Date.now()}`;
      const payment = {
        id: paymentId,
        type: 'credit_purchase' as const,
        amount: selectedPackage.price,
        credits: selectedPackage.credits + selectedPackage.bonusCredits,
        status: 'pending' as const,
        paymentMethod: selectedPaymentMethod.name,
        transactionId: '',
        description: `${selectedPackage.name} 구매`,
        createdAt: new Date().toISOString(),
      };

      dispatch(startPayment(payment));

      // 실제 결제 처리 (여기서는 시뮬레이션)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 결제 성공 시 크레딧 추가
      const transaction = {
        id: `credit_${Date.now()}`,
        type: 'charge' as const,
        amount: selectedPackage.credits + selectedPackage.bonusCredits,
        description: `${selectedPackage.name} 구매`,
        createdAt: new Date().toISOString(),
        status: 'completed' as const,
      };

      dispatch(addCredits({
        amount: selectedPackage.credits + selectedPackage.bonusCredits,
        transaction,
      }));

      Alert.alert(
        '충전 완료!',
        `${selectedPackage.credits + selectedPackage.bonusCredits} 크레딧이 충전되었습니다.`,
        [{ text: '확인', onPress: () => setShowPaymentModal(false) }]
      );

    } catch (error) {
      Alert.alert('결제 실패', '결제 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const PackageCard: React.FC<{ pkg: CreditPackage; isSelected: boolean }> = ({ pkg, isSelected }) => (
    <TouchableOpacity
      style={[styles.packageCard, isSelected && styles.packageCardSelected]}
      onPress={() => handlePackageSelect(pkg)}
    >
      {pkg.isPopular && (
        <View style={styles.popularBadge}>
          <Text style={styles.popularText}>인기</Text>
        </View>
      )}
      
      <Text style={styles.packageName}>{pkg.name}</Text>
      <View style={styles.creditInfo}>
        <Text style={styles.baseCredits}>{pkg.credits.toLocaleString()} 크레딧</Text>
        {pkg.bonusCredits > 0 && (
          <Text style={styles.bonusCredits}>+ {pkg.bonusCredits.toLocaleString()} 보너스</Text>
        )}
      </View>
      <Text style={styles.totalCredits}>
        총 {(pkg.credits + pkg.bonusCredits).toLocaleString()} 크레딧
      </Text>
      <Text style={styles.price}>{pkg.price.toLocaleString()}원</Text>
      <Text style={styles.description}>{pkg.description}</Text>
      
      {isSelected && (
        <View style={styles.selectedIndicator}>
          <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
        </View>
      )}
    </TouchableOpacity>
  );

  const PaymentMethodCard: React.FC<{ method: PaymentMethod; isSelected: boolean }> = ({ method, isSelected }) => (
    <TouchableOpacity
      style={[styles.paymentMethodCard, isSelected && styles.paymentMethodCardSelected]}
      onPress={() => handlePaymentMethodSelect(method)}
    >
      <View style={styles.paymentMethodInfo}>
        <Ionicons 
          name={method.type === 'card' ? 'card' : 'wallet'} 
          size={24} 
          color={Colors.primary} 
        />
        <View style={styles.paymentMethodText}>
          <Text style={styles.paymentMethodName}>{method.name}</Text>
          {method.lastFourDigits && (
            <Text style={styles.paymentMethodDetails}>**** {method.lastFourDigits}</Text>
          )}
        </View>
      </View>
      
      {isSelected && (
        <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* 현재 크레딧 */}
        <View style={styles.currentCreditCard}>
          <Text style={styles.currentCreditLabel}>현재 보유 크레딧</Text>
          <Text style={styles.currentCreditAmount}>
            {currentUser?.credits.toLocaleString() || '0'} 크레딧
          </Text>
        </View>

        {/* 크레딧 패키지 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>크레딧 패키지</Text>
          <View style={styles.packagesGrid}>
            {creditPackages.map((pkg) => (
              <PackageCard
                key={pkg.id}
                pkg={pkg}
                isSelected={selectedPackage?.id === pkg.id}
              />
            ))}
          </View>
        </View>

        {/* 결제 방법 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>결제 방법</Text>
          <View style={styles.paymentMethods}>
            {/* 기본 결제 방법들 */}
            <PaymentMethodCard
              method={{
                id: 'kakaopay',
                type: 'kakaopay',
                name: '카카오페이',
                isDefault: false,
                createdAt: '',
              }}
              isSelected={selectedPaymentMethod?.id === 'kakaopay'}
            />
            <PaymentMethodCard
              method={{
                id: 'tosspay',
                type: 'tosspay',
                name: '토스페이',
                isDefault: false,
                createdAt: '',
              }}
              isSelected={selectedPaymentMethod?.id === 'tosspay'}
            />
            <PaymentMethodCard
              method={{
                id: 'card',
                type: 'card',
                name: '신용/체크카드',
                isDefault: false,
                createdAt: '',
              }}
              isSelected={selectedPaymentMethod?.id === 'card'}
            />
            
            {/* 등록된 결제 방법들 */}
            {paymentMethods.map((method) => (
              <PaymentMethodCard
                key={method.id}
                method={method}
                isSelected={selectedPaymentMethod?.id === method.id}
              />
            ))}
          </View>
        </View>

        {/* 주의사항 */}
        <View style={styles.noticeSection}>
          <Text style={styles.noticeTitle}>주의사항</Text>
          <Text style={styles.noticeText}>
            • 크레딧은 환불이 불가능합니다.{'\n'}
            • 미성년자는 법정대리인의 동의가 필요합니다.{'\n'}
            • 결제 후 즉시 크레딧이 충전됩니다.{'\n'}
            • 문의사항은 고객센터로 연락해주세요.
          </Text>
        </View>
      </ScrollView>

      {/* 구매 버튼 */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[
            styles.purchaseButton,
            (!selectedPackage || !selectedPaymentMethod) && styles.purchaseButtonDisabled
          ]}
          onPress={() => setShowPaymentModal(true)}
          disabled={!selectedPackage || !selectedPaymentMethod}
        >
          <Text style={styles.purchaseButtonText}>
            {selectedPackage ? `${selectedPackage.price.toLocaleString()}원 결제하기` : '패키지를 선택하세요'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 결제 확인 모달 */}
      <Modal
        visible={showPaymentModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>결제 확인</Text>
            
            {selectedPackage && (
              <View style={styles.modalInfo}>
                <Text style={styles.modalLabel}>상품</Text>
                <Text style={styles.modalValue}>{selectedPackage.name}</Text>
                
                <Text style={styles.modalLabel}>크레딧</Text>
                <Text style={styles.modalValue}>
                  {(selectedPackage.credits + selectedPackage.bonusCredits).toLocaleString()} 크레딧
                </Text>
                
                <Text style={styles.modalLabel}>결제 금액</Text>
                <Text style={styles.modalValue}>{selectedPackage.price.toLocaleString()}원</Text>
                
                <Text style={styles.modalLabel}>결제 방법</Text>
                <Text style={styles.modalValue}>{selectedPaymentMethod?.name}</Text>
              </View>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowPaymentModal(false)}
              >
                <Text style={styles.modalCancelText}>취소</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalConfirmButton, loading && styles.modalConfirmButtonDisabled]}
                onPress={handlePurchase}
                disabled={loading}
              >
                <Text style={styles.modalConfirmText}>
                  {loading ? '결제중...' : '결제하기'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  currentCreditCard: {
    margin: 20,
    padding: 20,
    backgroundColor: Colors.primaryUltraLight,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.primaryLight,
  },
  currentCreditLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  currentCreditAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.primary,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  packagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  packageCard: {
    width: '48%',
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    position: 'relative',
  },
  packageCardSelected: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    right: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.background,
  },
  packageName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  creditInfo: {
    marginBottom: 4,
  },
  baseCredits: {
    fontSize: 14,
    color: Colors.text,
  },
  bonusCredits: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
  },
  totalCredits: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 8,
  },
  price: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  description: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  paymentMethods: {
    gap: 8,
  },
  paymentMethodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  paymentMethodCardSelected: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  paymentMethodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentMethodText: {
    marginLeft: 12,
  },
  paymentMethodName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  paymentMethodDetails: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  noticeSection: {
    paddingHorizontal: 20,
    marginBottom: 100,
  },
  noticeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  noticeText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.background,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  purchaseButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  purchaseButtonDisabled: {
    backgroundColor: Colors.textMuted,
  },
  purchaseButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.background,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalInfo: {
    marginBottom: 24,
  },
  modalLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
    marginTop: 12,
  },
  modalValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: Colors.backgroundGray,
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  modalConfirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: Colors.primary,
  },
  modalConfirmButtonDisabled: {
    backgroundColor: Colors.textMuted,
  },
  modalConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.background,
  },
});

export default CreditChargeScreen; 