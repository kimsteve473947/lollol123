import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Alert,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch } from 'react-redux';
import { addTournament, Tournament, Position } from '../store/slices/tournamentSlice';
import { Colors } from '../constants/colors';

const TournamentCreateScreen: React.FC = () => {
  const dispatch = useDispatch();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    prizePool: '',
    requirements: '',
    gameMode: '5v5' as '5v5' | '3v3' | '1v1',
  });

  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [applicationDeadline, setApplicationDeadline] = useState(new Date());
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showDeadlinePicker, setShowDeadlinePicker] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.description) {
      Alert.alert('오류', '제목과 설명을 입력해주세요.');
      return;
    }

    const newTournament: Tournament = {
      id: Date.now().toString(),
      title: formData.title,
      description: formData.description,
      maxParticipants: 10,
      currentParticipants: 0,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      startTime: startDate.toTimeString().slice(0, 5),
      endTime: endDate.toTimeString().slice(0, 5),
      applicationDeadline: applicationDeadline.toISOString(),
      prizePool: formData.prizePool || '0원',
      entryFee: 0,
      isFree: true,
      status: 'recruiting',
      organizer: '현재 사용자',
      organizerProfile: {
        id: 'user1',
        username: '현재 사용자',
        riotId: 'user123#KR1',
        tournamentsHosted: 0,
        tournamentsCanceled: 0,
        mercenaryParticipated: 0,
        mercenaryCanceled: 0,
        rating: 0,
        reviewCount: 0
      },
      requirements: formData.requirements.split(',').map(req => req.trim()).filter(req => req),
      gameMode: formData.gameMode,
      positions: {
        TOP: { current: 0, max: 2 },
        JUNGLE: { current: 0, max: 2 },
        MID: { current: 0, max: 2 },
        ADC: { current: 0, max: 2 },
        SUPPORT: { current: 0, max: 2 }
      },
      tags: ['내전', '친목'],
      createdAt: new Date().toISOString()
    };

    try {
      // 실제 구현에서는 API 호출
      // await fetch('/api/tournaments', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(newTournament),
      // });

      dispatch(addTournament(newTournament));
      Alert.alert('성공', '토너먼트가 생성되었습니다!');
      
      // 폼 초기화
      setFormData({
        title: '',
        description: '',
        prizePool: '',
        requirements: '',
        gameMode: '5v5',
      });
    } catch (error) {
      Alert.alert('오류', '토너먼트 생성에 실패했습니다.');
    }
  };

  const formatDateTime = (date: Date) => {
    return `${date.toLocaleDateString('ko-KR')} ${date.toLocaleTimeString('ko-KR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>토너먼트 생성</Text>
        <Text style={styles.headerSubtitle}>새로운 토너먼트를 만들어보세요</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>토너먼트 제목 *</Text>
            <TextInput
              style={styles.input}
              value={formData.title}
              onChangeText={(value) => handleInputChange('title', value)}
              placeholder="토너먼트 제목을 입력하세요"
              placeholderTextColor={Colors.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>설명 *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.description}
              onChangeText={(value) => handleInputChange('description', value)}
              placeholder="토너먼트에 대한 설명을 입력하세요"
              placeholderTextColor={Colors.textSecondary}
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>시작 시간</Text>
            <TouchableOpacity 
              style={styles.dateButton}
              onPress={() => setShowStartDatePicker(true)}
            >
              <Ionicons name="calendar" size={20} color={Colors.primary} />
              <Text style={styles.dateText}>{formatDateTime(startDate)}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>종료 시간</Text>
            <TouchableOpacity 
              style={styles.dateButton}
              onPress={() => setShowEndDatePicker(true)}
            >
              <Ionicons name="calendar" size={20} color={Colors.primary} />
              <Text style={styles.dateText}>{formatDateTime(endDate)}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>신청 마감</Text>
            <TouchableOpacity 
              style={styles.dateButton}
              onPress={() => setShowDeadlinePicker(true)}
            >
              <Ionicons name="time" size={20} color={Colors.primary} />
              <Text style={styles.dateText}>{formatDateTime(applicationDeadline)}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>상금</Text>
            <TextInput
              style={styles.input}
              value={formData.prizePool}
              onChangeText={(value) => handleInputChange('prizePool', value)}
              placeholder="예: 100,000원"
              placeholderTextColor={Colors.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>참가 조건</Text>
            <TextInput
              style={styles.input}
              value={formData.requirements}
              onChangeText={(value) => handleInputChange('requirements', value)}
              placeholder="예: 골드 이상, 독성 플레이어 금지 (쉼표로 구분)"
              placeholderTextColor={Colors.textSecondary}
            />
          </View>

          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>토너먼트 생성</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Date Pickers */}
      {showStartDatePicker && (
        <DateTimePicker
          value={startDate}
          mode="datetime"
          display="default"
          onChange={(event, selectedDate) => {
            setShowStartDatePicker(false);
            if (selectedDate) setStartDate(selectedDate);
          }}
        />
      )}

      {showEndDatePicker && (
        <DateTimePicker
          value={endDate}
          mode="datetime"
          display="default"
          onChange={(event, selectedDate) => {
            setShowEndDatePicker(false);
            if (selectedDate) setEndDate(selectedDate);
          }}
        />
      )}

      {showDeadlinePicker && (
        <DateTimePicker
          value={applicationDeadline}
          mode="datetime"
          display="default"
          onChange={(event, selectedDate) => {
            setShowDeadlinePicker(false);
            if (selectedDate) setApplicationDeadline(selectedDate);
          }}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  form: {
    padding: 20,
    paddingTop: 10,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 12,
    color: Colors.text,
    fontSize: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dateText: {
    color: Colors.text,
    fontSize: 16,
    marginLeft: 8,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    color: Colors.textLight,
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default TournamentCreateScreen; 