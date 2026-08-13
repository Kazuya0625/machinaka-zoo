import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { palette, PostCard, ScreenHeader, SectionTitle } from '@/components/zoo-ui';
import { useZoo } from '@/data/zoo-context';
import { useProfile } from '@/data/profile-context';

export default function MyPageScreen() {
  const { posts, toggleLike } = useZoo();
  const router = useRouter();
  const { profile } = useProfile();
  const mine = posts.filter(post => post.mine);
  const totalLikes = mine.reduce((sum, post) => sum + post.likes, 0);
  const animalTypes = new Set(mine.map(post => post.animal)).size;
  const now = new Date();
  const thisMonth = mine.filter(post => { const date = post.createdAt ? new Date(post.createdAt) : null; return date && date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth(); });
  const recentAnimals = [...new Set(thisMonth.map(post => post.animal))].slice(0, 3);
  const nextRankRemaining = Math.max(0, 5 - mine.length);
  return <SafeAreaView style={styles.safe} edges={['top']}><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
  <ScreenHeader eyebrow="MY MACHINAKA ZOO" title="マイページ" right={<Pressable onPress={() => router.push('/profile-edit')} accessibilityLabel="プロフィール編集" style={styles.settings}><Text style={{ fontSize: 20 }}>⚙</Text></Pressable>} />
  <View style={styles.profile}><View style={styles.avatar}><Text style={styles.avatarText}>🐾</Text></View><View style={{ flex: 1 }}><Text style={styles.name}>{profile.displayName}</Text><Text style={styles.handle}>@{profile.handle}</Text><Text style={styles.bio}>{profile.bio}</Text></View></View>
  <View style={styles.stats}><Stat number={mine.length} label="投稿" /><View style={styles.divider} /><Stat number={totalLikes} label="もらったいいね" /><View style={styles.divider} /><Stat number={animalTypes} label="見つけた種類" /></View>
  <View style={styles.badge}><Text style={styles.badgeIcon}>🏅</Text><View><Text style={styles.badgeTitle}>{mine.length >= 5 ? 'まちの動物発見員・名探偵' : 'まちの動物発見員・若葉'}</Text><Text style={styles.badgeText}>{nextRankRemaining > 0 ? `あと${nextRankRemaining}投稿で「名探偵」にランクアップ` : 'これからも、まちの動物を見つけよう'}</Text></View></View>
  <SectionTitle action="すべて見る">わたしの投稿</SectionTitle>
  <View style={styles.grid}>{mine.map(post => <PostCard key={post.id} compact post={post} onLike={() => toggleLike(post.id)} onOpen={() => router.push({ pathname: '/post-detail/[id]', params: { id: post.id } })} />)}{mine.length === 1 && <View style={styles.empty}><Text style={styles.emptyEmoji}>🗿</Text><Text style={styles.emptyTitle}>次の発見を待っています</Text><Text style={styles.emptyText}>街を歩いて、動物モチーフを探そう</Text></View>}</View>
  <SectionTitle>最近の記録</SectionTitle><View style={styles.record}><Text style={styles.recordIcon}>🪧</Text><View><Text style={styles.recordTitle}>今月は{thisMonth.length}つ発見しました</Text><Text style={styles.recordText}>{recentAnimals.length > 0 ? recentAnimals.join('・') : '次の発見を待っています'}</Text></View></View>
  </ScrollView></SafeAreaView>;
}
function Stat({ number, label }: { number: number; label: string }) { return <View style={styles.stat}><Text style={styles.statNumber}>{number}</Text><Text style={styles.statLabel}>{label}</Text></View> }
const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: palette.cream }, content: { paddingHorizontal: 18, paddingBottom: 130, maxWidth: 640, width: '100%', alignSelf: 'center' }, settings: { width: 42, height: 42, borderRadius: 21, backgroundColor: palette.card, borderWidth: 1, borderColor: palette.line, alignItems: 'center', justifyContent: 'center' }, profile: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 23 }, avatar: { width: 82, height: 82, borderRadius: 41, backgroundColor: palette.sage, borderWidth: 4, borderColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#315C45', shadowOpacity: .12, shadowRadius: 8 }, avatarText: { fontSize: 38 }, name: { color: palette.ink, fontSize: 19, fontWeight: '900' }, handle: { color: palette.green, fontSize: 11, fontWeight: '700', marginTop: 2 }, bio: { color: palette.muted, fontSize: 11, lineHeight: 17, marginTop: 8 }, stats: { flexDirection: 'row', backgroundColor: palette.card, borderWidth: 1, borderColor: palette.line, borderRadius: 18, paddingVertical: 17, marginBottom: 15 }, stat: { flex: 1, alignItems: 'center' }, statNumber: { color: palette.green, fontSize: 20, fontWeight: '900' }, statLabel: { color: palette.muted, fontSize: 9, marginTop: 3 }, divider: { width: 1, backgroundColor: palette.line }, badge: { flexDirection: 'row', gap: 12, alignItems: 'center', backgroundColor: '#E4EACF', borderRadius: 15, padding: 14, marginBottom: 27 }, badgeIcon: { fontSize: 27 }, badgeTitle: { color: palette.deep, fontSize: 13, fontWeight: '900' }, badgeText: { color: palette.muted, fontSize: 9, marginTop: 3 }, grid: { flexDirection: 'row', gap: 12, marginBottom: 29 }, empty: { flex: 1, minWidth: 150, borderWidth: 1, borderStyle: 'dashed', borderColor: '#B7C2AE', borderRadius: 20, minHeight: 230, alignItems: 'center', justifyContent: 'center', padding: 15 }, emptyEmoji: { fontSize: 35 }, emptyTitle: { color: palette.ink, fontSize: 12, fontWeight: '900', marginTop: 10, textAlign: 'center' }, emptyText: { color: palette.muted, fontSize: 9, marginTop: 5 }, record: { backgroundColor: palette.card, borderWidth: 1, borderColor: palette.line, borderRadius: 16, padding: 15, flexDirection: 'row', gap: 12, alignItems: 'center' }, recordIcon: { fontSize: 25 }, recordTitle: { color: palette.ink, fontSize: 12, fontWeight: '900' }, recordText: { color: palette.muted, fontSize: 10, marginTop: 4 } });
