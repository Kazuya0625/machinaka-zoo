import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { createPost, deleteRemoteComment, deleteRemotePost, getLegacyDeleteToken, getPosts, RemotePost, saveComment, saveLike, uploadImage } from '@/services/api';
import { useProfile } from './profile-context';

const POSTS_STORAGE_KEY = '@machinaka-zoo/posts/v1';

const animalAppearance: Record<string, { emoji: string; color: string }> = {
  犬: { emoji: '🐕', color: '#C68A55' }, 猫: { emoji: '🐈', color: '#B48B68' }, 鳥: { emoji: '🐦', color: '#91AA68' },
  パンダ: { emoji: '🐼', color: '#8C918D' }, キリン: { emoji: '🦒', color: '#D4A85C' }, ライオン: { emoji: '🦁', color: '#D09550' },
};

function relativeTime(createdAt: string) {
  const elapsed = Date.now() - new Date(createdAt).getTime();
  if (!Number.isFinite(elapsed) || elapsed < 60_000) return 'たった今';
  if (elapsed < 3_600_000) return `${Math.floor(elapsed / 60_000)}分前`;
  if (elapsed < 86_400_000) return `${Math.floor(elapsed / 3_600_000)}時間前`;
  return `${Math.floor(elapsed / 86_400_000)}日前`;
}

export type AnimalPost = {
  id: string;
  animal: string;
  emoji: string;
  color: string;
  location: string;
  description: string;
  author: string;
  time: string;
  likes: number;
  liked: boolean;
  comments?: PostComment[];
  photoUri?: string;
  imageId?: string;
  mine?: boolean;
  canDelete?: boolean;
  deleteToken?: string;
  createdAt?: string;
};

export type PostComment = {
  id: string;
  author: string;
  body: string;
  time: string;
  deleteToken?: string;
};

function mergeRemotePosts(remotePosts: RemotePost[], localPosts: AnimalPost[]) {
  const localById = new Map(localPosts.map(post => [post.id, post]));
  const synced = remotePosts.map(post => {
    const local = localById.get(post.id);
    const deleteToken = local?.deleteToken ?? getLegacyDeleteToken(post.id);
    const appearance = animalAppearance[post.animal] ?? { emoji: '🐾', color: '#7A9A72' };
    const localComments = new Map((local?.comments ?? []).map(comment => [comment.id, comment]));
    const comments = post.comments?.map(comment => ({ id: comment.id, author: comment.author, body: comment.body, time: relativeTime(comment.createdAt), deleteToken: localComments.get(comment.id)?.deleteToken })) ?? local?.comments ?? [];
    return { ...appearance, ...local, ...post, deleteToken, time: relativeTime(post.createdAt), likes: post.likes ?? local?.likes ?? 0, comments, liked: local?.liked ?? false, mine: Boolean(local?.mine || post.author === 'あなた'), canDelete: Boolean(deleteToken), photoUri: local?.photoUri } satisfies AnimalPost;
  });
  const localOnly = localPosts.filter(post => !post.imageId);
  return [...synced, ...localOnly];
}

const initialPosts: AnimalPost[] = [
  { id: '1', animal: 'リスの銅像', emoji: '🐿️', color: '#C68A55', location: '中央公園・けやき広場', description: '木の実を抱えた小さなリスの銅像。ベンチの隣で公園を見守っています。', author: 'さくら', time: '12分前', likes: 24, liked: false },
  { id: '2', animal: 'カモの遊具', emoji: '🦆', color: '#7A9A72', location: 'さくら川児童公園', description: '親子のカモをかたどったスプリング遊具。丸い表情がかわいい！', author: 'たくみ', time: '1時間前', likes: 41, liked: true },
  { id: '3', animal: '猫の看板', emoji: '🐈', color: '#B48B68', location: '本町商店街・路地裏', description: 'パン屋さんの入口で見つけた、黒猫が描かれた木製看板です。', author: 'みどり', time: '3時間前', likes: 18, liked: false },
  { id: '4', animal: 'フクロウの置物', emoji: '🦉', color: '#9BAF62', location: '城址通り・古書店前', description: '古書店の軒先にちょこんと座る石のフクロウ。眼鏡もかけています。', author: 'あなた', time: '昨日', likes: 32, liked: false, mine: true },
];

type NewPost = Pick<AnimalPost, 'animal' | 'location' | 'description' | 'emoji' | 'color' | 'photoUri'> & { photoMimeType?: string };
type ZooContextValue = { posts: AnimalPost[]; isLoading: boolean; isRefreshing: boolean; isLoadingMore: boolean; hasMore: boolean; syncError: string | null; refreshPosts: () => Promise<void>; loadMorePosts: () => Promise<void>; toggleLike: (id: string) => void; addPost: (post: NewPost) => Promise<void>; addComment: (postId: string, body: string) => void; deleteComment: (postId: string, commentId: string) => void; deletePost: (id: string) => void };
const ZooContext = createContext<ZooContextValue | null>(null);

export function ZooProvider({ children }: PropsWithChildren) {
  const { profile } = useProfile();
  const [posts, setPosts] = useState(initialPosts);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [continuationToken, setContinuationToken] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const restored = useRef(false);

  const refreshPosts = useCallback(async () => {
    setIsRefreshing(true);
    setSyncError(null);
    try {
      const page = await getPosts();
      setPosts(current => mergeRemotePosts(page.items, current));
      setContinuationToken(page.continuationToken);
    } catch (error) {
      console.warn('共有投稿を更新できませんでした。', error);
      setSyncError('最新の投稿を取得できませんでした。');
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  const loadMorePosts = useCallback(async () => {
    if (!continuationToken || isLoadingMore) return;
    setIsLoadingMore(true);
    setSyncError(null);
    try {
      const page = await getPosts(continuationToken);
      setPosts(current => {
        const existingRemote = current.filter(post => post.imageId);
        const incoming = mergeRemotePosts(page.items, current).filter(post => post.imageId);
        const combined = [...existingRemote];
        for (const post of incoming) if (!combined.some(item => item.id === post.id)) combined.push(post);
        return [...combined, ...current.filter(post => !post.imageId)];
      });
      setContinuationToken(page.continuationToken);
    } catch (error) {
      console.warn('次の投稿を取得できませんでした。', error);
      setSyncError('次の投稿を取得できませんでした。');
    } finally {
      setIsLoadingMore(false);
    }
  }, [continuationToken, isLoadingMore]);

  useEffect(() => {
    async function restorePosts() {
      try {
        const savedPosts = await AsyncStorage.getItem(POSTS_STORAGE_KEY);
        let localPosts = initialPosts;
        if (savedPosts) {
          const parsed = JSON.parse(savedPosts) as AnimalPost[];
          if (Array.isArray(parsed)) localPosts = parsed;
        }
        setPosts(localPosts);
        try {
          const page = await getPosts();
          setPosts(mergeRemotePosts(page.items, localPosts));
          setContinuationToken(page.continuationToken);
        } catch (error) {
          console.warn('共有投稿を取得できませんでした。端末内の投稿を表示します。', error);
          setSyncError('最新の投稿を取得できませんでした。');
        }
      } catch (error) {
        console.warn('投稿データを復元できませんでした。', error);
      } finally {
        restored.current = true;
        setIsLoading(false);
      }
    }
    restorePosts();
  }, []);

  useEffect(() => {
    if (!restored.current) return;
    AsyncStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(posts)).catch(error => {
      console.warn('投稿データを保存できませんでした。', error);
    });
  }, [posts]);

  const value = useMemo(() => ({
    posts,
    isLoading,
    isRefreshing,
    isLoadingMore,
    hasMore: Boolean(continuationToken),
    syncError,
    refreshPosts,
    loadMorePosts,
    toggleLike: (id: string) => setPosts(items => {
      const post = items.find(item => item.id === id);
      if (!post?.imageId) return items.map(item => item.id === id ? { ...item, liked: !item.liked, likes: item.likes + (item.liked ? -1 : 1) } : item);
      const delta: 1 | -1 = post.liked ? -1 : 1;
      saveLike(post.id, post.animal, delta).catch(error => console.warn('いいねを共有できませんでした。', error));
      return items.map(item => item.id === id ? { ...item, liked: !item.liked, likes: Math.max(0, item.likes + delta) } : item);
    }),
    addPost: async (post: NewPost) => {
      if (!post.photoUri) throw new Error('写真が選択されていません。');
      const { imageId } = await uploadImage(post.photoUri, post.photoMimeType);
      const saved = await createPost({ animal: post.animal, location: post.location, description: post.description, author: profile.displayName, imageId });
      const { photoMimeType: _photoMimeType, ...localPost } = post;
      setPosts(items => [{ ...localPost, id: saved.id, imageId, deleteToken: saved.deleteToken, createdAt: saved.createdAt, author: profile.displayName, time: 'たった今', likes: 0, liked: false, mine: true, canDelete: true }, ...items]);
    },
    addComment: (postId: string, body: string) => setPosts(items => {
      const post = items.find(item => item.id === postId);
      if (!post?.imageId) return items.map(item => item.id === postId ? { ...item, comments: [...(item.comments ?? []), { id: Date.now().toString(), author: 'あなた', body, time: 'たった今' }] } : item);
      const temporaryId = `local-${Date.now()}`;
      saveComment(post.id, post.animal, body, profile.displayName).then(saved => setPosts(current => current.map(item => item.id === postId ? { ...item, comments: (item.comments ?? []).map(comment => comment.id === temporaryId ? { id: saved.id, author: saved.author, body: saved.body, time: 'たった今', deleteToken: saved.deleteToken } : comment) } : item))).catch(error => console.warn('コメントを共有できませんでした。', error));
      return items.map(item => item.id === postId ? { ...item, comments: [...(item.comments ?? []), { id: temporaryId, author: profile.displayName, body, time: 'たった今' }] } : item);
    }),
    deleteComment: (postId: string, commentId: string) => setPosts(items => {
      const post = items.find(item => item.id === postId);
      const comment = post?.comments?.find(entry => entry.id === commentId);
      if (!post || !comment?.deleteToken) return items;
      deleteRemoteComment(post.id, post.animal, comment.id, comment.deleteToken).catch(error => {
        console.warn('コメントを削除できませんでした。', error);
        setPosts(current => current.map(item => item.id === postId && !(item.comments ?? []).some(entry => entry.id === comment.id) ? { ...item, comments: [...(item.comments ?? []), comment] } : item));
      });
      return items.map(item => item.id === postId ? { ...item, comments: (item.comments ?? []).filter(entry => entry.id !== commentId) } : item);
    }),
    deletePost: (id: string) => setPosts(items => {
      const post = items.find(item => item.id === id);
      if (post?.imageId && post.deleteToken) deleteRemotePost(post.id, post.animal, post.deleteToken).catch(error => {
        console.warn('投稿を共有データから削除できませんでした。', error);
        setPosts(current => current.some(item => item.id === post.id) ? current : [post, ...current]);
      });
      return items.filter(item => item.id !== id);
    }),
  }), [continuationToken, isLoading, isLoadingMore, isRefreshing, loadMorePosts, posts, profile.displayName, refreshPosts, syncError]);
  return <ZooContext.Provider value={value}>{children}</ZooContext.Provider>;
}

export function useZoo() {
  const value = useContext(ZooContext);
  if (!value) throw new Error('useZoo must be used inside ZooProvider');
  return value;
}
