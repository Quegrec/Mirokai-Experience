<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { ArrowLeft, Gamepad2, Save, Loader2, Trash2, Plus, Users, Cpu } from 'lucide-svelte';
	import HelpTip from '$lib/components/HelpTip.svelte';
	import { miniGames, updateMiniGame, deleteMiniGame } from '$lib/stores/miniGamesStore';
	import type { MiniGameRow, MiniGameType, ModuleStatus, MiniGameUpdate, QuizQuestion } from '$lib/supabase/types';

	let isSaving = $state(false);
	let isDeleting = $state(false);
	let error = $state<string | null>(null);

	// Onglet actif : 'standard' | 'famille' | 'tech'
	let activeQuestionsTab = $state<'standard' | 'famille' | 'tech'>('standard');

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
	let questionsFamille = $state<QuizQuestion[]>([]);
	let questionsTech = $state<QuizQuestion[]>([]);

	const emptyQuestion = (): QuizQuestion => ({
		question: '',
		options: ['', '', '', ''],
		correctIndex: 0
	});

	const normalizeQuestions = (raw: QuizQuestion[] | undefined): QuizQuestion[] => {
		if (!raw?.length) return [emptyQuestion()];
		return raw.map((q) => ({
			question: q.question,
			options: q.options.length === 4 ? q.options : [...q.options, '', '', ''].slice(0, 4),
			correctIndex: q.correctIndex ?? 0
		}));
	};

	$effect(() => {
		if (!currentGame) return;
		nom = currentGame.nom;
		description = currentGame.description ?? '';
		type = currentGame.type;
		status = currentGame.status;
		dureeEstimee = currentGame.duree_estimee;
		points = currentGame.recompense?.points;
		message = currentGame.recompense?.message;
		questions = normalizeQuestions(currentGame.contenu?.questions);
		questionsFamille = normalizeQuestions(currentGame.contenu?.questions_famille);
		questionsTech = normalizeQuestions(currentGame.contenu?.questions_tech);
	});

	function addQuestion(set: 'standard' | 'famille' | 'tech') {
		const q = emptyQuestion();
		if (set === 'standard') questions = [...questions, q];
		else if (set === 'famille') questionsFamille = [...questionsFamille, q];
		else questionsTech = [...questionsTech, q];
	}

	function removeQuestion(set: 'standard' | 'famille' | 'tech', index: number) {
		if (set === 'standard') questions = questions.filter((_, i) => i !== index);
		else if (set === 'famille') questionsFamille = questionsFamille.filter((_, i) => i !== index);
		else questionsTech = questionsTech.filter((_, i) => i !== index);
	}

	async function handleSave() {
		if (!currentGame) return;
		if (!nom.trim()) { error = 'Le nom est requis'; return; }

		isSaving = true;
		error = null;

		const cleanSet = (qs: QuizQuestion[]) =>
			qs
				.map((q) => ({ ...q, options: q.options.map((o) => o.trim()) }))
				.filter((q) => q.question.trim() && q.options.filter(Boolean).length === 4);

		const changes: MiniGameUpdate = {
			nom: nom.trim(),
			description: description.trim(),
			type,
			status,
			duree_estimee: dureeEstimee,
			contenu: {
				...currentGame.contenu,
				questions: cleanSet(questions),
				questions_famille: cleanSet(questionsFamille).length ? cleanSet(questionsFamille) : undefined,
				questions_tech: cleanSet(questionsTech).length ? cleanSet(questionsTech) : undefined
			},
			recompense: { ...currentGame.recompense, points, message }
		};

		const ok = await updateMiniGame(currentGame.id, changes);
		if (ok) goto('/admin/minigames');
		else error = 'Erreur lors de la mise à jour du mini-jeu';
		isSaving = false;
	}

	async function handleDelete() {
		if (!currentGame) return;
		if (!confirm('Supprimer définitivement ce mini-jeu ?')) return;
		isDeleting = true;
		const ok = await deleteMiniGame(currentGame.id);
		isDeleting = false;
		if (ok) goto('/admin/minigames');
		else error = 'Erreur lors de la suppression du mini-jeu';
	}

	// Helper pour rendre le template plus lisible
	function questionsForTab(tab: 'standard' | 'famille' | 'tech'): QuizQuestion[] {
		if (tab === 'standard') return questions;
		if (tab === 'famille') return questionsFamille;
		return questionsTech;
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
				<a href="/admin/minigames" class="p-2 rounded-lg hover:bg-[var(--color-bg-tertiary)] transition-colors">
					<ArrowLeft size={20} class="text-(--color-text-muted)" />
				</a>
				<div>
					<h1 class="text-2xl font-bold text-(--color-text-primary) flex items-center gap-3">
						<Gamepad2 size={28} class="text-(--magic-orange)" />
						Éditer le mini-jeu
					</h1>
					<p class="text-(--color-text-muted) mt-1">Modifiez les informations du mini-jeu quiz et ses questions</p>
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

		<form onsubmit={(e) => { e.preventDefault(); handleSave(); }} class="space-y-6">

			<!-- Infos générales -->
			<div class="glass rounded-xl p-6 space-y-4">
				<h2 class="text-lg font-semibold text-(--color-text-primary)">Informations générales</h2>

				<div class="grid md:grid-cols-2 gap-4">
					<div>
						<label for="nom" class="block text-sm font-medium text-(--color-text-secondary) mb-1.5">Nom du mini-jeu *</label>
						<input id="nom" type="text" bind:value={nom}
							class="w-full px-4 py-2.5 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg text-(--color-text-primary) focus:outline-none focus:border-[var(--magic-turquoise)]" />
					</div>

					<div>
						<label for="status" class="block text-sm font-medium text-(--color-text-secondary) mb-1.5">Statut</label>
						<select id="status" bind:value={status}
							class="w-full px-4 py-2.5 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg text-(--color-text-primary) focus:outline-none focus:border-[var(--magic-turquoise)]">
							<option value="brouillon">Brouillon</option>
							<option value="actif">Actif</option>
							<option value="archive">Archivé</option>
						</select>
					</div>
				</div>

				<div>
					<label for="description" class="block text-sm font-medium text-(--color-text-secondary) mb-1.5">Description</label>
					<textarea id="description" rows="3" bind:value={description}
						class="w-full px-4 py-2.5 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg text-(--color-text-primary) focus:outline-none focus:border-[var(--magic-turquoise)] resize-none"></textarea>
				</div>

				<div class="grid md:grid-cols-2 gap-4">
					<div>
						<label for="duree" class="block text-sm font-medium text-(--color-text-secondary) mb-1.5">Durée estimée (minutes)</label>
						<input id="duree" type="number" min="1" max="30" bind:value={dureeEstimee}
							class="w-full px-4 py-2.5 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg text-(--color-text-primary) focus:outline-none focus:border-[var(--magic-turquoise)]" />
					</div>

					<div>
						<label for="points" class="block text-sm font-medium text-(--color-text-secondary) mb-1.5">Points à gagner (optionnel)</label>
						<input id="points" type="number" min="0" max="100" bind:value={points}
							class="w-full px-4 py-2.5 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg text-(--color-text-primary) focus:outline-none focus:border-[var(--magic-turquoise)]" />
					</div>
				</div>

				<div>
					<label for="message" class="block text-sm font-medium text-(--color-text-secondary) mb-1.5">Message de succès (optionnel)</label>
					<input id="message" type="text" bind:value={message}
						class="w-full px-4 py-2.5 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg text-(--color-text-primary) focus:outline-none focus:border-[var(--magic-turquoise)]" />
				</div>
			</div>

			<!-- Questions du quiz – onglets Standard / Famille / Tech -->
			<div class="glass rounded-xl p-6 space-y-4">
				<div class="flex items-center gap-2">
					<h2 class="text-lg font-semibold text-(--color-text-primary)">Questions du quiz</h2>
					<HelpTip position="right" text="3 onglets disponibles : Standard (fallback), Famille (mode grand public) et Tech (mode expert). Si un onglet est vide, le quiz utilise les questions Standard." />
				</div>
				<p class="text-xs text-(--color-text-muted)">
					Définissez des questions par mode. En l'absence de questions Famille ou Tech, le quiz utilisera les questions Standard.
				</p>

				<!-- Onglets -->
				<div class="flex gap-2 border-b border-(--color-border) overflow-x-auto">
					<button type="button" onclick={() => (activeQuestionsTab = 'standard')}
						class="quiz-tab {activeQuestionsTab === 'standard' ? 'is-active' : ''}">
						📋 Standard
					</button>
					<button type="button" onclick={() => (activeQuestionsTab = 'famille')}
						class="quiz-tab {activeQuestionsTab === 'famille' ? 'is-active' : ''}">
						<Users size={13} class="inline mr-1" />Famille
					</button>
					<button type="button" onclick={() => (activeQuestionsTab = 'tech')}
						class="quiz-tab {activeQuestionsTab === 'tech' ? 'is-active' : ''}">
						<Cpu size={13} class="inline mr-1" />Tech
					</button>
					<div class="ml-auto">
						<button type="button" onclick={() => addQuestion(activeQuestionsTab)}
							class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-(--magic-turquoise)/40 text-(--magic-turquoise) text-xs hover:bg-(--magic-turquoise)/10">
							<Plus size={13} />Ajouter
						</button>
					</div>
				</div>

				<!-- Questions de l'onglet Standard -->
				{#if activeQuestionsTab === 'standard'}
					<div class="space-y-4">
						{#each questions as q, index}
							<div class="rounded-xl border border-(--color-border) bg-[var(--color-bg-tertiary)]/60 p-4 space-y-3">
								<div class="flex items-center justify-between gap-2">
									<h3 class="text-sm font-semibold text-(--color-text-primary)">Question {index + 1}</h3>
									<button type="button" onclick={() => removeQuestion('standard', index)}
										class="text-xs text-red-400 hover:text-red-300 flex items-center gap-1">
										<Trash2 size={12} />Supprimer
									</button>
								</div>
								<div>
									<label class="block text-xs font-medium text-(--color-text-secondary) mb-1.5">Intitulé de la question</label>
									<input type="text" bind:value={questions[index].question}
										class="w-full px-3 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg text-(--color-text-primary) text-sm focus:outline-none focus:border-[var(--magic-turquoise)]" />
								</div>
								<div class="grid md:grid-cols-2 gap-3">
									{#each [0, 1, 2, 3] as optIndex}
										<div class="flex items-start gap-2">
											<input type="radio" name="correct-standard-{index}" value={optIndex}
												checked={q.correctIndex === optIndex}
												onchange={() => (questions[index].correctIndex = optIndex)}
												class="mt-2 h-4 w-4" />
											<div class="flex-1">
												<label class="block text-xs font-medium text-(--color-text-secondary) mb-1">Réponse {optIndex + 1}</label>
												<input type="text" bind:value={questions[index].options[optIndex]}
													class="w-full px-3 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg text-(--color-text-primary) text-sm focus:outline-none focus:border-[var(--magic-turquoise)]" />
											</div>
										</div>
									{/each}
								</div>
							</div>
						{/each}
					</div>
				{/if}

				<!-- Questions de l'onglet Famille -->
				{#if activeQuestionsTab === 'famille'}
					<div class="space-y-4">
						{#each questionsFamille as q, index}
							<div class="rounded-xl border border-(--color-border) bg-[var(--color-bg-tertiary)]/60 p-4 space-y-3">
								<div class="flex items-center justify-between gap-2">
									<h3 class="text-sm font-semibold text-(--color-text-primary)">Question {index + 1}</h3>
									<button type="button" onclick={() => removeQuestion('famille', index)}
										class="text-xs text-red-400 hover:text-red-300 flex items-center gap-1">
										<Trash2 size={12} />Supprimer
									</button>
								</div>
								<div>
									<label class="block text-xs font-medium text-(--color-text-secondary) mb-1.5">Intitulé de la question</label>
									<input type="text" bind:value={questionsFamille[index].question}
										class="w-full px-3 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg text-(--color-text-primary) text-sm focus:outline-none focus:border-[var(--magic-turquoise)]" />
								</div>
								<div class="grid md:grid-cols-2 gap-3">
									{#each [0, 1, 2, 3] as optIndex}
										<div class="flex items-start gap-2">
											<input type="radio" name="correct-famille-{index}" value={optIndex}
												checked={q.correctIndex === optIndex}
												onchange={() => (questionsFamille[index].correctIndex = optIndex)}
												class="mt-2 h-4 w-4" />
											<div class="flex-1">
												<label class="block text-xs font-medium text-(--color-text-secondary) mb-1">Réponse {optIndex + 1}</label>
												<input type="text" bind:value={questionsFamille[index].options[optIndex]}
													class="w-full px-3 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg text-(--color-text-primary) text-sm focus:outline-none focus:border-[var(--magic-turquoise)]" />
											</div>
										</div>
									{/each}
								</div>
							</div>
						{/each}
					</div>
				{/if}

				<!-- Questions de l'onglet Tech -->
				{#if activeQuestionsTab === 'tech'}
					<div class="space-y-4">
						{#each questionsTech as q, index}
							<div class="rounded-xl border border-(--color-border) bg-[var(--color-bg-tertiary)]/60 p-4 space-y-3">
								<div class="flex items-center justify-between gap-2">
									<h3 class="text-sm font-semibold text-(--color-text-primary)">Question {index + 1}</h3>
									<button type="button" onclick={() => removeQuestion('tech', index)}
										class="text-xs text-red-400 hover:text-red-300 flex items-center gap-1">
										<Trash2 size={12} />Supprimer
									</button>
								</div>
								<div>
									<label class="block text-xs font-medium text-(--color-text-secondary) mb-1.5">Intitulé de la question</label>
									<input type="text" bind:value={questionsTech[index].question}
										class="w-full px-3 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg text-(--color-text-primary) text-sm focus:outline-none focus:border-[var(--magic-turquoise)]" />
								</div>
								<div class="grid md:grid-cols-2 gap-3">
									{#each [0, 1, 2, 3] as optIndex}
										<div class="flex items-start gap-2">
											<input type="radio" name="correct-tech-{index}" value={optIndex}
												checked={q.correctIndex === optIndex}
												onchange={() => (questionsTech[index].correctIndex = optIndex)}
												class="mt-2 h-4 w-4" />
											<div class="flex-1">
												<label class="block text-xs font-medium text-(--color-text-secondary) mb-1">Réponse {optIndex + 1}</label>
												<input type="text" bind:value={questionsTech[index].options[optIndex]}
													class="w-full px-3 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg text-(--color-text-primary) text-sm focus:outline-none focus:border-[var(--magic-turquoise)]" />
											</div>
										</div>
									{/each}
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>

			<!-- Actions -->
			<div class="flex justify-end gap-3">
				<a href="/admin/minigames"
					class="px-6 py-2.5 rounded-xl text-(--color-text-secondary) hover:bg-[var(--color-bg-tertiary)] transition-colors text-sm">
					Annuler
				</a>
				<button type="submit" disabled={isSaving}
					class="btn-magic flex items-center gap-2 px-6 py-2.5 rounded-xl disabled:opacity-50 text-sm">
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

<style>
	.quiz-tab {
		padding: 0.5rem 0.9rem;
		font-size: 0.8rem;
		font-weight: 600;
		border: none;
		background: none;
		color: var(--color-text-muted);
		cursor: pointer;
		border-bottom: 2px solid transparent;
		transition: color 0.2s, border-color 0.2s;
		margin-bottom: -1px;
	}

	.quiz-tab:hover { color: var(--color-text-primary); }

	.quiz-tab.is-active {
		color: var(--magic-turquoise);
		border-bottom-color: var(--magic-turquoise);
	}
</style>
                                                                                                                                                                                                                                                                                                                                                                                                                                                         