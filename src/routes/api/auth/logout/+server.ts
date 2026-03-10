import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals, cookies }) => {
	// Déconnecter via Supabase
	await locals.supabase.auth.signOut();
	
	// Supprimer tous les cookies Supabase manuellement
	const allCookies = cookies.getAll();
	for (const cookie of allCookies) {
		if (cookie.name.startsWith('sb-') || cookie.name.includes('supabase')) {
			cookies.delete(cookie.name, { path: '/' });
		}
	}
	
	throw redirect(303, '/admin/login');
};
