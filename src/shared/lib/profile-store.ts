import { useSyncExternalStore } from 'react';

export type PersonalProfile = {
  fullName: string;
  city: string;
  photoUrl: string;
  phone: string;
  email: string;
  profileStatusId: string;
  profileStatusLabel: string;
  statuses: {
    openDuels: boolean;
    lookingClub: boolean;
    publicProfile: boolean;
  };
};

const listeners = new Set<() => void>();

let profile: PersonalProfile = {
  fullName: 'Игрок BilliardHUB',
  city: 'Астана',
  photoUrl: '',
  phone: '+7 ',
  email: 'player@billiardhub.kz',
  profileStatusId: '',
  profileStatusLabel: '',
  statuses: {
    openDuels: true,
    lookingClub: false,
    publicProfile: true,
  },
};

export function getPersonalProfile() {
  return profile;
}

export function setPersonalProfile(nextProfile: PersonalProfile) {
  profile = nextProfile;
  listeners.forEach((listener) => listener());
}

export function usePersonalProfile() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getPersonalProfile,
    getPersonalProfile,
  );
}
