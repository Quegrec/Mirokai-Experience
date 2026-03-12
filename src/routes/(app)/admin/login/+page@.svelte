<script lang="ts">
	import '../../../../app.css';
	import { goto, invalidate } from '$app/navigation';
	import { Sparkles, Mail, Lock, LogIn, AlertCircle } from 'lucide-svelte';

	let { data } = $props();

	let email = $state('');
	let password = $state('');
	let loading = $state(false);
	let error = $state<string | null>(null);

	async function handleLogin(e: Event) {
		e.preventDefault();
		loading = true;
		error = null;

		const { error: authError } = await data.supabase.auth.signInWithPassword({
			email,
			password
		});

		if (authError) {
			error = authError.message === 'Invalid login credentials' 
				? 'Email ou mot de passe incorrect'
				: authError.message;
			loading = false;
			return;
		}

		await invalidate('supabase:auth');
		goto('/admin');
	}
</script>

<svelte:head>
	<title>Connexion Admin — Enchanted Tools</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center p-6 relative">
	<!-- Particules décoratives -->
	<div class="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
		<div class="absolute w-96 h-96 rounded-full bg-[var(--magic-purple)] opacity-10 blur-3xl -top-20 -left-20"></div>
		<div class="absolute w-96 h-96 rounded-full bg-[var(--magic-turquoise)] opacity-10 blur-3xl -bottom-20 -right-20"></div>
	</div>

	<div class="w-full max-w-md relative z-10">
		<!-- Logo et titre -->
		<div class="text-center mb-8">
			<div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--magic-turquoise)] via-[var(--magic-purple)] to-[var(--magic-magenta)] mb-4 shadow-lg">
				<Sparkles size={32} class="text-white" />
			</div>
			<h1 class="text-2xl font-bold text-(--color-text-primary)">
				Administration
			</h1>
			<p class="text-(--color-text-muted) mt-2">
				Connectez-vous pour gérer les modules
			</p>
		</div>

		<!-- Formulaire -->
		<form onsubmit={handleLogin} class="glass rounded-2xl p-8 space-y-6">
			{#if error}
				<div class="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400">
					<AlertCircle size={20} />
					<p class="text-sm">{error}</p>
				</div>
			{/if}

			<div>
				<label for="email" class="text-sm text-(--color-text-secondary) block mb-2">
					Email
				</label>
				<div class="relative">
					<Mail size={18} class="absolute left-4 top-1/2 -translate-y-1/2 text-(--color-text-muted)" />
					<input 
						type="email"
						id="email"
						bind:value={email}
						placeholder="admin@enchanted.tools"
						required
						class="w-full pl-12 pr-4 py-3 rounded-xl bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] text-(--color-text-primary) placeholder:text-(--color-text-muted) focus:outline-none focus:border-[var(--magic-turquoise)] transition-colors"
					/>
				</div>
			</div>

			<div>
				<label for="password" class="text-sm text-(--color-text-secondary) block mb-2">
					Mot de passe
				</label>
				<div class="relative">
					<Lock size={18} class="absolute left-4 top-1/2 -translate-y-1/2 text-(--color-text-muted)" />
					<input 
						type="password"
						id="password"
						bind:value={password}
						placeholder="••••••••"
						required
						class="w-full pl-12 pr-4 py-3 rounded-xl bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] text-(--color-text-primary) placeholder:text-(--color-text-muted) focus:outline-none focus:border-[var(--magic-turquoise)] transition-colors"
					/>
				</div>
			</div>

			<button 
				type="submit"
				disabled={loading}
				class="w-full flex items-center justify-center gap-2 py-3 rounded-xl btn-magic text-white font-medium disabled:opacity-50"
			>
				{#if loading}
					<div class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
					Connexion...
				{:else}
					<LogIn size={18} />
					Se connecter
				{/if}
			</button>
		</form>

		<!-- Lien retour -->
		<p class="text-center mt-6">
			<a href="/" class="text-sm text-(--color-text-muted) hover:text-(--magic-turquoise) transition-colors">
				← Retour à l'application
			</a>
		</p>
	</div>
</div>
