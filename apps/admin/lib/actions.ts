'use server';

import { revalidatePath } from 'next/cache';

import { adminCreate, adminDelete, adminPatch, adminUploadFile } from './api';

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function nullableText(formData: FormData, key: string) {
  const value = text(formData, key);
  return value ?? null;
}

function numberValue(formData: FormData, key: string) {
  const value = text(formData, key);
  return value ? Number(value) : undefined;
}

function tengeValue(formData: FormData, key: string) {
  const value = text(formData, key);
  if (!value) return undefined;
  const amount = Number(value.replace(',', '.'));
  return Number.isFinite(amount) ? Math.round(amount * 100) : undefined;
}

function csv(formData: FormData, key: string) {
  const value = text(formData, key);
  return value
    ? value.split(',').map((item) => item.trim()).filter(Boolean)
    : undefined;
}

function isUploadedFile(value: FormDataEntryValue | null): value is File {
  return typeof File !== 'undefined' && value instanceof File && value.size > 0;
}

async function imageValue(formData: FormData, key: string, folder: string) {
  const file = formData.get(`${key}File`);
  if (isUploadedFile(file)) {
    return adminUploadFile(folder, file);
  }

  return text(formData, key);
}

async function imageValues(formData: FormData, key: string, folder: string) {
  const existing = csv(formData, key) ?? [];
  const files = formData.getAll(`${key}Files`).filter(isUploadedFile);
  if (!files.length) return existing.length ? existing : undefined;

  const uploaded = await Promise.all(files.map((file) => adminUploadFile(folder, file)));
  return [...existing, ...uploaded];
}

function revalidateAdmin() {
  [
    '/',
    '/tournaments',
    '/matches',
    '/streams',
    '/news',
    '/clubs',
    '/users',
    '/listings',
    '/products',
    '/training',
    '/profile-statuses',
    '/push',
  ].forEach((path) => revalidatePath(path));
}

export async function createTournament(formData: FormData) {
  await adminCreate('/admin/tournaments', {
    title: text(formData, 'title'),
    status: text(formData, 'status') ?? 'draft',
    startsAt: text(formData, 'startsAt'),
    endsAt: text(formData, 'endsAt'),
    clubId: text(formData, 'clubId'),
    location: text(formData, 'location'),
    discipline: text(formData, 'discipline') ?? 'Москва',
    tournamentFormat: text(formData, 'tournamentFormat') ?? 'single_elimination',
    entryFeeCents: tengeValue(formData, 'entryFeeCents') ?? 0,
    maxPlayers: numberValue(formData, 'maxPlayers'),
    bannerKey: await imageValue(formData, 'bannerKey', 'banners'),
    firstPlaceUserId: text(formData, 'firstPlaceUserId'),
    secondPlaceUserId: text(formData, 'secondPlaceUserId'),
    thirdPlaceUserId: text(formData, 'thirdPlaceUserId'),
    thirdPlaceSecondUserId: text(formData, 'thirdPlaceSecondUserId'),
  });
  revalidateAdmin();
  return;
}

export async function updateTournament(formData: FormData) {
  const id = text(formData, 'id');
  if (!id) return;
  await adminPatch(`/admin/tournaments/${id}`, {
    title: text(formData, 'title'),
    status: text(formData, 'status'),
    startsAt: text(formData, 'startsAt'),
    endsAt: text(formData, 'endsAt'),
    clubId: text(formData, 'clubId'),
    location: text(formData, 'location'),
    discipline: text(formData, 'discipline'),
    tournamentFormat: text(formData, 'tournamentFormat'),
    entryFeeCents: tengeValue(formData, 'entryFeeCents'),
    maxPlayers: numberValue(formData, 'maxPlayers'),
    bannerKey: await imageValue(formData, 'bannerKey', 'banners'),
    firstPlaceUserId: text(formData, 'firstPlaceUserId'),
    secondPlaceUserId: text(formData, 'secondPlaceUserId'),
    thirdPlaceUserId: text(formData, 'thirdPlaceUserId'),
    thirdPlaceSecondUserId: text(formData, 'thirdPlaceSecondUserId'),
  });
  revalidateAdmin();
  return;
}

export async function deleteTournament(formData: FormData) {
  const id = text(formData, 'id');
  if (id) await adminDelete(`/admin/tournaments/${id}`);
  revalidateAdmin();
  return;
}

export async function generateTournamentBracket(formData: FormData) {
  const id = text(formData, 'id');
  if (!id) return;
  await adminCreate(`/admin/tournaments/${id}/generate-bracket`, {});
  revalidateAdmin();
}

export async function updateRegistration(formData: FormData) {
  const id = text(formData, 'id');
  if (!id) return;
  await adminPatch(`/admin/registrations/${id}`, {
    status: text(formData, 'status'),
    seedNumber: numberValue(formData, 'seedNumber'),
  });
  revalidateAdmin();
}

export async function createMatch(formData: FormData) {
  await adminCreate('/admin/matches', {
    tournamentId: text(formData, 'tournamentId'),
    playerAId: text(formData, 'playerAId'),
    playerBId: text(formData, 'playerBId'),
    roundName: text(formData, 'roundName') ?? 'Round 1',
    roundNumber: numberValue(formData, 'roundNumber'),
    bracketPosition: numberValue(formData, 'bracketPosition'),
    tableNumber: numberValue(formData, 'tableNumber'),
    scheduledAt: text(formData, 'scheduledAt'),
  });
  revalidateAdmin();
}

export async function updateMatch(formData: FormData) {
  const id = text(formData, 'id');
  if (!id) return;
  await adminPatch(`/admin/matches/${id}`, {
    playerAId: text(formData, 'playerAId'),
    playerBId: text(formData, 'playerBId'),
    status: text(formData, 'status'),
    score: text(formData, 'score'),
    winnerId: text(formData, 'winnerId'),
    roundName: text(formData, 'roundName'),
    tableNumber: numberValue(formData, 'tableNumber'),
    scheduledAt: text(formData, 'scheduledAt'),
  });
  revalidateAdmin();
}

export async function deleteMatch(formData: FormData) {
  const id = text(formData, 'id');
  if (id) await adminDelete(`/admin/matches/${id}`);
  revalidateAdmin();
}

export async function createStream(formData: FormData) {
  await adminCreate('/admin/streams', {
    title: text(formData, 'title'),
    youtubeVideoId: nullableText(formData, 'youtubeVideoId'),
    matchId: nullableText(formData, 'matchId'),
    status: text(formData, 'status') ?? 'draft',
    startsAt: text(formData, 'startsAt'),
  });
  revalidateAdmin();
}

export async function updateStream(formData: FormData) {
  const id = text(formData, 'id');
  if (!id) return;
  await adminPatch(`/admin/streams/${id}`, {
    title: text(formData, 'title'),
    youtubeVideoId: nullableText(formData, 'youtubeVideoId'),
    matchId: nullableText(formData, 'matchId'),
    status: text(formData, 'status') ?? 'draft',
    startsAt: text(formData, 'startsAt'),
  });
  revalidateAdmin();
}

export async function deleteStream(formData: FormData) {
  const id = text(formData, 'id');
  if (id) await adminDelete(`/admin/streams/${id}`);
  revalidateAdmin();
}

export async function createNews(formData: FormData) {
  await adminCreate('/admin/news', {
    title: text(formData, 'title'),
    body: text(formData, 'body'),
    imageKey: await imageValue(formData, 'imageKey', 'news'),
    status: text(formData, 'status') ?? 'draft',
  });
  revalidateAdmin();
  return;
}

export async function updateNews(formData: FormData) {
  const id = text(formData, 'id');
  if (!id) return;
  await adminPatch(`/admin/news/${id}`, {
    title: text(formData, 'title'),
    body: text(formData, 'body'),
    imageKey: await imageValue(formData, 'imageKey', 'news'),
    status: text(formData, 'status'),
  });
  revalidateAdmin();
  return;
}

export async function deleteNews(formData: FormData) {
  const id = text(formData, 'id');
  if (id) await adminDelete(`/admin/news/${id}`);
  revalidateAdmin();
  return;
}

export async function createClub(formData: FormData) {
  await adminCreate('/admin/clubs', {
    name: text(formData, 'name'),
    address: text(formData, 'address'),
    city: text(formData, 'city') ?? 'Astana',
    phone: text(formData, 'phone'),
    imageKey: await imageValue(formData, 'imageKey', 'clubs'),
    twoGisUrl: text(formData, 'twoGisUrl'),
  });
  revalidateAdmin();
  return;
}

export async function updateClub(formData: FormData) {
  const id = text(formData, 'id');
  if (!id) return;
  await adminPatch(`/admin/clubs/${id}`, {
    name: text(formData, 'name'),
    address: text(formData, 'address'),
    city: text(formData, 'city'),
    phone: text(formData, 'phone'),
    imageKey: await imageValue(formData, 'imageKey', 'clubs'),
    twoGisUrl: text(formData, 'twoGisUrl'),
  });
  revalidateAdmin();
  return;
}

export async function deleteClub(formData: FormData) {
  const id = text(formData, 'id');
  if (id) await adminDelete(`/admin/clubs/${id}`);
  revalidateAdmin();
  return;
}

export async function updateUser(formData: FormData) {
  const id = text(formData, 'id');
  if (!id) return;
  await adminPatch(`/admin/users/${id}`, {
    displayName: text(formData, 'displayName'),
    city: text(formData, 'city'),
    role: text(formData, 'role'),
    rating: numberValue(formData, 'rating'),
    clubName: text(formData, 'clubName'),
    skillLevel: text(formData, 'skillLevel'),
    profileStatusId: text(formData, 'profileStatusId'),
    titles: csv(formData, 'titles'),
    wins: numberValue(formData, 'wins'),
    losses: numberValue(formData, 'losses'),
    clubAdminClubId: text(formData, 'clubAdminClubId'),
    appAccessUntil: text(formData, 'appAccessUntil'),
    streamWatchUntil: text(formData, 'streamWatchUntil'),
    listingPublishUntil: text(formData, 'listingPublishUntil'),
  });
  revalidateAdmin();
  return;
}

export async function deleteUser(formData: FormData) {
  const id = text(formData, 'id');
  if (id) await adminDelete(`/admin/users/${id}`);
  revalidateAdmin();
  return;
}

export async function createProfileStatus(formData: FormData) {
  await adminCreate('/admin/profile-statuses', {
    label: text(formData, 'label'),
    description: text(formData, 'description'),
    sortOrder: numberValue(formData, 'sortOrder') ?? 0,
    status: text(formData, 'status') ?? 'published',
  });
  revalidateAdmin();
  return;
}

export async function updateProfileStatus(formData: FormData) {
  const id = text(formData, 'id');
  if (!id) return;
  await adminPatch(`/admin/profile-statuses/${id}`, {
    label: text(formData, 'label'),
    description: text(formData, 'description'),
    sortOrder: numberValue(formData, 'sortOrder'),
    status: text(formData, 'status'),
  });
  revalidateAdmin();
  return;
}

export async function deleteProfileStatus(formData: FormData) {
  const id = text(formData, 'id');
  if (id) await adminDelete(`/admin/profile-statuses/${id}`);
  revalidateAdmin();
  return;
}

export async function updateListing(formData: FormData) {
  const id = text(formData, 'id');
  if (!id) return;
  await adminPatch(`/admin/listings/${id}`, {
    title: text(formData, 'title'),
    description: text(formData, 'description'),
    category: text(formData, 'category'),
    priceCents: tengeValue(formData, 'priceCents'),
    status: text(formData, 'status'),
    imageKeys: await imageValues(formData, 'imageKeys', 'listings'),
    publishedUntil: text(formData, 'publishedUntil'),
  });
  revalidateAdmin();
  return;
}

export async function createListing(formData: FormData) {
  await adminCreate('/admin/listings', {
    userId: text(formData, 'userId'),
    title: text(formData, 'title'),
    description: text(formData, 'description'),
    category: text(formData, 'category') ?? 'misc',
    priceCents: tengeValue(formData, 'priceCents'),
    status: text(formData, 'status') ?? 'published',
    imageKeys: await imageValues(formData, 'imageKeys', 'listings'),
    publishedUntil: text(formData, 'publishedUntil'),
  });
  revalidateAdmin();
  return;
}

export async function deleteListing(formData: FormData) {
  const id = text(formData, 'id');
  if (id) await adminDelete(`/admin/listings/${id}`);
  revalidateAdmin();
  return;
}

export async function createTrainingTemplate(formData: FormData) {
  await adminCreate('/admin/training-templates', {
    title: text(formData, 'title'),
    target: text(formData, 'target'),
    metric: text(formData, 'metric'),
    sortOrder: numberValue(formData, 'sortOrder') ?? 0,
    status: text(formData, 'status') ?? 'published',
  });
  revalidateAdmin();
  return;
}

export async function updateTrainingTemplate(formData: FormData) {
  const id = text(formData, 'id');
  if (!id) return;
  await adminPatch(`/admin/training-templates/${id}`, {
    title: text(formData, 'title'),
    target: text(formData, 'target'),
    metric: text(formData, 'metric'),
    sortOrder: numberValue(formData, 'sortOrder'),
    status: text(formData, 'status'),
  });
  revalidateAdmin();
  return;
}

export async function deleteTrainingTemplate(formData: FormData) {
  const id = text(formData, 'id');
  if (id) await adminDelete(`/admin/training-templates/${id}`);
  revalidateAdmin();
  return;
}

export async function createProduct(formData: FormData) {
  await adminCreate('/admin/products', {
    title: text(formData, 'title'),
    description: text(formData, 'description'),
    priceCents: tengeValue(formData, 'priceCents') ?? 0,
    status: text(formData, 'status') ?? 'draft',
    imageKey: await imageValue(formData, 'imageKey', 'products'),
  });
  revalidateAdmin();
  return;
}

export async function updateProduct(formData: FormData) {
  const id = text(formData, 'id');
  if (!id) return;
  await adminPatch(`/admin/products/${id}`, {
    title: text(formData, 'title'),
    description: text(formData, 'description'),
    priceCents: tengeValue(formData, 'priceCents'),
    status: text(formData, 'status'),
    imageKey: await imageValue(formData, 'imageKey', 'products'),
  });
  revalidateAdmin();
  return;
}

export async function deleteProduct(formData: FormData) {
  const id = text(formData, 'id');
  if (id) await adminDelete(`/admin/products/${id}`);
  revalidateAdmin();
  return;
}

export async function createPushCampaign(formData: FormData) {
  await adminCreate('/admin/push-campaigns', {
    title: text(formData, 'title'),
    body: text(formData, 'body'),
    target: text(formData, 'target') ?? 'all',
    sendNow: formData.get('sendNow') === 'on',
  });
  revalidateAdmin();
  return;
}

export async function updatePushCampaign(formData: FormData) {
  const id = text(formData, 'id');
  if (!id) return;
  await adminPatch(`/admin/push-campaigns/${id}`, {
    title: text(formData, 'title'),
    body: text(formData, 'body'),
    target: text(formData, 'target'),
    status: text(formData, 'status'),
  });
  revalidateAdmin();
  return;
}

export async function deletePushCampaign(formData: FormData) {
  const id = text(formData, 'id');
  if (id) await adminDelete(`/admin/push-campaigns/${id}`);
  revalidateAdmin();
  return;
}
