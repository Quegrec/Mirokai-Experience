<script lang="ts">
	import { X, Bot, Users, Zap, Settings } from 'lucide-svelte';
	import { selectedZone, isSidebarOpen, closeSidebar } from '$lib/stores/selectedZone';

	function getStatusColor(status: string): string {
		switch (status) {
			case 'actif':
				return 'bg-green-500';
			case 'maintenance':
				return 'bg-amber-500';
			case 'inactif':
				return 'bg-red-500';
			default:
				return 'bg-gray-500';
		}
	}

	function getStatusLabel(status: string): string {
		switch (status) {
			case 'actif':
				return 'Opérationnel';
			case 'maintenance':
				return 'En maintenance';
			case 'inactif':
				return 'Hors service';
			default:
				return status;
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
	<!-- Overlay -->
	<button
		class="fixed inset-0 bg-black/40 z-40 cursor-default"
		onclick={closeSidebar}
		aria-label="Fermer la sidebar"
		tabindex="-1"
	></button>

	<!-- Sidebar -->
	<aside
		class="sidebar-enter fixed right-0 top-0 h-full w-full max-w-md z-50 glass overflow-hidden flex flex-col"
		role="dialog"
		aria-modal="true"
		aria-labelledby="sidebar-title"
	>
		<!-- Header -->
		<header
			class="p-6 border-b border-[var(--color-border)]"
			style="border-left: 4px solid {$selectedZone.couleur};"
		>
			<div class="flex items-start justify-between">
				<div>
					<h2
						id="sidebar-title"
						class="text-2xl font-bold text-[var(--color-text-primary)] mb-1"
					>
						{$selectedZone.nom}
					</h2>
					<div class="flex items-center gap-2">
						<span class="w-2 h-2 rounded-full {getStatusColor($selectedZone.status)}"></span>
						<span class="text-sm text-[var(--color-text-secondary)]">
							{getStatusLabel($selectedZone.status)}
						</span>
					</div>
				</div>
				<button
					onclick={closeSidebar}
					class="p-2 rounded-lg hover:bg-[var(--color-bg-tertiary)] transition-colors"
					aria-label="Fermer"
				>
					<X size={20} class="text-[var(--color-text-secondary)]" />
				</button>
			</div>
		</header>

		<!-- Content -->
		<div class="flex-1 overflow-y-auto p-6 space-y-6">
			<!-- Description -->
			<section>
				<h3 class="text-sm font-medium text-[var(--color-text-muted)] uppercase tracking-wider mb-2">
					Description
				</h3>
				<p class="text-[var(--color-text-secondary)] leading-relaxed">
					{$selectedZone.description}
				</p>
			</section>

			<!-- Stats -->
			<section class="grid grid-cols-2 gap-4">
				{#if $selectedZone.capacite}
					<div class="glass rounded-lg p-4">
						<div class="flex items-center gap-2 mb-1">
							<Users size={16} class="text-[var(--color-accent)]" />
							<span class="text-xs text-[var(--color-text-muted)] uppercase">Capacité</span>
						</div>
						<span class="text-2xl font-bold text-[var(--color-text-primary)]">
							{$selectedZone.capacite}
						</span>
					</div>
				{/if}

				<div class="glass rounded-lg p-4">
					<div class="flex items-center gap-2 mb-1">
						<Bot size={16} class="text-[var(--color-accent)]" />
						<span class="text-xs text-[var(--color-text-muted)] uppercase">Robots</span>
					</div>
					<span class="text-2xl font-bold text-[var(--color-text-primary)]">
						{$selectedZone.robots?.length ?? 0}
					</span>
				</div>
			</section>

			<!-- Robots list -->
			{#if $selectedZone.robots && $selectedZone.robots.length > 0}
				<section>
					<h3 class="text-sm font-medium text-[var(--color-text-muted)] uppercase tracking-wider mb-3">
						Robots présents
					</h3>
					<ul class="space-y-2">
						{#each $selectedZone.robots as robot}
							<li class="flex items-center gap-3 p-3 rounded-lg bg-[var(--color-bg-tertiary)]">
								<div class="w-8 h-8 rounded-full bg-[var(--color-accent)]/20 flex items-center justify-center">
									<Bot size={16} class="text-[var(--color-accent)]" />
								</div>
								<span class="text-[var(--color-text-primary)] font-medium">{robot}</span>
								<span class="ml-auto w-2 h-2 rounded-full bg-green-500"></span>
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
					class="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-[var(--color-accent)] text-[var(--color-bg-primary)] font-medium hover:bg-[var(--color-accent-dim)] transition-colors"
				>
					<Zap size={18} />
					Voir activité
				</button>
				<button
					class="px-4 py-3 rounded-lg border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] transition-colors"
				>
					<Settings size={18} />
				</button>
			</div>
		</footer>
	</aside>
{/if}
