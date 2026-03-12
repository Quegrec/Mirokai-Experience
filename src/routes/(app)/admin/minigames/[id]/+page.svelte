<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { ArrowLeft, Gamepad2, Save, Loader2, Trash2, Plus } from 'lucide-svelte';
	import { miniGames, updateMiniGame, deleteMiniGame } from '$lib/stores/miniGamesStore';
	import type { MiniGameRow, MiniGameType, ModuleStatus, MiniGameUpdate } from '$lib/supabase/types';

	type QuizQuestion = {
		question: string;
		options: string[];
		correctIndex: number;
	};

	let isSaving = $state(false);
	let isDeleting = $state(false);
	let error = $state<string | null>(null);

	const id = $derived($page.params.id);
	const currentGame = $derived(
		$miniGames.find((g) => g.id === id) as MiniGameRow | undefined
	);

	let nom = $state('');
	let description = $state('');
	let type = $state<MiniGameType>('quiz_flash');
	let status = $state<ModuleStatus>('brouillon');
	let dureeEstimee = $state(2);
	let points = $state<number | undefined>(undefined);
	let message = $state<string | undefined>(undefined);
	let questions = $state<QuizQuestion[]>([]);

	$effect(() => {
		if (!currentGame) return;

		nom = currentGame.nom;
		description = currentGame.description ?? '';
		type = currentGame.type;
		status = currentGame.status;
		dureeEstimee = currentGame.duree_estimee;
		points = currentGame.recompense?.points;
		message = currentGame.recompense?.message;

		if (currentGame.contenu?.questions?.length) {
			questions = currentGame.contenu.questions.map((q) => ({
				question: q.question,
				options: q.options.length === 4 ? q.options : [...q.options, '', '', ''].slice(0, 4),
				correctIndex: q.correctIndex ?? 0
			}));
		} else {
			questions = [
				{
					question: '',
					options: ['', '', '', ''],
					correctIndex: 0
				}
			];
		}
	});

	function addQuestion() {
		questions = [
			...questions,
			{
				question: '',
				options: ['', '', '', ''],
				correctIndex: 0
			}
		];
	}

	function removeQuestion(index: number) {
		if (questions.length === 1) return;
		questions = questions.filter((_, i) => i !== index);
	}

	async function handleSave() {
		if (!currentGame) return;
		if (!nom.trim()) {
			error = 'Le nom est requis';
			return;
		}

		isSaving = true;
		error = null;

		const cleanedQuestions = questions
			.map((q) => ({
				...q,
				options: q.options.map((o) => o.trim())
			}))
			.filter(
				(q) =>
					q.question.trim() &&
					q.options.filter((o) => o).length === 4
			);

		const changes: MiniGameUpdate = {
			nom: nom.trim(),
			description: description.trim(),
			type,
			status,
			duree_estimee: dureeEstimee,
			contenu: cleanedQuestions.length
				? {
						...currentGame.contenu,
						questions: cleanedQuestions
				  }
				: {
						...currentGame.contenu,
						questions: []
				  },
			recompense: {
				...currentGame.recompense,
				points,
				message
			}
		};

		const ok = await updateMiniGame(currentGame.id, changes);

		if (ok) {
			goto('/admin/minigames');
		} else {
			error = 'Erreur lors de la mise à jour du mini-jeu';
		}

		isSaving = false;
	}

	async function handleDelete() {
		if (!currentGame) return;
		if (!confirm('Supprimer définitivement ce mini-jeu ?')) return;

		isDeleting = true;
		const ok = await deleteMiniGame(currentGame.id);
		isDeleting = false;

		if (ok) {
			goto('/admin/minigames');
		} else {
			error = 'Erreur lors de la suppression du mini-jeu';
		}
	}
</script>

{#if !currentGame}
	<div class="flex items-center justify-center py-12">
		<Loader2 size={32} class="animate-spin text-(--magic-turquoise)" />
	</div>
{:else}
	<div class="max-w-4xl mx-auto space-y-6">
		<!-- Header -->
		<div class="flex items-center justify-between gap-4 flex-wrap">
			<div class="flex items-center gap-4">
				<a 
					href="/admin/minigames" 
					class="p-2 rounded-lg hover:bg-[var(--color-bg-tertiary)] transition-colors"
				>
					<ArrowLeft size={20} class="text-(--color-text-muted)" />
				</a>
				<div>
					<h1 class="text-2xl font-bold text-(--color-text-primary) flex items-center gap-3">
						<Gamepad2 size={28} class="text-(--magic-orange)" />
						Éditer le mini-jeu
					</h1>
					<p class="text-(--color-text-muted) mt-1">
						Modifiez les informations du mini-jeu quiz et ses questions
					</p>
				</div>
			</div>

			<button
				type="button"
				onclick={handleDelete}
				disabled={isDeleting}
				class="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-500/40 text-red-400 hover:bg-red-500/10 text-sm disabled:opacity-50"
			>
				{#if isDeleting}
					<Loader2 size={16} class="animate-spin" />
					<span>Suppression...</span>
				{:else}
					<Trash2 size={16} />
					<span>Supprimer</span>
				{/if}
			</button>
		</div>

		{#if error}
			<div class="glass rounded-xl p-4 border-red-500/30 bg-red-500/10">
				<p class="text-red-400 text-sm">{error}</p>
			</div>
		{/if}

		<form
			onsubmit={(e) => {
				e.preventDefault();
				handleSave();
			}}
			class="space-y-6"
		>
			<!-- Infos générales -->
			<div class="glass rounded-xl p-6 space-y-4">
				<h2 class="text-lg font-semibold text-(--color-text-primary)">
					Informations générales
				</h2>

				<div class="grid md:grid-cols-2 gap-4">
					<div>
						<label for="nom" class="block text-sm font-medium text-(--color-text-secondary) mb-1.5">
							Nom du mini-jeu *
						</label>
						<input
							id="nom"
							type="text"
							bind:value={nom}
							class="w-full px-4 py-2.5 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg text-(--color-text-primary) placeholder:text-(--color-text-muted) focus:outline-none focus:border-[var(--magic-turquoise)]"
						/>
					</div>

					<div>
						<label for="status" class="block text-sm font-medium text-(--color-text-secondary) mb-1.5">
							Statut
						</label>
						<select
							id="status"
							bind:value={status}
							class="w-full px-4 py-2.5 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg text-(--color-text-primary) focus:outline-none focus:border-[var(--magic-turquoise)]"
						>
							<option value="brouillon">Brouillon</option>
							<option value="actif">Actif</option>
							<option value="archive">Archivé</option>
						</select>
					</div>
				</div>

				<div>
					<label for="description" class="block text-sm font-medium text-(--color-text-secondary) mb-1.5">
						Description
					</label>
					<textarea
						id="description"
						rows="3"
						bind:value={description}
						class="w-full px-4 py-2.5 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg text-(--color-text-primary) placeholder:text-(--color-text-muted) focus:outline-none focus:border-[var(--magic-turquoise)] resize-none"
					></textarea>
				</div>

				<div class="grid md:grid-cols-2 gap-4">
					<div>
						<label for="duree" class="block text-sm font-medium text-(--color-text-secondary) mb-1.5">
							Durée estimée (minutes)
						</label>
						<input
							id="duree"
							type="number"
							min="1"
							max="30"
							bind:value={dureeEstimee}
							class="w-full px-4 py-2.5 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg text-(--color-text-primary) focus:outline-none focus:border-[var(--magic-turquoise)]"
						/>
					</div>

					<div>
						<label for="points" class="block text-sm font-medium text-(--color-text-secondary) mb-1.5">
							Points à gagner (optionnel)
						</label>
						<input
							id="points"
							type="number"
							min="0"
							max="100"
							bind:value={points}
							class="w-full px-4 py-2.5 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg text-(--color-text-primary) focus:outline-none focus:border-[var(--magic-turquoise)]"
						/>
					</div>
				</div>

				<div>
					<label for="message" class="block text-sm font-medium text-(--color-text-secondary) mb-1.5">
						Message de succès (optionnel)
					</label>
					<input
						id="message"
						type="text"
						bind:value={message}
						class="w-full px-4 py-2.5 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg text-(--color-text-primary) placeholder:text-(--color-text-muted) focus:outline-none focus:border-[var(--magic-turquoise)]"
					/>
				</div>
			</div>

			<!-- Questions du quiz -->
			<div class="glass rounded-xl p-6 space-y-4">
				<div class="flex items-center justify-between gap-2">
					<h2 class="text-lg font-semibold text-(--color-text-primary)">
						Questions du quiz
					</h2>
					<button
						type="button"
						onclick={addQuestion}
						class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-(--magic-turquoise)/40 text-(--magic-turquoise) text-xs hover:bg-(--magic-turquoise)/10"
					>
						<Plus size={14} />
						<span>Ajouter une question</span>
					</button>
				</div>

				<p class="text-xs text-(--color-text-muted)">
					Chaque question doit avoir exactement 4 réponses possibles, avec une seule réponse correcte.
				</p>

				<div class="space-y-4">
					{#each questions as q, index}
						<div class="rounded-xl border border-(--color-border) bg-[var(--color-bg-tertiary)]/60 p-4 space-y-3">
							<div class="flex items-center justify-between gap-2">
								<h3 class="text-sm font-semibold text-(--color-text-primary)">
									Question {index + 1}
								</h3>
								{#if questions.length > 1}
									<button
										type="button"
										onclick={() => removeQuestion(index)}
										class="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
									>
										<Trash2 size={12} />
										Supprimer
									</button>
								{/if}
							</div>

							<div>
								<label class="block text-xs font-medium text-(--color-text-secondary) mb-1.5">
									Intitulé de la question
								</label>
								<input
									type="text"
									bind:value={questions[index].question}
									class="w-full px-3 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg text-(--color-text-primary) text-sm focus:outline-none focus:border-[var(--magic-turquoise)]"
								/>
							</div>

							<div class="grid md:grid-cols-2 gap-3">
								{#each [0, 1, 2, 3] as optIndex}
									<div class="flex items-start gap-2">
										<input
											type="radio"
											name={`correct-${index}`}
											value={optIndex}
											checked={q.correctIndex === optIndex}
											onchange={() => (questions[index].correctIndex = optIndex)}
											class="mt-2 h-4 w-4 text-(--magic-turquoise) border-(--color-border) focus:ring-(--magic-turquoise)"
										/>
										<div class="flex-1">
											<label class="block text-xs font-medium text-(--color-text-secondary) mb-1">
												Réponse {optIndex + 1}
											</label>
											<input
												type="text"
												bind:value={questions[index].options[optIndex]}
												class="w-full px-3 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg text-(--color-text-primary) text-sm focus:outline-none focus:border-[var(--magic-turquoise)]"
											/>
										</div>
									</div>
								{/each}
							</div>
						</div>
					{/each}
				</div>
			</div>

			<!-- Actions -->
			<div class="flex justify-end gap-3">
				<a
					href="/admin/minigames"
					class="px-6 py-2.5 rounded-xl text-(--color-text-secondary) hover:bg-[var(--color-bg-tertiary)] transition-colors text-sm"
				>
					Annuler
				</a>
				<button
					type="submit"
					disabled={isSaving}
					class="btn-magic flex items-center gap-2 px-6 py-2.5 rounded-xl disabled:opacity-50 text-sm"
				>
					{#if isSaving}
						<Loader2 size={18} class="animate-spin" />
						<span>Enregistrement...</span>
					{:else}
						<Save size={18} />
						<span>Enregistrer</span>
					{/if}
				</button>
			</div>
		</form>
	</div>
{/if}

