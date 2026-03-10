import { createServerClient } from '@supabase/ssr';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import { redirect, type Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	// Créer le client Supabase pour le serveur
	event.locals.supabase = createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
		cookies: {
			getAll: () => event.cookies.getAll(),
			setAll: (cookiesToSet) => {
				cookiesToSet.forEach(({ name, value, options }) => {
					event.cookies.set(name, value, { ...options, path: '/' });
				});
			}
		}
	});

	// Helper pour obtenir la session de manière sécurisée
	// IMPORTANT: On utilise getUser() car getSession() peut renvoyer des données du cache
	event.locals.safeGetSession = async () => {
		const {
			data: { user },
			error
		} = await event.locals.supabase.auth.getUser();
		
		if (error || !user) {
			return { session: null, user: null };
		}

		const {
			data: { session }
		} = await event.locals.supabase.auth.getSession();

		return { session, user };
	};

	// Protection des routes admin
	if (event.url.pathname.startsWith('/admin')) {
		// Vérifier l'utilisateur directement (plus fiable que getSession)
		const { data: { user } } = await event.locals.supabase.auth.getUser();
		
		// Permettre l'accès à la page de login
		if (event.url.pathname === '/admin/login') {
			if (user) {
				// Si déjà connecté, rediriger vers l'admin
				throw redirect(303, '/admin');
			}
			return resolve(event);
		}

		// Protéger toutes les autres routes admin
		if (!user) {
			throw redirect(303, '/admin/login');
		}
	}

	return resolve(event, {
		filterSerializedResponseHeaders(name) {
			return name === 'content-range' || name === 'x-supabase-api-version';
		}
	});
};
