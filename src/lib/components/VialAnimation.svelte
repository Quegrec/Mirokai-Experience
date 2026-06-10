<script lang="ts">
	interface Props {
		show?: boolean;
		progressLabel?: string; // ex: "1/3"
		onClose?: () => void;
	}

	let { show = false, progressLabel = '1/3', onClose }: Props = $props();
</script>

{#if show}
	<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
	<div class="vial-overlay" onclick={onClose} role="dialog" aria-modal="true">
		<div class="vial-card" onclick={(e) => e.stopPropagation()} role="document">
			<div class="vial-glow"></div>

			<p class="vial-label">Progression</p>
			<p class="vial-title">{progressLabel} du parcours accompli !</p>

			<!-- SVG fiole placeholder – remplacer par l'asset final -->
			<div class="vial-svg-wrapper">
				<svg viewBox="0 0 80 160" xmlns="http://www.w3.org/2000/svg" class="vial-svg">
					<defs>
						<!-- Clip : forme de la fiole -->
						<clipPath id="vial-clip">
							<!-- Corps de la fiole -->
							<path d="M22,55 L22,120 Q22,145 40,145 Q58,145 58,120 L58,55 Z" />
						</clipPath>

						<!-- Gradient du liquide -->
						<linearGradient id="liquid-grad" x1="0" y1="0" x2="0" y2="1">
							<stop offset="0%" stop-color="#0EAAA2" />
							<stop offset="100%" stop-color="#9E63A5" />
						</linearGradient>

						<!-- Gradient brillance fiole -->
						<linearGradient id="glass-grad" x1="0" y1="0" x2="1" y2="0">
							<stop offset="0%" stop-color="rgba(255,255,255,0.15)" />
							<stop offset="40%" stop-color="rgba(255,255,255,0.05)" />
							<stop offset="100%" stop-color="rgba(255,255,255,0)" />
						</linearGradient>

						<!-- Clip goulot -->
						<clipPath id="neck-clip">
							<rect x="31" y="10" width="18" height="50" />
						</clipPath>
					</defs>

					<!-- === Goulot === -->
					<!-- Contour goulot -->
					<rect x="32" y="12" width="16" height="46" rx="4"
						fill="#1e293b" stroke="#4B6480" stroke-width="1.5" />
					<!-- Bouchon -->
					<rect x="30" y="10" width="20" height="8" rx="3"
						fill="#4B6480" />
					<!-- Brillance goulot -->
					<rect x="34" y="14" width="4" height="38" rx="2"
						fill="rgba(255,255,255,0.12)" />

					<!-- === Corps de la fiole === -->
					<!-- Fond sombre -->
					<path d="M22,55 L22,120 Q22,145 40,145 Q58,145 58,120 L58,55 Z"
						fill="#0d1117" />

					<!-- Liquide animé (clippé dans la forme fiole) -->
					<g clip-path="url(#vial-clip)">
						<!-- Niveau de liquide : bottom=145, fill jusqu'au tiers → y = 145 - (90 * 0.33) ≈ 115 -->
						<rect class="liquid-fill" x="22" y="115" width="36" height="30"
							fill="url(#liquid-grad)" />

						<!-- Vaguelettes -->
						<path class="wave" d="M14,115 Q22,111 30,115 Q38,119 46,115 Q54,111 62,115 L62,116 Q54,120 46,116 Q38,112 30,116 Q22,120 14,116 Z"
							fill="rgba(14,170,162,0.7)" />
					</g>

					<!-- Bulles dans le liquide -->
					<g clip-path="url(#vial-clip)">
						<circle class="bubble bubble-1" cx="32" cy="130" r="2" fill="rgba(255,255,255,0.3)" />
						<circle class="bubble bubble-2" cx="45" cy="126" r="1.5" fill="rgba(255,255,255,0.25)" />
						<circle class="bubble bubble-3" cx="38" cy="133" r="1" fill="rgba(255,255,255,0.2)" />
					</g>

					<!-- Contour fiole -->
					<path d="M22,55 L22,120 Q22,145 40,145 Q58,145 58,120 L58,55 Z"
						fill="none" stroke="#4B6480" stroke-width="1.5" />

					<!-- Brillance fiole (côté gauche) -->
					<path d="M25,60 L25,118 Q25.5,138 35,141"
						fill="none" stroke="rgba(255,255,255,0.18)" stroke-width="3" stroke-linecap="round" />

					<!-- Marques de graduation -->
					<line x1="22" y1="120" x2="27" y2="120" stroke="#4B6480" stroke-width="1" />
					<line x1="22" y1="100" x2="27" y2="100" stroke="#4B6480" stroke-width="1" />
					<line x1="22" y1="80"  x2="27" y2="80"  stroke="#4B6480" stroke-width="1" />

					<!-- Étoiles / sparkles autour -->
					<g class="sparkles">
						<path d="M10,70 L11.2,73.2 L14.5,74 L11.2,74.8 L10,78 L8.8,74.8 L5.5,74 L8.8,73.2 Z"
							fill="#F0B429" opacity="0.9" />
						<path d="M65,90 L65.8,92.1 L68,92.8 L65.8,93.5 L65,95.6 L64.2,93.5 L62,92.8 L64.2,92.1 Z"
							fill="#A333B0" opacity="0.9" />
						<circle cx="68" cy="70" r="2" fill="#0EAAA2" opacity="0.7" />
						<circle cx="8" cy="100" r="1.5" fill="#9E63A5" opacity="0.7" />
					</g>
				</svg>
			</div>

			<p class="vial-sub">
				Un tiers de l'aventure débloqué !<br/>Continue comme ça 🧪
			</p>

			<button class="vial-btn" onclick={onClose}>
				Continuer l'aventure
			</button>

			<p class="vial-hint">
				(Asset placeholder – remplacer par le GIF/asset final)
			</p>
		</div>
	</div>
{/if}

<style>
	.vial-overlay {
		position: fixed;
		inset: 0;
		z-index: 300;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(0, 0, 0, 0.75);
		backdrop-filter: blur(8px);
		padding: 1.5rem;
		animation: fadeIn 0.3s ease;
	}

	@keyframes fadeIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	.vial-card {
		position: relative;
		background: linear-gradient(145deg, #0f172a, #1e293b);
		border: 1px solid rgba(14, 170, 162, 0.4);
		border-radius: 1.5rem;
		padding: 2rem 1.5rem 1.5rem;
		text-align: center;
		max-width: 320px;
		width: 100%;
		box-shadow:
			0 0 40px rgba(14, 170, 162, 0.2),
			0 20px 60px rgba(0, 0, 0, 0.5);
		animation: slideUp 0.35s ease;
	}

	@keyframes slideUp {
		from { opacity: 0; transform: translateY(20px) scale(0.95); }
		to { opacity: 1; transform: translateY(0) scale(1); }
	}

	.vial-glow {
		position: absolute;
		top: -40px;
		left: 50%;
		transform: translateX(-50%);
		width: 120px;
		height: 120px;
		border-radius: 50%;
		background: radial-gradient(circle, rgba(14, 170, 162, 0.3), transparent 70%);
		pointer-events: none;
	}

	.vial-label {
		font-size: 0.7rem;
		font-weight: 700;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--magic-turquoise, #0EAAA2);
		margin: 0 0 0.25rem;
	}

	.vial-title {
		font-size: 1.2rem;
		font-weight: 800;
		color: #f1f5f9;
		margin: 0 0 1rem;
	}

	.vial-svg-wrapper {
		display: flex;
		justify-content: center;
		margin: 0.5rem 0 1rem;
	}

	.vial-svg {
		width: 90px;
		height: 180px;
		filter: drop-shadow(0 0 12px rgba(14, 170, 162, 0.5));
	}

	/* Liquide qui monte depuis 145 vers ~115 */
	.liquid-fill {
		animation: fillUp 1.2s cubic-bezier(0.22, 1, 0.36, 1) both;
		transform-origin: bottom center;
	}

	@keyframes fillUp {
		from { transform: scaleY(0); }
		to { transform: scaleY(1); }
	}

	/* Vaguelette */
	.wave {
		animation: waveAnim 2s ease-in-out infinite;
	}

	@keyframes waveAnim {
		0%, 100% { transform: translateX(0); }
		50% { transform: translateX(-4px); }
	}

	/* Bulles qui remontent */
	.bubble {
		animation: rise 3s ease-in infinite;
	}
	.bubble-1 { animation-delay: 0s; }
	.bubble-2 { animation-delay: 1s; }
	.bubble-3 { animation-delay: 2s; }

	@keyframes rise {
		0% { transform: translateY(0); opacity: 0.3; }
		80% { opacity: 0.3; }
		100% { transform: translateY(-20px); opacity: 0; }
	}

	/* Sparkles qui scintillent */
	.sparkles {
		animation: sparkle 1.5s ease-in-out infinite alternate;
	}

	@keyframes sparkle {
		from { opacity: 0.5; transform: scale(0.95); }
		to { opacity: 1; transform: scale(1.05); }
	}

	.vial-sub {
		font-size: 0.875rem;
		color: #94a3b8;
		line-height: 1.5;
		margin: 0 0 1.25rem;
	}

	.vial-btn {
		width: 100%;
		padding: 0.75rem 1.5rem;
		border: none;
		border-radius: 999px;
		background: linear-gradient(135deg, var(--magic-turquoise, #0EAAA2), var(--magic-magenta, #A3337C));
		color: white;
		font-weight: 700;
		font-size: 0.9rem;
		cursor: pointer;
		box-shadow: 0 8px 20px rgba(14, 170, 162, 0.35);
		transition: transform 0.15s ease, box-shadow 0.15s ease;
	}

	.vial-btn:hover {
		transform: translateY(-1px);
		box-shadow: 0 12px 28px rgba(14, 170, 162, 0.45);
	}

	.vial-hint {
		margin-top: 0.75rem;
		font-size: 0.65rem;
		color: rgba(148, 163, 184, 0.5);
		font-style: italic;
	}
</style>
