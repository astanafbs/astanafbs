export type AppState =
  | 'booting'
  | 'checking_auth'
  | 'unauthenticated'
  | 'syncing_user'
  | 'profile_required'
  | 'authenticated'
  | 'offline'
  | 'maintenance';

export type DataState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'empty' }
  | { status: 'error'; message: string }
  | { status: 'refreshing'; data: T }
  | { status: 'offline'; data?: T };

export type MutationState = 'idle' | 'submitting' | 'success' | 'error';
