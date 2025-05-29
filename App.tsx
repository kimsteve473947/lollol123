import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider, useSelector, useDispatch } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { store, persistor, RootState, AppDispatch, setUser, setLoading } from './src/store';
import { Colors } from './src/constants/colors';

// Screens
import TournamentListScreen from './src/screens/TournamentListScreen';
import MercenaryProfilesScreen from './src/screens/MercenaryProfilesScreen';
import ChatScreen from './src/screens/ChatScreen';
import MyPageScreen from './src/screens/MyPageScreen';
import TournamentDetailScreen from './src/screens/TournamentDetailScreen';
import TournamentCreateScreen from './src/screens/TournamentCreateScreen';
import RankingScreen from './src/screens/RankingScreen';
import AuthScreen from './src/screens/AuthScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// 로딩 컴포넌트
const LoadingScreen: React.FC = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
    <ActivityIndicator size="large" color={Colors.primary} />
    <Text style={{ marginTop: 16, color: Colors.text, fontSize: 16 }}>로딩 중...</Text>
  </View>
);

const TournamentStack = React.memo(() => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: Colors.background,
        elevation: 0,
        shadowOpacity: 0,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
      },
      headerTintColor: Colors.text,
      headerTitleStyle: {
        fontWeight: '600',
      },
    }}
  >
    <Stack.Screen 
      name="TournamentList" 
      component={TournamentListScreen} 
      options={{ title: '내전 목록' }}
    />
    <Stack.Screen 
      name="TournamentDetail" 
      component={TournamentDetailScreen} 
      options={{ title: '내전 상세' }}
    />
    <Stack.Screen 
      name="TournamentCreate" 
      component={TournamentCreateScreen} 
      options={{ title: '내전 생성' }}
    />
  </Stack.Navigator>
));

const TabNavigator = React.memo(() => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName: keyof typeof Ionicons.glyphMap;

        if (route.name === 'TournamentStack') {
          iconName = focused ? 'list-circle' : 'list-circle-outline';
        } else if (route.name === 'Ranking') {
          iconName = focused ? 'trophy' : 'trophy-outline';
        } else if (route.name === 'MercenaryProfiles') {
          iconName = focused ? 'people' : 'people-outline';
        } else if (route.name === 'Chat') {
          iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
        } else if (route.name === 'MyPage') {
          iconName = focused ? 'person-circle' : 'person-circle-outline';
        } else {
          iconName = 'help-circle-outline';
        }

        return <Ionicons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: Colors.primary,
      tabBarInactiveTintColor: Colors.textMuted,
      tabBarStyle: {
        backgroundColor: Colors.background,
        borderTopColor: Colors.border,
        borderTopWidth: 1,
        paddingBottom: 5,
        paddingTop: 5,
        height: 60,
      },
      tabBarLabelStyle: {
        fontSize: 11,
        fontWeight: '500',
      },
      headerShown: false,
    })}
  >
    <Tab.Screen 
      name="TournamentStack" 
      component={TournamentStack}
      options={{ title: '내전' }}
    />
    <Tab.Screen 
      name="Ranking" 
      component={RankingScreen}
      options={{ title: '랭킹' }}
    />
    <Tab.Screen 
      name="MercenaryProfiles" 
      component={MercenaryProfilesScreen}
      options={{ title: '용병' }}
    />
    <Tab.Screen 
      name="Chat" 
      component={ChatScreen}
      options={{ title: '채팅' }}
    />
    <Tab.Screen 
      name="MyPage" 
      component={MyPageScreen}
      options={{ title: '마이' }}
    />
  </Tab.Navigator>
));

const AppContent: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { isLoggedIn, isLoading, user } = useSelector((state: RootState) => state.app);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        dispatch(setLoading(true));
        
        // 저장된 사용자 데이터 확인
        const userData = await AsyncStorage.getItem('userData');
        const accessToken = await AsyncStorage.getItem('accessToken');
        
        if (userData && accessToken) {
          const parsedUserData = JSON.parse(userData);
          dispatch(setUser(parsedUserData));
        }
      } catch (error) {
        console.error('App initialization error:', error);
      } finally {
        dispatch(setLoading(false));
      }
    };

    initializeApp();
  }, [dispatch]);

  const handleLogin = React.useCallback(async (userData: any) => {
    dispatch(setUser(userData));
  }, [dispatch]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isLoggedIn || !user) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  return <TabNavigator />;
};

export default function App() {
  return (
    <Provider store={store}>
      <PersistGate loading={<LoadingScreen />} persistor={persistor}>
        <NavigationContainer>
          <AppContent />
        </NavigationContainer>
      </PersistGate>
    </Provider>
  );
}
