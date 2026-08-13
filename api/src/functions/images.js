import { randomUUID } from 'node:crypto';
import { app } from '@azure/functions';
import { getImagesContainer } from '../blob.js';
import { json } from '../http.js';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const allowedTypes = new Map([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
  ['image/heic', 'heic'],
  ['image/heif', 'heif'],
]);

app.http('uploadImage', {
  methods: ['POST'],
  authLevel: 'function',
  route: 'images',
  handler: async (request, context) => {
    try {
      const form = await request.formData();
      const file = form.get('image');
      if (!file || typeof file === 'string') return json(400, { error: 'imageファイルは必須です。' });
      const extension = allowedTypes.get(file.type);
      if (!extension) return json(415, { error: 'JPEG、PNG、WebP、HEIC画像のみ使用できます。' });
      if (file.size <= 0 || file.size > MAX_IMAGE_BYTES) return json(413, { error: '画像は5MB以下にしてください。' });

      const imageId = `${randomUUID()}.${extension}`;
      const bytes = Buffer.from(await file.arrayBuffer());
      await getImagesContainer().getBlockBlobClient(imageId).uploadData(bytes, {
        blobHTTPHeaders: { blobContentType: file.type },
      });
      return json(201, { imageId });
    } catch (error) {
      context.error('image upload failed', error);
      return json(500, { error: '画像の保存に失敗しました。' });
    }
  },
});

app.http('getImage', {
  methods: ['GET'],
  authLevel: 'function',
  route: 'images/{imageId}',
  handler: async (request, context) => {
    try {
      const imageId = request.params.imageId;
      if (!/^[0-9a-f-]{36}\.(jpg|png|webp|heic|heif)$/.test(imageId)) return json(400, { error: '画像IDが不正です。' });
      const download = await getImagesContainer().getBlobClient(imageId).download();
      if ((download.contentLength ?? 0) > MAX_IMAGE_BYTES) return json(413, { error: '画像サイズが上限を超えています。' });
      const chunks = [];
      let size = 0;
      for await (const chunk of download.readableStreamBody) {
        const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        size += bytes.length;
        if (size > MAX_IMAGE_BYTES) return json(413, { error: '画像サイズが上限を超えています。' });
        chunks.push(bytes);
      }
      return {
        status: 200,
        headers: {
          'Content-Type': download.contentType ?? 'application/octet-stream',
          'Cache-Control': 'private, max-age=86400',
        },
        body: Buffer.concat(chunks),
      };
    } catch (error) {
      if (error?.statusCode === 404) return json(404, { error: '画像が見つかりません。' });
      context.error('image download failed', error);
      return json(500, { error: '画像の取得に失敗しました。' });
    }
  },
});
