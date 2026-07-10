import { API_URL, apiFetch } from './api';

type PresignedUpload = {
  data: {
    key: string;
    uploadUrl: string;
    method: 'PUT';
  };
};

export async function uploadImageUri({
  folder,
  uri,
  filename,
  contentType,
}: {
  folder: 'avatars' | 'banners' | 'news' | 'products' | 'listings' | 'clubs' | 'tournaments';
  uri: string;
  filename?: string | null;
  contentType?: string | null;
}) {
  const resolvedContentType = contentType || 'image/jpeg';
  const resolvedFilename = filename || `image-${Date.now()}.${resolvedContentType.split('/')[1] || 'jpg'}`;
  const presign = await apiFetch<PresignedUpload>('/files/presign-upload', {
    method: 'POST',
    body: JSON.stringify({
      folder,
      filename: resolvedFilename,
      contentType: resolvedContentType,
    }),
  });

  const fileResponse = await fetch(uri);
  const blob = await fileResponse.blob();
  const uploadResponse = await fetch(presign.data.uploadUrl, {
    method: presign.data.method,
    headers: {
      'Content-Type': resolvedContentType,
    },
    body: blob,
  });

  if (!uploadResponse.ok) {
    throw new Error('Не удалось загрузить файл');
  }

  const path = presign.data.key.split('/').map(encodeURIComponent).join('/');
  return `${API_URL}/files/${path}`;
}
