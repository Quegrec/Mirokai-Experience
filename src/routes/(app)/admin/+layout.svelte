<script lang="ts">
	import { Settings, LayoutGrid, Layers, ArrowLeft, Sparkles, LogOut, Gamepad2, Map, Menu, X } from 'lucide-svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { setSupabaseClient, loadModules } from '$lib/stores/modulesStore';
	import { setMiniGameSupabaseClient, loadMiniGames } from '$lib/stores/miniGamesStore';
	import PWAInstall from '$lib/components/PWAInstall.svelte';

	let { children, data } = $props();

	// État du menu mobile
	let sidebarOpen = $state(false);

	const navItems = [
		{ href: '/admin', label: 'Vue d\'ensemble', icon: LayoutGrid },
		{ href: '/admin/modules', label: 'Modules', icon: Layers },
		{ href: '/admin/minigames', label: 'Mini-jeux', icon: Gamepad2 },
		{ href: '/admin/map-editor', label: 'Éditeur de carte', icon: Map },
		{ href: '/admin/settings', label: 'Paramètres', icon: Settings }
	];

	// Vérification de l'authentification côté client
	$effect(() => {
		if (browser && !data.user) {
			goto('/admin/login');
		}
	});

	// Fermer le menu quand on change de page
	$effect(() => {
		$page.url.pathname;
		sidebarOpen = false;
	});

	// Initialiser Supabase et charger les modules et mini-jeux
	onMount(() => {
		if (data.supabase && data.user) {
			setSupabaseClient(data.supabase);
			setMiniGameSupabaseClient(data.supabase);
			loadModules();
			loadMiniGames();
		}
	});

	function toggleSidebar() {
		sidebarOpen = !sidebarOpen;
	}

	function closeSidebar() {
		sidebarOpen = false;
	}
</script>

<svelte:head>
	<link rel="manifest" href="/manifest.json" />
	<meta name="theme-color" content="#9e63a5" />
	<meta name="apple-mobile-web-app-capable" content="yes" />
	<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
	<meta name="apple-mobile-web-app-title" content="Mirokai Admin" />
	<link rel="apple-touch-icon" href="/icons/icon-192.svg" />
</svelte:head>

<PWAInstall />

{#if data.user}
	<div class="admin-layout">

		<!-- FAB mobile : ouvre la sidebar -->
		<button class="mobile-fab" onclick={toggleSidebar} aria-label="Menu">
			<Menu size={22} />
		</button>

		<!-- Overlay pour fermer le menu -->
		{#if sidebarOpen}
			<div
				class="sidebar-overlay"
				onclick={closeSidebar}
				role="button"
				tabindex="-1"
				aria-label="Fermer le menu"
			></div>
		{/if}

		<!-- Sidebar Admin -->
		<aside class="sidebar" class:open={sidebarOpen}>
			<div class="sidebar-content">
				<div class="sidebar-brand">
					<div class="brand-icon">
						<Sparkles size={20} class="text-white" />
					</div>
					<div>
						<h1 class="font-bold text-(--color-text-primary)">Mirokaï</h1>
						<p class="text-xs text-(--color-text-muted)">Interface admin</p>
					</div>
					<!-- Fermer sidebar (mobile) -->
					<button class="close-sidebar" onclick={closeSidebar}>
						<X size={18} />
					</button>
				</div>

				<nav class="sidebar-nav">
					<a href="/" class="nav-item nav-item--back">
						<ArrowLeft size={18} />
						Retour à l'app
					</a>

					{#each navItems as item}
						{@const isActive = $page.url.pathname === item.href ||
							(item.href !== '/admin' && $page.url.pathname.startsWith(item.href))}
						<a href={item.href} class="nav-item" class:active={isActive}>
							<item.icon size={18} />
							{item.label}
						</a>
					{/each}

					<form method="POST" action="/api/auth/logout" class="mt-auto">
						<button type="submit" class="nav-item nav-item--logout w-full text-left">
							<LogOut size={18} />
							Se déconnecter
						</button>
					</form>
				</nav>
			</div>
		</aside>

		<!-- Contenu principal -->
		<main class="admin-main">
			<div class="main-content">
				{@render children()}
			</div>
		</main>
	</div>
{:else}
	<!-- Loader pendant la redirection -->
	<div class="min-h-screen flex items-center justify-center">
		<div class="w-8 h-8 border-2 border-[var(--magic-turquoise)]/30 border-t-[var(--magic-turquoise)] rounded-full animate-spin"></div>
	</div>
{/if}

<style>
	/* ========================================
	   MOBILE FIRST
	   ======================================== */

	.admin-layout {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
	}

	/* FAB mobile – bouton flottant pour ouvrir la sidebar */
	.mobile-fab {
		display: flex;
		position: fixed;
		bottom: 1.25rem;
		right: 1.25rem;
		z-index: 80;
		width: 48px;
		height: 48px;
		border-radius: 50%;
		background: linear-gradient(135deg, var(--magic-purple), var(--magic-magenta));
		border: none;
		color: #fff;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		box-shadow: 0 4px 16px rgba(158, 99, 165, 0.5);
		transition: transform 0.2s, box-shadow 0.2s;
	}

	.mobile-fab:hover {
		transform: scale(1.08);
		box-shadow: 0 6px 22px rgba(158, 99, 165, 0.65);
	}

	/* Overlay */
	.sidebar-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		z-index: 90;
		animation: fadeIn 0.2s ease;
	}

	@keyframes fadeIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	/* Sidebar */
	.sidebar {
		position: fixed;
		top: 0;
		left: 0;
		bottom: 0;
		width: 280px;
		background: var(--color-bg-secondary);
		border-right: 1px solid var(--color-border);
		display: flex;
		flex-direction: column;
		z-index: 100;
		transform: translateX(-100%);
		transition: transform 0.3s ease;
	}

	.sidebar.open {
		transform: translateX(0);
	}

	.close-sidebar {
		margin-left: auto;
		flex-shrink: 0;
		width: 32px;
		height: 32px;
		display: none; /* visible uniquement en mobile via media query */
		align-items: center;
		justify-content: center;
		background: none;
		border: none;
		color: var(--color-text-muted);
		cursor: pointer;
		border-radius: 0.5rem;
	}

	.close-sidebar:hover {
		background: var(--color-bg-tertiary);
		color: var(--color-text-primary);
	}

	.sidebar-content {
		flex: 1;
		padding: 1rem;
		overflow-y: auto;
	}

	.sidebar-brand {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 1.5rem;
		padding-bottom: 1rem;
		border-bottom: 1px solid var(--color-border);
	}

	.brand-icon {
		width: 40px;
		height: 40px;
		border-radius: 0.75rem;
		background: linear-gradient(135deg, var(--magic-purple), var(--magic-magenta));
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.sidebar-nav {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.nav-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem;
		border-radius: 0.75rem;
		font-size: 0.9rem;
		color: var(--color-text-secondary);
		transition: all 0.2s ease;
	}

	.nav-item:hover {
		background: var(--color-bg-tertiary);
		color: var(--color-text-primary);
	}

	.nav-item.active {
		background: linear-gradient(135deg, rgba(158, 99, 165, 0.2), rgba(163, 51, 124, 0.1));
		color: var(--magic-turquoise);
		border: 1px solid rgba(158, 99, 165, 0.3);
	}

	.nav-item--back {
		color: var(--color-text-muted);
		margin-bottom: 0.5rem;
		font-size: 0.85rem;
	}

	.nav-item--logout {
		margin-top: 1rem;
		border-top: 1px solid var(--color-border);
		padding-top: 1rem;
		color: #f87171;
		background: none;
		border-radius: 0;
		border-left: none;
		border-right: none;
		border-bottom: none;
		cursor: pointer;
	}

	.nav-item--logout:hover {
		background: rgba(248, 113, 113, 0.08);
		color: #f87171;
		border-radius: 0.75rem;
	}

	/* Main content */
	.admin-main {
		flex: 1;
		overflow-x: hidden;
	}

	.main-content {
		padding: 1rem;
		max-width: 100%;
		overflow-x: hidden;
	}

	/* ========================================
	   DESKTOP - Sidebar fixe
	   ======================================== */
	
	/* Sur mobile : afficher le bouton X dans la sidebar */
	@media (max-width: 1023px) {
		.close-sidebar {
			display: flex;
		}
	}

	@media (min-width: 1024px) {
		.admin-layout {
			flex-direction: row;
		}

		/* Masquer le FAB sur desktop */
		.mobile-fab {
			display: none;
		}

		.sidebar-overlay {
			display: none;
		}

		.sidebar {
			position: relative;
			transform: translateX(0);
			width: 260px;
			flex-shrink: 0;
		}

		.admin-main {
			flex: 1;
			overflow: auto;
		}

		.main-content {
			padding: 2rem;
		}
	}
</style>
