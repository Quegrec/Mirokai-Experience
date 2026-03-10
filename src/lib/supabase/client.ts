import { createBrowserClient, createServerClient, isBrowser } from '@supabase/ssr';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import type { Database } from './types';

export function createSupabaseClient(
	serverFetch?: typeof fetch,
	serverCookies?: {
		get: (key: string) => string | undefined;
		set: (key: string, value: string, options: object) => void;
		remove: (key: string, options: object) => void;
	}
) {
	if (isBrowser()) {
		return createBrowserClient<Database>(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);
	}

	return createServerClient<Database>(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
		global: {
			fetch: serverFetch
		},
		cookies: serverCookies!
	});
}
