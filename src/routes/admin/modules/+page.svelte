<script lang="ts">
	import { 
		Search, Plus, Filter, MoreVertical, Pencil, Copy, Trash2, 
		GripVertical, Play, Hand, HelpCircle, Info, Sparkles,
		ChevronDown, Loader2, Map
	} from 'lucide-svelte';
	import { 
		filteredModules, searchQuery, statusFilter, typeFilter,
		deleteModule, duplicateModule, isLoading, error
	} from '$lib/stores/modulesStore';
	import type { ModuleStatus, ModuleType } from '$lib/supabase/types';

	const moduleTypeLabels: Record<ModuleType, string> = {
		video: 'Vidéo',
		interaction: 'Interaction',
		quiz: 'Quiz',
		info: 'Information',
		experience: 'Expérience'
	};

	const moduleStatusLabels: Record<ModuleStatus, string> = {
		actif: 'Actif',
		brouillon: 'Brouillon',
		archive: 'Archivé'
	};

	const moduleStatusColors: Record<ModuleStatus, string> = {
		actif: 'var(--magic-turquoise)',
		brouillon: 'var(--magic-orange)',
		archive: 'var(--color-text-muted)'
	};

	const typeIcons = {
		video: Play,
		interaction: Hand,
		quiz: HelpCircle,
		info: Info,
		experience: Sparkles
	};

	let showFilters = $state(false);
	let contextMenuModule = $state<string | null>(null);
	let deletingId = $state<string | null>(null);

	async function handleDelete(id: string) {
		if (confirm('Êtes-vous sûr de vouloir supprimer ce module ?')) {
			deletingId = id;
			await deleteModule(id);
			deletingId = null;
		}
		contextMenuModule = null;
	}

	async function handleDuplicate(id: string) {
		await duplicateModule(id);
		contextMenuModule = null;
	}

	function toggleContextMenu(id: string) {
		contextMenuModule = contextMenuModule === id ? null : id;
	}
</script>

<svelte:window onclick={() => contextMenuModule = null} />

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold text-[var(--color-text-primary)]">
				Modules
			</h1>
			<p class="text-[var(--color-text-muted)] mt-1">
				{$filteredModules.length} module{$filteredModules.length > 1 ? 's' : ''}
			</p>
		</div>
		<div class="flex items-center gap-3">
			<a 
				href="/admin/modules/map"
				class="flex items-center gap-2 px-4 py-2.5 rounded-xl glass border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--magic-turquoise)] hover:text-[var(--magic-turquoise)] transition-colors text-sm font-medium"
			>
				<Map size={18} />
				Placer sur la carte
			</a>
			<a 
				href="/admin/modules/new"
				class="flex items-center gap-2 px-4 py-2.5 rounded-xl btn-magic text-white text-sm font-medium"
			>
				<Plus size={18} />
				Nouveau module
			</a>
		</div>
	</div>

	{#if $error}
		<div class="glass rounded-xl p-4 border-red-500/30 bg-red-500/10">
			<p class="text-red-400 text-sm">{$error}</p>
		</div>
	{/if}

	<!-- Barre de recherche et filtres -->
	<div class="flex flex-col sm:flex-row gap-3">
		<div class="relative flex-1">
			<Search size={18} class="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
			<input 
				type="text"
				placeholder="Rechercher un module..."
				bind:value={$searchQuery}
				class="w-full pl-10 pr-4 py-2.5 rounded-xl glass border border-[var(--color-border)] bg-transparent text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--magic-turquoise)] transition-colors"
			/>
		</div>
		
		<button 
			onclick={() => showFilters = !showFilters}
			class="flex items-center gap-2 px-4 py-2.5 rounded-xl glass border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--magic-turquoise)] transition-colors"
		>
			<Filter size={18} />
			Filtres
			<ChevronDown size={16} class="transition-transform {showFilters ? 'rotate-180' : ''}" />
		</button>
	</div>

	<!-- Filtres expandés -->
	{#if showFilters}
		<div class="glass rounded-xl p-4 flex flex-wrap gap-4">
			<div>
				<label class="text-xs text-[var(--color-text-muted)] uppercase tracking-wider block mb-2">
					Statut
				</label>
				<select 
					bind:value={$statusFilter}
					class="px-3 py-2 rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-sm focus:outline-none focus:border-[var(--magic-turquoise)]"
				>
					<option value="all">Tous</option>
					<option value="actif">Actif</option>
					<option value="brouillon">Brouillon</option>
					<option value="archive">Archivé</option>
				</select>
			</div>
			<div>
				<label class="text-xs text-[var(--color-text-muted)] uppercase tracking-wider block mb-2">
					Type
				</label>
				<select 
					bind:value={$typeFilter}
					class="px-3 py-2 rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-sm focus:outline-none focus:border-[var(--magic-turquoise)]"
				>
					<option value="all">Tous</option>
					{#each Object.entries(moduleTypeLabels) as [value, label]}
						<option {value}>{label}</option>
					{/each}
				</select>
			</div>
		</div>
	{/if}

	<!-- Liste des modules -->
	{#if $isLoading}
		<div class="flex items-center justify-center py-12">
			<Loader2 size={32} class="animate-spin text-[var(--magic-turquoise)]" />
		</div>
	{:else}
		<div class="space-y-3">
			{#each $filteredModules as module (module.id)}
				{@const TypeIcon = typeIcons[module.type]}
				<div 
					class="glass rounded-xl p-4 flex items-center gap-4 group hover:border-[var(--magic-turquoise)]/30 transition-colors"
					class:opacity-50={deletingId === module.id}
				>
					<!-- Drag handle -->
					<button class="cursor-grab text-[var(--color-text-muted)] opacity-0 group-hover:opacity-100 transition-opacity">
						<GripVertical size={20} />
					</button>

					<!-- Ordre -->
					<div class="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--magic-purple)]/20 to-[var(--magic-magenta)]/20 flex items-center justify-center text-sm font-bold text-[var(--magic-purple)]">
						{module.ordre}
					</div>

					<!-- Icône type -->
					<div 
						class="w-10 h-10 rounded-xl flex items-center justify-center"
						style="background-color: {moduleStatusColors[module.status]}20; color: {moduleStatusColors[module.status]}"
					>
						<TypeIcon size={20} />
					</div>

					<!-- Infos -->
					<div class="flex-1 min-w-0">
						<a 
							href="/admin/modules/{module.id}"
							class="font-medium text-[var(--color-text-primary)] hover:text-[var(--magic-turquoise)] transition-colors"
						>
							{module.nom}
						</a>
						<p class="text-sm text-[var(--color-text-muted)] truncate">
							{module.description}
						</p>
					</div>

					<!-- Badges -->
					<div class="hidden md:flex items-center gap-2">
						<span 
							class="px-2 py-1 rounded-lg text-xs font-medium"
							style="background-color: {moduleStatusColors[module.status]}20; color: {moduleStatusColors[module.status]}"
						>
							{moduleStatusLabels[module.status]}
						</span>
						<span class="px-2 py-1 rounded-lg text-xs font-medium bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)]">
							{module.duree_estimee} min
						</span>
					</div>

					<!-- Actions -->
					<div class="relative">
						<button 
							onclick={(e) => { e.stopPropagation(); toggleContextMenu(module.id); }}
							class="p-2 rounded-lg hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
						>
							<MoreVertical size={18} />
						</button>

						{#if contextMenuModule === module.id}
							<div 
								class="absolute right-0 top-full mt-1 w-48 glass rounded-xl py-2 z-50 shadow-xl border border-[var(--color-border)]"
								onclick={(e) => e.stopPropagation()}
							>
								<a 
									href="/admin/modules/{module.id}"
									class="flex items-center gap-2 px-4 py-2 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)]"
								>
									<Pencil size={16} />
									Modifier
								</a>
								<button 
									onclick={() => handleDuplicate(module.id)}
									class="w-full flex items-center gap-2 px-4 py-2 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)]"
								>
									<Copy size={16} />
									Dupliquer
								</button>
								<hr class="my-2 border-[var(--color-border)]" />
								<button 
									onclick={() => handleDelete(module.id)}
									class="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10"
								>
									<Trash2 size={16} />
									Supprimer
								</button>
							</div>
						{/if}
					</div>
				</div>
			{:else}
				<div class="glass rounded-xl p-12 text-center">
					<p class="text-[var(--color-text-muted)]">
						Aucun module trouvé
					</p>
					<a 
						href="/admin/modules/new"
						class="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-xl btn-magic text-white text-sm"
					>
						<Plus size={16} />
						Créer un module
					</a>
				</div>
			{/each}
		</div>
	{/if}
</div>
