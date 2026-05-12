export type StorageObject = {
  key: string;
  url?: string;
};

export function getStoragePublicUrl(object?: StorageObject | null) {
  if (!object) {
    return null;
  }

  return object.url ?? `${process.env.EXPO_PUBLIC_STORAGE_PUBLIC_URL ?? ''}/${object.key}`;
}
