import { createHash, randomUUID, timingSafeEqual } from 'node:crypto';
import { app } from '@azure/functions';
import { getPostsContainer } from '../cosmos.js';
import { getImagesContainer } from '../blob.js';
import { json } from '../http.js';

function validPostReference(body) {
  return typeof body?.id === 'string' && body.id.length <= 64 && typeof body?.animal === 'string' && body.animal.length <= 40;
}

app.http('interactions', {
  methods: ['POST'],
  authLevel: 'function',
  route: 'interactions/{action}',
  handler: async (request, context) => {
    try {
      const body = await request.json();
      if (!validPostReference(body)) return json(400, { error: '投稿の指定が不正です。' });
      const item = getPostsContainer().item(body.id, body.animal);

      if (request.params.action === 'delete') {
        const { resource: current } = await item.read();
        const suppliedHash = createHash('sha256').update(typeof body.deleteToken === 'string' ? body.deleteToken : '').digest();
        const storedHash = typeof current?.deleteTokenHash === 'string' ? Buffer.from(current.deleteTokenHash, 'hex') : Buffer.alloc(0);
        if (storedHash.length !== suppliedHash.length || !timingSafeEqual(storedHash, suppliedHash)) {
          return json(403, { error: 'この投稿を削除する権限がありません。' });
        }
        await item.delete();
        if (typeof current.imageId === 'string') {
          await getImagesContainer().getBlobClient(current.imageId).deleteIfExists();
        }
        return { status: 204 };
      }

      if (request.params.action === 'like') {
        const delta = body.delta === -1 ? -1 : body.delta === 1 ? 1 : 0;
        if (!delta) return json(400, { error: 'いいねの変更値が不正です。' });
        const { resource: current } = await item.read();
        const likes = Math.max(0, Number(current?.likes ?? 0) + delta);
        await item.patch([{ op: 'set', path: '/likes', value: likes }]);
        return json(200, { likes });
      }

      if (request.params.action === 'comment') {
        const text = typeof body.text === 'string' ? body.text.trim().slice(0, 200) : '';
        const author = typeof body.author === 'string' ? body.author.trim().slice(0, 60) : 'あなた';
        if (!text) return json(400, { error: 'コメントを入力してください。' });
        const deleteToken = randomUUID();
        const comment = { id: randomUUID(), author: author || 'あなた', body: text, createdAt: new Date().toISOString(), deleteTokenHash: createHash('sha256').update(deleteToken).digest('hex') };
        const { resource: current } = await item.read();
        const comments = Array.isArray(current?.comments) ? current.comments : [];
        await item.patch([{ op: 'set', path: '/comments', value: [...comments, comment].slice(-100) }]);
        const { deleteTokenHash: _deleteTokenHash, ...safeComment } = comment;
        return json(201, { ...safeComment, deleteToken });
      }

      if (request.params.action === 'delete-comment') {
        const commentId = typeof body.commentId === 'string' ? body.commentId : '';
        const deleteToken = typeof body.deleteToken === 'string' ? body.deleteToken : '';
        const { resource: current } = await item.read();
        const comments = Array.isArray(current?.comments) ? current.comments : [];
        const comment = comments.find(entry => entry.id === commentId);
        const suppliedHash = createHash('sha256').update(deleteToken).digest();
        const storedHash = typeof comment?.deleteTokenHash === 'string' ? Buffer.from(comment.deleteTokenHash, 'hex') : Buffer.alloc(0);
        if (storedHash.length !== suppliedHash.length || !timingSafeEqual(storedHash, suppliedHash)) {
          return json(403, { error: 'このコメントを削除する権限がありません。' });
        }
        await item.patch([{ op: 'set', path: '/comments', value: comments.filter(entry => entry.id !== commentId) }]);
        return { status: 204 };
      }

      return json(404, { error: '操作が見つかりません。' });
    } catch (error) {
      if (error?.code === 404) return json(404, { error: '投稿が見つかりません。' });
      context.error('interaction failed', error);
      return json(500, { error: '操作を保存できませんでした。' });
    }
  },
});
