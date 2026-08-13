import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';

const PROFILE_KEY = '@machinaka-zoo/profile/v1';
export type UserProfile = { displayName: string; handle: string; bio: string };
const initialProfile: UserProfile = { displayName: 'まちなか はなこ', handle: 'hanako_zoo', bio: '散歩しながら、看板や銅像に隠れた動物を探しています。' };
const ProfileContext = createContext<{ profile: UserProfile; saveProfile: (profile: UserProfile) => Promise<void> } | null>(null);

export function ProfileProvider({ children }: PropsWithChildren) {
  const [profile, setProfile] = useState(initialProfile);
  useEffect(() => { AsyncStorage.getItem(PROFILE_KEY).then(value => { if (value) setProfile(JSON.parse(value) as UserProfile); }).catch(error => console.warn('プロフィールを復元できませんでした。', error)); }, []);
  const value = useMemo(() => ({ profile, saveProfile: async (next: UserProfile) => { setProfile(next); await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(next)); } }), [profile]);
  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  const value = useContext(ProfileContext);
  if (!value) throw new Error('useProfile must be used inside ProfileProvider');
  return value;
}
