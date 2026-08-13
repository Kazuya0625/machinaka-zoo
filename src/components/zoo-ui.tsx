import { PropsWithChildren } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { AnimalPost } from '@/data/zoo-context';
import { getRemoteImageSource } from '@/services/api';

export const palette = { green: '#315C45', deep: '#244737', sage: '#DDE7D8', cream: '#F7F2E7', card: '#FFFDF8', ink: '#253229', muted: '#718078', line: '#E4DED1', coral: '#D96C5F' };

export function ScreenHeader({ eyebrow, title, right }: { eyebrow: string; title: string; right?: React.ReactNode }) {
  return <View style={styles.header}><View><Text style={styles.eyebrow}>{eyebrow}</Text><Text style={styles.title}>{title}</Text></View>{right}</View>;
}

export function AnimalArtwork({ emoji, color, small = false }: { emoji: string; color: string; small?: boolean }) {
  return <View style={[styles.art, { backgroundColor: color }, small && styles.artSmall]}><View style={styles.sun} /><Text style={[styles.emoji, small && styles.emojiSmall]}>{emoji}</Text><View style={styles.grass}><Text style={styles.grassText}>⌇ ៸ 〳 ៸ ⌇</Text></View></View>;
}

export function PostCard({ post, onLike, onOpen, compact = false, hideAnimalTag = false }: { post: AnimalPost; onLike: () => void; onOpen?: () => void; compact?: boolean; hideAnimalTag?: boolean }) {
  const photoSource = post.photoUri ? { uri: post.photoUri } : post.imageId ? getRemoteImageSource(post.imageId) : null;
  return <View style={[styles.card, compact && styles.compactCard]}>
    <Pressable onPress={onOpen}>{photoSource
      ? <Image source={photoSource} style={[styles.postPhoto, compact && styles.postPhotoSmall]} resizeMode="cover" />
      : <AnimalArtwork emoji={post.emoji} color={post.color} small={compact} />}</Pressable>
    <View style={[styles.cardBody, compact && styles.compactCardBody]}>
      <Pressable onPress={onOpen}><View style={styles.metaRow}><View style={[styles.avatar, compact && styles.compactAvatar]}><Text>{post.author === 'あなた' ? '🌿' : '🙂'}</Text></View><View style={styles.authorBlock}><Text numberOfLines={1} ellipsizeMode="tail" style={styles.author}>{post.author}</Text><Text style={styles.time}>{post.time}</Text></View>{!hideAnimalTag && <View style={styles.tag}><Text style={styles.tagText}>{post.animal}</Text></View>}</View>
      <Text style={styles.location}>●  {post.location}</Text>
      {!compact && <Text style={styles.description}>{post.description}</Text>}</Pressable>
      <View style={styles.cardActions}><Pressable accessibilityRole="button" accessibilityLabel="いいね" onPress={onLike} style={styles.likeButton}><Text style={[styles.like, post.liked && styles.liked]}>{post.liked ? '♥' : '♡'}  {post.likes}</Text></Pressable><Pressable onPress={onOpen} style={styles.commentButton}><Text style={styles.commentText}>💬 {post.comments?.length ?? 0}</Text></Pressable></View>
    </View>
  </View>;
}

export function SectionTitle({ children, action }: PropsWithChildren<{ action?: string }>) { return <View style={styles.sectionRow}><Text style={styles.sectionTitle}>{children}</Text>{action && <Text style={styles.sectionAction}>{action}</Text>}</View> }

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, paddingBottom: 22 },
  eyebrow: { color: palette.green, fontSize: 11, fontWeight: '800', letterSpacing: 2 }, title: { color: palette.ink, fontSize: 28, fontWeight: '900', letterSpacing: 1, marginTop: 3 },
  art: { height: 190, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }, artSmall: { height: 112 }, emoji: { fontSize: 88, zIndex: 2 }, emojiSmall: { fontSize: 54 },
  postPhoto: { width: '100%', height: 190, backgroundColor: palette.sage }, postPhotoSmall: { height: 112 },
  sun: { position: 'absolute', width: 110, height: 110, borderRadius: 55, backgroundColor: 'rgba(255,245,207,.42)', top: 18, right: 25 }, grass: { position: 'absolute', bottom: -2, width: '100%', height: 39, backgroundColor: 'rgba(49,92,69,.28)', justifyContent: 'center' }, grassText: { color: '#EEF1CF', fontSize: 24, textAlign: 'center', letterSpacing: 12 },
  card: { backgroundColor: palette.card, borderRadius: 22, overflow: 'hidden', marginBottom: 18, borderWidth: 1, borderColor: palette.line, shadowColor: '#203A2B', shadowOpacity: .08, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } }, compactCard: { flex: 1, minWidth: 155, marginBottom: 0 }, cardBody: { padding: 16 }, compactCardBody: { padding: 12 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 9 }, avatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: palette.sage, alignItems: 'center', justifyContent: 'center' }, compactAvatar: { width: 28, height: 28, borderRadius: 14 }, authorBlock: { flex: 1, minWidth: 0 }, author: { color: palette.ink, fontSize: 13, fontWeight: '800', flexShrink: 1 }, time: { color: palette.muted, fontSize: 10, marginTop: 1 },
  tag: { backgroundColor: palette.sage, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 }, tagText: { color: palette.deep, fontSize: 11, fontWeight: '800' }, location: { color: palette.green, fontSize: 12, fontWeight: '700', marginTop: 14 }, description: { color: palette.ink, fontSize: 14, lineHeight: 22, marginTop: 9 }, cardActions: { flexDirection: 'row', alignItems: 'center', gap: 14 }, likeButton: { paddingTop: 12, paddingRight: 8 }, like: { color: palette.muted, fontSize: 16, fontWeight: '800' }, liked: { color: palette.coral }, commentButton: { paddingTop: 12, paddingHorizontal: 4 }, commentText: { color: palette.muted, fontSize: 14, fontWeight: '700' },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 13 }, sectionTitle: { color: palette.ink, fontSize: 18, fontWeight: '900' }, sectionAction: { color: palette.green, fontSize: 12, fontWeight: '800' },
});
