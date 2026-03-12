<script lang="ts">
	import { Settings, LayoutGrid, Layers, ArrowLeft, Sparkles, LogOut, User, Gamepad2, Map, Menu, X } from 'lucide-svelte';
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
		<!-- Mobile Header -->
		<header class="mobile-header">
			<button class="menu-toggle" onclick={toggleSidebar}>
				<Menu size={24} />
			</button>
			<div class="mobile-title">
			<Sparkles size={18} class="text-(--magic-turquoise)" />
				<span>Admin</span>
			</div>
			<a href="/" class="back-link">
				<ArrowLeft size={20} />
			</a>
		</header>

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
			<div class="sidebar-header">
				<a href="/" class="flex items-center gap-2 text-sm text-(--color-text-muted) hover:text-(--magic-turquoise) transition-colors group">
					<ArrowLeft size={16} class="group-hover:-translate-x-1 transition-transform" />
					Retour à l'app
				</a>
				<button class="close-sidebar" onclick={closeSidebar}>
					<X size={20} />
				</button>
			</div>
			
			<div class="sidebar-content">
				<div class="sidebar-brand">
					<div class="brand-icon">
						<Sparkles size={20} class="text-white" />
					</div>
					<div>
						<h1 class="font-bold text-(--color-text-primary)">Admin</h1>
						<p class="text-xs text-(--color-text-muted)">Gestion des modules</p>
					</div>
				</div>
				
				<nav class="sidebar-nav">
					{#each navItems as item}
						{@const isActive = $page.url.pathname === item.href || 
							(item.href !== '/admin' && $page.url.pathname.startsWith(item.href))}
						<a 
							href={item.href}
							class="nav-item"
							class:active={isActive}
						>
							<item.icon size={18} />
							{item.label}
						</a>
					{/each}
				</nav>
			</div>
			
			<!-- Utilisateur connecté et déconnexion -->
			<div class="sidebar-footer">
				<div class="user-info">
					<div class="user-avatar">
						<User size={14} class="text-white" />
					</div>
					<div class="user-details">
						<p class="user-email">{data.user.email}</p>
						<p class="user-role">Admin</p>
					</div>
				</div>

				<form method="POST" action="/api/auth/logout">
					<button type="submit" class="logout-btn">
						<LogOut size={18} />
						<span>Se déconnecter</span>
					</button>
				</form>
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

	/* Mobile Header */
	.mobile-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem 1rem;
		background: var(--color-bg-secondary);
		border-bottom: 1px solid var(--color-border);
		position: sticky;
		top: 0;
		z-index: 50;
	}

	.menu-toggle {
		width: 40px;
		height: 40px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: none;
		border: none;
		color: var(--color-text-primary);
		cursor: pointer;
		border-radius: 0.5rem;
	}

	.menu-toggle:hover {
		background: var(--color-bg-tertiary);
	}

	.mobile-title {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-weight: 600;
		color: var(--color-text-primary);
	}

	.back-link {
		width: 40px;
		height: 40px;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--color-text-muted);
		border-radius: 0.5rem;
	}

	.back-link:hover {
		color: var(--magic-turquoise);
		background: var(--color-bg-tertiary);
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

	.sidebar-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem;
		border-bottom: 1px solid var(--color-border);
	}

	.close-sidebar {
		width: 36px;
		height: 36px;
		display: flex;
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

	.sidebar-footer {
		padding: 1rem;
		border-top: 1px solid var(--color-border);
	}

	.user-info {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.5rem;
		margin-bottom: 0.75rem;
	}

	.user-avatar {
		width: 32px;
		height: 32px;
		border-radius: 50%;
		background: linear-gradient(135deg, var(--magic-turquoise), var(--magic-purple));
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.user-details {
		flex: 1;
		min-width: 0;
	}

	.user-email {
		font-size: 0.75rem;
		color: var(--color-text-primary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.user-role {
		font-size: 0.65rem;
		color: var(--color-text-muted);
	}

	.logout-btn {
		width: 100%;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem;
		border-radius: 0.75rem;
		font-size: 0.875rem;
		color: #f87171;
		background: none;
		border: none;
		cursor: pointer;
		transition: background 0.2s ease;
	}

	.logout-btn:hover {
		background: rgba(248, 113, 113, 0.1);
	}

	/* Main content */
	.admin-main {
		flex: 1;
		overflow-x: hidden;
	}

	.main-content {
		padding: 1rem;
	}

	/* ========================================
	   DESKTOP - Sidebar fixe
	   ======================================== */
	
	@media (min-width: 1024px) {
		.admin-layout {
			flex-direction: row;
		}

		.mobile-header {
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

		.close-sidebar {
			display: none;
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
