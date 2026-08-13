import { createHash, randomUUID } from 'node:crypto';
import { app } from '@azure/functions';
import { getReportsContainer } from '../cosmos.js';
import { json } from '../http.js';

const reasons = new Set(['不適切な内容', '動物モチーフではない', '迷惑行為・スパム', '個人情報が含まれている', 'その他']);

app.http('reports', {
  methods: ['POST'],
  authLevel: 'function',
  route: 'reports',
  handler: async (request, context) => {
    try {
      const body = await request.json();
      const deviceId = typeof body?.deviceId === 'string' ? body.deviceId : '';
      const targetId = typeof body?.targetId === 'string' ? body.targetId.slice(0, 64) : '';
      const postId = typeof body?.postId === 'string' ? body.postId.slice(0, 64) : '';
      const targetType = body?.targetType === 'comment' ? 'comment' : body?.targetType === 'post' ? 'post' : '';
      const reason = reasons.has(body?.reason) ? body.reason : '';
      if (!/^[0-9a-f-]{36}$/.test(deviceId) || !targetId || !postId || !targetType || !reason) return json(400, { error: '通報内容が不正です。' });

      const reporterId = createHash('sha256').update(deviceId).digest('hex');
      const container = getReportsContainer();
      const { resources: duplicate } = await container.items.query({
        query: 'SELECT TOP 1 c.id FROM c WHERE c.reporterId = @reporterId AND c.targetType = @targetType AND c.targetId = @targetId',
        parameters: [{ name: '@reporterId', value: reporterId }, { name: '@targetType', value: targetType }, { name: '@targetId', value: targetId }],
      }, { partitionKey: reporterId }).fetchAll();
      if (duplicate.length) return json(409, { error: 'この内容はすでに通報済みです。' });

      const oneHourAgo = new Date(Date.now() - 3_600_000).toISOString();
      const { resources: recent } = await container.items.query({
        query: 'SELECT VALUE COUNT(1) FROM c WHERE c.reporterId = @reporterId AND c.createdAt >= @oneHourAgo',
        parameters: [{ name: '@reporterId', value: reporterId }, { name: '@oneHourAgo', value: oneHourAgo }],
      }, { partitionKey: reporterId }).fetchAll();
      if ((recent[0] ?? 0) >= 5) return json(429, { error: '短時間の通報回数が上限に達しました。時間をおいてください。' });

      await container.items.create({ id: randomUUID(), reporterId, targetType, targetId, postId, reason, status: 'open', createdAt: new Date().toISOString() });
      return json(201, { message: '通報を受け付けました。' });
    } catch (error) {
      context.error('report failed', error);
      return json(500, { error: '通報を送信できませんでした。' });
    }
  },
});
