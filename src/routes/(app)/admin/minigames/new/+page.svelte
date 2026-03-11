<script lang="ts">
	import { goto } from '$app/navigation';
	import { ArrowLeft, Gamepad2, Save, Loader2 } from 'lucide-svelte';
	import { addMiniGame, miniGameTypeLabels } from '$lib/stores/miniGamesStore';
	import { modules } from '$lib/stores/modulesStore';
	import type { MiniGameType, ModuleStatus, MiniGameInsert } from '$lib/supabase/types';

	let isSaving = $state(false);
	let error = $state<string | null>(null);

	// Formulaire
	let nom = $state('');
	let description = $state('');
	let type = $state<MiniGameType>('quiz_flash');
	let status = $state<ModuleStatus>('brouillon');
	let afterModuleId = $state<string | null>(null);
	let dureeEstimee = $state(2);
	let points = $state(10);
	let message = $state('Bravo !');

	// Modules actifs pour le sélecteur
	const activeModules = $derived(
		$modules
			.filter(m => m.status === 'actif')
			.sort((a, b) => a.ordre - b.ordre)
	);

	async function handleSubmit() {
		if (!nom.trim()) {
			error = 'Le nom est requis';
			return;
		}

		isSaving = true;
		error = null;

		const gameData: MiniGameInsert = {
			nom: nom.trim(),
			description: description.trim(),
			type,
			status,
			after_module_id: afterModuleId,
			duree_estimee: dureeEstimee,
			contenu: {},
			recompense: {
				points,
				message
			}
		};

		const result = await addMiniGame(gameData);

		if (result) {
			goto('/admin/minigames');
		} else {
			error = 'Erreur lors de la création du mini-jeu';
		}

		isSaving = false;
	}
</script>

<div class="max-w-2xl mx-auto space-y-6">
	<!-- Header -->
	<div class="flex items-center gap-4">
		<a 
			href="/admin/minigames" 
			class="p-2 rounded-lg hover:bg-[var(--color-bg-tertiary)] transition-colors"
		>
			<ArrowLeft size={20} class="text-[var(--color-text-muted)]" />
		</a>
		<div>
			<h1 class="text-2xl font-bold text-[var(--color-text-primary)] flex items-center gap-3">
				<Gamepad2 size={28} class="text-[var(--magic-orange)]" />
				Nouveau mini-jeu
			</h1>
			<p class="text-[var(--color-text-muted)] mt-1">
				Créez un mini-jeu à intercaler entre les modules
			</p>
		</div>
	</div>

	{#if error}
		<div class="glass rounded-xl p-4 border-red-500/30 bg-red-500/10">
			<p class="text-red-400 text-sm">{error}</p>
		</div>
	{/if}

	<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="space-y-6">
		<!-- Informations de base -->
		<div class="glass rounded-xl p-6 space-y-4">
			<h2 class="text-lg font-semibold text-[var(--color-text-primary)]">
				Informations générales
			</h2>

			<div>
				<label for="nom" class="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
					Nom du mini-jeu *
				</label>
				<input 
					type="text" 
					id="nom"
					bind:value={nom}
					placeholder="Ex: Quiz Express Mirokaï"
					class="w-full px-4 py-2.5 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--magic-turquoise)]"
				/>
			</div>

			<div>
				<label for="description" class="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
					Description
				</label>
				<textarea 
					id="description"
					bind:value={description}
					placeholder="Décrivez brièvement ce mini-jeu..."
					rows="3"
					class="w-full px-4 py-2.5 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--magic-turquoise)] resize-none"
				></textarea>
			</div>

			<div class="grid grid-cols-2 gap-4">
				<div>
					<label for="type" class="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
						Type de jeu
					</label>
					<select 
						id="type"
						bind:value={type}
						class="w-full px-4 py-2.5 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--magic-turquoise)]"
					>
						{#each Object.entries(miniGameTypeLabels) as [value, label]}
							<option {value}>{label}</option>
						{/each}
					</select>
				</div>

				<div>
					<label for="status" class="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
						Statut
					</label>
					<select 
						id="status"
						bind:value={status}
						class="w-full px-4 py-2.5 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--magic-turquoise)]"
					>
						<option value="brouillon">Brouillon</option>
						<option value="actif">Actif</option>
						<option value="archive">Archivé</option>
					</select>
				</div>
			</div>

			<div>
				<label for="duree" class="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
					Durée estimée (minutes)
				</label>
				<input 
					type="number" 
					id="duree"
					bind:value={dureeEstimee}
					min="1"
					max="30"
					class="w-full px-4 py-2.5 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--magic-turquoise)]"
				/>
			</div>
		</div>

		<!-- Positionnement dans le parcours -->
		<div class="glass rounded-xl p-6 space-y-4">
			<h2 class="text-lg font-semibold text-[var(--color-text-primary)]">
				Position dans le parcours
			</h2>

			<div>
				<label for="afterModule" class="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
					Après quel module ?
				</label>
				<select 
					id="afterModule"
					bind:value={afterModuleId}
					class="w-full px-4 py-2.5 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--magic-turquoise)]"
				>
					<option value={null}>-- Sélectionner un module --</option>
					{#each activeModules as module}
						<option value={module.id}>
							{module.ordre}. {module.nom}
						</option>
					{/each}
				</select>
				<p class="text-xs text-[var(--color-text-muted)] mt-1">
					Le mini-jeu apparaîtra juste après ce module dans le parcours
				</p>
			</div>
		</div>

		<!-- Récompenses -->
		<div class="glass rounded-xl p-6 space-y-4">
			<h2 class="text-lg font-semibold text-[var(--color-text-primary)]">
				Récompense
			</h2>

			<div class="grid grid-cols-2 gap-4">
				<div>
					<label for="points" class="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
						Points à gagner
					</label>
					<input 
						type="number" 
						id="points"
						bind:value={points}
						min="0"
						max="100"
						class="w-full px-4 py-2.5 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--magic-turquoise)]"
					/>
				</div>

				<div>
					<label for="message" class="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
						Message de succès
					</label>
					<input 
						type="text" 
						id="message"
						bind:value={message}
						placeholder="Bravo !"
						class="w-full px-4 py-2.5 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--magic-turquoise)]"
					/>
				</div>
			</div>
		</div>

		<!-- Actions -->
		<div class="flex justify-end gap-3">
			<a 
				href="/admin/minigames"
				class="px-6 py-2.5 rounded-xl text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] transition-colors"
			>
				Annuler
			</a>
			<button 
				type="submit"
				disabled={isSaving}
				class="btn-magic flex items-center gap-2 px-6 py-2.5 rounded-xl disabled:opacity-50"
			>
				{#if isSaving}
					<Loader2 size={18} class="animate-spin" />
					<span>Création...</span>
				{:else}
					<Save size={18} />
					<span>Créer le mini-jeu</span>
				{/if}
			</button>
		</div>
	</form>
</div>
