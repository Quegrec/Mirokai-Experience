import { writable, get } from 'svelte/store';
import type { AppSettings } from '$lib/supabase/types';
import type { SupabaseClient } from '@supabase/supabase-js';

// Settings par défaut
const defaultSettings: AppSettings = {
	id: 'main',
	journey_background_url: null,
	journey_background_type: 'generated',
	updated_at: new Date().toISOString()
};

// Store principal des settings
export const settings = writable<AppSettings>(defaultSettings);

// Store pour l'état de chargement
export const isLoadingSettings = writable<boolean>(false);

// Store pour les erreurs
export const settingsError = writable<string | null>(null);

// Client Supabase
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let supabaseClient: SupabaseClient<any> | null = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function setSettingsSupabaseClient(client: SupabaseClient<any>) {
	supabaseClient = client;
}

// Charger les settings
export async function loadSettings(): Promise<void> {
	if (!supabaseClient) {
		console.warn('Supabase client not initialized for settings');
		return;
	}

	isLoadingSettings.set(true);
	settingsError.set(null);

	const { data, error } = await supabaseClient
		.from('settings')
		.select('*')
		.eq('id', 'main')
		.single();

	if (error) {
		// Si la table n'existe pas encore ou pas de données, utiliser les valeurs par défaut
		if (error.code === 'PGRST116') {
			// No rows returned - créer les settings par défaut
			await initializeSettings();
		} else {
			settingsError.set(error.message);
			console.error('Error loading settings:', error);
		}
	} else if (data) {
		settings.set(data as AppSettings);
	}

	isLoadingSettings.set(false);
}

// Initialiser les settings par défaut
async function initializeSettings(): Promise<void> {
	if (!supabaseClient) return;

	const { data, error } = await supabaseClient
		.from('settings')
		.insert(defaultSettings)
		.select()
		.single();

	if (error) {
		console.error('Error initializing settings:', error);
	} else if (data) {
		settings.set(data as AppSettings);
	}
}

// Mettre à jour les settings
export async function updateSettings(changes: Partial<AppSettings>): Promise<boolean> {
	if (!supabaseClient) return false;

	settingsError.set(null);

	const { data, error } = await supabaseClient
		.from('settings')
		.update(changes)
		.eq('id', 'main')
		.select()
		.single();

	if (error) {
		settingsError.set(error.message);
		console.error('Error updating settings:', error);
		return false;
	}

	if (data) {
		settings.set(data as AppSettings);
	}

	return true;
}

// Uploader une image de fond
export async function uploadJourneyBackground(file: File): Promise<string | null> {
	if (!supabaseClient) return null;

	settingsError.set(null);

	// Générer un nom unique pour le fichier
	const fileExt = file.name.split('.').pop();
	const fileName = `journey-bg-${Date.now()}.${fileExt}`;

	// Upload vers Supabase Storage
	const { data, error } = await supabaseClient.storage
		.from('journey-backgrounds')
		.upload(fileName, file, {
			cacheControl: '3600',
			upsert: true
		});

	if (error) {
		settingsError.set(`Erreur upload: ${error.message}`);
		console.error('Error uploading image:', error);
		return null;
	}

	// Obtenir l'URL publique
	const { data: urlData } = supabaseClient.storage
		.from('journey-backgrounds')
		.getPublicUrl(data.path);

	return urlData.publicUrl;
}

// Obtenir l'URL de fond actuelle
export function getJourneyBackgroundUrl(): string | null {
	const currentSettings = get(settings);
	return currentSettings.journey_background_url;
}
