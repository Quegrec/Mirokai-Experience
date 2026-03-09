<script lang="ts">
	import InteractiveMap from '$lib/components/InteractiveMap.svelte';
	import { zones } from '$lib/data/zones';
	import { Leaf, Sparkles, Wrench, Bot } from 'lucide-svelte';
</script>

<div class="space-y-6">
	<!-- Stats rapides - Style forêt enchantée -->
	<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
		<div class="glass magic-glow rounded-2xl p-5 group transition-all duration-300 hover:scale-[1.02]">
			<div class="flex items-center gap-2 mb-2">
				<Leaf size={16} class="text-[var(--magic-purple)]" />
				<p class="text-xs text-[var(--color-text-muted)] uppercase tracking-wider">Zones</p>
			</div>
			<p class="text-3xl font-bold bg-gradient-to-r from-[var(--magic-purple)] to-[var(--magic-magenta)] bg-clip-text text-transparent">
				{zones.length}
			</p>
		</div>
		<div class="glass glass-turquoise rounded-2xl p-5 group transition-all duration-300 hover:scale-[1.02]">
			<div class="flex items-center gap-2 mb-2">
				<Sparkles size={16} class="text-[var(--magic-turquoise)]" />
				<p class="text-xs text-[var(--color-text-muted)] uppercase tracking-wider">Actives</p>
			</div>
			<p class="text-3xl font-bold text-[var(--magic-turquoise)]">
				{zones.filter(z => z.status === 'actif').length}
			</p>
		</div>
		<div class="glass rounded-2xl p-5 group transition-all duration-300 hover:scale-[1.02]" style="border-color: rgba(240, 152, 3, 0.2);">
			<div class="flex items-center gap-2 mb-2">
				<Wrench size={16} class="text-[var(--magic-orange)]" />
				<p class="text-xs text-[var(--color-text-muted)] uppercase tracking-wider">Maintenance</p>
			</div>
			<p class="text-3xl font-bold text-[var(--magic-orange)]">
				{zones.filter(z => z.status === 'maintenance').length}
			</p>
		</div>
		<div class="glass glass-magenta rounded-2xl p-5 group transition-all duration-300 hover:scale-[1.02]">
			<div class="flex items-center gap-2 mb-2">
				<Bot size={16} class="text-[var(--magic-magenta)]" />
				<p class="text-xs text-[var(--color-text-muted)] uppercase tracking-wider">Robots</p>
			</div>
			<p class="text-3xl font-bold text-[var(--magic-magenta)]">
				{zones.reduce((acc, z) => acc + (z.robots?.length ?? 0), 0)}
			</p>
		</div>
	</div>

	<!-- Carte interactive avec bordure magique -->
	<div class="relative">
		<div class="absolute -inset-0.5 bg-gradient-to-r from-[var(--magic-turquoise)] via-[var(--magic-purple)] to-[var(--magic-magenta)] rounded-2xl opacity-20 blur-sm"></div>
		<div class="relative glass rounded-2xl overflow-hidden" style="min-height: 600px;">
			<InteractiveMap />
		</div>
	</div>

	<!-- Instructions -->
	<p class="text-center text-sm text-[var(--color-text-muted)] flex items-center justify-center gap-2">
		<span class="text-[var(--magic-turquoise)]">✦</span>
		Explorez la forêt — cliquez sur une zone pour révéler ses secrets
		<span class="text-[var(--magic-magenta)]">✦</span>
	</p>
</div>
