<script lang="ts">
	import { X, Bot, Users, Sparkles, Settings } from 'lucide-svelte';
	import { selectedZone, isSidebarOpen, closeSidebar } from '$lib/stores/selectedZone';

	function getStatusColor(status: string): string {
		switch (status) {
			case 'actif':
				return 'bg-[var(--magic-turquoise)]';
			case 'maintenance':
				return 'bg-[var(--magic-orange)]';
			case 'inactif':
				return 'bg-[var(--magic-magenta)]';
			default:
				return 'bg-gray-500';
		}
	}

	function getStatusLabel(status: string): string {
		switch (status) {
			case 'actif':
				return '✦ Éveillé';
			case 'maintenance':
				return '◐ En sommeil';
			case 'inactif':
				return '○ Dormant';
			default:
				return status;
		}
	}

	function getStatusGlow(status: string): string {
		switch (status) {
			case 'actif':
				return 'shadow-[var(--glow-turquoise)]';
			case 'maintenance':
				return 'shadow-[var(--glow-orange)]';
			case 'inactif':
				return 'shadow-[var(--glow-magenta)]';
			default:
				return '';
		}
	}

	function handleKeyDown(event: KeyboardEvent): void {
		if (event.key === 'Escape') {
			closeSidebar();
		}
	}
</script>

<svelte:window onkeydown={handleKeyDown} />

{#if $isSidebarOpen && $selectedZone}
	<!-- Overlay avec effet de brume -->
	<button
		class="fixed inset-0 z-40 cursor-default"
		style="background: radial-gradient(ellipse at 70% 50%, rgba(163, 51, 124, 0.15) 0%, rgba(0, 0, 0, 0.6) 100%);"
		onclick={closeSidebar}
		aria-label="Fermer la sidebar"
		tabindex="-1"
	></button>

	<!-- Sidebar enchantée -->
	<aside
		class="sidebar-enter fixed right-0 top-0 h-full w-full max-w-md z-50 glass overflow-hidden flex flex-col"
		style="border-left: 2px solid rgba(14, 170, 146, 0.3);"
		role="dialog"
		aria-modal="true"
		aria-labelledby="sidebar-title"
	>
		<!-- Header avec accent gradient -->
		<header class="relative p-6 border-b border-[var(--color-border)] overflow-hidden">
			<!-- Gradient de fond subtil -->
			<div 
				class="absolute inset-0 opacity-20"
				style="background: linear-gradient(135deg, {$selectedZone.couleur}22 0%, transparent 60%);"
			></div>
			<!-- Barre latérale colorée -->
			<div 
				class="absolute left-0 top-0 bottom-0 w-1"
				style="background: linear-gradient(to bottom, {$selectedZone.couleur}, {$selectedZone.couleur}88);"
			></div>
			
			<div class="relative flex items-start justify-between">
				<div>
					<h2
						id="sidebar-title"
						class="text-2xl font-bold text-[var(--color-text-primary)] mb-2"
					>
						{$selectedZone.nom}
					</h2>
					<div class="flex items-center gap-2">
						<span class="w-2.5 h-2.5 rounded-full {getStatusColor($selectedZone.status)} {getStatusGlow($selectedZone.status)} glow-pulse"></span>
						<span class="text-sm text-[var(--color-text-secondary)] font-medium">
							{getStatusLabel($selectedZone.status)}
						</span>
					</div>
				</div>
				<button
					onclick={closeSidebar}
					class="p-2.5 rounded-xl hover:bg-[var(--color-bg-tertiary)] border border-transparent hover:border-[var(--color-border)] transition-all duration-200"
					aria-label="Fermer"
				>
					<X size={20} class="text-[var(--color-text-secondary)]" />
				</button>
			</div>
		</header>

		<!-- Content -->
		<div class="flex-1 overflow-y-auto p-6 space-y-6">
			<!-- Description -->
			<section class="accent-bar pl-4">
				<h3 class="text-xs font-semibold text-[var(--magic-turquoise)] uppercase tracking-widest mb-2 flex items-center gap-2">
					<span>✦</span> Légende
				</h3>
				<p class="text-[var(--color-text-secondary)] leading-relaxed">
					{$selectedZone.description}
				</p>
			</section>

			<!-- Stats -->
			<section class="grid grid-cols-2 gap-4">
				{#if $selectedZone.capacite}
					<div class="glass glass-turquoise rounded-xl p-4 transition-all duration-200 hover:scale-[1.02]">
						<div class="flex items-center gap-2 mb-2">
							<Users size={16} class="text-[var(--magic-turquoise)]" />
							<span class="text-xs text-[var(--color-text-muted)] uppercase tracking-wide">Capacité</span>
						</div>
						<span class="text-2xl font-bold text-[var(--magic-turquoise)]">
							{$selectedZone.capacite}
						</span>
					</div>
				{/if}

				<div class="glass glass-magenta rounded-xl p-4 transition-all duration-200 hover:scale-[1.02]">
					<div class="flex items-center gap-2 mb-2">
						<Bot size={16} class="text-[var(--magic-magenta)]" />
						<span class="text-xs text-[var(--color-text-muted)] uppercase tracking-wide">Créatures</span>
					</div>
					<span class="text-2xl font-bold text-[var(--magic-magenta)]">
						{$selectedZone.robots?.length ?? 0}
					</span>
				</div>
			</section>

			<!-- Robots list -->
			{#if $selectedZone.robots && $selectedZone.robots.length > 0}
				<section>
					<h3 class="text-xs font-semibold text-[var(--magic-purple)] uppercase tracking-widest mb-3 flex items-center gap-2">
						<span>✦</span> Êtres enchantés
					</h3>
					<ul class="space-y-2">
						{#each $selectedZone.robots as robot, i}
							<li 
								class="flex items-center gap-3 p-3 rounded-xl glass transition-all duration-200 hover:scale-[1.01]"
								style="animation-delay: {i * 50}ms;"
							>
								<div 
									class="w-9 h-9 rounded-xl flex items-center justify-center"
									style="background: linear-gradient(135deg, var(--magic-turquoise)33, var(--magic-purple)33);"
								>
									<Bot size={16} class="text-[var(--magic-turquoise)]" />
								</div>
								<span class="text-[var(--color-text-primary)] font-medium">{robot}</span>
								<span class="ml-auto w-2 h-2 rounded-full bg-[var(--magic-turquoise)] glow-pulse shadow-[var(--glow-turquoise)]"></span>
							</li>
						{/each}
					</ul>
				</section>
			{/if}
		</div>

		<!-- Footer -->
		<footer class="p-6 border-t border-[var(--color-border)]">
			<div class="flex gap-3">
				<button
					class="btn-magic flex-1 flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl font-semibold"
				>
					<Sparkles size={18} />
					Explorer l'activité
				</button>
				<button
					class="px-4 py-3.5 rounded-xl border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] hover:border-[var(--magic-purple)] hover:text-[var(--magic-purple)] transition-all duration-200"
				>
					<Settings size={18} />
				</button>
			</div>
		</footer>
	</aside>
{/if}
