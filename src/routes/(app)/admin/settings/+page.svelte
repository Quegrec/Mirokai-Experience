<script lang="ts">
	import { Settings, RefreshCw, Download, AlertTriangle, Database, Image, Upload, Trash2, Check, Loader2, Map, FolderOpen, ImageIcon } from 'lucide-svelte';
	import { modules, loadModules } from '$lib/stores/modulesStore';
	import { onMount } from 'svelte';
	import type { AppSettings } from '$lib/supabase/types';

	let { data } = $props();

	let isReloading = $state(false);
	let settings = $state<AppSettings | null>(null);
	let isLoadingSettings = $state(true);
	let isSaving = $state(false);
	let isUploading = $state(false);
	let saveMessage = $state<{ type: 'success' | 'error'; text: string } | null>(null);

	// Preview de l'image uploadée
	let previewUrl = $state<string | null>(null);
	let fileInput: HTMLInputElement;

	// Fichiers du bucket Supabase
	interface BucketFile {
		name: string;
		url: string;
		created_at: string;
	}
	let bucketFiles = $state<BucketFile[]>([]);
	let isLoadingBucket = $state(false);
	let bucketError = $state<string | null>(null);

	onMount(async () => {
		await Promise.all([loadSettings(), loadBucketFiles()]);
	});

	// Charger les fichiers du bucket
	async function loadBucketFiles() {
		if (!data.supabase) return;

		isLoadingBucket = true;
		bucketError = null;

		try {
			const { data: files, error } = await data.supabase.storage
				.from('journey-backgrounds')
				.list('', {
					limit: 100,
					sortBy: { column: 'created_at', order: 'desc' }
				});

			if (error) {
				console.error('Erreur bucket:', error);
				if (error.message.includes('bucket') || error.message.includes('not found')) {
					bucketError = 'Bucket "journey-backgrounds" non trouvé. Créez-le dans Supabase Storage.';
				} else if (error.message.includes('security') || error.message.includes('policy')) {
					bucketError = 'Erreur RLS: Ajoutez une politique SELECT sur le bucket Storage.';
				} else {
					bucketError = error.message;
				}
			} else if (files) {
				// Filtrer les fichiers (exclure les dossiers vides et fichiers système)
				// Note: id existe seulement pour les fichiers, pas les dossiers
				bucketFiles = files
					.filter(f => f.name && !f.name.startsWith('.') && f.id)
					.map(f => ({
						name: f.name,
						url: data.supabase!.storage.from('journey-backgrounds').getPublicUrl(f.name).data.publicUrl,
						created_at: f.created_at || ''
					}));
				
				console.log('Fichiers trouvés dans le bucket:', bucketFiles.length, files);
			}
		} catch (err) {
			bucketError = 'Erreur lors du chargement des fichiers';
		}

		isLoadingBucket = false;
	}

	// Sélectionner un fichier du bucket
	async function selectBucketFile(file: BucketFile) {
		await updateBackgroundUrl(file.url);
	}

	// Supprimer un fichier du bucket
	async function deleteBucketFile(file: BucketFile) {
		if (!data.supabase) return;
		
		if (!confirm(`Supprimer "${file.name}" du bucket ?`)) return;

		try {
			const { error } = await data.supabase.storage
				.from('journey-backgrounds')
				.remove([file.name]);

			if (error) {
				saveMessage = { type: 'error', text: `Erreur: ${error.message}` };
			} else {
				// Si c'était le fichier actuel, reset le fond
				if (settings?.journey_background_url === file.url) {
					await updateBackgroundUrl(null);
				}
				// Recharger la liste
				await loadBucketFiles();
				saveMessage = { type: 'success', text: 'Fichier supprimé !' };
			}
		} catch (err) {
			saveMessage = { type: 'error', text: 'Erreur lors de la suppression' };
		}
	}

	async function loadSettings() {
		isLoadingSettings = true;
		if (data.supabase) {
			const { data: settingsData, error } = await data.supabase
				.from('settings')
				.select('*')
				.eq('id', 'main')
				.single();

			if (error && error.code === 'PGRST116') {
				// No settings yet, create default
				const { data: newSettings } = await data.supabase
					.from('settings')
					.insert({ 
						id: 'main', 
						journey_background_url: null,
						journey_background_type: 'generated'
					})
					.select()
					.single();
				if (newSettings) settings = newSettings;
			} else if (settingsData) {
				settings = settingsData;
			}
		}
		isLoadingSettings = false;
	}

	async function handleReload() {
		isReloading = true;
		await loadModules();
		isReloading = false;
	}

	function exportModules() {
		const dataExport = JSON.stringify($modules, null, 2);
		const blob = new Blob([dataExport], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `modules-export-${new Date().toISOString().split('T')[0]}.json`;
		a.click();
		URL.revokeObjectURL(url);
	}

	// Gérer la sélection de fichier
	function handleFileSelect(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		
		if (file) {
			// Vérifier le type
			if (!file.type.startsWith('image/')) {
				saveMessage = { type: 'error', text: 'Veuillez sélectionner une image' };
				return;
			}

			// Vérifier la taille (max 5MB)
			if (file.size > 5 * 1024 * 1024) {
				saveMessage = { type: 'error', text: 'L\'image ne doit pas dépasser 5MB' };
				return;
			}

			// Créer un preview
			const reader = new FileReader();
			reader.onload = (e) => {
				previewUrl = e.target?.result as string;
			};
			reader.readAsDataURL(file);
		}
	}

	// Uploader et sauvegarder l'image
	async function uploadAndSave() {
		if (!fileInput?.files?.[0] || !data.supabase) return;

		isUploading = true;
		saveMessage = null;

		const file = fileInput.files[0];
		const fileExt = file.name.split('.').pop();
		const fileName = `journey-bg-${Date.now()}.${fileExt}`;

		try {
			// Upload vers Supabase Storage
			const { data: uploadData, error: uploadError } = await data.supabase.storage
				.from('journey-backgrounds')
				.upload(fileName, file, {
					cacheControl: '3600',
					upsert: true
				});

			if (uploadError) {
				// Si le bucket n'existe pas, proposer d'utiliser le fichier local
				if (uploadError.message.includes('bucket') || uploadError.message.includes('not found')) {
					saveMessage = { 
						type: 'error', 
						text: 'Bucket Storage non configuré. Utilisez une URL directe ou créez le bucket "journey-backgrounds" dans Supabase.' 
					};
				} else {
					saveMessage = { type: 'error', text: `Erreur upload: ${uploadError.message}` };
				}
				isUploading = false;
				return;
			}

			// Obtenir l'URL publique
			const { data: urlData } = data.supabase.storage
				.from('journey-backgrounds')
				.getPublicUrl(uploadData.path);

			// Mettre à jour les settings
			await updateBackgroundUrl(urlData.publicUrl);

			// Recharger la liste des fichiers du bucket
			await loadBucketFiles();

		} catch (err) {
			saveMessage = { type: 'error', text: 'Erreur lors de l\'upload' };
		}

		isUploading = false;
	}

	// Utiliser un fichier du dossier static
	async function useStaticFile(filename: string) {
		await updateBackgroundUrl(`/${filename}`);
	}

	// Mettre à jour l'URL du fond
	async function updateBackgroundUrl(url: string | null) {
		if (!data.supabase) return;

		isSaving = true;
		saveMessage = null;

		const { error } = await data.supabase
			.from('settings')
			.update({ 
				journey_background_url: url,
				journey_background_type: url ? 'image' : 'generated'
			})
			.eq('id', 'main');

		if (error) {
			saveMessage = { type: 'error', text: `Erreur: ${error.message}` };
		} else {
			settings = {
				...settings!,
				journey_background_url: url,
				journey_background_type: url ? 'image' : 'generated'
			};
			previewUrl = null;
			if (fileInput) fileInput.value = '';
			saveMessage = { type: 'success', text: 'Image de fond mise à jour !' };
		}

		isSaving = false;
	}

	// Supprimer l'image de fond
	async function removeBackground() {
		if (confirm('Supprimer l\'image de fond et revenir au fond généré ?')) {
			await updateBackgroundUrl(null);
		}
	}
</script>

<div class="max-w-2xl">
	<!-- Header -->
	<div class="mb-8">
		<h1 class="text-2xl font-bold text-(--color-text-primary)">
			Paramètres
		</h1>
		<p class="text-(--color-text-muted) mt-1">
			Configuration de l'administration
		</p>
	</div>

	{#if saveMessage}
		<div 
			class="mb-6 p-4 rounded-xl flex items-center gap-3 {saveMessage.type === 'success' ? 'bg-[var(--magic-turquoise)]/10 border border-[var(--magic-turquoise)]/30' : 'bg-red-500/10 border border-red-500/30'}"
		>
			{#if saveMessage.type === 'success'}
				<Check size={18} class="text-(--magic-turquoise)" />
				<span class="text-(--magic-turquoise)">{saveMessage.text}</span>
			{:else}
				<AlertTriangle size={18} class="text-red-400" />
				<span class="text-red-400">{saveMessage.text}</span>
			{/if}
		</div>
	{/if}

	<div class="space-y-6">
		<!-- Image de fond du parcours -->
		<div class="glass rounded-2xl p-6">
			<div class="flex items-center gap-2 mb-4">
				<Map size={18} class="text-(--magic-magenta)" />
				<h2 class="font-semibold text-(--color-text-primary)">Image de fond du parcours</h2>
			</div>

			{#if isLoadingSettings}
				<div class="flex items-center justify-center py-8">
					<Loader2 size={24} class="animate-spin text-(--magic-turquoise)" />
				</div>
			{:else}
				<div class="space-y-4">
					<!-- Aperçu actuel -->
					<div class="p-4 rounded-xl bg-[var(--color-bg-tertiary)]">
						<p class="text-xs text-(--color-text-muted) uppercase tracking-wider mb-3">Aperçu actuel</p>
						
						{#if settings?.journey_background_url}
							<div class="relative aspect-[9/16] max-h-[300px] rounded-lg overflow-hidden border border-[var(--color-border)]">
								<img 
									src={settings.journey_background_url} 
									alt="Fond du parcours actuel"
									class="w-full h-full object-cover"
								/>
								<button 
									onclick={removeBackground}
									class="absolute top-2 right-2 p-2 rounded-lg bg-red-500/80 hover:bg-red-500 text-white transition-colors"
									title="Supprimer"
								>
									<Trash2 size={16} />
								</button>
							</div>
							<p class="text-xs text-(--color-text-muted) mt-2 truncate">
								{settings.journey_background_url}
							</p>
						{:else}
							<div class="aspect-[9/16] max-h-[200px] rounded-lg bg-gradient-to-b from-[var(--color-bg-secondary)] to-[var(--color-bg-primary)] border border-[var(--color-border)] flex items-center justify-center">
								<div class="text-center">
									<div class="w-12 h-12 mx-auto mb-2 rounded-full bg-[var(--magic-turquoise)]/20 flex items-center justify-center">
										<Image size={24} class="text-(--magic-turquoise)" />
									</div>
									<p class="text-sm text-(--color-text-muted)">Fond généré automatiquement</p>
								</div>
							</div>
						{/if}
					</div>

					<!-- Fichiers du Bucket Supabase -->
						<div class="p-4 rounded-xl bg-[var(--color-bg-tertiary)]">
							<div class="flex items-center justify-between mb-3">
								<div class="flex items-center gap-2">
									<FolderOpen size={14} class="text-(--magic-turquoise)" />
									<p class="text-xs text-(--color-text-muted) uppercase tracking-wider">Fichiers du bucket Supabase</p>
							</div>
								<button 
									onclick={loadBucketFiles}
									disabled={isLoadingBucket}
									class="text-xs text-(--magic-turquoise) hover:underline disabled:opacity-50"
							>
								{isLoadingBucket ? 'Chargement...' : 'Actualiser'}
							</button>
						</div>

						{#if bucketError}
							<div class="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400">
								{bucketError}
							</div>
						{:else if isLoadingBucket}
							<div class="flex items-center justify-center py-6">
								<Loader2 size={20} class="animate-spin text-(--magic-turquoise)" />
							</div>
						{:else if bucketFiles.length === 0}
							<div class="text-center py-6 text-sm text-(--color-text-muted)">
								<ImageIcon size={32} class="mx-auto mb-2 opacity-50" />
								<p>Aucune image dans le bucket</p>
								<p class="text-xs mt-1">Uploadez une image ci-dessous</p>
							</div>
						{:else}
							<div class="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[300px] overflow-y-auto pr-1">
								{#each bucketFiles as file}
									<div 
										class="relative group rounded-lg border border-[var(--color-border)] overflow-hidden transition-colors hover:border-[var(--magic-turquoise)] {settings?.journey_background_url === file.url ? 'border-[var(--magic-turquoise)] ring-2 ring-[var(--magic-turquoise)]/50' : ''}"
									>
										<button 
											onclick={() => selectBucketFile(file)}
											class="w-full text-left"
										>
											<div class="aspect-[9/16] max-h-[120px]">
												<img 
													src={file.url} 
													alt={file.name}
													class="w-full h-full object-cover"
													loading="lazy"
												/>
											</div>
											<div class="p-2">
												<p class="text-xs text-(--color-text-primary) truncate">{file.name}</p>
											</div>
										</button>
										
										<!-- Badge si sélectionné -->
										{#if settings?.journey_background_url === file.url}
											<div class="absolute top-1 left-1 p-1 rounded-full bg-[var(--magic-turquoise)] text-white">
												<Check size={10} />
											</div>
										{/if}

										<!-- Bouton supprimer -->
										<button 
											onclick={() => deleteBucketFile(file)}
											class="absolute top-1 right-1 p-1.5 rounded-lg bg-red-500/80 hover:bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
											title="Supprimer du bucket"
										>
											<Trash2 size={12} />
										</button>
									</div>
								{/each}
							</div>
						{/if}
					</div>

					<!-- Options rapides -->
					<div class="p-4 rounded-xl bg-[var(--color-bg-tertiary)]">
						<p class="text-xs text-(--color-text-muted) uppercase tracking-wider mb-3">Options rapides</p>
						<div class="grid grid-cols-2 gap-3">
							<button 
								onclick={() => useStaticFile('parcours-example.png')}
								class="p-3 rounded-lg border border-[var(--color-border)] hover:border-[var(--magic-turquoise)] transition-colors text-left group"
								class:border-[var(--magic-turquoise)]={settings?.journey_background_url === '/parcours-example.png'}
							>
								<div class="aspect-[9/16] max-h-[80px] rounded overflow-hidden mb-2">
									<img src="/parcours-example.png" alt="Parcours exemple" class="w-full h-full object-cover" />
								</div>
								<p class="text-xs text-(--color-text-primary) group-hover:text-(--magic-turquoise)">Image par défaut</p>
							</button>
							
							<button 
								onclick={() => updateBackgroundUrl(null)}
								class="p-3 rounded-lg border border-[var(--color-border)] hover:border-[var(--magic-purple)] transition-colors text-left group"
								class:border-[var(--magic-purple)]={!settings?.journey_background_url}
							>
								<div class="aspect-[9/16] max-h-[80px] rounded bg-gradient-to-b from-[var(--magic-turquoise)]/20 via-[var(--magic-purple)]/10 to-[var(--magic-magenta)]/20 flex items-center justify-center mb-2">
									<span class="text-2xl">✨</span>
								</div>
								<p class="text-xs text-(--color-text-primary) group-hover:text-(--magic-purple)">Fond généré</p>
							</button>
						</div>
					</div>

					<!-- Upload personnalisé -->
					<div class="p-4 rounded-xl bg-[var(--color-bg-tertiary)]">
						<p class="text-xs text-(--color-text-muted) uppercase tracking-wider mb-3">Uploader une image</p>
						
						<input 
							type="file" 
							accept="image/*"
							bind:this={fileInput}
							onchange={handleFileSelect}
							class="hidden"
							id="bg-upload"
						/>

						{#if previewUrl}
							<div class="mb-3">
								<div class="aspect-[9/16] max-h-[200px] rounded-lg overflow-hidden border border-[var(--magic-turquoise)]">
									<img src={previewUrl} alt="Preview" class="w-full h-full object-cover" />
								</div>
							</div>
							<div class="flex gap-2">
								<button 
									onclick={uploadAndSave}
									disabled={isUploading || isSaving}
									class="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl btn-magic disabled:opacity-50"
								>
									{#if isUploading || isSaving}
										<Loader2 size={16} class="animate-spin" />
										<span>Sauvegarde...</span>
									{:else}
										<Check size={16} />
										<span>Utiliser cette image</span>
									{/if}
								</button>
								<button 
									onclick={() => { previewUrl = null; if(fileInput) fileInput.value = ''; }}
									class="px-4 py-2.5 rounded-xl glass hover:bg-[var(--color-bg-tertiary)] text-(--color-text-muted)"
								>
									Annuler
								</button>
							</div>
						{:else}
							<label 
								for="bg-upload"
								class="flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed border-[var(--color-border)] hover:border-[var(--magic-turquoise)] cursor-pointer transition-colors"
							>
								<Upload size={20} class="text-(--color-text-muted)" />
								<span class="text-sm text-(--color-text-muted)">Cliquez pour sélectionner une image</span>
							</label>
							<p class="text-xs text-(--color-text-muted) mt-2">
								Format : PNG, JPG, WebP • Max 5MB • Ratio portrait recommandé (9:16)
							</p>
						{/if}
					</div>
				</div>
			{/if}
		</div>

		<!-- Base de données -->
		<div class="glass rounded-2xl p-6">
			<div class="flex items-center gap-2 mb-4">
				<Database size={18} class="text-(--magic-turquoise)" />
				<h2 class="font-semibold text-(--color-text-primary)">Base de données</h2>
			</div>

			<div class="space-y-4">
				<div class="flex items-center justify-between p-4 rounded-xl bg-[var(--color-bg-tertiary)]">
					<div>
						<p class="text-sm text-(--color-text-primary)">Recharger les modules</p>
						<p class="text-xs text-(--color-text-muted)">
							Synchroniser avec la base de données Supabase
						</p>
					</div>
					<button 
						onclick={handleReload}
						disabled={isReloading}
						class="flex items-center gap-2 px-4 py-2 rounded-xl glass hover:bg-[var(--color-bg-tertiary)] text-(--magic-turquoise) transition-colors disabled:opacity-50"
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
				<Settings size={18} class="text-(--magic-purple)" />
				<h2 class="font-semibold text-(--color-text-primary)">Données</h2>
			</div>

			<div class="space-y-4">
				<div class="flex items-center justify-between p-4 rounded-xl bg-[var(--color-bg-tertiary)]">
					<div>
						<p class="text-sm text-(--color-text-primary)">Exporter les modules</p>
						<p class="text-xs text-(--color-text-muted)">
							Télécharger tous les modules au format JSON
						</p>
					</div>
					<button 
						onclick={exportModules}
						class="flex items-center gap-2 px-4 py-2 rounded-xl glass hover:bg-[var(--color-bg-tertiary)] text-(--magic-turquoise) transition-colors"
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
				<AlertTriangle size={18} class="text-(--magic-orange)" />
				<h2 class="font-semibold text-(--color-text-primary)">Configuration requise</h2>
			</div>

			<div class="space-y-4 text-sm text-(--color-text-secondary)">
				<p>
					Pour que l'application fonctionne, vous devez configurer Supabase :
				</p>
				<ol class="list-decimal list-inside space-y-2">
					<li>Créer un projet sur <a href="https://supabase.com" target="_blank" class="text-(--magic-turquoise) hover:underline">supabase.com</a></li>
					<li>Copier l'URL et la clé anonyme depuis les paramètres API</li>
					<li>Créer un fichier <code class="px-1.5 py-0.5 rounded bg-[var(--color-bg-tertiary)]">.env</code> avec :
						<pre class="mt-2 p-3 rounded-lg bg-[var(--color-bg-tertiary)] text-xs overflow-x-auto">PUBLIC_SUPABASE_URL=https://xxx.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJ...</pre>
					</li>
					<li>Exécuter le script SQL <code class="px-1.5 py-0.5 rounded bg-[var(--color-bg-tertiary)]">supabase-schema.sql</code></li>
					<li>Créer un bucket Storage <code class="px-1.5 py-0.5 rounded bg-[var(--color-bg-tertiary)]">journey-backgrounds</code> (public)</li>
					<li>Créer un utilisateur admin dans Authentication → Users</li>
				</ol>
			</div>
		</div>

		<!-- Informations -->
		<div class="glass rounded-2xl p-6">
			<h2 class="font-semibold text-(--color-text-primary) mb-4">À propos</h2>
			
			<div class="space-y-3 text-sm">
				<div class="flex justify-between">
					<span class="text-(--color-text-muted)">Version</span>
					<span class="text-(--color-text-primary)">1.0.0</span>
				</div>
				<div class="flex justify-between">
					<span class="text-(--color-text-muted)">Framework</span>
					<span class="text-(--color-text-primary)">SvelteKit 5</span>
				</div>
				<div class="flex justify-between">
					<span class="text-(--color-text-muted)">Base de données</span>
					<span class="text-(--color-text-primary)">Supabase (PostgreSQL)</span>
				</div>
				<div class="flex justify-between">
					<span class="text-(--color-text-muted)">Authentification</span>
					<span class="text-(--color-text-primary)">Supabase Auth</span>
				</div>
			</div>
		</div>
	</div>
</div>
