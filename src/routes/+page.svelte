<script lang="ts">
	import InteractiveMap from '$lib/components/InteractiveMap.svelte';
	import { zones } from '$lib/data/zones';
</script>

<div class="space-y-6">
	<!-- Stats rapides -->
	<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
		<div class="glass rounded-xl p-4">
			<p class="text-xs text-[var(--color-text-muted)] uppercase tracking-wider mb-1">Zones</p>
			<p class="text-3xl font-bold text-[var(--color-text-primary)]">{zones.length}</p>
		</div>
		<div class="glass rounded-xl p-4">
			<p class="text-xs text-[var(--color-text-muted)] uppercase tracking-wider mb-1">Actives</p>
			<p class="text-3xl font-bold text-green-400">{zones.filter(z => z.status === 'actif').length}</p>
		</div>
		<div class="glass rounded-xl p-4">
			<p class="text-xs text-[var(--color-text-muted)] uppercase tracking-wider mb-1">Maintenance</p>
			<p class="text-3xl font-bold text-amber-400">{zones.filter(z => z.status === 'maintenance').length}</p>
		</div>
		<div class="glass rounded-xl p-4">
			<p class="text-xs text-[var(--color-text-muted)] uppercase tracking-wider mb-1">Robots</p>
			<p class="text-3xl font-bold text-[var(--color-accent)]">{zones.reduce((acc, z) => acc + (z.robots?.length ?? 0), 0)}</p>
		</div>
	</div>

	<!-- Carte interactive -->
	<div class="glass rounded-2xl overflow-hidden" style="min-height: 600px;">
		<InteractiveMap />
	</div>

	<!-- Instructions -->
	<p class="text-center text-sm text-[var(--color-text-muted)]">
		Cliquez sur une zone pour afficher ses détails
	</p>
</div>
