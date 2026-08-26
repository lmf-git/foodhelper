<script>
	import { DIFFICULTY_LABEL, difficultyOf, formatTime } from '$lib/difficulty';
	import { DAYS, plan } from '$lib/stores/plan.svelte';
	import { selection } from '$lib/stores/selection.svelte';

	let { recipe } = $props();

	const difficulty = $derived(difficultyOf(recipe));
	const selected = $derived(selection.has(recipe.id));
	const ingredientCount = $derived(recipe.extendedIngredients?.length ?? 0);

	let addedTo = $state(null);
	let flashTimer;

	function addToDay(event) {
		const select = event.currentTarget;
		const day = Number(select.value);
		if (Number.isNaN(day)) return;

		plan.add(day, recipe.id);
		addedTo = DAYS[day];
		select.value = '';

		clearTimeout(flashTimer);
		flashTimer = setTimeout(() => (addedTo = null), 1800);
	}
</script>

<article class="card" class:selected>
	<button
		type="button"
		class="hit"
		aria-pressed={selected}
		onclick={() => selection.toggle(recipe.id)}
	>
		<span class="sr">{selected ? 'Remove' : 'Add'} {recipe.title} {selected ? 'from' : 'to'} selection</span>
		<div class="thumb">
			{#if recipe.image}
				<img src={recipe.image} alt="" loading="lazy" decoding="async" />
			{:else}
				<div class="noimg" aria-hidden="true">🍽️</div>
			{/if}
			<span class="tick" aria-hidden="true">{selected ? '✓' : ''}</span>
		</div>
		<h3>{recipe.title}</h3>
	</button>

	<div class="meta">
		<span class="pill d-{difficulty}">{DIFFICULTY_LABEL[difficulty]}</span>
		<span class="muted">{formatTime(recipe.readyInMinutes)}</span>
		{#if ingredientCount}
			<span class="muted">· {ingredientCount} ingredients</span>
		{/if}
	</div>

	<div class="actions">
		<label class="sr" for="day-{recipe.id}">Add {recipe.title} to a day</label>
		<select id="day-{recipe.id}" class="field" onchange={addToDay} value="">
			<option value="" disabled>Add to day…</option>
			{#each DAYS as day, i (day)}
				<option value={i}>{day}</option>
			{/each}
		</select>
		{#if recipe.sourceUrl}
			<a class="btn recipe-link" href={recipe.sourceUrl} target="_blank" rel="noreferrer noopener">
				Recipe ↗
			</a>
		{/if}
	</div>

	{#if addedTo}
		<p class="flash" role="status">Added to {addedTo}</p>
	{/if}
</article>

<style>
	.card {
		display: flex;
		flex-direction: column;
		overflow: hidden;
		position: relative;
		transition: border-color 0.14s ease, box-shadow 0.14s ease;
	}

	.card:hover {
		box-shadow: var(--shadow);
	}

	.selected {
		border-color: var(--accent);
		box-shadow: 0 0 0 1px var(--accent);
	}

	.hit {
		display: block;
		width: 100%;
		text-align: left;
		background: none;
		border: 0;
		padding: 0;
	}

	.thumb {
		position: relative;
		aspect-ratio: 16 / 10;
		background: var(--surface-2);
	}

	.thumb img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}

	.noimg {
		display: grid;
		place-items: center;
		height: 100%;
		font-size: 2rem;
		opacity: 0.4;
	}

	.tick {
		position: absolute;
		top: 0.6rem;
		right: 0.6rem;
		width: 26px;
		height: 26px;
		border-radius: 999px;
		display: grid;
		place-items: center;
		font-size: 0.85rem;
		font-weight: 800;
		background: color-mix(in srgb, var(--surface) 80%, transparent);
		border: 1px solid var(--line);
		backdrop-filter: blur(6px);
	}

	.selected .tick {
		background: var(--accent);
		border-color: var(--accent);
		color: var(--accent-text);
	}

	h3 {
		font-size: 1rem;
		padding: 0.75rem 0.85rem 0;
	}

	.meta {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.4rem;
		padding: 0.55rem 0.85rem 0;
		font-size: 0.85rem;
	}

	.pill {
		border-radius: 999px;
		padding: 0.1rem 0.5rem;
		font-size: 0.75rem;
		font-weight: 650;
		background: var(--surface-2);
	}

	.d-easy {
		background: color-mix(in srgb, var(--good) 18%, transparent);
		color: var(--good);
	}

	.d-hard {
		background: var(--accent-soft);
		color: var(--accent);
	}

	.actions {
		display: flex;
		gap: 0.4rem;
		padding: 0.85rem;
		margin-top: auto;
	}

	.actions select {
		flex: 1;
		min-width: 0;
		font-size: 0.85rem;
		padding-block: 0.35rem;
	}

	.recipe-link {
		font-size: 0.85rem;
		padding: 0.35rem 0.7rem;
		text-decoration: none;
		color: var(--text);
		white-space: nowrap;
	}

	.flash {
		margin: 0;
		padding: 0.4rem 0.85rem 0.7rem;
		font-size: 0.82rem;
		font-weight: 600;
		color: var(--good);
	}

	.sr {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip: rect(0 0 0 0);
		white-space: nowrap;
	}
</style>
