import { apiFetch } from '../../shared/lib/api';

export async function syncPushToken(expoPushToken: string) {
  return apiFetch<{ data: unknown }>('/push-tokens', {
    method: 'POST',
    body: JSON.stringify({
      expoPushToken,
      platform: process.env.EXPO_OS,
      enabled: true,
    }),
  });
}
