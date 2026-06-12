import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import CompanyDirectory from '../../components/CompanyDirectory';
import { useActiveCompany } from '../../contexts/CompanyContext';
import { useLanguage } from '../../contexts/LanguageContext';

export default function TabLayout() {
  const { companyId } = useActiveCompany();
  const { t } = useLanguage();

  if (!companyId) {
    return <CompanyDirectory />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#D85A30',
        tabBarInactiveTintColor: '#5C564C',
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopColor: '#EDE7D9',
          borderTopWidth: 0.5,
        },
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabProfile'),
          tabBarLabel: t('tabProfile'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="business-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: t('tabVideos'),
          tabBarLabel: t('tabVideos'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="play-circle-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: t('tabChat'),
          tabBarLabel: t('tabChat'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubble-ellipses-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="admin"
        options={{
          title: t('tabAdmin'),
          tabBarLabel: t('tabAdmin'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
