import { useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { palette, ScreenHeader } from '@/components/zoo-ui';
import { useZoo } from '@/data/zoo-context';

const animals = [
  { name: '犬', emoji: '🐕', color: '#C68A55' },
  { name: '猫', emoji: '🐈', color: '#B48B68' },
  { name: '鳥', emoji: '🐦', color: '#91AA68' },
  { name: '爬虫類', emoji: '🦎', color: '#779B82' },
  { name: 'パンダ', emoji: '🐼', color: '#8C918D' },
  { name: 'キリン', emoji: '🦒', color: '#D4A85C' },
  { name: 'タヌキ', emoji: '🦝', color: '#8E7966' },
  { name: 'シカ', emoji: '🦌', color: '#A47B59' },
  { name: 'ライオン', emoji: '🦁', color: '#D09550' },
  { name: 'クマ', emoji: '🐻', color: '#85654E' },
  { name: 'ゾウ', emoji: '🐘', color: '#819A9D' },
  { name: 'サル', emoji: '🐒', color: '#9B7658' },
  { name: 'ウサギ', emoji: '🐇', color: '#C8AFA9' },
  { name: 'ウマ', emoji: '🐎', color: '#8D6A50' },
  { name: 'ウシ', emoji: '🐄', color: '#8C918D' },
  { name: 'ブタ', emoji: '🐖', color: '#D69A9A' },
  { name: 'ヒツジ', emoji: '🐑', color: '#B8B2A5' },
  { name: 'ヤギ', emoji: '🐐', color: '#9C9183' },
  { name: 'キツネ', emoji: '🦊', color: '#C8793F' },
  { name: 'リス', emoji: '🐿️', color: '#A8744E' },
  { name: '伝説上の生物', emoji: '🐉', color: '#80649B' },
  { name: 'タコ', emoji: '🐙', color: '#B76872' },
  { name: 'イカ', emoji: '🦑', color: '#8A6D9E' },
  { name: 'その他', emoji: '🐾', color: '#7A9A72' },
];

export default function PostScreen() {
  const [photoUri, setPhotoUri] = useState<string | null>(null); const [photoMimeType, setPhotoMimeType] = useState('image/jpeg'); const [selected, setSelected] = useState(0); const [location, setLocation] = useState(''); const [description, setDescription] = useState(''); const [submitting, setSubmitting] = useState(false);
  const { addPost } = useZoo(); const router = useRouter();
  const chooseFromLibrary = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return Alert.alert('写真へのアクセスが必要です', 'iPhoneの設定から写真へのアクセスを許可してください。');
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [4, 3], quality: 0.8 });
    if (!result.canceled) { setPhotoUri(result.assets[0].uri); setPhotoMimeType(result.assets[0].mimeType ?? 'image/jpeg'); }
  };
  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return Alert.alert('カメラへのアクセスが必要です', 'iPhoneの設定からカメラへのアクセスを許可してください。');
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [4, 3], quality: 0.8 });
    if (!result.canceled) { setPhotoUri(result.assets[0].uri); setPhotoMimeType(result.assets[0].mimeType ?? 'image/jpeg'); }
  };
  const selectPhoto = () => Alert.alert('写真を追加', '写真の選び方を選択してください。', [
    { text: 'カメラで撮影', onPress: takePhoto },
    { text: 'ライブラリから選択', onPress: chooseFromLibrary },
    { text: 'キャンセル', style: 'cancel' },
  ]);
  const submit = async () => { if (!photoUri || !location.trim() || !description.trim()) return Alert.alert('入力を確認してください', '写真・発見場所・説明をすべて入力してください。'); const animal = animals[selected]; try { setSubmitting(true); await addPost({ animal: animal.name, emoji: animal.emoji, color: animal.color, photoUri, photoMimeType, location: location.trim(), description: description.trim() }); setPhotoUri(null); setLocation(''); setDescription(''); Alert.alert('投稿できました', 'まちで見つけた動物が仲間入りしました。', [{ text: 'みつけるへ', onPress: () => router.navigate('/') }]); } catch (error) { Alert.alert('投稿できませんでした', error instanceof Error ? error.message : '通信状態を確認して、もう一度お試しください。'); } finally { setSubmitting(false); } };
  return <SafeAreaView style={styles.safe} edges={['top']}><KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
    <ScreenHeader eyebrow="SHARE A FIND" title="投稿する" />
    <Field label="写真" required>{photoUri ? <View style={styles.photo}><Image source={{ uri: photoUri }} style={styles.preview} resizeMode="cover" /><View style={styles.photoActions}><Pressable onPress={selectPhoto} style={styles.photoAction}><Text style={styles.photoActionText}>変更</Text></Pressable><Pressable onPress={() => setPhotoUri(null)} style={[styles.photoAction, styles.removeAction]}><Text style={styles.photoActionText}>削除</Text></Pressable></View></View> : <Pressable style={styles.photoEmpty} onPress={selectPhoto}><Text style={styles.camera}>⌾</Text><Text style={styles.photoTitle}>写真を追加</Text><Text style={styles.help}>カメラまたはライブラリから選択</Text></Pressable>}</Field>
    <Field label="動物" required><View style={styles.chips}>{animals.map((animal, index) => <Pressable key={animal.name} onPress={() => setSelected(index)} style={[styles.chip, selected === index && styles.chipActive]}><Text style={[styles.chipText, selected === index && styles.chipTextActive]}>{animal.name}</Text></Pressable>)}</View></Field>
    <Field label="発見場所" required><View style={styles.inputWrap}><Text style={styles.pin}>●</Text><TextInput value={location} onChangeText={setLocation} placeholder="例：中央公園・けやき広場" placeholderTextColor="#9A9E98" style={styles.input} /></View></Field>
    <Field label="説明" required><TextInput value={description} onChangeText={setDescription} multiline maxLength={120} textAlignVertical="top" placeholder="何の動物が、どんなものに描かれていたり、かたどられていたりしましたか？" placeholderTextColor="#9A9E98" style={[styles.input, styles.textarea]} /><Text style={styles.count}>{description.length} / 120</Text></Field>
    <View style={styles.note}><Text style={styles.noteIcon}>🪧</Text><Text style={styles.noteText}>本物の動物ではなく、動物が描かれた看板や、動物をかたどった銅像・遊具・置物などを投稿してね。</Text></View>
    <Pressable disabled={submitting} onPress={submit} style={({ pressed }) => [styles.submit, (pressed || submitting) && { opacity: .6 }]}><Text style={styles.submitText}>{submitting ? '投稿中…' : 'この発見を投稿する　›'}</Text></Pressable>
  </ScrollView></KeyboardAvoidingView></SafeAreaView>;
}
function Field({ label, required, children }: React.PropsWithChildren<{ label: string; required?: boolean }>) { return <View style={styles.field}><Text style={styles.label}>{label} {required && <Text style={styles.required}>必須</Text>}</Text>{children}</View> }
const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: palette.cream }, content: { paddingHorizontal: 18, paddingBottom: 130, maxWidth: 640, width: '100%', alignSelf: 'center' }, lead: { color: palette.muted, fontSize: 13, lineHeight: 21, marginTop: -10, marginBottom: 24 }, field: { marginBottom: 24 }, label: { color: palette.ink, fontSize: 15, fontWeight: '900', marginBottom: 10 }, required: { color: palette.coral, fontSize: 10 }, photoEmpty: { height: 184, borderRadius: 20, borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#A5B39F', backgroundColor: '#F9F7EF', alignItems: 'center', justifyContent: 'center' }, camera: { color: palette.green, fontSize: 42 }, photoTitle: { color: palette.green, fontSize: 15, fontWeight: '900', marginTop: 5 }, help: { color: palette.muted, fontSize: 11, marginTop: 5 }, photo: { height: 220, borderRadius: 20, overflow: 'hidden', backgroundColor: palette.sage }, preview: { width: '100%', height: '100%' }, photoActions: { position: 'absolute', right: 12, bottom: 12, flexDirection: 'row', gap: 8 }, photoAction: { backgroundColor: 'rgba(36,71,55,.9)', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 16 }, removeAction: { backgroundColor: 'rgba(150,65,58,.9)' }, photoActionText: { color: '#fff', fontSize: 12, fontWeight: '800' }, chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, chip: { alignItems: 'center', borderWidth: 1, borderColor: palette.line, paddingVertical: 9, paddingHorizontal: 14, borderRadius: 18, backgroundColor: palette.card }, chipActive: { borderColor: palette.green, backgroundColor: palette.sage }, chipText: { color: palette.muted, fontSize: 12, fontWeight: '700' }, chipTextActive: { color: palette.deep, fontWeight: '900' }, inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: palette.card, borderWidth: 1, borderColor: palette.line, borderRadius: 14, paddingHorizontal: 14 }, pin: { color: palette.green, fontSize: 9 }, input: { flex: 1, color: palette.ink, fontSize: 14, padding: 14 }, textarea: { minHeight: 120, backgroundColor: palette.card, borderWidth: 1, borderColor: palette.line, borderRadius: 14 }, count: { textAlign: 'right', color: palette.muted, fontSize: 10, marginTop: 5 }, note: { flexDirection: 'row', backgroundColor: palette.sage, borderRadius: 14, padding: 14, gap: 10 }, noteIcon: { fontSize: 19 }, noteText: { color: palette.deep, fontSize: 11, lineHeight: 18, flex: 1 }, submit: { backgroundColor: palette.green, borderRadius: 17, alignItems: 'center', paddingVertical: 17, marginTop: 22 }, submitText: { color: '#fff', fontSize: 15, fontWeight: '900' } });
