import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function usePushNotifications(userId: string | undefined, employeeId?: string) {
  useEffect(() => {
    if (!userId) return;
    registerForPushNotifications(userId, employeeId);
  }, [userId, employeeId]);
}

async function registerForPushNotifications(userId: string, employeeId?: string) {
  if (!Device.isDevice) return;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  const token = (await Notifications.getExpoPushTokenAsync({
    projectId: 'e8d15acd-9d24-4f79-8be4-977b3747da04',
  })).data;

  // Save token to Supabase
  await supabase.from('push_tokens').upsert(
    { user_id: userId, employee_id: employeeId ?? null, token },
    { onConflict: 'token' }
  );
}
