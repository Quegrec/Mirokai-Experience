<script lang="ts">
	import { ArrowLeft, Map, Save, Loader2 } from 'lucide-svelte';
	import ModuleMapEditor from '$lib/components/ModuleMapEditor.svelte';
	import { modules, updateModule, isLoading } from '$lib/stores/modulesStore';
	import type { ModulePosition } from '$lib/supabase/types';

	let saving = $state(false);
	let saveMessage = $state<string | null>(null);

	async function handlePositionChange(moduleId: string, position: ModulePosition | null) {
		saving = true;
		saveMessage = null;

		const success = await updateModule(moduleId, { position });
		
		if (success) {
			saveMessage = 'Position sauvegardée';
			setTimeout(() => saveMessage = null, 2000);
		} else {
			saveMessage = 'Erreur de sauvegarde';
		}
		
		saving = false;
	}
</script>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-4">
			<a 
				href="/admin/modules"
				class="p-2 rounded-xl glass hover:bg-[var(--color-bg-tertiary)] transition-colors text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
			>
				<ArrowLeft size={20} />
			</a>
			<div>
				<h1 class="text-2xl font-bold text-[var(--color-text-primary)] flex items-center gap-3">
					<Map size={24} class="text-[var(--magic-turquoise)]" />
					Placer les modules sur la carte
				</h1>
				<p class="text-[var(--color-text-muted)] mt-1">
					Glissez-déposez les modules pour définir leur position
				</p>
			</div>
		</div>

		<div class="flex items-center gap-3">
			{#if saving}
				<span class="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
					<Loader2 size={16} class="animate-spin" />
					Sauvegarde...
				</span>
			{:else if saveMessage}
				<span class="flex items-center gap-2 text-sm text-[var(--magic-turquoise)]">
					<Save size={16} />
					{saveMessage}
				</span>
			{/if}
		</div>
	</div>

	<!-- Éditeur de carte -->
	{#if $isLoading}
		<div class="flex items-center justify-center py-20">
			<Loader2 size={32} class="animate-spin text-[var(--magic-turquoise)]" />
		</div>
	{:else}
		<ModuleMapEditor 
			modules={$modules} 
			onPositionChange={handlePositionChange} 
		/>
	{/if}

	<!-- Instructions -->
	<div class="glass rounded-xl p-4">
		<h3 class="text-sm font-semibold text-[var(--color-text-primary)] mb-2">Instructions</h3>
		<ul class="text-xs text-[var(--color-text-muted)] space-y-1">
			<li>• <strong>Placer un module</strong> : Glissez-le depuis le panneau de gauche vers la carte</li>
			<li>• <strong>Déplacer un module</strong> : Cliquez et faites glisser le marqueur sur la carte</li>
			<li>• <strong>Retirer un module</strong> : Survolez le marqueur et cliquez sur la croix rouge</li>
			<li>• Les positions sont sauvegardées automatiquement</li>
		</ul>
	</div>
</div>
