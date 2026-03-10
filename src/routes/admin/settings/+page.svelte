<script lang="ts">
	import { Settings, RefreshCw, Download, Upload, AlertTriangle, Database } from 'lucide-svelte';
	import { modules, loadModules } from '$lib/stores/modulesStore';

	let isReloading = $state(false);

	async function handleReload() {
		isReloading = true;
		await loadModules();
		isReloading = false;
	}

	function exportModules() {
		const data = JSON.stringify($modules, null, 2);
		const blob = new Blob([data], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `modules-export-${new Date().toISOString().split('T')[0]}.json`;
		a.click();
		URL.revokeObjectURL(url);
	}
</script>

<div class="max-w-2xl">
	<!-- Header -->
	<div class="mb-8">
		<h1 class="text-2xl font-bold text-[var(--color-text-primary)]">
			Paramètres
		</h1>
		<p class="text-[var(--color-text-muted)] mt-1">
			Configuration de l'administration des modules
		</p>
	</div>

	<div class="space-y-6">
		<!-- Base de données -->
		<div class="glass rounded-2xl p-6">
			<div class="flex items-center gap-2 mb-4">
				<Database size={18} class="text-[var(--magic-turquoise)]" />
				<h2 class="font-semibold text-[var(--color-text-primary)]">Base de données</h2>
			</div>

			<div class="space-y-4">
				<div class="flex items-center justify-between p-4 rounded-xl bg-[var(--color-bg-tertiary)]">
					<div>
						<p class="text-sm text-[var(--color-text-primary)]">Recharger les modules</p>
						<p class="text-xs text-[var(--color-text-muted)]">
							Synchroniser avec la base de données Supabase
						</p>
					</div>
					<button 
						onclick={handleReload}
						disabled={isReloading}
						class="flex items-center gap-2 px-4 py-2 rounded-xl glass hover:bg-[var(--color-bg-tertiary)] text-[var(--magic-turquoise)] transition-colors disabled:opacity-50"
					>
						<RefreshCw size={16} class={isReloading ? 'animate-spin' : ''} />
						{isReloading ? 'Chargement...' : 'Recharger'}
					</button>
				</div>
			</div>
		</div>

		<!-- Export/Import -->
		<div class="glass rounded-2xl p-6">
			<div class="flex items-center gap-2 mb-4">
				<Settings size={18} class="text-[var(--magic-purple)]" />
				<h2 class="font-semibold text-[var(--color-text-primary)]">Données</h2>
			</div>

			<div class="space-y-4">
				<div class="flex items-center justify-between p-4 rounded-xl bg-[var(--color-bg-tertiary)]">
					<div>
						<p class="text-sm text-[var(--color-text-primary)]">Exporter les modules</p>
						<p class="text-xs text-[var(--color-text-muted)]">
							Télécharger tous les modules au format JSON
						</p>
					</div>
					<button 
						onclick={exportModules}
						class="flex items-center gap-2 px-4 py-2 rounded-xl glass hover:bg-[var(--color-bg-tertiary)] text-[var(--magic-turquoise)] transition-colors"
					>
						<Download size={16} />
						Exporter
					</button>
				</div>
			</div>
		</div>

		<!-- Configuration Supabase -->
		<div class="glass rounded-2xl p-6 border-[var(--magic-orange)]/30">
			<div class="flex items-center gap-2 mb-4">
				<AlertTriangle size={18} class="text-[var(--magic-orange)]" />
				<h2 class="font-semibold text-[var(--color-text-primary)]">Configuration requise</h2>
			</div>

			<div class="space-y-4 text-sm text-[var(--color-text-secondary)]">
				<p>
					Pour que l'application fonctionne, vous devez configurer Supabase :
				</p>
				<ol class="list-decimal list-inside space-y-2">
					<li>Créer un projet sur <a href="https://supabase.com" target="_blank" class="text-[var(--magic-turquoise)] hover:underline">supabase.com</a></li>
					<li>Copier l'URL et la clé anonyme depuis les paramètres API</li>
					<li>Créer un fichier <code class="px-1.5 py-0.5 rounded bg-[var(--color-bg-tertiary)]">.env</code> avec :
						<pre class="mt-2 p-3 rounded-lg bg-[var(--color-bg-tertiary)] text-xs overflow-x-auto">PUBLIC_SUPABASE_URL=https://xxx.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJ...</pre>
					</li>
					<li>Exécuter le script SQL <code class="px-1.5 py-0.5 rounded bg-[var(--color-bg-tertiary)]">supabase-schema.sql</code></li>
					<li>Créer un utilisateur admin dans Authentication → Users</li>
				</ol>
			</div>
		</div>

		<!-- Informations -->
		<div class="glass rounded-2xl p-6">
			<h2 class="font-semibold text-[var(--color-text-primary)] mb-4">À propos</h2>
			
			<div class="space-y-3 text-sm">
				<div class="flex justify-between">
					<span class="text-[var(--color-text-muted)]">Version</span>
					<span class="text-[var(--color-text-primary)]">1.0.0</span>
				</div>
				<div class="flex justify-between">
					<span class="text-[var(--color-text-muted)]">Framework</span>
					<span class="text-[var(--color-text-primary)]">SvelteKit 5</span>
				</div>
				<div class="flex justify-between">
					<span class="text-[var(--color-text-muted)]">Base de données</span>
					<span class="text-[var(--color-text-primary)]">Supabase (PostgreSQL)</span>
				</div>
				<div class="flex justify-between">
					<span class="text-[var(--color-text-muted)]">Authentification</span>
					<span class="text-[var(--color-text-primary)]">Supabase Auth</span>
				</div>
			</div>
		</div>
	</div>
</div>
