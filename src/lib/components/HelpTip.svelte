<script lang="ts">
	interface Props {
		text: string;
		position?: 'top' | 'bottom' | 'left' | 'right';
	}

	let { text, position = 'top' }: Props = $props();
	let visible = $state(false);
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<span
	class="helptip"
	onmouseenter={() => (visible = true)}
	onmouseleave={() => (visible = false)}
	onfocus={() => (visible = true)}
	onblur={() => (visible = false)}
	tabindex="0"
	role="tooltip"
	aria-label={text}
>
	<span class="helptip-icon">?</span>

	{#if visible}
		<span class="helptip-bubble helptip-bubble--{position}" role="tooltip">
			{text}
		</span>
	{/if}
</span>

<style>
	.helptip {
		position: relative;
		display: inline-flex;
		align-items: center;
		cursor: help;
		outline: none;
	}

	.helptip-icon {
		width: 16px;
		height: 16px;
		border-radius: 50%;
		background: rgba(14, 170, 162, 0.2);
		border: 1px solid rgba(14, 170, 162, 0.5);
		color: var(--magic-turquoise, #0EAAA2);
		font-size: 0.65rem;
		font-weight: 800;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		transition: background 0.15s;
	}

	.helptip:hover .helptip-icon,
	.helptip:focus .helptip-icon {
		background: rgba(14, 170, 162, 0.35);
	}

	.helptip-bubble {
		position: absolute;
		z-index: 200;
		width: 220px;
		padding: 0.6rem 0.75rem;
		background: #0f172a;
		border: 1px solid rgba(14, 170, 162, 0.35);
		border-radius: 0.75rem;
		font-size: 0.75rem;
		line-height: 1.5;
		color: #cbd5e1;
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
		pointer-events: none;
		white-space: normal;
	}

	/* Positions */
	.helptip-bubble--top {
		bottom: calc(100% + 8px);
		left: 50%;
		transform: translateX(-50%);
	}

	.helptip-bubble--bottom {
		top: calc(100% + 8px);
		left: 50%;
		transform: translateX(-50%);
	}

	.helptip-bubble--right {
		left: calc(100% + 8px);
		top: 50%;
		transform: translateY(-50%);
	}

	.helptip-bubble--left {
		right: calc(100% + 8px);
		top: 50%;
		transform: translateY(-50%);
	}
</style>
