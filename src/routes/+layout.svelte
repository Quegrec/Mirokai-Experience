<script lang="ts">
	import '../app.css';
	import { Bot } from 'lucide-svelte';
	import Sidebar from '$lib/components/Sidebar.svelte';

	let { children } = $props();
</script>

<svelte:head>
	<title>Enchanted Tools — Centre Robotique</title>
	<meta name="description" content="Application de monitoring éco-conçue pour le centre robotique Enchanted Tools" />
	<meta name="viewport" content="width=device-width, initial-scale=1" />
	<meta name="theme-color" content="#0a0a0f" />
</svelte:head>

<div class="min-h-screen bg-[var(--color-bg-primary)] flex flex-col">
	<!-- Header -->
	<header class="border-b border-[var(--color-border)] px-6 py-4">
		<div class="flex items-center justify-between max-w-7xl mx-auto">
			<div class="flex items-center gap-3">
				<div class="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-accent)] to-[var(--zone-mirokai)] flex items-center justify-center">
					<Bot size={22} class="text-white" />
				</div>
				<div>
					<h1 class="text-lg font-bold text-[var(--color-text-primary)] tracking-tight">
						Enchanted Tools
					</h1>
					<p class="text-xs text-[var(--color-text-muted)]">
						Centre de contrôle robotique
					</p>
				</div>
			</div>

			<div class="flex items-center gap-2">
				<span class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
					<span class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
					<span class="text-xs text-green-400 font-medium">Système actif</span>
				</span>
			</div>
		</div>
	</header>

	<!-- Main content -->
	<main class="flex-1 max-w-7xl mx-auto w-full p-6">
		{@render children()}
	</main>

	<!-- Footer éco-conception -->
	<footer class="border-t border-[var(--color-border)] px-6 py-4">
		<div class="max-w-7xl mx-auto flex items-center justify-between text-xs text-[var(--color-text-muted)]">
			<span>© 2026 Enchanted Tools</span>
			<span class="flex items-center gap-1">
				<span class="w-1.5 h-1.5 rounded-full bg-green-500"></span>
				Éco-conçu — Dark Mode activé
			</span>
		</div>
	</footer>
</div>

<!-- Sidebar globale -->
<Sidebar />
