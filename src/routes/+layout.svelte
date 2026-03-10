<script lang="ts">
	import '../app.css';
	import { Sparkles, Settings } from 'lucide-svelte';
	import Sidebar from '$lib/components/Sidebar.svelte';

	let { children } = $props();
</script>

<svelte:head>
	<title>Enchanted Tools — Forêt Magique</title>
	<meta name="description" content="Application de monitoring éco-conçue pour le centre robotique Enchanted Tools" />
	<meta name="viewport" content="width=device-width, initial-scale=1" />
	<meta name="theme-color" content="#0d1117" />
</svelte:head>

<div class="min-h-screen flex flex-col relative">
	<!-- Particules décoratives (forêt enchantée) -->
	<div class="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
		<div class="particle particle-1"></div>
		<div class="particle particle-2"></div>
		<div class="particle particle-3"></div>
		<div class="particle particle-4"></div>
	</div>

	<!-- Header -->
	<header class="relative z-10 border-b border-[var(--color-border)] px-6 py-4 glass">
		<div class="flex items-center justify-between max-w-7xl mx-auto">
			<div class="flex items-center gap-3">
				<!-- Logo inspiré forêt magique -->
				<div class="logo-container relative">
					<div class="w-11 h-11 rounded-2xl bg-gradient-to-br from-[var(--magic-turquoise)] via-[var(--magic-purple)] to-[var(--magic-magenta)] flex items-center justify-center shadow-lg">
						<Sparkles size={22} class="text-white drop-shadow-lg" />
					</div>
					<div class="absolute -inset-1 rounded-2xl bg-gradient-to-br from-[var(--magic-turquoise)] to-[var(--magic-magenta)] opacity-30 blur-md -z-10"></div>
				</div>
				<div>
					<h1 class="text-lg font-bold text-[var(--color-text-primary)] tracking-tight">
						Enchanted Tools
					</h1>
					<p class="text-xs text-[var(--magic-turquoise)]">
						✦ Centre robotique enchanté
					</p>
				</div>
			</div>

			<div class="flex items-center gap-3">
				<!-- Lien Admin -->
				<a 
					href="/admin"
					class="flex items-center gap-2 px-3 py-2 rounded-xl glass hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)] hover:text-[var(--magic-purple)] transition-colors"
				>
					<Settings size={16} />
					<span class="text-xs font-medium hidden sm:inline">Admin</span>
				</a>
				<!-- Status magique -->
				<span class="flex items-center gap-2 px-4 py-2 rounded-full glass-turquoise">
					<span class="w-2 h-2 rounded-full bg-[var(--magic-turquoise)] glow-pulse shadow-[var(--glow-turquoise)]"></span>
					<span class="text-xs text-[var(--magic-turquoise)] font-medium">Forêt active</span>
				</span>
			</div>
		</div>
	</header>

	<!-- Main content -->
	<main class="flex-1 max-w-7xl mx-auto w-full p-6 relative z-10">
		{@render children()}
	</main>

	<!-- Footer enchanté -->
	<footer class="relative z-10 border-t border-[var(--color-border)] px-6 py-4">
		<div class="max-w-7xl mx-auto flex items-center justify-between text-xs text-[var(--color-text-muted)]">
			<span class="flex items-center gap-2">
				<span class="text-[var(--magic-purple)]">✦</span>
				© 2026 Enchanted Tools
			</span>
			<span class="flex items-center gap-2">
				<span class="w-1.5 h-1.5 rounded-full bg-[var(--magic-turquoise)] shadow-[var(--glow-turquoise)]"></span>
				<span class="bg-gradient-to-r from-[var(--magic-turquoise)] to-[var(--magic-purple)] bg-clip-text text-transparent font-medium">
					Mode Forêt Enchantée
				</span>
			</span>
		</div>
	</footer>
</div>

<!-- Sidebar globale -->
<Sidebar />

<style>
	/* Particules bioluminescentes flottantes */
	.particle {
		position: absolute;
		border-radius: 50%;
		pointer-events: none;
		opacity: 0.4;
	}
	
	.particle-1 {
		width: 300px;
		height: 300px;
		background: radial-gradient(circle, var(--magic-turquoise) 0%, transparent 70%);
		top: 10%;
		left: -5%;
		animation: float1 20s ease-in-out infinite;
	}
	
	.particle-2 {
		width: 200px;
		height: 200px;
		background: radial-gradient(circle, var(--magic-magenta) 0%, transparent 70%);
		top: 60%;
		right: -3%;
		animation: float2 25s ease-in-out infinite;
	}
	
	.particle-3 {
		width: 150px;
		height: 150px;
		background: radial-gradient(circle, var(--magic-purple) 0%, transparent 70%);
		bottom: 20%;
		left: 20%;
		animation: float3 18s ease-in-out infinite;
	}
	
	.particle-4 {
		width: 100px;
		height: 100px;
		background: radial-gradient(circle, var(--magic-orange) 0%, transparent 70%);
		top: 30%;
		right: 25%;
		animation: float1 22s ease-in-out infinite reverse;
		opacity: 0.25;
	}
	
	@keyframes float1 {
		0%, 100% { transform: translate(0, 0) scale(1); }
		33% { transform: translate(30px, -20px) scale(1.1); }
		66% { transform: translate(-20px, 20px) scale(0.95); }
	}
	
	@keyframes float2 {
		0%, 100% { transform: translate(0, 0) scale(1); }
		50% { transform: translate(-40px, 30px) scale(1.15); }
	}
	
	@keyframes float3 {
		0%, 100% { transform: translate(0, 0); }
		25% { transform: translate(20px, -30px); }
		50% { transform: translate(-10px, -50px); }
		75% { transform: translate(-30px, -20px); }
	}
	
	@media (prefers-reduced-motion: reduce) {
		.particle {
			animation: none;
		}
	}
</style>
