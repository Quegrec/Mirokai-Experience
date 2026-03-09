export interface Zone {
	id: string;
	nom: string;
	description: string;
	status: 'actif' | 'maintenance' | 'inactif';
	capacite?: number;
	robots?: string[];
	couleur: string;
}

export const zones: Zone[] = [
	{
		id: 'mirokai-experience',
		nom: 'Mirokaï Experience',
		description: 'Zone d\'interaction principale avec les robots Mirokaï. Espace dédié aux démonstrations et à l\'expérience utilisateur immersive.',
		status: 'actif',
		capacite: 12,
		robots: ['Mirokaï Alpha', 'Mirokaï Beta'],
		couleur: 'var(--zone-mirokai)'
	},
	{
		id: 'spoon',
		nom: 'Zone Spoon',
		description: 'Espace de service et d\'assistance robotique. Les robots Spoon assurent la livraison et le support logistique.',
		status: 'actif',
		capacite: 8,
		robots: ['Spoon-01', 'Spoon-02', 'Spoon-03'],
		couleur: 'var(--zone-spoon)'
	},
	{
		id: 'regie',
		nom: 'Régie',
		description: 'Centre de contrôle et de supervision. Monitoring en temps réel de tous les systèmes robotiques.',
		status: 'actif',
		capacite: 4,
		robots: [],
		couleur: 'var(--zone-regie)'
	},
	{
		id: 'cyclage',
		nom: 'Salle de Cyclage',
		description: 'Zone technique pour la recharge et la maintenance des batteries. Gestion optimisée des cycles énergétiques.',
		status: 'maintenance',
		capacite: 6,
		robots: ['Spoon-02'],
		couleur: 'var(--zone-cyclage)'
	}
];

export function getZoneById(id: string): Zone | undefined {
	return zones.find(zone => zone.id === id);
}
