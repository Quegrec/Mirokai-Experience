export type ModuleType = 'video' | 'interaction' | 'quiz' | 'info' | 'experience';
export type ModuleStatus = 'actif' | 'brouillon' | 'archive';

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

export type Database = {
	public: {
		Tables: {
			modules: {
				Row: ModuleRow;
				Insert: ModuleInsert;
				Update: ModuleUpdate;
				Relationships: [];
			};
		};
		Views: Record<string, never>;
		Functions: Record<string, never>;
		Enums: Record<string, never>;
		CompositeTypes: Record<string, never>;
	};
};
