<script>
	import { clearAll, stats } from '$lib/cache';
	import { list } from '$lib/stores/list.svelte';
	import { plan } from '$lib/stores/plan.svelte';
	import { selection } from '$lib/stores/selection.svelte';
	import { settings } from '$lib/stores/settings.svelte';

	let keyDraft = $state(settings.apiKey);
	let saved = $state(false);
	let cache = $state(stats());

	function saveKey() {
		settings.apiKey = keyDraft;
		saved = true;
		setTimeout(() => (saved = false), 2000);
	}

	function wipeCache() {
		clearAll();
		cache = stats();
	}

	function resetEverything() {
		if (!confirm('Clear the cache, your selection and the whole week plan?')) return;
		clearAll();
		selection.clear();
		plan.clear();
		list.uncheckAll();
		cache = stats();
	}

	const size = $derived(
		cache.bytes > 1024 * 1024
			? `${(cache.bytes / 1024 / 1024).toFixed(1)} MB`
			: `${Math.round(cache.bytes / 1024)} KB`
	);
</script>

<h1>Settings</h1>

<section class="card block">
	<h2>Spoonacular API key</h2>
	<p class="muted">
		{#if settings.apiKey}
			Key set. Requests count against your own quota.
		{:else}
			No key yet.
			<a href="https://spoonacular.com/food-api/console#Dashboard" target="_blank" rel="noreferrer noopener">
				Get a free one
			</a> — 150 points a day, no card needed.
		{/if}
	</p>

	<div class="row">
		<input
			class="field grow"
			type="password"
			bind:value={keyDraft}
			placeholder="paste key here"
			autocomplete="off"
			spellcheck="false"
			aria-label="Spoonacular API key"
		/>
		<button class="btn btn-primary" onclick={saveKey}>{saved ? 'Saved ✓' : 'Save'}</button>
		{#if settings.apiKey}
			<button
				class="btn"
				onclick={() => {
					keyDraft = '';
					settings.apiKey = '';
				}}
			>
				Remove
			</button>
		{/if}
	</div>
	<p class="fine muted">
		Stored only in this browser, and never sent anywhere but Spoonacular. There is no server in
		this app and no key baked into the build, so the key stays yours — but anyone using this site
		on another machine needs to paste in their own.
	</p>
</section>

<section class="card block">
	<h2>Cooking</h2>
	<div class="row">
		<label class="inline">
			Household size
			<input
				class="field small"
				type="number"
				min="1"
				max="20"
				value={settings.servings}
				oninput={(e) => (settings.servings = Number(e.currentTarget.value))}
			/>
		</label>
		<label class="inline">
			Units
			<select
				class="field"
				value={settings.units}
				onchange={(e) => (settings.units = e.currentTarget.value)}
			>
				<option value="metric">Metric (g, ml)</option>
				<option value="us">US (cups, oz)</option>
			</select>
		</label>
	</div>
	<p class="fine muted">
		Every recipe is scaled from its own yield to your household size before the shopping list adds
		anything up.
	</p>
</section>

<section class="card block">
	<h2>Cache</h2>
	<dl class="figures">
		<div><dt>Requests today</dt><dd>{settings.requestsToday}<span class="muted"> / ~150 free</span></dd></div>
		<div><dt>Cached responses</dt><dd>{cache.entries}</dd></div>
		<div><dt>On disk</dt><dd>{size}</dd></div>
	</dl>
	<p class="fine muted">
		Searches are cached for a day; individual recipes are kept indefinitely, since a published
		recipe doesn't change. Repeating a search or rebuilding a list costs nothing.
	</p>
	<div class="row">
		<button class="btn" onclick={() => (cache = stats())}>Refresh</button>
		<button class="btn" onclick={wipeCache}>Clear cache</button>
		<button class="btn danger" onclick={resetEverything}>Reset everything</button>
	</div>
</section>

<style>
	h1 {
		font-size: clamp(1.6rem, 4vw, 2.2rem);
		margin-bottom: 1.25rem;
	}

	.block {
		padding: 1.1rem 1.25rem;
		margin-bottom: 1rem;
		max-width: 46rem;
	}

	h2 {
		font-size: 1rem;
		margin-bottom: 0.5rem;
	}

	.block p {
		margin: 0 0 0.9rem;
		font-size: 0.92rem;
	}

	.row {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		align-items: center;
	}

	.grow {
		flex: 1 1 18rem;
		min-width: 0;
	}

	.inline {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.92rem;
	}

	.small {
		width: 4.5rem;
	}

	.fine {
		font-size: 0.85rem !important;
		margin-top: 0.9rem !important;
	}

	.figures {
		display: flex;
		flex-wrap: wrap;
		gap: 1.5rem;
		margin: 0;
	}

	dt {
		font-size: 0.78rem;
		text-transform: uppercase;
		letter-spacing: 0.07em;
		color: var(--muted);
	}

	dd {
		margin: 0.15rem 0 0;
		font-size: 1.3rem;
		font-weight: 650;
		font-variant-numeric: tabular-nums;
	}

	dd span {
		font-size: 0.85rem;
		font-weight: 500;
	}

	.danger {
		color: var(--accent);
		border-color: color-mix(in srgb, var(--accent) 40%, var(--line));
	}
</style>
