import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import CompanyDirectory from '../../components/CompanyDirectory';
import { useActiveCompany } from '../../contexts/CompanyContext';

export default function TabLayout() {
  const { companyId } = useActiveCompany();

  if (!companyId) {
    return <CompanyDirectory />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#1A5CFF',
        tabBarInactiveTintColor: '#aaa',
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopColor: '#eee',
          borderTopWidth: 0.5,
        },
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Profile',
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="business-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Videos',
          tabBarLabel: 'Videos',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="play-circle-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarLabel: 'Chat',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubble-ellipses-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="admin"
        options={{
          title: 'Admin',
          tabBarLabel: 'Admin',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
