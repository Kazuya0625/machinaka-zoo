const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
const POSTS_KEY = process.env.EXPO_PUBLIC_POSTS_FUNCTION_KEY;
const UPLOAD_IMAGE_KEY = process.env.EXPO_PUBLIC_UPLOAD_IMAGE_FUNCTION_KEY;
const GET_IMAGE_KEY = process.env.EXPO_PUBLIC_GET_IMAGE_FUNCTION_KEY;
const INTERACTIONS_KEY = process.env.EXPO_PUBLIC_INTERACTIONS_FUNCTION_KEY;
const LEGACY_DELETE_TOKENS = process.env.EXPO_PUBLIC_LEGACY_DELETE_TOKENS;
const REPORTS_KEY = process.env.EXPO_PUBLIC_REPORTS_FUNCTION_KEY;

export function getLegacyDeleteToken(postId: string) {
  if (!LEGACY_DELETE_TOKENS) return undefined;
  try {
    const tokens = JSON.parse(LEGACY_DELETE_TOKENS) as Record<string, unknown>;
    return typeof tokens[postId] === 'string' ? tokens[postId] : undefined;
  } catch {
    return undefined;
  }
}

function requireConfig(key: string | undefined, keyName: string) {
  if (!API_BASE_URL || !key) {
    throw new Error(`Azure APIの開発用設定（${keyName}）がありません。.env.localを確認してください。`);
  }
  return { baseUrl: API_BASE_URL.replace(/\/$/, ''), key };
}

async function parseError(response: Response) {
  try {
    const body = await response.json();
    return typeof body?.error === 'string' ? body.error : `HTTP ${response.status}`;
  } catch {
    return `HTTP ${response.status}`;
  }
}

export async function uploadImage(photoUri: string, mimeType = 'image/jpeg') {
  const { baseUrl, key } = requireConfig(UPLOAD_IMAGE_KEY, '画像アップロードキー');
  const extension = mimeType.includes('png') ? 'png' : mimeType.includes('webp') ? 'webp' : mimeType.includes('hei') ? 'heic' : 'jpg';
  const form = new FormData();
  form.append('image', { uri: photoUri, name: `post.${extension}`, type: mimeType } as unknown as Blob);
  const response = await fetch(`${baseUrl}/images`, {
    method: 'POST',
    headers: { 'x-functions-key': key },
    body: form,
  });
  if (!response.ok) throw new Error(await parseError(response));
  return (await response.json()) as { imageId: string };
}

export type CreatePostRequest = {
  animal: string;
  location: string;
  description: string;
  author: string;
  imageId: string;
};

export type RemotePost = CreatePostRequest & {
  id: string;
  createdAt: string;
  likes?: number;
  comments?: { id: string; author: string; body: string; createdAt: string }[];
};

export async function getPosts(continuationToken?: string) {
  const { baseUrl, key } = requireConfig(POSTS_KEY, '投稿キー');
  const query = continuationToken ? `?continuationToken=${encodeURIComponent(continuationToken)}` : '';
  const response = await fetch(`${baseUrl}/posts${query}`, { headers: { 'x-functions-key': key } });
  if (!response.ok) throw new Error(await parseError(response));
  return (await response.json()) as { items: RemotePost[]; continuationToken: string | null };
}

export async function createPost(post: CreatePostRequest) {
  const { baseUrl, key } = requireConfig(POSTS_KEY, '投稿キー');
  const response = await fetch(`${baseUrl}/posts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-functions-key': key },
    body: JSON.stringify(post),
  });
  if (!response.ok) throw new Error(await parseError(response));
  return (await response.json()) as { id: string; createdAt: string; imageId: string; deleteToken: string };
}

export function getRemoteImageSource(imageId: string) {
  const { baseUrl, key } = requireConfig(GET_IMAGE_KEY, '画像取得キー');
  return { uri: `${baseUrl}/images/${encodeURIComponent(imageId)}`, headers: { 'x-functions-key': key }, cache: 'force-cache' as const };
}

async function interact(action: 'like' | 'comment' | 'delete' | 'delete-comment', body: Record<string, unknown>) {
  const { baseUrl, key } = requireConfig(INTERACTIONS_KEY, 'いいね・コメントキー');
  const response = await fetch(`${baseUrl}/interactions/${action}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-functions-key': key },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(await parseError(response));
  return response.status === 204 ? null : response.json();
}

export async function saveLike(id: string, animal: string, delta: 1 | -1) {
  return (await interact('like', { id, animal, delta })) as { likes: number };
}

export async function saveComment(id: string, animal: string, text: string, author: string) {
  return (await interact('comment', { id, animal, text, author })) as { id: string; author: string; body: string; createdAt: string; deleteToken: string };
}

export async function deleteRemoteComment(id: string, animal: string, commentId: string, deleteToken: string) {
  await interact('delete-comment', { id, animal, commentId, deleteToken });
}

export async function deleteRemotePost(id: string, animal: string, deleteToken: string) {
  await interact('delete', { id, animal, deleteToken });
}

export async function sendReport(report: { deviceId: string; targetType: 'post' | 'comment'; targetId: string; postId: string; reason: string }) {
  const { baseUrl, key } = requireConfig(REPORTS_KEY, '通報キー');
  const response = await fetch(`${baseUrl}/reports`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-functions-key': key },
    body: JSON.stringify(report),
  });
  if (!response.ok) throw new Error(await parseError(response));
}
