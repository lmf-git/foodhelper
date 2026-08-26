<script>
	import '../app.css';
	import { page } from '$app/state';
	import { selection } from '$lib/stores/selection.svelte';
	import { plan } from '$lib/stores/plan.svelte';

	let { children } = $props();

	const links = $derived([
		{ href: '/', label: 'Browse', badge: 0 },
		{ href: '/plan', label: 'Week', badge: plan.count },
		{ href: '/list', label: 'List', badge: selection.count + plan.count },
		{ href: '/settings', label: 'Settings', badge: 0 }
	]);

	function active(href) {
		return href === '/' ? page.url.pathname === '/' : page.url.pathname.startsWith(href);
	}
</script>

<header>
	<div class="wrap bar">
		<a class="brand" href="/">
			<svg class="mark" viewBox="0 0 24 24" aria-hidden="true">
				<path
					d="M12 21V9"
					fill="none"
					stroke="currentColor"
					stroke-width="1.8"
					stroke-linecap="round"
				/>
				<path
					d="M12 12c0-3.3 2.4-6 5.5-6.6C17.8 8.9 15.4 12 12 12Zm0 3c0-2.7-2-5-4.6-5.5C7.2 12.2 9.3 15 12 15Z"
					fill="currentColor"
				/>
			</svg>
			<span>Mise</span>
		</a>
		<nav>
			{#each links as link (link.href)}
				<a href={link.href} class:active={active(link.href)}>
					{link.label}
					{#if link.badge > 0}<span class="badge">{link.badge}</span>{/if}
				</a>
			{/each}
		</nav>
	</div>
</header>

<main class="wrap">
	{@render children()}
</main>

<style>
	header {
		position: sticky;
		top: 0;
		z-index: 20;
		background: color-mix(in srgb, var(--bg) 86%, transparent);
		backdrop-filter: blur(12px);
		border-bottom: 1px solid var(--line);
	}

	.bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		height: 60px;
	}

	.brand {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		font-family: var(--font-display);
		font-weight: 600;
		font-size: 1.25rem;
		font-variation-settings: 'SOFT' 30, 'WONK' 1;
		letter-spacing: -0.01em;
		color: var(--text);
		text-decoration: none;
	}

	.mark {
		width: 22px;
		height: 22px;
		color: var(--accent);
		flex: none;
	}

	nav {
		display: flex;
		gap: 0.25rem;
	}

	nav a {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.4rem 0.75rem;
		border-radius: 999px;
		text-decoration: none;
		color: var(--muted);
		font-weight: 500;
		font-size: 0.94rem;
	}

	nav a:hover {
		color: var(--text);
		background: var(--surface-2);
	}

	nav a.active {
		color: var(--text);
		background: var(--surface);
		border: 1px solid var(--line);
		padding-block: calc(0.4rem - 1px);
	}

	.badge {
		min-width: 1.35em;
		padding: 0 0.35em;
		border-radius: 999px;
		background: var(--hot);
		color: var(--surface);
		font-size: 0.75rem;
		font-weight: 700;
		text-align: center;
	}

	main {
		padding-block: 1.5rem 5rem;
	}

	@media (max-width: 560px) {
		.brand span:last-child {
			display: none;
		}

		nav a {
			padding-inline: 0.6rem;
		}
	}
</style>
