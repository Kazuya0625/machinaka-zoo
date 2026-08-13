import AsyncStorage from '@react-native-async-storage/async-storage';
import { sendReport } from './api';

const DEVICE_ID_KEY = '@machinaka-zoo/report-device-id/v1';

function createDeviceId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, character => {
    const value = Math.floor(Math.random() * 16);
    return (character === 'x' ? value : (value & 3) | 8).toString(16);
  });
}

async function getDeviceId() {
  const stored = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (stored) return stored;
  const created = createDeviceId();
  await AsyncStorage.setItem(DEVICE_ID_KEY, created);
  return created;
}

export async function reportContent(targetType: 'post' | 'comment', targetId: string, postId: string, reason: string) {
  const deviceId = await getDeviceId();
  await sendReport({ deviceId, targetType, targetId, postId, reason });
}
