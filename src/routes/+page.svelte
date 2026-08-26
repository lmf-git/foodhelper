<script>
	import RecipeCard from '$lib/components/RecipeCard.svelte';
	import { difficultyOf } from '$lib/difficulty';
	import { ApiError, CUISINES, MEAL_TYPES, search } from '$lib/spoonacular';
	import { selection } from '$lib/stores/selection.svelte';
	import { settings } from '$lib/stores/settings.svelte';

	const PAGE_SIZE = 12;

	let query = $state('');
	let cuisine = $state('');
	// Deliberately unset: Spoonacular's dishTypes are narrow, and defaulting to
	// 'main course' silently hides things like empanadas, which it tags as appetizers.
	let type = $state('');
	let difficulty = $state('');
	let maxTime = $state('');

	let recipes = $state([]);
	let total = $state(0);
	let offset = $state(0);
	let loading = $state(false);
	let error = $state('');
	let servedFromCache = $state(false);
	let searched = $state(false);

	// Difficulty leans on ingredient count, which the API can't filter on, so the
	// last cut happens here on what came back.
	const shown = $derived(
		difficulty ? recipes.filter((r) => difficultyOf(r) === difficulty) : recipes
	);
	const canLoadMore = $derived(recipes.length < total && !loading);

	async function run(nextOffset) {
		if (!settings.apiKey) {
			error = 'Add a Spoonacular API key on the Settings page to start searching.';
			return;
		}

		loading = true;
		error = '';
		try {
			const result = await search({
				query,
				cuisine,
				type,
				maxReadyTime: maxTime === '' ? null : Number(maxTime),
				difficulty: difficulty || null,
				offset: nextOffset,
				number: PAGE_SIZE
			});

			recipes = nextOffset === 0 ? result.recipes : [...recipes, ...result.recipes];
			total = result.total;
			offset = nextOffset;
			servedFromCache = result.cached;
			searched = true;
		} catch (e) {
			error = e instanceof ApiError ? e.message : 'Something went wrong loading recipes.';
		} finally {
			loading = false;
		}
	}

	function submit(event) {
		event.preventDefault();
		run(0);
	}
</script>

<section class="intro">
	<h1>What are we cooking?</h1>
	<p class="muted">
		Search, tick the meals you fancy, and the shopping list adds itself up. Results are cached in
		your browser, so repeating a search costs nothing.
	</p>
</section>

<form class="filters card" onsubmit={submit}>
	<input
		class="field grow"
		type="search"
		bind:value={query}
		placeholder="milanesa, curry, empanada…"
		aria-label="Search recipes"
	/>

	<select class="field" bind:value={cuisine} aria-label="Cuisine">
		<option value="">Any cuisine</option>
		{#each CUISINES as c (c)}<option value={c}>{c}</option>{/each}
	</select>

	<select class="field" bind:value={type} aria-label="Meal type">
		<option value="">Any course</option>
		{#each MEAL_TYPES as t (t)}<option value={t}>{t}</option>{/each}
	</select>

	<select class="field" bind:value={difficulty} aria-label="Difficulty">
		<option value="">Any effort</option>
		<option value="easy">Easy</option>
		<option value="medium">Medium</option>
		<option value="hard">Involved</option>
	</select>

	<select class="field" bind:value={maxTime} aria-label="Maximum time">
		<option value="">Any time</option>
		<option value={20}>Under 20 min</option>
		<option value={30}>Under 30 min</option>
		<option value={45}>Under 45 min</option>
		<option value={60}>Under 1 hour</option>
	</select>

	<button class="btn btn-primary" type="submit" disabled={loading}>
		{loading ? 'Searching…' : 'Search'}
	</button>
</form>

{#if !settings.apiKey}
	<p class="notice setup">
		This app talks to Spoonacular straight from your browser, so it needs your own API key —
		<a href="/settings">add one in settings</a>. It's free and takes a minute.
	</p>
{/if}

{#if error}
	<p class="notice error" role="alert">
		{error}
		{#if !settings.apiKey}<a href="/settings">Open settings →</a>{/if}
	</p>
{/if}

{#if searched && !loading}
	<p class="status muted">
		{shown.length} of {total.toLocaleString()} matches
		{#if servedFromCache}· served from cache, no request used{/if}
		{#if difficulty && shown.length < recipes.length}
			· {recipes.length - shown.length} hidden by the effort filter
		{/if}
	</p>
{/if}

{#if shown.length}
	<div class="grid">
		{#each shown as recipe (recipe.id)}
			<RecipeCard {recipe} />
		{/each}
	</div>

	{#if canLoadMore}
		<div class="more">
			<button class="btn" onclick={() => run(offset + PAGE_SIZE)}>Load more</button>
		</div>
	{/if}
{:else if searched && !loading}
	<p class="empty">Nothing matched. Try loosening a filter.</p>
{:else if !searched && !loading}
	<p class="empty">Pick your filters and hit search.</p>
{/if}

{#if selection.count > 0}
	<div class="tray">
		<span><strong>{selection.count}</strong> selected</span>
		<button class="btn" onclick={() => selection.clear()}>Clear</button>
		<a class="btn btn-primary" href="/list">Shopping list →</a>
	</div>
{/if}

<style>
	.intro {
		max-width: 46ch;
		margin-bottom: 1.25rem;
	}

	.intro h1 {
		font-size: clamp(1.6rem, 4vw, 2.2rem);
		margin-bottom: 0.5rem;
	}

	.intro p {
		margin: 0;
		font-size: 0.95rem;
	}

	.filters {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		padding: 0.75rem;
		margin-bottom: 1rem;
	}

	.grow {
		flex: 1 1 16rem;
		min-width: 0;
	}

	.notice {
		border-radius: 10px;
		padding: 0.7rem 0.9rem;
		margin: 0 0 1rem;
	}

	.setup {
		background: var(--surface);
		border: 1px solid var(--line);
	}

	.error {
		background: var(--hot-soft);
		color: var(--hot);
		font-weight: 500;
	}

	.status {
		font-size: 0.87rem;
		margin: 0 0 1rem;
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(255px, 1fr));
		gap: 1rem;
	}

	.more {
		display: flex;
		justify-content: center;
		margin-top: 1.5rem;
	}

	.tray {
		position: fixed;
		left: 50%;
		bottom: 1rem;
		transform: translateX(-50%);
		z-index: 30;
		display: flex;
		align-items: center;
		gap: 0.6rem;
		padding: 0.5rem 0.6rem 0.5rem 1rem;
		border-radius: 999px;
		background: var(--surface);
		border: 1px solid var(--line);
		box-shadow: var(--shadow);
		white-space: nowrap;
	}

	.tray a {
		text-decoration: none;
	}
</style>
