import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ScrollView,
  Image,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { POSITIONS } from '../constants/positions';

interface AuthScreenProps {
  onLogin: (userData: any) => void;
}

interface UserData {
  email: string;
  password: string;
  name: string;
  phone: string;
  birthDate: string;
  riotId: string;
  riotTag: string;
  mainPosition: string;
  subPosition: string;
  tier: string;
  rank: string;
  profileIcon: string;
  isVerified: boolean;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [step, setStep] = useState(1); // 1: 기본정보, 2: 본인인증, 3: 라이엇연동, 4: 포지션선택
  const [showPositionModal, setShowPositionModal] = useState(false);
  const [positionType, setPositionType] = useState<'main' | 'sub'>('main');
  
  const [formData, setFormData] = useState<Partial<UserData>>({
    email: '',
    password: '',
    name: '',
    phone: '',
    birthDate: '',
    riotId: '',
    riotTag: '',
    mainPosition: '',
    subPosition: '',
    tier: '',
    rank: '',
    profileIcon: '',
    isVerified: false,
  });

  const [verificationCode, setVerificationCode] = useState('');
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [isRiotConnected, setIsRiotConnected] = useState(false);

  const tiers = [
    'IRON', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 
    'EMERALD', 'DIAMOND', 'MASTER', 'GRANDMASTER', 'CHALLENGER'
  ];

  const ranks = ['IV', 'III', 'II', 'I'];

  const handleLogin = () => {
    if (!formData.email || !formData.password) {
      Alert.alert('오류', '이메일과 비밀번호를 입력해주세요.');
      return;
    }

    // 로그인 로직 (실제로는 서버 API 호출)
    const userData = {
      id: 'user1',
      email: formData.email,
      name: '테스트유저',
      tier: 'GOLD',
      rank: 'II',
      mainPosition: 'ADC',
      subPosition: 'MID',
      profileIcon: 'https://ddragon.leagueoflegends.com/cdn/13.24.1/img/profileicon/1.png',
      isVerified: true,
    };

    onLogin(userData);
  };

  const handleNextStep = () => {
    switch (step) {
      case 1:
        if (!formData.email || !formData.password || !formData.name || !formData.phone || !formData.birthDate) {
          Alert.alert('오류', '모든 필드를 입력해주세요.');
          return;
        }
        // 미성년자 확인
        const birthYear = parseInt(formData.birthDate!.split('-')[0]);
        const currentYear = new Date().getFullYear();
        if (currentYear - birthYear < 18) {
          Alert.alert('미성년자 보호', '만 18세 미만은 가입할 수 없습니다.');
          return;
        }
        setStep(2);
        break;
      case 2:
        if (!isPhoneVerified) {
          Alert.alert('오류', '휴대폰 인증을 완료해주세요.');
          return;
        }
        setStep(3);
        break;
      case 3:
        if (!isRiotConnected) {
          Alert.alert('오류', '라이엇 계정 연동을 완료해주세요.');
          return;
        }
        setStep(4);
        break;
      case 4:
        if (!formData.mainPosition || !formData.subPosition) {
          Alert.alert('오류', '주 포지션과 부 포지션을 선택해주세요.');
          return;
        }
        completeRegistration();
        break;
    }
  };

  const sendVerificationCode = () => {
    if (!formData.phone) {
      Alert.alert('오류', '휴대폰 번호를 입력해주세요.');
      return;
    }
    // 실제로는 SMS API 호출
    Alert.alert('인증번호 발송', '인증번호가 발송되었습니다.');
  };

  const verifyPhone = () => {
    if (verificationCode === '123456') { // 테스트용
      setIsPhoneVerified(true);
      Alert.alert('인증 완료', '휴대폰 인증이 완료되었습니다.');
    } else {
      Alert.alert('인증 실패', '인증번호가 올바르지 않습니다.');
    }
  };

  const connectRiotAccount = async () => {
    if (!formData.riotId || !formData.riotTag) {
      Alert.alert('오류', '라이엇 ID와 태그를 입력해주세요.');
      return;
    }

    // 실제로는 Riot API 호출하여 계정 정보 확인
    try {
      // 모의 API 응답
      const riotData = {
        summonerName: formData.riotId,
        tier: 'GOLD',
        rank: 'II',
        profileIconId: 1,
        verified: formData.name === formData.riotId, // 실명과 라이엇 ID 일치 확인
      };

      if (!riotData.verified) {
        Alert.alert('인증 실패', '실명과 라이엇 계정명이 일치하지 않습니다.');
        return;
      }

      setFormData(prev => ({
        ...prev,
        tier: riotData.tier,
        rank: riotData.rank,
        profileIcon: `https://ddragon.leagueoflegends.com/cdn/13.24.1/img/profileicon/${riotData.profileIconId}.png`,
      }));

      setIsRiotConnected(true);
      Alert.alert('연동 완료', '라이엇 계정 연동이 완료되었습니다.');
    } catch (error) {
      Alert.alert('연동 실패', '라이엇 계정을 찾을 수 없습니다.');
    }
  };

  const selectPosition = (positionId: string) => {
    if (positionType === 'main') {
      setFormData(prev => ({ ...prev, mainPosition: positionId }));
    } else {
      if (positionId === formData.mainPosition) {
        Alert.alert('오류', '주 포지션과 다른 포지션을 선택해주세요.');
        return;
      }
      setFormData(prev => ({ ...prev, subPosition: positionId }));
    }
    setShowPositionModal(false);
  };

  const completeRegistration = () => {
    const userData = {
      ...formData,
      id: Date.now().toString(),
      isVerified: true,
    };

    Alert.alert(
      '회원가입 완료',
      '회원가입이 완료되었습니다. 로그인해주세요.',
      [{ text: '확인', onPress: () => setIsLogin(true) }]
    );
  };

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>기본 정보 입력</Text>
      
      <TextInput
        style={styles.input}
        placeholder="이메일"
        value={formData.email}
        onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      
      <TextInput
        style={styles.input}
        placeholder="비밀번호"
        value={formData.password}
        onChangeText={(text) => setFormData(prev => ({ ...prev, password: text }))}
        secureTextEntry
      />
      
      <TextInput
        style={styles.input}
        placeholder="실명"
        value={formData.name}
        onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
      />
      
      <TextInput
        style={styles.input}
        placeholder="휴대폰 번호 (010-1234-5678)"
        value={formData.phone}
        onChangeText={(text) => setFormData(prev => ({ ...prev, phone: text }))}
        keyboardType="phone-pad"
      />
      
      <TextInput
        style={styles.input}
        placeholder="생년월일 (YYYY-MM-DD)"
        value={formData.birthDate}
        onChangeText={(text) => setFormData(prev => ({ ...prev, birthDate: text }))}
        keyboardType="numeric"
      />
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>휴대폰 본인인증</Text>
      
      <View style={styles.phoneVerificationContainer}>
        <Text style={styles.phoneNumber}>{formData.phone}</Text>
        <TouchableOpacity style={styles.sendCodeButton} onPress={sendVerificationCode}>
          <Text style={styles.sendCodeButtonText}>인증번호 발송</Text>
        </TouchableOpacity>
      </View>
      
      <TextInput
        style={styles.input}
        placeholder="인증번호 6자리"
        value={verificationCode}
        onChangeText={setVerificationCode}
        keyboardType="numeric"
        maxLength={6}
      />
      
      <TouchableOpacity style={styles.verifyButton} onPress={verifyPhone}>
        <Text style={styles.verifyButtonText}>인증 확인</Text>
      </TouchableOpacity>
      
      {isPhoneVerified && (
        <View style={styles.verifiedContainer}>
          <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
          <Text style={styles.verifiedText}>인증 완료</Text>
        </View>
      )}
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>라이엇 계정 연동</Text>
      <Text style={styles.stepDescription}>
        실명과 라이엇 계정명이 일치해야 합니다.
      </Text>
      
      <TextInput
        style={styles.input}
        placeholder="라이엇 ID (게임 내 닉네임)"
        value={formData.riotId}
        onChangeText={(text) => setFormData(prev => ({ ...prev, riotId: text }))}
      />
      
      <TextInput
        style={styles.input}
        placeholder="태그 (#KR1)"
        value={formData.riotTag}
        onChangeText={(text) => setFormData(prev => ({ ...prev, riotTag: text }))}
      />
      
      <TouchableOpacity style={styles.connectButton} onPress={connectRiotAccount}>
        <Text style={styles.connectButtonText}>라이엇 계정 연동</Text>
      </TouchableOpacity>
      
      {isRiotConnected && (
        <View style={styles.riotInfoContainer}>
          <Image source={{ uri: formData.profileIcon }} style={styles.profileIcon} />
          <View style={styles.riotInfo}>
            <Text style={styles.riotName}>{formData.riotId}#{formData.riotTag}</Text>
            <Text style={styles.riotTier}>{formData.tier} {formData.rank}</Text>
          </View>
          <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
        </View>
      )}
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>포지션 선택</Text>
      
      <View style={styles.positionSection}>
        <Text style={styles.positionLabel}>주 포지션</Text>
        <TouchableOpacity
          style={styles.positionSelector}
          onPress={() => {
            setPositionType('main');
            setShowPositionModal(true);
          }}
        >
          {formData.mainPosition ? (
            <View style={styles.selectedPosition}>
              <Image 
                source={{ uri: POSITIONS[formData.mainPosition as keyof typeof POSITIONS].icon }} 
                style={styles.positionIcon} 
              />
              <Text style={styles.positionText}>
                {POSITIONS[formData.mainPosition as keyof typeof POSITIONS].name}
              </Text>
            </View>
          ) : (
            <Text style={styles.positionPlaceholder}>주 포지션 선택</Text>
          )}
        </TouchableOpacity>
      </View>
      
      <View style={styles.positionSection}>
        <Text style={styles.positionLabel}>부 포지션</Text>
        <TouchableOpacity
          style={styles.positionSelector}
          onPress={() => {
            setPositionType('sub');
            setShowPositionModal(true);
          }}
        >
          {formData.subPosition ? (
            <View style={styles.selectedPosition}>
              <Image 
                source={{ uri: POSITIONS[formData.subPosition as keyof typeof POSITIONS].icon }} 
                style={styles.positionIcon} 
              />
              <Text style={styles.positionText}>
                {POSITIONS[formData.subPosition as keyof typeof POSITIONS].name}
              </Text>
            </View>
          ) : (
            <Text style={styles.positionPlaceholder}>부 포지션 선택</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderPositionModal = () => (
    <Modal visible={showPositionModal} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {positionType === 'main' ? '주 포지션' : '부 포지션'} 선택
            </Text>
            <TouchableOpacity onPress={() => setShowPositionModal(false)}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.positionGrid}>
            {Object.values(POSITIONS).map((position) => (
              <TouchableOpacity
                key={position.id}
                style={styles.positionOption}
                onPress={() => selectPosition(position.id)}
              >
                <Image source={{ uri: position.icon }} style={styles.positionOptionIcon} />
                <Text style={styles.positionOptionText}>{position.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );

  if (isLogin) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loginContainer}>
          <Text style={styles.title}>로그인</Text>
          
          <TextInput
            style={styles.input}
            placeholder="이메일"
            value={formData.email}
            onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          
          <TextInput
            style={styles.input}
            placeholder="비밀번호"
            value={formData.password}
            onChangeText={(text) => setFormData(prev => ({ ...prev, password: text }))}
            secureTextEntry
          />
          
          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.loginButtonText}>로그인</Text>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => setIsLogin(false)}>
            <Text style={styles.switchText}>계정이 없으신가요? 회원가입</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>회원가입</Text>
          <View style={styles.progressBar}>
            {[1, 2, 3, 4].map((stepNumber) => (
              <View
                key={stepNumber}
                style={[
                  styles.progressStep,
                  step >= stepNumber && styles.progressStepActive,
                ]}
              />
            ))}
          </View>
        </View>
        
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
        
        <View style={styles.buttonContainer}>
          {step > 1 && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setStep(step - 1)}
            >
              <Text style={styles.backButtonText}>이전</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity style={styles.nextButton} onPress={handleNextStep}>
            <Text style={styles.nextButtonText}>
              {step === 4 ? '가입 완료' : '다음'}
            </Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity onPress={() => setIsLogin(true)}>
          <Text style={styles.switchText}>이미 계정이 있으신가요? 로그인</Text>
        </TouchableOpacity>
      </ScrollView>
      
      {renderPositionModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContainer: {
    flex: 1,
  },
  loginContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 20,
  },
  progressBar: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  progressStep: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.border,
    marginHorizontal: 2,
    borderRadius: 2,
  },
  progressStepActive: {
    backgroundColor: Colors.primary,
  },
  stepContainer: {
    padding: 20,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 10,
  },
  stepDescription: {
    fontSize: 14,
    color: Colors.textMuted,
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
    color: Colors.text,
    backgroundColor: Colors.cardBackground,
  },
  phoneVerificationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  phoneNumber: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
    padding: 12,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 8,
    marginRight: 8,
  },
  sendCodeButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  sendCodeButtonText: {
    color: Colors.background,
    fontWeight: '600',
    fontSize: 14,
  },
  verifyButton: {
    backgroundColor: Colors.primary,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  verifyButtonText: {
    color: Colors.background,
    fontWeight: '600',
    fontSize: 16,
  },
  verifiedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  verifiedText: {
    color: Colors.success,
    fontWeight: '600',
    marginLeft: 8,
  },
  connectButton: {
    backgroundColor: Colors.primary,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  connectButtonText: {
    color: Colors.background,
    fontWeight: '600',
    fontSize: 16,
  },
  riotInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
    borderWidth: 1,
    borderColor: Colors.success,
  },
  profileIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  riotInfo: {
    flex: 1,
  },
  riotName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  riotTier: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  positionSection: {
    marginBottom: 20,
  },
  positionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  positionSelector: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 16,
    backgroundColor: Colors.cardBackground,
  },
  selectedPosition: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  positionIcon: {
    width: 24,
    height: 24,
    marginRight: 8,
  },
  positionText: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '500',
  },
  positionPlaceholder: {
    fontSize: 16,
    color: Colors.textMuted,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  positionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  positionOption: {
    width: '45%',
    alignItems: 'center',
    padding: 16,
    marginBottom: 16,
    backgroundColor: Colors.cardBackground,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  positionOptionIcon: {
    width: 32,
    height: 32,
    marginBottom: 8,
  },
  positionOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  backButton: {
    flex: 1,
    backgroundColor: Colors.backgroundSecondary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  backButtonText: {
    color: Colors.text,
    fontWeight: '600',
    fontSize: 16,
  },
  nextButton: {
    flex: 2,
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  nextButtonText: {
    color: Colors.background,
    fontWeight: '600',
    fontSize: 16,
  },
  loginButton: {
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  loginButtonText: {
    color: Colors.background,
    fontWeight: '600',
    fontSize: 16,
  },
  switchText: {
    textAlign: 'center',
    color: Colors.primary,
    marginTop: 20,
    fontSize: 14,
  },
});

export default AuthScreen; 