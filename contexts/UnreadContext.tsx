import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';
import { AppState } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

const LAST_READ_KEY = 'chatLastReadAt';
const POLL_MS = 30000;

type UnreadContextType = {
  unreadCount: number;
  markChatRead: () => void;
  refreshUnread: () => void;
};

const UnreadContext = createContext<UnreadContextType>({
  unreadCount: 0,
  markChatRead: () => {},
  refreshUnread: () => {},
});

export function UnreadProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnread = useCallback(async () => {
    if (!user) {
      setUnreadCount(0);
      return;
    }
    try {
      const lastRead = (await AsyncStorage.getItem(LAST_READ_KEY)) ?? new Date(0).toISOString();

      // The user's own conversations (RLS permits reading these)
      const { data: convs } = await supabase
        .from('conversations')
        .select('id')
        .eq('user_id', user.id);

      const ids = (convs ?? []).map((c) => c.id);
      if (ids.length === 0) {
        setUnreadCount(0);
        return;
      }

      // Replies (from the AI or an employer) newer than the last time
      // the user opened the Chat tab
      const { count } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .in('conversation_id', ids)
        .in('role', ['assistant', 'employee'])
        .gt('created_at', lastRead);

      setUnreadCount(count ?? 0);
    } catch {
      // Network/permission hiccup — leave the current count untouched
    }
  }, [user?.id]);

  const markChatRead = useCallback(async () => {
    try {
      await AsyncStorage.setItem(LAST_READ_KEY, new Date().toISOString());
    } catch {
      // ignore write failures
    }
    setUnreadCount(0);
  }, []);

  useEffect(() => {
    refreshUnread();
    const interval = setInterval(refreshUnread, POLL_MS);
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') refreshUnread();
    });
    return () => {
      clearInterval(interval);
      sub.remove();
    };
  }, [refreshUnread]);

  return (
    <UnreadContext.Provider value={{ unreadCount, markChatRead, refreshUnread }}>
      {children}
    </UnreadContext.Provider>
  );
}

export function useUnread() {
  return useContext(UnreadContext);
}
