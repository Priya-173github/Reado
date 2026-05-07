import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import api from './api';

const OFFLINE_SESSIONS_KEY = '@offline_sessions_queue';

export interface OfflineSession {
  id: string;
  book_id: string;
  pages_read: number;
  duration_seconds: number;
  notes: string;
  started_at: string;
  ended_at: string;
  created_at: string;
}

export const queueOfflineSession = async (session: OfflineSession) => {
  try {
    const queueStr = await AsyncStorage.getItem(OFFLINE_SESSIONS_KEY);
    const queue: OfflineSession[] = queueStr ? JSON.parse(queueStr) : [];
    queue.push(session);
    await AsyncStorage.setItem(OFFLINE_SESSIONS_KEY, JSON.stringify(queue));
  } catch (error) {
    console.error('Failed to queue offline session', error);
  }
};

export const syncOfflineSessions = async () => {
  try {
    const state = await NetInfo.fetch();
    if (!state.isConnected) return { synced: 0, skipped: 0 };

    const queueStr = await AsyncStorage.getItem(OFFLINE_SESSIONS_KEY);
    if (!queueStr) return { synced: 0, skipped: 0 };
    
    const queue: OfflineSession[] = JSON.parse(queueStr);
    if (queue.length === 0) return { synced: 0, skipped: 0 };

    const response = await api.post('/sessions/sync', { sessions: queue });
    
    // Clear queue on success
    await AsyncStorage.removeItem(OFFLINE_SESSIONS_KEY);
    
    return response.data; // { synced: N, skipped: N }
  } catch (error) {
    console.error('Failed to sync offline sessions', error);
    return { synced: 0, skipped: 0 };
  }
};

// Setup network listener to auto-sync when coming online
export const setupNetworkListener = (onSyncSuccess?: (synced: number) => void) => {
  return NetInfo.addEventListener(state => {
    if (state.isConnected) {
      syncOfflineSessions().then(result => {
        if (result && result.synced > 0 && onSyncSuccess) {
          onSyncSuccess(result.synced);
        }
      });
    }
  });
};
