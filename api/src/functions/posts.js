import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { app } from '@azure/functions';
import { getPostsContainer } from '../cosmos.js';
import { json } from '../http.js';

function cleanText(value, maxLength) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

app.http('posts', {
  methods: ['GET', 'POST'],
  authLevel: 'function',
  route: 'posts',
  handler: async (request, context) => {
    try {
      const container = getPostsContainer();
      if (request.method === 'GET') {
        const continuationToken = request.query.get('continuationToken') || undefined;
        const iterator = container.items.query('SELECT * FROM c ORDER BY c.createdAt DESC', {
          maxItemCount: 20,
          continuationToken,
        });
        const page = await iterator.fetchNext();
        const items = page.resources.map(({ deleteTokenHash: _deleteTokenHash, ...post }) => ({ ...post, comments: Array.isArray(post.comments) ? post.comments.map(({ deleteTokenHash: _commentTokenHash, ...comment }) => comment) : [] }));
        return json(200, { items, continuationToken: page.continuationToken ?? null });
      }

      const body = await request.json();
      const animal = cleanText(body?.animal, 40);
      const location = cleanText(body?.location, 120);
      const description = cleanText(body?.description, 500);
      const author = cleanText(body?.author, 60) || 'あなた';
      const imageId = cleanText(body?.imageId, 50);
      if (!animal || !location || !description || !/^[0-9a-f-]{36}\.(jpg|png|webp|heic|heif)$/.test(imageId)) {
        return json(400, { error: 'animal、location、description、正しいimageIdは必須です。' });
      }

      const deleteToken = randomBytes(32).toString('base64url');
      const post = {
        id: randomUUID(), animal, location, description, author,
        imageId, deleteTokenHash: createHash('sha256').update(deleteToken).digest('hex'),
        createdAt: new Date().toISOString(), likes: 0, comments: [],
      };
      const { resource } = await container.items.create(post);
      const { deleteTokenHash: _deleteTokenHash, ...safeResource } = resource;
      return json(201, { ...safeResource, deleteToken });
    } catch (error) {
      context.error('posts request failed', error);
      return json(500, { error: '投稿データの処理に失敗しました。' });
    }
  },
});
