import { useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AnimalArtwork, palette } from '@/components/zoo-ui';
import { useZoo } from '@/data/zoo-context';
import { getRemoteImageSource } from '@/services/api';
import { reportContent } from '@/services/reports';

const reportReasons = ['不適切な内容', '動物モチーフではない', '迷惑行為・スパム', '個人情報が含まれている', 'その他'];

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { posts, toggleLike, addComment, deleteComment, deletePost } = useZoo();
  const [comment, setComment] = useState('');
  const post = posts.find(item => item.id === id);
  const photoSource = post?.photoUri ? { uri: post.photoUri } : post?.imageId ? getRemoteImageSource(post.imageId) : null;

  if (!post) return <SafeAreaView style={styles.safe}><View style={styles.notFound}><Text style={styles.notFoundText}>投稿が見つかりませんでした</Text><Pressable onPress={() => router.back()}><Text style={styles.backLink}>一覧へ戻る</Text></Pressable></View></SafeAreaView>;

  const submitComment = () => {
    const body = comment.trim();
    if (!body) return;
    addComment(post.id, body);
    setComment('');
  };

  const confirmDelete = () => Alert.alert(
    '投稿を削除しますか？',
    'この投稿とコメントは端末から削除され、元に戻せません。',
    [
      { text: 'キャンセル', style: 'cancel' },
      { text: '削除する', style: 'destructive', onPress: () => { deletePost(post.id); router.replace('/'); } },
    ],
  );

  const openMenu = () => {
    const canDeletePost = post.canDelete || Boolean(post.deleteToken) || (post.mine && !post.imageId);
    Alert.alert('投稿メニュー', undefined, [
      ...(canDeletePost ? [{ text: '投稿を削除', style: 'destructive' as const, onPress: confirmDelete }] : [{ text: '投稿を通報', onPress: () => chooseReportReason('post', post.id) }]),
      { text: 'キャンセル', style: 'cancel' },
    ]);
  };

  const chooseReportReason = (targetType: 'post' | 'comment', targetId: string) => Alert.alert(
    targetType === 'post' ? '投稿を通報' : 'コメントを通報',
    '通報理由を選んでください。',
    [
      ...reportReasons.map(reason => ({ text: reason, onPress: () => submitReport(targetType, targetId, reason) })),
      { text: 'キャンセル', style: 'cancel' as const },
    ],
  );

  const submitReport = async (targetType: 'post' | 'comment', targetId: string, reason: string) => {
    try {
      await reportContent(targetType, targetId, post.id, reason);
      Alert.alert('通報を受け付けました', 'ご協力ありがとうございます。内容を確認します。');
    } catch (error) {
      Alert.alert('通報できませんでした', error instanceof Error ? error.message : '時間をおいて、もう一度お試しください。');
    }
  };

  const confirmDeleteComment = (commentId: string) => Alert.alert(
    'コメントを削除しますか？',
    '削除したコメントは元に戻せません。',
    [
      { text: 'キャンセル', style: 'cancel' },
      { text: '削除する', style: 'destructive', onPress: () => deleteComment(post.id, commentId) },
    ],
  );

  return <SafeAreaView style={styles.safe} edges={['top']}><KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={8}>
    <View style={styles.topBar}><Pressable onPress={() => router.back()} style={styles.backButton}><Text style={styles.backButtonText}>‹</Text></Pressable><Text style={styles.topTitle}>投稿の詳細</Text><Pressable onPress={openMenu} accessibilityLabel="投稿メニュー" style={styles.menuButton}><Text style={styles.menuButtonText}>…</Text></Pressable></View>
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <View style={styles.postCard}>{photoSource ? <Image source={photoSource} style={styles.photo} resizeMode="cover" /> : <AnimalArtwork emoji={post.emoji} color={post.color} />}
        <View style={styles.postBody}><View style={styles.meta}><View style={styles.avatar}><Text>{post.author === 'あなた' ? '🌿' : '🙂'}</Text></View><View style={styles.authorBlock}><Text style={styles.author}>{post.author}</Text><Text style={styles.time}>{post.time}</Text></View><View style={styles.tag}><Text style={styles.tagText}>{post.animal}</Text></View></View>
          <Text style={styles.location}>●  {post.location}</Text><Text style={styles.description}>{post.description}</Text>
          <Pressable onPress={() => toggleLike(post.id)} style={styles.likeButton}><Text style={[styles.like, post.liked && styles.liked]}>{post.liked ? '♥' : '♡'}  {post.likes}</Text></Pressable>
        </View>
      </View>
      <Text style={styles.commentsTitle}>コメント  {post.comments?.length ?? 0}</Text>
      {(post.comments ?? []).length === 0 ? <View style={styles.empty}><Text style={styles.emptyText}>まだコメントはありません。{`\n`}最初のコメントを投稿してみよう。</Text></View> : (post.comments ?? []).map(item => <View key={item.id} style={styles.comment}><View style={styles.commentAvatar}><Text>🌿</Text></View><View style={styles.commentBody}><View style={styles.commentHeader}><Text style={styles.commentAuthor}>{item.author}</Text><Text style={styles.commentTime}>{item.time}</Text>{item.deleteToken ? <Pressable onPress={() => confirmDeleteComment(item.id)} style={styles.commentDelete}><Text style={styles.commentDeleteText}>削除</Text></Pressable> : <Pressable onPress={() => chooseReportReason('comment', item.id)} style={styles.commentDelete}><Text style={styles.reportText}>通報</Text></Pressable>}</View><Text style={styles.commentText}>{item.body}</Text></View></View>)}
    </ScrollView>
    <View style={styles.composer}><TextInput value={comment} onChangeText={setComment} placeholder="コメントを入力" placeholderTextColor="#929A95" maxLength={200} multiline style={styles.input} /><Pressable disabled={!comment.trim()} onPress={submitComment} style={[styles.send, !comment.trim() && styles.sendDisabled]}><Text style={styles.sendText}>送信</Text></Pressable></View>
  </KeyboardAvoidingView></SafeAreaView>;
}

const styles = StyleSheet.create({
  flex: { flex: 1 }, safe: { flex: 1, backgroundColor: palette.cream }, topBar: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: palette.line }, backButton: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' }, backButtonText: { color: palette.green, fontSize: 38, lineHeight: 40 }, topTitle: { color: palette.ink, fontSize: 17, fontWeight: '900' }, topSpacer: { width: 42 }, menuButton: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' }, menuButtonText: { color: palette.green, fontSize: 25, fontWeight: '900', lineHeight: 27 }, content: { padding: 18, paddingBottom: 30, maxWidth: 640, width: '100%', alignSelf: 'center' },
  postCard: { borderRadius: 22, overflow: 'hidden', backgroundColor: palette.card, borderWidth: 1, borderColor: palette.line }, photo: { width: '100%', height: 260, backgroundColor: palette.sage }, postBody: { padding: 16 }, meta: { flexDirection: 'row', alignItems: 'center', gap: 9 }, avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: palette.sage, alignItems: 'center', justifyContent: 'center' }, authorBlock: { flex: 1 }, author: { color: palette.ink, fontSize: 14, fontWeight: '900' }, time: { color: palette.muted, fontSize: 10, marginTop: 2 }, tag: { backgroundColor: palette.sage, borderRadius: 16, paddingHorizontal: 11, paddingVertical: 6 }, tagText: { color: palette.deep, fontSize: 11, fontWeight: '900' }, location: { color: palette.green, fontSize: 13, fontWeight: '800', marginTop: 15 }, description: { color: palette.ink, fontSize: 15, lineHeight: 23, marginTop: 10 }, likeButton: { alignSelf: 'flex-start', paddingTop: 15, paddingRight: 24 }, like: { color: palette.muted, fontSize: 17, fontWeight: '900' }, liked: { color: palette.coral },
  commentsTitle: { color: palette.ink, fontSize: 18, fontWeight: '900', marginTop: 26, marginBottom: 12 }, empty: { padding: 24, borderRadius: 16, backgroundColor: palette.card, borderWidth: 1, borderColor: palette.line }, emptyText: { color: palette.muted, fontSize: 13, lineHeight: 21, textAlign: 'center' }, comment: { flexDirection: 'row', gap: 10, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: palette.line }, commentAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: palette.sage, alignItems: 'center', justifyContent: 'center' }, commentBody: { flex: 1 }, commentHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 }, commentAuthor: { color: palette.ink, fontSize: 13, fontWeight: '900' }, commentTime: { color: palette.muted, fontSize: 10 }, commentDelete: { marginLeft: 'auto', paddingHorizontal: 8, paddingVertical: 4 }, commentDeleteText: { color: palette.coral, fontSize: 11, fontWeight: '800' }, reportText: { color: palette.muted, fontSize: 11, fontWeight: '800' }, commentText: { color: palette.ink, fontSize: 14, lineHeight: 21, marginTop: 5 },
  composer: { flexDirection: 'row', alignItems: 'flex-end', gap: 9, paddingHorizontal: 14, paddingTop: 10, paddingBottom: Platform.OS === 'ios' ? 10 : 14, backgroundColor: palette.card, borderTopWidth: 1, borderTopColor: palette.line }, input: { flex: 1, maxHeight: 100, minHeight: 42, color: palette.ink, backgroundColor: '#F4F1E9', borderWidth: 1, borderColor: palette.line, borderRadius: 21, paddingHorizontal: 15, paddingVertical: 10, fontSize: 14 }, send: { height: 42, paddingHorizontal: 17, borderRadius: 21, backgroundColor: palette.green, alignItems: 'center', justifyContent: 'center' }, sendDisabled: { opacity: .4 }, sendText: { color: '#fff', fontSize: 13, fontWeight: '900' }, notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' }, notFoundText: { color: palette.ink, fontSize: 16 }, backLink: { color: palette.green, fontWeight: '800', marginTop: 12 },
});
