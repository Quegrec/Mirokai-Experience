import { writable } from 'svelte/store';
import type { Zone } from '$lib/data/zones';

// Store pour la zone sélectionnée
export const selectedZone = writable<Zone | null>(null);

// Store pour contrôler la visibilité de la sidebar
export const isSidebarOpen = writable<boolean>(false);

// Action pour sélectionner une zone
export function selectZone(zone: Zone | null): void {
	selectedZone.set(zone);
	isSidebarOpen.set(zone !== null);
}

// Action pour fermer la sidebar
export function closeSidebar(): void {
	isSidebarOpen.set(false);
	// Délai pour l'animation avant de reset la zone
	setTimeout(() => {
		selectedZone.set(null);
	}, 300);
}
