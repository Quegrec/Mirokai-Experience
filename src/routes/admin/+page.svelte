<script lang="ts">
	import { Layers, Clock, CheckCircle, FileEdit, Archive, TrendingUp, Loader2 } from 'lucide-svelte';
	import { moduleStats, modules, filteredModules, isLoading, error } from '$lib/stores/modulesStore';

	const moduleTypeLabels: Record<string, string> = {
		video: 'Vidéo',
		interaction: 'Interaction',
		quiz: 'Quiz',
		info: 'Information',
		experience: 'Expérience'
	};

	const moduleStatusColors: Record<string, string> = {
		actif: 'var(--magic-turquoise)',
		brouillon: 'var(--magic-orange)',
		archive: 'var(--color-text-muted)'
	};

	const recentModules = $derived(
		[...$modules]
			.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
			.slice(0, 5)
	);
</script>

<div class="space-y-8">
	<!-- Header -->
	<div>
		<h1 class="text-2xl font-bold text-[var(--color-text-primary)]">
			Vue d'ensemble
		</h1>
		<p class="text-[var(--color-text-muted)] mt-1">
			Gérez les modules de votre expérience visiteur
		</p>
	</div>

	{#if $error}
		<div class="glass rounded-xl p-4 border-red-500/30 bg-red-500/10">
			<p class="text-red-400 text-sm">{$error}</p>
		</div>
	{/if}

	{#if $isLoading}
		<div class="flex items-center justify-center py-12">
			<Loader2 size={32} class="animate-spin text-[var(--magic-turquoise)]" />
		</div>
	{:else}
		<!-- Stats Cards -->
		<div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
			<div class="glass magic-glow rounded-2xl p-5 group transition-all duration-300 hover:scale-[1.02]">
				<div class="flex items-center gap-2 mb-2">
					<Layers size={16} class="text-[var(--magic-purple)]" />
					<p class="text-xs text-[var(--color-text-muted)] uppercase tracking-wider">Total Modules</p>
				</div>
				<p class="text-3xl font-bold bg-gradient-to-r from-[var(--magic-purple)] to-[var(--magic-magenta)] bg-clip-text text-transparent">
					{$moduleStats.total}
				</p>
			</div>

			<div class="glass glass-turquoise rounded-2xl p-5 group transition-all duration-300 hover:scale-[1.02]">
				<div class="flex items-center gap-2 mb-2">
					<CheckCircle size={16} class="text-[var(--magic-turquoise)]" />
					<p class="text-xs text-[var(--color-text-muted)] uppercase tracking-wider">Actifs</p>
				</div>
				<p class="text-3xl font-bold text-[var(--magic-turquoise)]">
					{$moduleStats.actifs}
				</p>
			</div>

			<div class="glass rounded-2xl p-5 group transition-all duration-300 hover:scale-[1.02]" style="border-color: rgba(240, 152, 3, 0.2);">
				<div class="flex items-center gap-2 mb-2">
					<FileEdit size={16} class="text-[var(--magic-orange)]" />
					<p class="text-xs text-[var(--color-text-muted)] uppercase tracking-wider">Brouillons</p>
				</div>
				<p class="text-3xl font-bold text-[var(--magic-orange)]">
					{$moduleStats.brouillons}
				</p>
			</div>

			<div class="glass glass-magenta rounded-2xl p-5 group transition-all duration-300 hover:scale-[1.02]">
				<div class="flex items-center gap-2 mb-2">
					<Clock size={16} class="text-[var(--magic-magenta)]" />
					<p class="text-xs text-[var(--color-text-muted)] uppercase tracking-wider">Durée totale</p>
				</div>
				<p class="text-3xl font-bold text-[var(--magic-magenta)]">
					{$moduleStats.dureeTotal}<span class="text-lg ml-1">min</span>
				</p>
			</div>
		</div>

		<!-- Contenu principal en 2 colonnes -->
		<div class="grid lg:grid-cols-3 gap-6">
			<!-- Modules récents -->
			<div class="lg:col-span-2 glass rounded-2xl p-6">
				<div class="flex items-center justify-between mb-4">
					<h2 class="font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
						<TrendingUp size={18} class="text-[var(--magic-turquoise)]" />
						Modules récemment modifiés
					</h2>
					<a href="/admin/modules" class="text-sm text-[var(--magic-turquoise)] hover:underline">
						Voir tout →
					</a>
				</div>

				<div class="space-y-3">
					{#each recentModules as module}
						<a 
							href="/admin/modules/{module.id}"
							class="flex items-center justify-between p-4 rounded-xl bg-[var(--color-bg-tertiary)]/50 hover:bg-[var(--color-bg-tertiary)] transition-colors group"
						>
							<div class="flex items-center gap-4">
								<div 
									class="w-2 h-8 rounded-full"
									style="background-color: {moduleStatusColors[module.status]}"
								></div>
								<div>
									<p class="font-medium text-[var(--color-text-primary)] group-hover:text-[var(--magic-turquoise)] transition-colors">
										{module.nom}
									</p>
									<p class="text-xs text-[var(--color-text-muted)]">
										{moduleTypeLabels[module.type]} · {module.duree_estimee} min
									</p>
								</div>
							</div>
							<div class="text-right">
								<p class="text-xs text-[var(--color-text-muted)]">
									{new Date(module.updated_at).toLocaleDateString('fr-FR', { 
										day: 'numeric', 
										month: 'short' 
									})}
								</p>
							</div>
						</a>
					{:else}
						<p class="text-center text-[var(--color-text-muted)] py-8">
							Aucun module pour le moment
						</p>
					{/each}
				</div>
			</div>

			<!-- Actions rapides -->
			<div class="glass rounded-2xl p-6">
				<h2 class="font-semibold text-[var(--color-text-primary)] mb-4">
					Actions rapides
				</h2>

				<div class="space-y-3">
					<a 
						href="/admin/modules/new"
						class="flex items-center gap-3 p-4 rounded-xl btn-magic text-white"
					>
						<Layers size={18} />
						<span>Nouveau module</span>
					</a>

					<a 
						href="/admin/modules"
						class="flex items-center gap-3 p-4 rounded-xl glass hover:bg-[var(--color-bg-tertiary)] transition-colors text-[var(--color-text-secondary)]"
					>
						<FileEdit size={18} />
						<span>Gérer les modules</span>
					</a>

					<a 
						href="/admin/settings"
						class="flex items-center gap-3 p-4 rounded-xl glass hover:bg-[var(--color-bg-tertiary)] transition-colors text-[var(--color-text-secondary)]"
					>
						<Archive size={18} />
						<span>Paramètres</span>
					</a>
				</div>

				<!-- Parcours visiteur -->
				<div class="mt-6 pt-6 border-t border-[var(--color-border)]">
					<h3 class="text-sm font-medium text-[var(--color-text-secondary)] mb-3">
						Aperçu du parcours
					</h3>
					<div class="space-y-2">
						{#each $filteredModules.filter(m => m.status === 'actif').slice(0, 4) as module, i}
							<div class="flex items-center gap-2 text-xs">
								<span class="w-5 h-5 rounded-full bg-gradient-to-br from-[var(--magic-turquoise)] to-[var(--magic-purple)] flex items-center justify-center text-white font-bold">
									{i + 1}
								</span>
								<span class="text-[var(--color-text-muted)] truncate">{module.nom}</span>
							</div>
						{/each}
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>
