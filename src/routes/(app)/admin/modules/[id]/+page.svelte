<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { modules, updateModule, deleteModule } from '$lib/stores/modulesStore';
	import { createSupabaseClient } from '$lib/supabase/client';
	import { zones } from '$lib/data/zones';
	import type { ModuleType, ModuleStatus } from '$lib/supabase/types';
	import { ArrowLeft, Save, Trash2, Sparkles, AlertCircle, Upload, Music } from 'lucide-svelte';
	import HelpTip from '$lib/components/HelpTip.svelte';
	import AudioPlayer from '$lib/components/AudioPlayer.svelte';

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

	const moduleId = $page.params.id;
	const module = $derived($modules.find(m => m.id === moduleId));

	// Garde pour s'assurer que moduleId est défini
	function getModuleId(): string {
		if (!moduleId) throw new Error('Module ID is required');
		return moduleId;
	}

	// États du formulaire
	let nom = $state('');
	let description = $state('');
	let type = $state<ModuleType>('video');
	let status = $state<ModuleStatus>('brouillon');
	let dureeEstimee = $state(5);
	let zoneId = $state<string>('');
	let mediaUrl = $state('');
	let texte = $state('');
	let instructions = $state<string[]>(['']);
	let isSaving = $state(false);
	let isDeleting = $state(false);
	let hasChanges = $state(false);
	let errorMsg = $state<string | null>(null);

	// Upload / suppression audioguide via Supabase Storage
	const supabase = createSupabaseClient();
	const AUDIO_BUCKET = 'audioguides';
	let audioFile = $state<File | null>(null);
	let isUploadingAudio = $state(false);
	let uploadError = $state<string | null>(null);
	let audioLang = $state<'FR' | 'EN'>('FR');

	// Transcription automatique via Groq Whisper
	let isTranscribing = $state(false);
	let transcribeError = $state<string | null>(null);

	async function transcribeAudio() {
		if (!mediaUrl.trim()) return;
		isTranscribing = true;
		transcribeError = null;

		try {
			const res = await fetch('/api/transcribe', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ audioUrl: mediaUrl.trim() })
			});

			if (!res.ok) {
				const err = await res.json().catch(() => ({ message: res.statusText }));
				throw new Error(err.message || res.statusText);
			}

			const { transcript } = await res.json();
			texte = transcript;
			markChanged();
		} catch (e: unknown) {
			transcribeError = e instanceof Error ? e.message : 'Erreur lors de la transcription';
		}

		isTranscribing = false;
	}

	// Initialiser les valeurs quand le module change
	$effect(() => {
		if (module) {
			nom = module.nom;
			description = module.description;
			type = module.type;
			status = module.status;
			dureeEstimee = module.duree_estimee;
			zoneId = module.zone_id || '';
			mediaUrl = module.contenu?.mediaUrl || '';
			texte = module.contenu?.texte || '';
			instructions = module.contenu?.instructions?.length 
				? [...module.contenu.instructions] 
				: [''];
			hasChanges = false;
		}
	});

	// Suivre les modifications
	function markChanged() {
		hasChanges = true;
	}

	function addInstruction() {
		instructions = [...instructions, ''];
		markChanged();
	}

	function removeInstruction(index: number) {
		instructions = instructions.filter((_, i) => i !== index);
		markChanged();
	}

	function updateInstruction(index: number, value: string) {
		instructions = instructions.map((inst, i) => i === index ? value : inst);
		markChanged();
	}

	function handleAudioFileChange(event: Event) {
		const target = event.currentTarget as HTMLInputElement;
		audioFile = target.files?.[0] ?? null;
		uploadError = null;
		if (audioFile) {
			markChanged();
		}
	}

	async function uploadAudio() {
		if (!audioFile) return;

		isUploadingAudio = true;
		uploadError = null;

		const safeName = audioFile.name.replace(/\s+/g, '_');
		const filePath = `${audioLang.toLowerCase()}/${Date.now()}_${safeName}`;

		const { error: uploadErr } = await supabase.storage
			.from(AUDIO_BUCKET)
			.upload(filePath, audioFile, { upsert: false });

		if (uploadErr) {
			console.error('Erreur upload audioguide', uploadErr);
			uploadError = 'Erreur lors de l’upload de l’audioguide.';
			isUploadingAudio = false;
			return;
		}

		const { data: publicUrlData } = supabase.storage
			.from(AUDIO_BUCKET)
			.getPublicUrl(filePath);

		mediaUrl = publicUrlData.publicUrl;
		isUploadingAudio = false;
		markChanged();
	}

	async function deleteAudioFromSupabase(url: string | null | undefined) {
		if (!url) return;

		// On ne supprime que si l’URL pointe vers le bucket Supabase "audioguides"
		const match = url.match(/audioguides\/(.+)$/);
		if (!match) return;

		const filePath = match[1];
		const { error: deleteErr } = await supabase.storage
			.from(AUDIO_BUCKET)
			.remove([filePath]);

		if (deleteErr) {
			console.error('Erreur lors de la suppression de l’audioguide', deleteErr);
		}
	}

	async function handleSubmit() {
		if (!nom.trim()) {
			errorMsg = 'Le nom du module est requis';
			return;
		}

		isSaving = true;
		errorMsg = null;

		const oldMediaUrl = module?.contenu?.mediaUrl || null;

		const success = await updateModule(getModuleId(), {
			nom: nom.trim(),
			description: description.trim(),
			type,
			status,
			duree_estimee: dureeEstimee,
			zone_id: zoneId || null,
			contenu: {
				mediaUrl: mediaUrl.trim() || undefined,
				texte: texte.trim() || undefined,
				instructions: instructions.filter(i => i.trim()).length > 0 
					? instructions.filter(i => i.trim()) 
					: undefined
			}
		});

		if (success) {
			// Si l’audioguide a été changé ou supprimé, on supprime l’ancien fichier du bucket
			if (oldMediaUrl && oldMediaUrl !== (mediaUrl.trim() || undefined)) {
				await deleteAudioFromSupabase(oldMediaUrl);
			}
			hasChanges = false;
		} else {
			errorMsg = 'Erreur lors de la sauvegarde';
		}

		isSaving = false;
	}

	async function handleDelete() {
		if (confirm('Êtes-vous sûr de vouloir supprimer ce module ? Cette action est irréversible.')) {
			isDeleting = true;

			// Supprimer l’audioguide associé s’il est dans le bucket
			const currentMediaUrl = module?.contenu?.mediaUrl || null;
			if (currentMediaUrl) {
				await deleteAudioFromSupabase(currentMediaUrl);
			}

			const success = await deleteModule(getModuleId());
			if (success) {
				goto('/admin/modules');
			} else {
				errorMsg = 'Erreur lors de la suppression';
				isDeleting = false;
			}
		}
	}
</script>

{#if !module}
	<div class="glass rounded-2xl p-12 text-center">
		<AlertCircle size={48} class="mx-auto mb-4 text-(--magic-orange)" />
		<h2 class="text-xl font-bold text-(--color-text-primary) mb-2">
			Module non trouvé
		</h2>
		<p class="text-(--color-text-muted) mb-6">
			Le module demandé n'existe pas ou a été supprimé.
		</p>
				<a 
			href="/admin/modules"
			class="inline-flex items-center gap-2 px-4 py-2 rounded-xl btn-magic text-white"
		>
			<ArrowLeft size={16} />
			Retour aux modules
		</a>
	</div>
{:else}
	<div class="max-w-3xl">
		<!-- Header -->
		<div class="flex items-center justify-between mb-8">
			<div class="flex items-center gap-4">
				<a 
					href="/admin/modules"
					class="p-2 rounded-xl glass hover:bg-[var(--color-bg-tertiary)] transition-colors text-(--color-text-muted) hover:text-(--color-text-primary)"
				>
					<ArrowLeft size={20} />
				</a>
				<div>
					<h1 class="text-2xl font-bold text-(--color-text-primary)">
						{module.nom}
					</h1>
					<p class="text-(--color-text-muted) mt-1">
						Modifier le module
					</p>
				</div>
			</div>
			
			{#if hasChanges}
				<span class="px-3 py-1 rounded-full text-xs font-medium bg-[var(--magic-orange)]/20 text-(--magic-orange)">
					Modifications non sauvegardées
				</span>
			{/if}
		</div>

		{#if errorMsg}
			<div class="glass rounded-xl p-4 border-red-500/30 bg-red-500/10 mb-6">
				<p class="text-red-400 text-sm">{errorMsg}</p>
			</div>
		{/if}

		<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="space-y-6">
			<!-- Informations principales -->
			<div class="glass rounded-2xl p-6 space-y-5">
				<div class="flex items-center gap-2 mb-2">
					<Sparkles size={18} class="text-(--magic-turquoise)" />
					<h2 class="font-semibold text-(--color-text-primary)">Informations</h2>
				</div>

				<div>
					<label for="nom" class="text-sm text-(--color-text-secondary) block mb-2">
						Nom du module *
					</label>
					<input 
						type="text"
						id="nom"
						bind:value={nom}
						oninput={markChanged}
						placeholder="Ex: Introduction à Mirokaï"
						class="w-full px-4 py-3 rounded-xl bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] text-(--color-text-primary) placeholder:text-(--color-text-muted) focus:outline-none focus:border-[var(--magic-turquoise)] transition-colors"
						required
					/>
				</div>

				<div>
					<label for="description" class="text-sm text-(--color-text-secondary) block mb-2">
						Description
					</label>
					<textarea 
						id="description"
						bind:value={description}
						oninput={markChanged}
						placeholder="Décrivez le contenu de ce module..."
						rows="3"
						class="w-full px-4 py-3 rounded-xl bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] text-(--color-text-primary) placeholder:text-(--color-text-muted) focus:outline-none focus:border-[var(--magic-turquoise)] transition-colors resize-none"
					></textarea>
				</div>

				<div class="grid sm:grid-cols-2 gap-4">
					<div>
						<label for="type" class="text-sm text-(--color-text-secondary) flex items-center gap-1.5 mb-2">
							Type de module
							<HelpTip text="Le type détermine l'icône sur la carte. Un module «Vidéo» affiche un triangle ▶ à la place du numéro. Choisissez «Expérience» ou «Info» pour les étapes sans média." />
						</label>
						<select 
							id="type"
							bind:value={type}
							onchange={markChanged}
							class="w-full px-4 py-3 rounded-xl bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] text-(--color-text-primary) focus:outline-none focus:border-[var(--magic-turquoise)] transition-colors"
						>
							{#each Object.entries(moduleTypeLabels) as [value, label]}
								<option {value}>{label}</option>
							{/each}
						</select>
					</div>

					<div>
						<label for="status" class="text-sm text-(--color-text-secondary) block mb-2">
							Statut
						</label>
						<select 
							id="status"
							bind:value={status}
							onchange={markChanged}
							class="w-full px-4 py-3 rounded-xl bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] text-(--color-text-primary) focus:outline-none focus:border-[var(--magic-turquoise)] transition-colors"
						>
							{#each Object.entries(moduleStatusLabels) as [value, label]}
								<option {value}>{label}</option>
							{/each}
						</select>
					</div>
				</div>

				<div class="grid sm:grid-cols-2 gap-4">
					<div>
						<label for="duree" class="text-sm text-(--color-text-secondary) block mb-2">
							Durée estimée (minutes)
						</label>
						<input 
							type="number"
							id="duree"
							bind:value={dureeEstimee}
							oninput={markChanged}
							min="1"
							max="60"
							class="w-full px-4 py-3 rounded-xl bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] text-(--color-text-primary) focus:outline-none focus:border-[var(--magic-turquoise)] transition-colors"
						/>
					</div>

					<div>
						<label for="zone" class="text-sm text-(--color-text-secondary) block mb-2">
							Zone associée
						</label>
						<select 
							id="zone"
							bind:value={zoneId}
							onchange={markChanged}
							class="w-full px-4 py-3 rounded-xl bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] text-(--color-text-primary) focus:outline-none focus:border-[var(--magic-turquoise)] transition-colors"
						>
							<option value="">Aucune zone</option>
							{#each zones as zone}
								<option value={zone.id}>{zone.nom}</option>
							{/each}
						</select>
					</div>
				</div>
			</div>

			<!-- Contenu -->
			<div class="glass rounded-2xl p-6 space-y-5">
				<h2 class="font-semibold text-(--color-text-primary)">Contenu</h2>

				<div class="space-y-3">
					<label for="mediaUrl" class="text-sm text-(--color-text-secondary) flex items-center gap-1.5 mb-1">
						URL de l’audioguide
						<HelpTip text="Collez l’URL publique du fichier audio (hébergé sur Supabase Storage ou ailleurs). Formats acceptés : MP3, MP4, WAV, OGG. Après upload, l’URL s’affiche automatiquement dans ce champ." position="right" />
					</label>
					<input 
						type="text"
						id="mediaUrl"
						bind:value={mediaUrl}
						oninput={markChanged}
						placeholder="/Audioguides/FR/1.Naissance d'ET.mp4 ou URL Supabase"
						class="w-full px-4 py-3 rounded-xl bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] text-(--color-text-primary) placeholder:text-(--color-text-muted) focus:outline-none focus:border-[var(--magic-turquoise)] transition-colors"
					/>

					<!-- Zone d’upload mise en évidence -->
					<div class="upload-zone">
						<div class="upload-zone__header">
							<Music size={18} class="text-(--magic-turquoise)" />
							<span class="upload-zone__title">Uploader un audioguide</span>
							<select
								bind:value={audioLang}
								class="upload-zone__lang"
							>
								<option value="FR">🇫🇷 FR</option>
								<option value="EN">🇬🇧 EN</option>
							</select>
						</div>

						<label class="upload-zone__droparea" class:has-file={!!audioFile}>
							<input
								type="file"
								accept="audio/*,video/mp4"
								onchange={handleAudioFileChange}
								class="sr-only"
							/>
							{#if audioFile}
								<div class="upload-zone__file-info">
									<Music size={20} class="text-(--magic-turquoise)" />
									<span class="upload-zone__filename">{audioFile.name}</span>
									<span class="upload-zone__filesize">
										{(audioFile.size / 1024 / 1024).toFixed(1)} MB
									</span>
								</div>
							{:else}
								<Upload size={22} class="text-(--color-text-muted)" />
								<p class="upload-zone__hint">
									Cliquez ou déposez un fichier ici<br/>
									<span>MP3 · MP4 · WAV · OGG</span>
								</p>
							{/if}
						</label>

						{#if audioFile}
							<button
								type="button"
								onclick={uploadAudio}
								disabled={isUploadingAudio}
								class="upload-zone__btn"
							>
								{#if isUploadingAudio}
									<div class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
									Upload en cours…
								{:else}
									<Upload size={15} />
									Uploader vers Supabase
								{/if}
							</button>
						{/if}

						{#if uploadError}
							<p class="text-xs text-red-400 mt-1">{uploadError}</p>
						{/if}
					</div>
				</div>

				{#if mediaUrl}
					<div class="space-y-2">
						<p class="text-xs text-(--color-text-secondary) mb-1">Aperçu de l’audioguide</p>
						<AudioPlayer src={mediaUrl} />
					</div>
				{/if}

				<div>
					<div class="flex items-center justify-between mb-2">
						<label for="texte" class="text-sm text-(--color-text-secondary) flex items-center gap-1.5">
							Texte / Script
							<HelpTip text="Ce texte s'affiche en sous-titres synchronisés pendant la lecture de l'audio. Il défile phrase par phrase en temps réel. Utilisez le bouton «Transcrire» pour le générer automatiquement depuis l'audio." />
						</label>
						{#if mediaUrl.trim()}
							<button
								type="button"
								onclick={transcribeAudio}
								disabled={isTranscribing}
								class="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium border border-(--magic-turquoise)/40 text-(--magic-turquoise) hover:bg-(--magic-turquoise)/10 disabled:opacity-50 transition-colors"
							>
								{#if isTranscribing}
									<div class="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin"></div>
									Transcription…
								{:else}
									🎙️ Transcrire avec Whisper
								{/if}
							</button>
						{/if}
					</div>
					{#if transcribeError}
						<p class="text-xs text-red-400 mb-2">{transcribeError}</p>
					{/if}
					<textarea
						id="texte"
						bind:value={texte}
						oninput={markChanged}
						rows="14"
						placeholder="Colle ici le script de l'audioguide — il deviendra les sous-titres synchronisés."
						class="w-full px-4 py-3 rounded-xl bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] text-(--color-text-primary) placeholder:text-(--color-text-muted) focus:outline-none focus:border-[var(--magic-turquoise)] transition-colors resize-y"
					></textarea>
				</div>

				<div>
					<div class="flex items-center justify-between mb-2">
						<label class="text-sm text-(--color-text-secondary)">
							Instructions
						</label>
						<button 
							type="button"
							onclick={addInstruction}
							class="text-sm text-(--magic-turquoise) hover:underline"
						>
							+ Ajouter
						</button>
					</div>
					<div class="space-y-2">
						{#each instructions as instruction, i}
							<div class="flex gap-2">
								<input 
									type="text"
									value={instruction}
									oninput={(e) => updateInstruction(i, e.currentTarget.value)}
									placeholder="Instruction {i + 1}"
									class="flex-1 px-4 py-2.5 rounded-xl bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] text-(--color-text-primary) placeholder:text-(--color-text-muted) focus:outline-none focus:border-[var(--magic-turquoise)] transition-colors text-sm"
								/>
								{#if instructions.length > 1}
									<button 
										type="button"
										onclick={() => removeInstruction(i)}
										class="px-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors"
									>
										×
									</button>
								{/if}
							</div>
						{/each}
					</div>
				</div>
			</div>

			<!-- Zone de danger -->
			<div class="glass rounded-2xl p-6 border-red-500/30">
				<h2 class="font-semibold text-red-400 mb-4">Zone de danger</h2>
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm text-(--color-text-primary)">Supprimer ce module</p>
						<p class="text-xs text-(--color-text-muted)">Cette action est irréversible</p>
					</div>
					<button 
						type="button"
						onclick={handleDelete}
						disabled={isDeleting}
						class="flex items-center gap-2 px-4 py-2 rounded-xl text-red-400 border border-red-500/30 hover:bg-red-500/10 transition-colors disabled:opacity-50"
					>
						{#if isDeleting}
							<div class="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin"></div>
						{:else}
							<Trash2 size={16} />
						{/if}
						{isDeleting ? 'Suppression...' : 'Supprimer'}
					</button>
				</div>
			</div>

			<!-- Actions -->
			<div class="flex items-center justify-end gap-3 sticky bottom-6">
				<a 
					href="/admin/modules"
					class="px-6 py-3 rounded-xl glass text-(--color-text-secondary) hover:text-(--color-text-primary) hover:bg-[var(--color-bg-tertiary)] transition-colors"
				>
					Annuler
				</a>
				<button 
					type="submit"
					disabled={isSaving || !hasChanges}
					class="flex items-center gap-2 px-6 py-3 rounded-xl btn-magic text-white font-medium disabled:opacity-50"
				>
					{#if isSaving}
						<div class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
					{:else}
						<Save size={18} />
					{/if}
					{isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
				</button>
			</div>
		</form>
	</div>
{/if}

<style>
	/* ── Zone d'upload audioguide ── */
	.upload-zone {
		border: 1.5px dashed rgba(14, 170, 162, 0.4);
		border-radius: 1rem;
		padding: 1rem;
		background: rgba(14, 170, 162, 0.04);
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		transition: border-color 0.2s, background 0.2s;
	}

	.upload-zone:focus-within {
		border-color: rgba(14, 170, 162, 0.7);
		background: rgba(14, 170, 162, 0.08);
	}

	.upload-zone__header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--color-text-primary);
	}

	.upload-zone__title { flex: 1; }

	.upload-zone__lang {
		padding: 0.2rem 0.5rem;
		border-radius: 0.5rem;
		background: var(--color-bg-tertiary);
		border: 1px solid var(--color-border);
		font-size: 0.75rem;
		color: var(--color-text-primary);
		cursor: pointer;
	}

	.upload-zone__droparea {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 1.25rem 1rem;
		border-radius: 0.75rem;
		border: 1.5px dashed var(--color-border);
		background: var(--color-bg-tertiary);
		cursor: pointer;
		text-align: center;
		transition: border-color 0.2s, background 0.2s;
		min-height: 90px;
	}

	.upload-zone__droparea:hover,
	.upload-zone__droparea.has-file {
		border-color: rgba(14, 170, 162, 0.6);
		background: rgba(14, 170, 162, 0.06);
	}

	.upload-zone__hint {
		margin: 0;
		font-size: 0.8rem;
		color: var(--color-text-muted);
		line-height: 1.5;
	}

	.upload-zone__hint span {
		font-size: 0.7rem;
		opacity: 0.7;
		display: block;
		margin-top: 0.15rem;
	}

	.upload-zone__file-info {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
		justify-content: center;
	}

	.upload-zone__filename {
		font-size: 0.82rem;
		font-weight: 600;
		color: var(--magic-turquoise);
		max-width: 220px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.upload-zone__filesize {
		font-size: 0.72rem;
		color: var(--color-text-muted);
	}

	.upload-zone__btn {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.65rem 1rem;
		border-radius: 0.75rem;
		border: none;
		background: linear-gradient(135deg, var(--magic-turquoise), var(--magic-magenta));
		color: white;
		font-size: 0.85rem;
		font-weight: 600;
		cursor: pointer;
		box-shadow: 0 4px 14px rgba(14, 170, 162, 0.35);
		transition: opacity 0.2s, transform 0.15s;
	}

	.upload-zone__btn:hover { opacity: 0.92; transform: translateY(-1px); }
	.upload-zone__btn:disabled { opacity: 0.5; cursor: default; transform: none; }
</style>
