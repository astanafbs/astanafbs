'use server';

import { revalidatePath } from 'next/cache';

import { adminCreate, adminDelete, adminPatch } from './api';

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function numberValue(formData: FormData, key: string) {
  const value = text(formData, key);
  return value ? Number(value) : undefined;
}

function revalidateAdmin() {
  [
    '/',
    '/tournaments',
    '/news',
    '/clubs',
    '/users',
    '/listings',
    '/products',
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
    entryFeeCents: numberValue(formData, 'entryFeeCents') ?? 0,
    maxPlayers: numberValue(formData, 'maxPlayers'),
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
    location: text(formData, 'location'),
    entryFeeCents: numberValue(formData, 'entryFeeCents'),
    maxPlayers: numberValue(formData, 'maxPlayers'),
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
    scheduledAt: text(formData, 'scheduledAt'),
  });
  revalidateAdmin();
}

export async function updateMatch(formData: FormData) {
  const id = text(formData, 'id');
  if (!id) return;
  await adminPatch(`/admin/matches/${id}`, {
    status: text(formData, 'status'),
    score: text(formData, 'score'),
    winnerId: text(formData, 'winnerId'),
    roundName: text(formData, 'roundName'),
  });
  revalidateAdmin();
}

export async function deleteMatch(formData: FormData) {
  const id = text(formData, 'id');
  if (id) await adminDelete(`/admin/matches/${id}`);
  revalidateAdmin();
}

export async function createNews(formData: FormData) {
  await adminCreate('/admin/news', {
    title: text(formData, 'title'),
    body: text(formData, 'body'),
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
    wins: numberValue(formData, 'wins'),
    losses: numberValue(formData, 'losses'),
  });
  revalidateAdmin();
  return;
}

export async function updateListing(formData: FormData) {
  const id = text(formData, 'id');
  if (!id) return;
  await adminPatch(`/admin/listings/${id}`, {
    title: text(formData, 'title'),
    category: text(formData, 'category'),
    priceCents: numberValue(formData, 'priceCents'),
    status: text(formData, 'status'),
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

export async function createProduct(formData: FormData) {
  await adminCreate('/admin/products', {
    title: text(formData, 'title'),
    description: text(formData, 'description'),
    priceCents: numberValue(formData, 'priceCents') ?? 0,
    status: text(formData, 'status') ?? 'draft',
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
    priceCents: numberValue(formData, 'priceCents'),
    status: text(formData, 'status'),
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
