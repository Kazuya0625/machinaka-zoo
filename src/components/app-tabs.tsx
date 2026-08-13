import { Tabs } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

const icons: Record<string, string> = { index: '⌂', post: '＋', mypage: '♙' };

export default function AppTabs() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#315C45',
        tabBarInactiveTintColor: '#718078',
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.label,
        tabBarIcon: ({ color }) => <Text style={[styles.icon, { color }]}>{icons[route.name]}</Text>,
      })}>
      <Tabs.Screen name="index" options={{ title: 'みつける' }} />
      <Tabs.Screen name="post" options={{ title: '投稿する' }} />
      <Tabs.Screen name="mypage" options={{ title: 'マイページ' }} />
      <Tabs.Screen name="post-detail/[id]" options={{ href: null }} />
      <Tabs.Screen name="profile-edit" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#FFFDF8',
    borderTopColor: '#E4DED1',
    height: 82,
    paddingTop: 8,
    paddingBottom: 12,
  },
  label: { fontSize: 10, fontWeight: '700' },
  icon: { fontSize: 22, lineHeight: 24, fontWeight: '700' },
});
