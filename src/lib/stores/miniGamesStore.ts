import { writable, derived, get } from 'svelte/store';
import type { MiniGameRow, MiniGameInsert, MiniGameUpdate, ModuleStatus, MiniGameType } from '$lib/supabase/types';
import type { SupabaseClient } from '@supabase/supabase-js';

// Store principal des mini-jeux
export const miniGames = writable<MiniGameRow[]>([]);

// Store pour l'état de chargement
export const isLoadingMiniGames = writable<boolean>(false);

// Store pour les erreurs
export const miniGamesError = writable<string | null>(null);

// Mini-jeux filtrés et triés
export const activeMiniGames = derived(miniGames, ($miniGames) => {
	return $miniGames
		.filter(g => g.status === 'actif')
		.sort((a, b) => {
			// Trier par module parent puis par ordre
			if (a.after_module_id !== b.after_module_id) {
				return (a.after_module_id || '').localeCompare(b.after_module_id || '');
			}
			return a.ordre - b.ordre;
		});
});

// Statistiques des mini-jeux
export const miniGameStats = derived(miniGames, ($miniGames) => ({
	total: $miniGames.length,
	actifs: $miniGames.filter(g => g.status === 'actif').length,
	brouillons: $miniGames.filter(g => g.status === 'brouillon').length,
	archives: $miniGames.filter(g => g.status === 'archive').length
}));

// Labels pour les types de mini-jeux
export const miniGameTypeLabels: Record<MiniGameType, string> = {
	memory: 'Memory',
	puzzle: 'Puzzle',
	quiz_flash: 'Quiz Flash',
	drag_drop: 'Glisser-Déposer',
	find_difference: 'Différences',
	sequence: 'Séquence'
};

// Icônes pour les types de mini-jeux
export const miniGameTypeIcons: Record<MiniGameType, string> = {
	memory: 'Brain',
	puzzle: 'Puzzle',
	quiz_flash: 'Zap',
	drag_drop: 'Move',
	find_difference: 'Search',
	sequence: 'ListOrdered'
};

// === FONCTIONS SUPABASE ===

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let supabaseClient: SupabaseClient<any> | null = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function setMiniGameSupabaseClient(client: SupabaseClient<any>) {
	supabaseClient = client;
}

// Charger tous les mini-jeux depuis Supabase
export async function loadMiniGames(): Promise<void> {
	if (!supabaseClient) {
		console.warn('Supabase client not initialized for mini-games');
		return;
	}

	isLoadingMiniGames.set(true);
	miniGamesError.set(null);

	const { data, error: fetchError } = await supabaseClient
		.from('mini_games')
		.select('*')
		.order('ordre', { ascending: true });

	if (fetchError) {
		miniGamesError.set(fetchError.message);
		console.error('Error loading mini-games:', fetchError);
	} else {
		miniGames.set(data || []);
	}

	isLoadingMiniGames.set(false);
}

// Ajouter un mini-jeu
export async function addMiniGame(gameData: MiniGameInsert): Promise<MiniGameRow | null> {
	if (!supabaseClient) return null;

	isLoadingMiniGames.set(true);
	miniGamesError.set(null);

	const { data, error: insertError } = await supabaseClient
		.from('mini_games')
		.insert(gameData)
		.select()
		.single();

	if (insertError) {
		miniGamesError.set(insertError.message);
		console.error('Error adding mini-game:', insertError);
		isLoadingMiniGames.set(false);
		return null;
	}

	miniGames.update(g => [...g, data as MiniGameRow]);
	isLoadingMiniGames.set(false);
	return data as MiniGameRow;
}

// Mettre à jour un mini-jeu
export async function updateMiniGame(id: string, changes: MiniGameUpdate): Promise<boolean> {
	if (!supabaseClient) return false;

	miniGamesError.set(null);

	const { data, error: updateError } = await supabaseClient
		.from('mini_games')
		.update(changes)
		.eq('id', id)
		.select()
		.single();

	if (updateError) {
		miniGamesError.set(updateError.message);
		console.error('Error updating mini-game:', updateError);
		return false;
	}

	miniGames.update(games => games.map(g => g.id === id ? (data as MiniGameRow) : g));
	return true;
}

// Supprimer un mini-jeu
export async function deleteMiniGame(id: string): Promise<boolean> {
	if (!supabaseClient) return false;

	miniGamesError.set(null);

	const { error: deleteError } = await supabaseClient
		.from('mini_games')
		.delete()
		.eq('id', id);

	if (deleteError) {
		miniGamesError.set(deleteError.message);
		console.error('Error deleting mini-game:', deleteError);
		return false;
	}

	miniGames.update(games => games.filter(g => g.id !== id));
	return true;
}

// Obtenir les mini-jeux après un module
export function getMiniGamesAfterModule(moduleId: string): MiniGameRow[] {
	return get(miniGames)
		.filter(g => g.after_module_id === moduleId && g.status === 'actif')
		.sort((a, b) => a.ordre - b.ordre);
}
