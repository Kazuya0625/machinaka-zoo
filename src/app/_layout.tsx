import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import AppTabs from '@/components/app-tabs';
import { ZooProvider } from '@/data/zoo-context';
import { ProfileProvider } from '@/data/profile-context';

export default function TabLayout() {
  return (
    <ThemeProvider value={{ ...DefaultTheme, colors: { ...DefaultTheme.colors, background: '#F7F2E7' } }}>
      <ProfileProvider><ZooProvider><AppTabs /></ZooProvider></ProfileProvider>
    </ThemeProvider>
  );
}
