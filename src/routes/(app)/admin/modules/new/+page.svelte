<script lang="ts">
	import { goto } from '$app/navigation';
	import { addModule } from '$lib/stores/modulesStore';
	import { zones } from '$lib/data/zones';
	import type { ModuleType, ModuleStatus } from '$lib/supabase/types';
	import { ArrowLeft, Save, Sparkles } from 'lucide-svelte';

	const moduleTypeLabels: Record<ModuleType, string> = {
		video: 'Vidéo',
		interaction: 'Interaction',
		quiz: 'Quiz',
		info: 'Information',
		experience: 'Expérience'
	};

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
	let errorMsg = $state<string | null>(null);

	function addInstruction() {
		instructions = [...instructions, ''];
	}

	function removeInstruction(index: number) {
		instructions = instructions.filter((_, i) => i !== index);
	}

	function updateInstruction(index: number, value: string) {
		instructions = instructions.map((inst, i) => i === index ? value : inst);
	}

	async function handleSubmit() {
		if (!nom.trim()) {
			errorMsg = 'Le nom du module est requis';
			return;
		}

		isSaving = true;
		errorMsg = null;

		const newModule = await addModule({
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

		if (newModule) {
			await goto('/admin/modules');
		} else {
			errorMsg = 'Erreur lors de la création du module';
			isSaving = false;
		}
	}
</script>

<div class="max-w-3xl">
	<!-- Header -->
	<div class="flex items-center gap-4 mb-8">
			<a 
			href="/admin/modules"
			class="p-2 rounded-xl glass hover:bg-[var(--color-bg-tertiary)] transition-colors text-(--color-text-muted) hover:text-(--color-text-primary)"
		>
			<ArrowLeft size={20} />
		</a>
		<div>
			<h1 class="text-2xl font-bold text-(--color-text-primary)">
				Nouveau module
			</h1>
			<p class="text-(--color-text-muted) mt-1">
				Créez une nouvelle section de l'expérience
			</p>
		</div>
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
					placeholder="Décrivez le contenu de ce module..."
					rows="3"
					class="w-full px-4 py-3 rounded-xl bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] text-(--color-text-primary) placeholder:text-(--color-text-muted) focus:outline-none focus:border-[var(--magic-turquoise)] transition-colors resize-none"
				></textarea>
			</div>

			<div class="grid sm:grid-cols-2 gap-4">
				<div>
					<label for="type" class="text-sm text-(--color-text-secondary) block mb-2">
						Type de module
					</label>
					<select 
						id="type"
						bind:value={type}
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
						class="w-full px-4 py-3 rounded-xl bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] text-(--color-text-primary) focus:outline-none focus:border-[var(--magic-turquoise)] transition-colors"
					>
						<option value="brouillon">Brouillon</option>
						<option value="actif">Actif</option>
						<option value="archive">Archivé</option>
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

			<div>
				<label for="mediaUrl" class="text-sm text-(--color-text-secondary) block mb-2">
					URL du média (vidéo, image)
				</label>
				<input 
					type="text"
					id="mediaUrl"
					bind:value={mediaUrl}
					placeholder="/videos/intro.mp4"
					class="w-full px-4 py-3 rounded-xl bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] text-(--color-text-primary) placeholder:text-(--color-text-muted) focus:outline-none focus:border-[var(--magic-turquoise)] transition-colors"
				/>
			</div>

			<div>
				<label for="texte" class="text-sm text-(--color-text-secondary) block mb-2">
					Texte / Script
				</label>
				<textarea 
					id="texte"
					bind:value={texte}
					placeholder="Texte à afficher ou script de narration..."
					rows="4"
					class="w-full px-4 py-3 rounded-xl bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] text-(--color-text-primary) placeholder:text-(--color-text-muted) focus:outline-none focus:border-[var(--magic-turquoise)] transition-colors resize-none"
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

		<!-- Actions -->
		<div class="flex items-center justify-end gap-3">
			<a 
				href="/admin/modules"
				class="px-6 py-3 rounded-xl glass text-(--color-text-secondary) hover:text-(--color-text-primary) hover:bg-[var(--color-bg-tertiary)] transition-colors"
			>
				Annuler
			</a>
			<button 
				type="submit"
				disabled={isSaving}
				class="flex items-center gap-2 px-6 py-3 rounded-xl btn-magic text-white font-medium disabled:opacity-50"
			>
				{#if isSaving}
					<div class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
				{:else}
					<Save size={18} />
				{/if}
				{isSaving ? 'Création...' : 'Créer le module'}
			</button>
		</div>
	</form>
</div>
