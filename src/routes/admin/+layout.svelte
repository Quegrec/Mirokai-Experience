<script lang="ts">
	import { Settings, LayoutGrid, Layers, ArrowLeft, Sparkles, LogOut, User } from 'lucide-svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { setSupabaseClient, loadModules } from '$lib/stores/modulesStore';

	let { children, data } = $props();

	const navItems = [
		{ href: '/admin', label: 'Vue d\'ensemble', icon: LayoutGrid },
		{ href: '/admin/modules', label: 'Modules', icon: Layers },
		{ href: '/admin/settings', label: 'Paramètres', icon: Settings }
	];

	// Vérification de l'authentification côté client
	$effect(() => {
		if (browser && !data.user) {
			goto('/admin/login');
		}
	});

	// Initialiser Supabase et charger les modules
	onMount(() => {
		if (data.supabase && data.user) {
			setSupabaseClient(data.supabase);
			loadModules();
		}
	});
</script>

{#if data.user}
	<div class="min-h-screen flex">
		<!-- Sidebar Admin -->
		<aside class="w-64 border-r border-[var(--color-border)] glass flex flex-col">
			<div class="p-4 border-b border-[var(--color-border)]">
				<a href="/" class="flex items-center gap-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--magic-turquoise)] transition-colors group">
					<ArrowLeft size={16} class="group-hover:-translate-x-1 transition-transform" />
					Retour à l'app
				</a>
			</div>
			
			<div class="p-4">
				<div class="flex items-center gap-3 mb-6">
					<div class="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--magic-purple)] to-[var(--magic-magenta)] flex items-center justify-center">
						<Sparkles size={20} class="text-white" />
					</div>
					<div>
						<h1 class="font-bold text-[var(--color-text-primary)]">Admin</h1>
						<p class="text-xs text-[var(--color-text-muted)]">Gestion des modules</p>
					</div>
				</div>
				
				<nav class="space-y-1">
					{#each navItems as item}
						{@const isActive = $page.url.pathname === item.href || 
							(item.href !== '/admin' && $page.url.pathname.startsWith(item.href))}
						<a 
							href={item.href}
							class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200
								{isActive 
									? 'bg-gradient-to-r from-[var(--magic-purple)]/20 to-[var(--magic-magenta)]/10 text-[var(--magic-turquoise)] border border-[var(--magic-purple)]/30' 
									: 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)]'}"
						>
							<item.icon size={18} />
							{item.label}
						</a>
					{/each}
				</nav>
			</div>
			
			<!-- Utilisateur connecté et déconnexion -->
			<div class="mt-auto p-4 border-t border-[var(--color-border)] space-y-3">
				<div class="flex items-center gap-3 px-3 py-2">
					<div class="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--magic-turquoise)] to-[var(--magic-purple)] flex items-center justify-center">
						<User size={14} class="text-white" />
					</div>
					<div class="flex-1 min-w-0">
						<p class="text-xs text-[var(--color-text-primary)] truncate">
							{data.user.email}
						</p>
						<p class="text-xs text-[var(--color-text-muted)]">Admin</p>
					</div>
				</div>

				<!-- Formulaire pour la déconnexion -->
				<form method="POST" action="/api/auth/logout">
					<button 
						type="submit"
						class="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-colors"
					>
						<LogOut size={18} />
						Se déconnecter
					</button>
				</form>
			</div>
		</aside>
		
		<!-- Contenu principal -->
		<main class="flex-1 overflow-auto">
			<div class="p-8">
				{@render children()}
			</div>
		</main>
	</div>
{:else}
	<!-- Afficher un loader pendant la redirection -->
	<div class="min-h-screen flex items-center justify-center">
		<div class="w-8 h-8 border-2 border-[var(--magic-turquoise)]/30 border-t-[var(--magic-turquoise)] rounded-full animate-spin"></div>
	</div>
{/if}
