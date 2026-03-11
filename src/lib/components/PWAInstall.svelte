<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { Download, X, Sparkles, Monitor, Smartphone } from 'lucide-svelte';

	let deferredPrompt: any = null;
	let showInstallBanner = $state(false);
	let canInstall = $state(false);
	let isInstalled = $state(false);
	let dismissed = $state(false);
	let isIOS = $state(false);
	let isChromium = $state(false);
	let serviceWorkerReady = $state(false);

	onMount(() => {
		if (!browser) return;

		console.log('🚀 PWAInstall: Composant monté');

		// Détecter le type de navigateur
		const ua = navigator.userAgent;
		isIOS = /iPad|iPhone|iPod/.test(ua);
		isChromium = /Chrome|Chromium|Edge/.test(ua) && !/Firefox/.test(ua);
		
		console.log('📱 PWAInstall: iOS =', isIOS, '| Chromium =', isChromium);

		// Vérifier si déjà installé (mode standalone)
		if (window.matchMedia('(display-mode: standalone)').matches) {
			isInstalled = true;
			return;
		}

		// Vérifier si déjà refusé dans cette session
		if (sessionStorage.getItem('pwa-dismissed')) {
			dismissed = true;
		}

		// Écouter l'événement beforeinstallprompt (Chrome/Edge uniquement)
		window.addEventListener('beforeinstallprompt', (e: Event) => {
			e.preventDefault();
			deferredPrompt = e;
			canInstall = true;
			showInstallBanner = !dismissed;
		});

		// Écouter quand l'app est installée
		window.addEventListener('appinstalled', () => {
			isInstalled = true;
			showInstallBanner = false;
			canInstall = false;
			deferredPrompt = null;
		});

		// Enregistrer le service worker
		if ('serviceWorker' in navigator) {
			navigator.serviceWorker.register('/sw.js')
				.then((reg) => {
					console.log('✅ Service Worker enregistré:', reg.scope);
					serviceWorkerReady = true;
					// Sur Chrome/Edge, afficher la bannière même sans beforeinstallprompt après un délai
					if (isChromium && !dismissed && !isInstalled) {
						setTimeout(() => {
							showInstallBanner = true;
						}, 1500);
					}
				})
				.catch((err) => {
					console.error('❌ Erreur Service Worker:', err);
				});
		} else {
			console.log('⚠️ Service Worker non supporté');
		}
	});

	async function installPWA() {
		if (deferredPrompt) {
			deferredPrompt.prompt();
			const { outcome } = await deferredPrompt.userChoice;
			
			if (outcome === 'accepted') {
				console.log('PWA installée');
			}
			
			deferredPrompt = null;
			showInstallBanner = false;
		}
	}

	function dismissBanner() {
		showInstallBanner = false;
		dismissed = true;
		sessionStorage.setItem('pwa-dismissed', 'true');
	}
</script>

{#if showInstallBanner && !isInstalled}
	<div class="pwa-banner">
		<div class="pwa-content">
			<div class="pwa-icon">
				{#if isIOS}
					<Smartphone size={20} />
				{:else}
					<Monitor size={20} />
				{/if}
			</div>
			<div class="pwa-text">
				<p class="pwa-title">Installer l'application</p>
				{#if canInstall}
					<p class="pwa-desc">Accédez rapidement à l'admin depuis votre écran d'accueil</p>
				{:else if isIOS}
					<p class="pwa-desc">Appuyez sur <strong>Partager</strong> puis <strong>Sur l'écran d'accueil</strong></p>
				{:else if isChromium}
					<p class="pwa-desc">Cliquez sur l'icône <strong>⊕</strong> dans la barre d'adresse</p>
				{:else}
					<p class="pwa-desc">Utilisez Chrome ou Edge pour installer l'app</p>
				{/if}
			</div>
		</div>
		<div class="pwa-actions">
			{#if canInstall}
				<button class="pwa-install" onclick={installPWA}>
					<Download size={16} />
					Installer
				</button>
			{/if}
			<button class="pwa-dismiss" onclick={dismissBanner}>
				<X size={18} />
			</button>
		</div>
	</div>
{/if}

{#if isInstalled}
	<div class="pwa-installed-badge">
		<Sparkles size={14} />
		<span>App installée</span>
	</div>
{/if}

<style>
	.pwa-banner {
		position: fixed;
		bottom: 1rem;
		left: 1rem;
		right: 1rem;
		background: linear-gradient(135deg, rgba(158, 99, 165, 0.95), rgba(163, 51, 124, 0.95));
		backdrop-filter: blur(10px);
		border-radius: 1rem;
		padding: 1rem;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
		z-index: 1000;
		animation: slideUp 0.3s ease;
	}

	@keyframes slideUp {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.pwa-content {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex: 1;
		min-width: 0;
	}

	.pwa-icon {
		width: 40px;
		height: 40px;
		border-radius: 0.75rem;
		background: rgba(255, 255, 255, 0.2);
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		flex-shrink: 0;
	}

	.pwa-text {
		min-width: 0;
	}

	.pwa-title {
		font-weight: 600;
		color: white;
		font-size: 0.9rem;
	}

	.pwa-desc {
		font-size: 0.75rem;
		color: rgba(255, 255, 255, 0.8);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.pwa-actions {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-shrink: 0;
	}

	.pwa-install {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		background: white;
		color: var(--magic-purple);
		border: none;
		border-radius: 0.5rem;
		font-weight: 600;
		font-size: 0.85rem;
		cursor: pointer;
		transition: transform 0.2s ease, box-shadow 0.2s ease;
	}

	.pwa-install:hover {
		transform: scale(1.05);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
	}

	.pwa-dismiss {
		width: 36px;
		height: 36px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(255, 255, 255, 0.15);
		border: none;
		border-radius: 0.5rem;
		color: white;
		cursor: pointer;
		transition: background 0.2s ease;
	}

	.pwa-dismiss:hover {
		background: rgba(255, 255, 255, 0.25);
	}

	.pwa-installed-badge {
		position: fixed;
		bottom: 1rem;
		right: 1rem;
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		background: rgba(45, 212, 191, 0.15);
		border: 1px solid rgba(45, 212, 191, 0.3);
		color: var(--magic-turquoise);
		border-radius: 0.5rem;
		font-size: 0.75rem;
		font-weight: 500;
		z-index: 1000;
	}

	.pwa-desc strong {
		color: white;
	}

	@media (max-width: 480px) {
		.pwa-banner {
			flex-direction: column;
			align-items: stretch;
		}

		.pwa-actions {
			justify-content: flex-end;
		}

		.pwa-desc {
			white-space: normal;
		}
	}

	@media (min-width: 1024px) {
		.pwa-banner {
			left: auto;
			right: 2rem;
			bottom: 2rem;
			max-width: 400px;
		}
	}
</style>
