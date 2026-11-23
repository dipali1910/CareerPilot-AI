import { supabase } from './supabase'

/**
 * Send requests to the CareerPilot API with the current Supabase access token.
 * The backend verifies this token and derives the user identity from it;
 * client-supplied email/user IDs are never treated as authentication.
 */
export async function apiFetch(input, init = {}) {
  const { data: { session }, error } = await supabase.auth.getSession()

  if (error) {
    throw new Error(error.message || 'Unable to read your sign-in session.')
  }

  if (!session?.access_token) {
    throw new Error('Your session has expired. Please sign in again.')
  }

  const headers = new Headers(init.headers || {})
  headers.set('Authorization', `Bearer ${session.access_token}`)

  return fetch(input, { ...init, headers })
}
