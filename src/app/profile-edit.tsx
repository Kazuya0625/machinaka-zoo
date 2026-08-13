import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { palette } from '@/components/zoo-ui';
import { useProfile } from '@/data/profile-context';

export default function ProfileEditScreen() {
  const router = useRouter();
  const { profile, saveProfile } = useProfile();
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [handle, setHandle] = useState(profile.handle);
  const [bio, setBio] = useState(profile.bio);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const name = displayName.trim();
    const normalizedHandle = handle.trim().replace(/^@/, '').toLowerCase();
    if (!name) return Alert.alert('表示名を入力してください');
    if (!/^[a-z0-9_]{3,20}$/.test(normalizedHandle)) return Alert.alert('ユーザーIDを確認してください', '半角英数字と「_」を使い、3〜20文字で入力してください。');
    try {
      setSaving(true);
      await saveProfile({ displayName: name.slice(0, 30), handle: normalizedHandle, bio: bio.trim().slice(0, 120) });
      Alert.alert('保存しました', 'プロフィールを更新しました。', [{ text: 'OK', onPress: () => router.back() }]);
    } catch {
      Alert.alert('保存できませんでした', 'もう一度お試しください。');
    } finally { setSaving(false); }
  };

  return <SafeAreaView style={styles.safe} edges={['top']}><KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <View style={styles.topBar}><Pressable onPress={() => router.back()} style={styles.back}><Text style={styles.backText}>‹</Text></Pressable><Text style={styles.title}>プロフィール編集</Text><View style={styles.spacer} /></View>
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.avatar}><Text style={styles.avatarText}>🐾</Text></View>
      <Field label="表示名"><TextInput value={displayName} onChangeText={setDisplayName} maxLength={30} style={styles.input} /></Field>
      <Field label="ユーザーID"><View style={styles.handleRow}><Text style={styles.at}>@</Text><TextInput value={handle} onChangeText={setHandle} autoCapitalize="none" maxLength={20} style={styles.handleInput} /></View><Text style={styles.help}>半角英数字と「_」で3〜20文字</Text></Field>
      <Field label="自己紹介"><TextInput value={bio} onChangeText={setBio} multiline maxLength={120} textAlignVertical="top" style={[styles.input, styles.bio]} /><Text style={styles.count}>{bio.length} / 120</Text></Field>
      <Text style={styles.note}>変更後に作成する投稿とコメントへ、新しい表示名が使用されます。</Text>
      <Pressable disabled={saving} onPress={save} style={[styles.save, saving && styles.disabled]}><Text style={styles.saveText}>{saving ? '保存中…' : '保存する'}</Text></Pressable>
    </ScrollView>
  </KeyboardAvoidingView></SafeAreaView>;
}

function Field({ label, children }: React.PropsWithChildren<{ label: string }>) { return <View style={styles.field}><Text style={styles.label}>{label}</Text>{children}</View>; }
const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: palette.cream }, flex: { flex: 1 }, topBar: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: palette.line, paddingHorizontal: 12 }, back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }, backText: { color: palette.green, fontSize: 38, lineHeight: 40 }, title: { color: palette.ink, fontSize: 17, fontWeight: '900' }, spacer: { width: 44 }, content: { padding: 20, paddingBottom: 60, maxWidth: 640, width: '100%', alignSelf: 'center' }, avatar: { alignSelf: 'center', width: 92, height: 92, borderRadius: 46, backgroundColor: palette.sage, alignItems: 'center', justifyContent: 'center', marginVertical: 22 }, avatarText: { fontSize: 42 }, field: { marginBottom: 22 }, label: { color: palette.ink, fontSize: 14, fontWeight: '900', marginBottom: 9 }, input: { backgroundColor: palette.card, borderWidth: 1, borderColor: palette.line, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13, color: palette.ink, fontSize: 14 }, handleRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: palette.card, borderWidth: 1, borderColor: palette.line, borderRadius: 14, paddingHorizontal: 14 }, at: { color: palette.green, fontWeight: '900' }, handleInput: { flex: 1, paddingVertical: 13, color: palette.ink, fontSize: 14 }, help: { color: palette.muted, fontSize: 10, marginTop: 6 }, bio: { minHeight: 110 }, count: { color: palette.muted, fontSize: 10, textAlign: 'right', marginTop: 5 }, note: { color: palette.muted, fontSize: 11, lineHeight: 18, backgroundColor: palette.sage, borderRadius: 12, padding: 12 }, save: { marginTop: 22, backgroundColor: palette.green, borderRadius: 16, paddingVertical: 16, alignItems: 'center' }, disabled: { opacity: .6 }, saveText: { color: '#fff', fontSize: 15, fontWeight: '900' } });
