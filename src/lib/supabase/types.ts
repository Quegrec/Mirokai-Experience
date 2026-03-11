export type ModuleType = 'video' | 'interaction' | 'quiz' | 'info' | 'experience';
export type ModuleStatus = 'actif' | 'brouillon' | 'archive';

// Types de mini-jeux disponibles
export type MiniGameType = 'memory' | 'puzzle' | 'quiz_flash' | 'drag_drop' | 'find_difference' | 'sequence';

export interface ModuleContent {
	mediaUrl?: string;
	texte?: string;
	instructions?: string[];
}

export interface ModulePosition {
	x: number; // Position en pourcentage (0-100)
	y: number; // Position en pourcentage (0-100)
}

export interface ModuleRow {
	id: string;
	nom: string;
	description: string;
	type: ModuleType;
	status: ModuleStatus;
	ordre: number;
	duree_estimee: number;
	zone_id: string | null;
	contenu: ModuleContent;
	position: ModulePosition | null; // Position sur la carte
	created_at: string;
	updated_at: string;
}

export interface ModuleInsert {
	id?: string;
	nom: string;
	description?: string;
	type: ModuleType;
	status?: ModuleStatus;
	ordre?: number;
	duree_estimee?: number;
	zone_id?: string | null;
	contenu?: ModuleContent;
	position?: ModulePosition | null;
	created_at?: string;
	updated_at?: string;
}

export interface ModuleUpdate {
	id?: string;
	nom?: string;
	description?: string;
	type?: ModuleType;
	status?: ModuleStatus;
	ordre?: number;
	duree_estimee?: number;
	zone_id?: string | null;
	contenu?: ModuleContent;
	position?: ModulePosition | null;
	updated_at?: string;
}

// === MINI-JEUX ===

export interface MiniGameContent {
	// Contenu spécifique selon le type de jeu
	questions?: Array<{
		question: string;
		options: string[];
		correctIndex: number;
	}>;
	pairs?: Array<{
		id: string;
		content: string;
		imageUrl?: string;
	}>;
	instructions?: string;
	timeLimit?: number; // en secondes
	difficulty?: 'easy' | 'medium' | 'hard';
}

export interface MiniGameRow {
	id: string;
	nom: string;
	description: string;
	type: MiniGameType;
	status: ModuleStatus;
	after_module_id: string | null; // Le module après lequel ce mini-jeu apparaît
	ordre: number; // Ordre si plusieurs mini-jeux après le même module
	duree_estimee: number;
	contenu: MiniGameContent;
	recompense?: {
		points?: number;
		badge?: string;
		message?: string;
	};
	position: ModulePosition | null; // Position sur la carte
	created_at: string;
	updated_at: string;
}

export interface MiniGameInsert {
	id?: string;
	nom: string;
	description?: string;
	type: MiniGameType;
	status?: ModuleStatus;
	after_module_id?: string | null;
	ordre?: number;
	duree_estimee?: number;
	contenu?: MiniGameContent;
	recompense?: MiniGameRow['recompense'];
	created_at?: string;
	updated_at?: string;
}

export interface MiniGameUpdate {
	id?: string;
	nom?: string;
	description?: string;
	type?: MiniGameType;
	status?: ModuleStatus;
	after_module_id?: string | null;
	ordre?: number;
	duree_estimee?: number;
	contenu?: MiniGameContent;
	recompense?: MiniGameRow['recompense'];
	updated_at?: string;
}

// === JOURNEY NODE (Union type pour la carte) ===

export type JourneyNodeType = 'module' | 'minigame' | 'start' | 'end';

export interface JourneyNode {
	id: string;
	type: JourneyNodeType;
	data: ModuleRow | MiniGameRow | null;
	ordre: number;
	status: 'locked' | 'available' | 'completed' | 'current';
	position: ModulePosition;
}

// === SETTINGS ===

export interface AppSettings {
	id: string;
	journey_background_url: string | null;
	journey_background_type: 'image' | 'generated'; // 'image' = custom image, 'generated' = auto-generated path
	updated_at: string;
}

export type Database = {
	public: {
		Tables: {
			modules: {
				Row: ModuleRow;
				Insert: ModuleInsert;
				Update: ModuleUpdate;
				Relationships: [];
			};
			mini_games: {
				Row: MiniGameRow;
				Insert: MiniGameInsert;
				Update: MiniGameUpdate;
				Relationships: [];
			};
			settings: {
				Row: AppSettings;
				Insert: Partial<AppSettings>;
				Update: Partial<AppSettings>;
				Relationships: [];
			};
		};
		Views: Record<string, never>;
		Functions: Record<string, never>;
		Enums: Record<string, never>;
		CompositeTypes: Record<string, never>;
	};
};
