import { writable, derived, get } from 'svelte/store';
import type { ModuleRow, ModuleInsert, ModuleUpdate, ModuleStatus, ModuleType } from '$lib/supabase/types';
import type { SupabaseClient } from '@supabase/supabase-js';

// Store principal des modules
export const modules = writable<ModuleRow[]>([]);

// Store pour l'état de chargement
export const isLoading = writable<boolean>(false);

// Store pour les erreurs
export const error = writable<string | null>(null);

// Store pour le filtre de recherche
export const searchQuery = writable<string>('');

// Store pour le filtre de statut
export const statusFilter = writable<ModuleStatus | 'all'>('all');

// Store pour le filtre de type
export const typeFilter = writable<ModuleType | 'all'>('all');

// Modules filtrés et triés
export const filteredModules = derived(
	[modules, searchQuery, statusFilter, typeFilter],
	([$modules, $searchQuery, $statusFilter, $typeFilter]) => {
		return $modules
			.filter(m => {
				// Filtre de recherche
				if ($searchQuery) {
					const query = $searchQuery.toLowerCase();
					if (!m.nom.toLowerCase().includes(query) && 
						!m.description.toLowerCase().includes(query)) {
						return false;
					}
				}
				// Filtre de statut
				if ($statusFilter !== 'all' && m.status !== $statusFilter) {
					return false;
				}
				// Filtre de type
				if ($typeFilter !== 'all' && m.type !== $typeFilter) {
					return false;
				}
				return true;
			})
			// Tri dynamique basé sur la position sur la carte (cohérent avec le parcours)
			// On lit la carte de bas en haut, puis de gauche à droite.
			.sort((a, b) => {
				const posA = a.position || { x: 50, y: 50 };
				const posB = b.position || { x: 50, y: 50 };

				// D'abord trier par Y (du bas vers le haut : y le plus grand en premier)
				if (posA.y !== posB.y) return posB.y - posA.y;

				// Puis par X (de gauche à droite)
				if (posA.x !== posB.x) return posA.x - posB.x;

				// En dernier recours, garder un ordre stable basé sur "ordre"
				return a.ordre - b.ordre;
			});
	}
);

// Statistiques des modules
export const moduleStats = derived(modules, ($modules) => ({
	total: $modules.length,
	actifs: $modules.filter(m => m.status === 'actif').length,
	brouillons: $modules.filter(m => m.status === 'brouillon').length,
	archives: $modules.filter(m => m.status === 'archive').length,
	dureeTotal: $modules
		.filter(m => m.status === 'actif')
		.reduce((acc, m) => acc + m.duree_estimee, 0)
}));

// === FONCTIONS SUPABASE ===

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let supabaseClient: SupabaseClient<any> | null = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function setSupabaseClient(client: SupabaseClient<any>) {
	supabaseClient = client;
}

// Charger tous les modules depuis Supabase
export async function loadModules(): Promise<void> {
	if (!supabaseClient) {
		console.warn('Supabase client not initialized');
		return;
	}

	isLoading.set(true);
	error.set(null);

	const { data, error: fetchError } = await supabaseClient
		.from('modules')
		.select('*')
		.order('ordre', { ascending: true });

	if (fetchError) {
		error.set(fetchError.message);
		console.error('Error loading modules:', fetchError);
	} else {
		const fetched = data || [];

		// Recalculer dynamiquement le champ "ordre" en fonction de la position sur la carte
		// (lecture de la carte de bas en haut puis de gauche à droite)
		const sortedByPosition = [...fetched].sort((a, b) => {
			const posA = a.position || { x: 50, y: 50 };
			const posB = b.position || { x: 50, y: 50 };

			// Y décroissant (bas -> haut)
			if (posA.y !== posB.y) return posB.y - posA.y;

			// X croissant (gauche -> droite)
			if (posA.x !== posB.x) return posA.x - posB.x;

			// Fallback stable sur l'ordre existant
			return a.ordre - b.ordre;
		});

		// Préparer les mises à jour pour les modules dont l'ordre change réellement
		const updates: { id: string; ordre: number }[] = [];
		sortedByPosition.forEach((mod, index) => {
			const newOrdre = index + 1;
			if (mod.ordre !== newOrdre) {
				mod.ordre = newOrdre;
				updates.push({ id: mod.id, ordre: newOrdre });
			}
		});

		// Sauvegarder en base uniquement si nécessaire
		if (updates.length > 0 && supabaseClient) {
			for (const u of updates) {
				const { error: updateError } = await supabaseClient
					.from('modules')
					.update({ ordre: u.ordre })
					.eq('id', u.id);

				if (updateError) {
					console.error('Error updating module order:', updateError);
					// On ne bloque pas le reste du chargement, on sort simplement de la boucle
					break;
				}
			}
		}

		// Mettre à jour le store avec les ordres recalculés
		modules.set(sortedByPosition);
	}

	isLoading.set(false);
}

// Ajouter un module
export async function addModule(moduleData: ModuleInsert): Promise<ModuleRow | null> {
	if (!supabaseClient) return null;

	isLoading.set(true);
	error.set(null);

	// Calculer le prochain ordre
	const currentModules = get(modules);
	const maxOrdre = currentModules.reduce((max, m) => Math.max(max, m.ordre), 0);

	const insertData = {
		...moduleData,
		ordre: moduleData.ordre ?? maxOrdre + 1
	};

	const { data, error: insertError } = await supabaseClient
		.from('modules')
		.insert(insertData)
		.select()
		.single();

	if (insertError) {
		error.set(insertError.message);
		console.error('Error adding module:', insertError);
		isLoading.set(false);
		return null;
	}

	// Mettre à jour le store local
	modules.update(m => [...m, data as ModuleRow]);
	isLoading.set(false);
	return data as ModuleRow;
}

// Mettre à jour un module
export async function updateModule(id: string, changes: ModuleUpdate): Promise<boolean> {
	if (!supabaseClient) return false;

	error.set(null);

	const { data, error: updateError } = await supabaseClient
		.from('modules')
		.update(changes)
		.eq('id', id)
		.select()
		.single();

	if (updateError) {
		error.set(updateError.message);
		console.error('Error updating module:', updateError);
		return false;
	}

	// Mettre à jour le store local
	modules.update(mods => mods.map(m => m.id === id ? (data as ModuleRow) : m));
	return true;
}

// Supprimer un module
export async function deleteModule(id: string): Promise<boolean> {
	if (!supabaseClient) return false;

	error.set(null);

	const { error: deleteError } = await supabaseClient
		.from('modules')
		.delete()
		.eq('id', id);

	if (deleteError) {
		error.set(deleteError.message);
		console.error('Error deleting module:', deleteError);
		return false;
	}

	// Mettre à jour le store local
	modules.update(mods => mods.filter(m => m.id !== id));
	return true;
}

// Dupliquer un module
export async function duplicateModule(id: string): Promise<ModuleRow | null> {
	if (!supabaseClient) return null;

	const currentModules = get(modules);
	const original = currentModules.find(m => m.id === id);
	
	if (!original) return null;

	const duplicateData: ModuleInsert = {
		nom: `${original.nom} (copie)`,
		description: original.description,
		type: original.type,
		status: 'brouillon',
		duree_estimee: original.duree_estimee,
		zone_id: original.zone_id,
		contenu: original.contenu
	};

	return addModule(duplicateData);
}

// Obtenir un module par ID
export function getModuleById(id: string): ModuleRow | undefined {
	return get(modules).find(m => m.id === id);
}

// Réordonner les modules
export async function reorderModules(fromIndex: number, toIndex: number): Promise<boolean> {
	if (!supabaseClient) return false;

	const currentModules = get(modules);
	const sorted = [...currentModules].sort((a, b) => a.ordre - b.ordre);
	const [moved] = sorted.splice(fromIndex, 1);
	sorted.splice(toIndex, 0, moved);

	// Mettre à jour les ordres
	const updates = sorted.map((m, index) => ({
		id: m.id,
		ordre: index + 1
	}));

	// Batch update
	for (const update of updates) {
		const { error: updateError } = await supabaseClient
			.from('modules')
			.update({ ordre: update.ordre })
			.eq('id', update.id);

		if (updateError) {
			error.set(updateError.message);
			return false;
		}
	}

	// Recharger les modules
	await loadModules();
	return true;
}
