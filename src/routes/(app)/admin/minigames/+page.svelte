<script lang="ts">
	import { Plus, Search, Filter, Gamepad2, Brain, Puzzle, Zap, Shapes, Trash2, Edit, MoreVertical, Loader2, Link } from 'lucide-svelte';
	import { miniGames, miniGameStats, isLoadingMiniGames, miniGamesError, deleteMiniGame, miniGameTypeLabels } from '$lib/stores/miniGamesStore';
	import { modules } from '$lib/stores/modulesStore';
	import type { MiniGameType, ModuleStatus } from '$lib/supabase/types';

	// Filtres
	let searchQuery = $state('');
	let statusFilter = $state<ModuleStatus | 'all'>('all');
	let typeFilter = $state<MiniGameType | 'all'>('all');

	// Menu contextuel
	let openMenuId = $state<string | null>(null);

	const miniGameTypeIcons: Record<MiniGameType, typeof Brain> = {
		memory: Brain,
		puzzle: Puzzle,
		quiz_flash: Zap,
		drag_drop: Shapes,
		find_difference: Search,
		sequence: Shapes
	};

	const miniGameTypeColors: Record<MiniGameType, string> = {
		memory: 'var(--magic-purple)',
		puzzle: 'var(--magic-blue)',
		quiz_flash: 'var(--magic-orange)',
		drag_drop: 'var(--magic-turquoise)',
		find_difference: 'var(--magic-magenta)',
		sequence: 'var(--magic-purple)'
	};

	const statusColors: Record<ModuleStatus, string> = {
		actif: 'var(--magic-turquoise)',
		brouillon: 'var(--magic-orange)',
		archive: 'var(--color-text-muted)'
	};

	// Mini-jeux filtrés
	const filteredMiniGames = $derived(
		$miniGames.filter(game => {
			if (searchQuery && !game.nom.toLowerCase().includes(searchQuery.toLowerCase())) {
				return false;
			}
			if (statusFilter !== 'all' && game.status !== statusFilter) {
				return false;
			}
			if (typeFilter !== 'all' && game.type !== typeFilter) {
				return false;
			}
			return true;
		}).sort((a, b) => a.ordre - b.ordre)
	);

	// Trouver le module parent
	function getParentModule(moduleId: string | null) {
		if (!moduleId) return null;
		return $modules.find(m => m.id === moduleId);
	}

	async function handleDelete(id: string) {
		if (confirm('Êtes-vous sûr de vouloir supprimer ce mini-jeu ?')) {
			await deleteMiniGame(id);
		}
		openMenuId = null;
	}

	function toggleMenu(id: string) {
		openMenuId = openMenuId === id ? null : id;
	}
</script>

<svelte:window onclick={() => openMenuId = null} />

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between flex-wrap gap-4">
		<div>
			<h1 class="text-2xl font-bold text-(--color-text-primary) flex items-center gap-3">
				<Gamepad2 size={28} class="text-(--magic-orange)" />
				Mini-jeux
			</h1>
			<p class="text-(--color-text-muted) mt-1">
				Gérez les mini-jeux intercalés entre les modules
			</p>
		</div>
		
		<a href="/admin/minigames/new" class="btn-magic flex items-center gap-2 px-4 py-2.5 rounded-xl">
			<Plus size={18} />
			<span>Nouveau mini-jeu</span>
		</a>
	</div>

	{#if $miniGamesError}
		<div class="glass rounded-xl p-4 border-red-500/30 bg-red-500/10">
			<p class="text-red-400 text-sm">{$miniGamesError}</p>
		</div>
	{/if}

	<!-- Stats -->
	<div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
		<div class="glass rounded-xl p-4 flex items-center gap-3">
			<div class="w-10 h-10 rounded-lg bg-(--magic-purple)/20 flex items-center justify-center">
				<Gamepad2 size={20} class="text-(--magic-purple)" />
			</div>
			<div>
				<p class="text-2xl font-bold text-(--color-text-primary)">{$miniGameStats.total}</p>
				<p class="text-xs text-(--color-text-muted)">Total</p>
			</div>
		</div>
		<div class="glass rounded-xl p-4 flex items-center gap-3">
			<div class="w-10 h-10 rounded-lg bg-(--magic-turquoise)/20 flex items-center justify-center">
				<Zap size={20} class="text-(--magic-turquoise)" />
			</div>
			<div>
				<p class="text-2xl font-bold text-(--magic-turquoise)">{$miniGameStats.actifs}</p>
				<p class="text-xs text-(--color-text-muted)">Actifs</p>
			</div>
		</div>
		<div class="glass rounded-xl p-4 flex items-center gap-3">
			<div class="w-10 h-10 rounded-lg bg-(--magic-orange)/20 flex items-center justify-center">
				<Edit size={20} class="text-(--magic-orange)" />
			</div>
			<div>
				<p class="text-2xl font-bold text-(--magic-orange)">{$miniGameStats.brouillons}</p>
				<p class="text-xs text-(--color-text-muted)">Brouillons</p>
			</div>
		</div>
		<div class="glass rounded-xl p-4 flex items-center gap-3">
			<div class="w-10 h-10 rounded-lg bg-(--color-text-muted)/20 flex items-center justify-center">
				<Trash2 size={20} class="text-(--color-text-muted)" />
			</div>
			<div>
				<p class="text-2xl font-bold text-(--color-text-muted)">{$miniGameStats.archives}</p>
				<p class="text-xs text-(--color-text-muted)">Archivés</p>
			</div>
		</div>
	</div>

	<!-- Filtres -->
	<div class="glass rounded-xl p-4">
		<div class="flex flex-wrap gap-4">
			<!-- Recherche -->
			<div class="relative flex-1 min-w-[200px]">
				<Search size={16} class="absolute left-3 top-1/2 -translate-y-1/2 text-(--color-text-muted)" />
				<input 
					type="text" 
					placeholder="Rechercher un mini-jeu..." 
					bind:value={searchQuery}
					class="w-full pl-10 pr-4 py-2 bg-(--color-bg-tertiary) border border-(--color-border) rounded-lg text-sm text-(--color-text-primary) placeholder:text-(--color-text-muted) focus:outline-none focus:border-(--magic-turquoise)"
				/>
			</div>

			<!-- Filtre statut -->
			<select 
				bind:value={statusFilter}
				class="px-4 py-2 bg-(--color-bg-tertiary) border border-(--color-border) rounded-lg text-sm text-(--color-text-primary) focus:outline-none focus:border-(--magic-turquoise)"
			>
				<option value="all">Tous les statuts</option>
				<option value="actif">Actif</option>
				<option value="brouillon">Brouillon</option>
				<option value="archive">Archivé</option>
			</select>

			<!-- Filtre type -->
			<select 
				bind:value={typeFilter}
				class="px-4 py-2 bg-(--color-bg-tertiary) border border-(--color-border) rounded-lg text-sm text-(--color-text-primary) focus:outline-none focus:border-(--magic-turquoise)"
			>
				<option value="all">Tous les types</option>
				<option value="memory">Memory</option>
				<option value="quiz_flash">Quiz Flash</option>
				<option value="puzzle">Puzzle</option>
				<option value="drag_drop">Glisser-Déposer</option>
				<option value="find_difference">Différences</option>
				<option value="sequence">Séquence</option>
			</select>
		</div>
	</div>

	<!-- Liste des mini-jeux -->
	{#if $isLoadingMiniGames}
		<div class="flex items-center justify-center py-12">
			<Loader2 size={32} class="animate-spin text-(--magic-turquoise)" />
		</div>
	{:else if filteredMiniGames.length === 0}
		<div class="glass rounded-xl p-12 text-center">
			<Gamepad2 size={48} class="mx-auto text-(--color-text-muted) mb-4" />
			<h3 class="text-lg font-semibold text-(--color-text-primary) mb-2">
				Aucun mini-jeu trouvé
			</h3>
			<p class="text-(--color-text-muted) mb-4">
				{searchQuery || statusFilter !== 'all' || typeFilter !== 'all' 
					? 'Essayez de modifier vos filtres' 
					: 'Créez votre premier mini-jeu pour enrichir l\'expérience'}
			</p>
			<a href="/admin/minigames/new" class="inline-flex items-center gap-2 btn-magic px-4 py-2 rounded-lg">
				<Plus size={16} />
				Créer un mini-jeu
			</a>
		</div>
	{:else}
		<div class="grid gap-4">
			{#each filteredMiniGames as game (game.id)}
				{@const Icon = miniGameTypeIcons[game.type]}
				{@const parentModule = getParentModule(game.after_module_id)}
				<div class="glass rounded-xl p-4 hover:border-(--magic-turquoise)/30 transition-colors group">
					<div class="flex items-center gap-4">
						<!-- Icône du type -->
						<div 
							class="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
							style="background: {miniGameTypeColors[game.type]}20; border: 1px solid {miniGameTypeColors[game.type]}40"
						>
							<Icon size={24} style="color: {miniGameTypeColors[game.type]}" />
						</div>

						<!-- Infos -->
						<div class="flex-1 min-w-0">
							<div class="flex items-center gap-2 mb-1">
								<h3 class="font-semibold text-(--color-text-primary) truncate group-hover:text-(--magic-turquoise) transition-colors">
									{game.nom}
								</h3>
								<span 
									class="px-2 py-0.5 rounded-full text-xs font-medium"
									style="background: {statusColors[game.status]}20; color: {statusColors[game.status]}"
								>
									{game.status}
								</span>
							</div>
							<p class="text-sm text-(--color-text-muted) truncate">
								{game.description || 'Pas de description'}
							</p>
							<div class="flex items-center gap-4 mt-2 text-xs text-(--color-text-muted)">
								<span class="flex items-center gap-1">
									<Gamepad2 size={12} />
									{miniGameTypeLabels[game.type]}
								</span>
								<span>{game.duree_estimee} min</span>
								{#if parentModule}
									<span class="flex items-center gap-1 text-(--magic-purple)">
										<Link size={12} />
										Après "{parentModule.nom}"
									</span>
								{/if}
							</div>
						</div>

						<!-- Menu actions -->
						<div class="relative">
							<button 
								class="p-2 rounded-lg hover:bg-(--color-bg-tertiary) transition-colors"
								onclick={(e) => { e.stopPropagation(); toggleMenu(game.id); }}
							>
								<MoreVertical size={18} class="text-(--color-text-muted)" />
							</button>

							{#if openMenuId === game.id}
								<div 
									class="absolute right-0 top-full mt-1 w-40 glass rounded-lg border border-(--color-border) shadow-lg z-50 py-1"
									onclick={(e) => e.stopPropagation()}
								>
									<a 
										href="/admin/minigames/{game.id}"
										class="flex items-center gap-2 px-3 py-2 text-sm text-(--color-text-secondary) hover:bg-(--color-bg-tertiary) hover:text-(--color-text-primary)"
									>
										<Edit size={14} />
										Modifier
									</a>
									<button 
										class="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10"
										onclick={() => handleDelete(game.id)}
									>
										<Trash2 size={14} />
										Supprimer
									</button>
								</div>
							{/if}
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
