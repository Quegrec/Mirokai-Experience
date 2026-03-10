export type ModuleType = 'video' | 'interaction' | 'quiz' | 'info' | 'experience';
export type ModuleStatus = 'actif' | 'brouillon' | 'archive';

export interface Module {
	id: string;
	nom: string;
	description: string;
	type: ModuleType;
	status: ModuleStatus;
	ordre: number;
	dureeEstimee: number; // en minutes
	zoneId?: string; // lien vers une zone si applicable
	contenu: {
		mediaUrl?: string;
		texte?: string;
		instructions?: string[];
	};
	createdAt: Date;
	updatedAt: Date;
}

export const moduleTypeLabels: Record<ModuleType, string> = {
	video: 'Vidéo',
	interaction: 'Interaction',
	quiz: 'Quiz',
	info: 'Information',
	experience: 'Expérience'
};

export const moduleTypeIcons: Record<ModuleType, string> = {
	video: 'Play',
	interaction: 'Hand',
	quiz: 'HelpCircle',
	info: 'Info',
	experience: 'Sparkles'
};

export const moduleStatusLabels: Record<ModuleStatus, string> = {
	actif: 'Actif',
	brouillon: 'Brouillon',
	archive: 'Archivé'
};

export const moduleStatusColors: Record<ModuleStatus, string> = {
	actif: 'var(--magic-turquoise)',
	brouillon: 'var(--magic-orange)',
	archive: 'var(--color-text-muted)'
};

// Données initiales des modules
export const initialModules: Module[] = [
	{
		id: 'accueil',
		nom: 'Accueil & Introduction',
		description: 'Présentation de l\'expérience Enchanted Tools et introduction aux robots Mirokaï.',
		type: 'video',
		status: 'actif',
		ordre: 1,
		dureeEstimee: 3,
		zoneId: 'mirokai-experience',
		contenu: {
			mediaUrl: '/videos/intro.mp4',
			texte: 'Bienvenue dans la forêt enchantée...',
			instructions: ['Regardez la vidéo d\'introduction', 'Familiarisez-vous avec l\'espace']
		},
		createdAt: new Date('2026-01-15'),
		updatedAt: new Date('2026-03-01')
	},
	{
		id: 'rencontre-mirokai',
		nom: 'Rencontre avec Mirokaï',
		description: 'Première interaction avec le robot Mirokaï. Découvrez ses capacités expressives.',
		type: 'interaction',
		status: 'actif',
		ordre: 2,
		dureeEstimee: 5,
		zoneId: 'mirokai-experience',
		contenu: {
			texte: 'Approchez-vous doucement de Mirokaï...',
			instructions: [
				'Laissez Mirokaï vous observer',
				'Répondez à ses expressions',
				'Initiez un geste de salutation'
			]
		},
		createdAt: new Date('2026-01-15'),
		updatedAt: new Date('2026-02-20')
	},
	{
		id: 'demo-spoon',
		nom: 'Démonstration Spoon',
		description: 'Observez les robots Spoon en action dans leur mission de service.',
		type: 'experience',
		status: 'actif',
		ordre: 3,
		dureeEstimee: 4,
		zoneId: 'spoon',
		contenu: {
			texte: 'Les robots Spoon sont conçus pour l\'assistance...',
			instructions: [
				'Observez le ballet des robots',
				'Notez leur coordination',
				'Demandez une livraison test'
			]
		},
		createdAt: new Date('2026-02-01'),
		updatedAt: new Date('2026-03-05')
	},
	{
		id: 'quiz-robotique',
		nom: 'Quiz Robotique',
		description: 'Testez vos connaissances sur la robotique et l\'IA après votre visite.',
		type: 'quiz',
		status: 'actif',
		ordre: 4,
		dureeEstimee: 3,
		contenu: {
			texte: 'Répondez aux questions pour valider votre parcours...',
			instructions: ['5 questions à choix multiples', 'Obtenez votre badge visiteur']
		},
		createdAt: new Date('2026-02-15'),
		updatedAt: new Date('2026-03-01')
	},
	{
		id: 'coulisses',
		nom: 'Les Coulisses',
		description: 'Découvrez en exclusivité la régie et le centre de contrôle.',
		type: 'info',
		status: 'brouillon',
		ordre: 5,
		dureeEstimee: 6,
		zoneId: 'regie',
		contenu: {
			mediaUrl: '/videos/coulisses.mp4',
			texte: 'Plongez dans les coulisses de notre centre...',
			instructions: ['Visite guidée', 'Questions-réponses avec l\'équipe']
		},
		createdAt: new Date('2026-03-01'),
		updatedAt: new Date('2026-03-08')
	}
];
