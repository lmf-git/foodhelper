<script>
	import Select from '$lib/components/Select.svelte';
	import { DIFFICULTY_LABEL, difficultyOf, formatTime } from '$lib/difficulty';
	import { DAYS, plan } from '$lib/stores/plan.svelte';
	import { selection } from '$lib/stores/selection.svelte';

	let { recipe } = $props();

	const difficulty = $derived(difficultyOf(recipe));
	const selected = $derived(selection.has(recipe.id));
	const ingredientCount = $derived(recipe.extendedIngredients?.length ?? 0);

	let addedTo = $state(null);
	let flashTimer;

	const dayOptions = DAYS.map((day, i) => ({ value: i, label: day }));

	function addToDay(day) {
		plan.add(day, recipe.id);
		addedTo = DAYS[day];

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
		<div class="day-pick">
			<Select
				action
				options={dayOptions}
				placeholder="Add to day…"
				label="Add {recipe.title} to a day"
				onselect={addToDay}
			/>
		</div>
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
		aspect-ratio: 4 / 3;
		background: var(--surface-2);
		border-radius: calc(var(--radius) - 1px) calc(var(--radius) - 1px) 0 0;
		overflow: hidden;
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
		font-weight: 700;
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
		font-family: var(--font-display);
		font-size: 1.06rem;
		font-weight: 600;
		font-variation-settings: 'SOFT' 20, 'WONK' 1;
		line-height: 1.2;
		padding: 0.8rem 0.85rem 0;
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
		font-size: 0.72rem;
		font-weight: 600;
		letter-spacing: 0.02em;
		background: var(--surface-2);
	}

	.d-easy {
		background: color-mix(in srgb, var(--good) 18%, transparent);
		color: var(--good);
	}

	.d-hard {
		background: var(--hot-soft);
		color: var(--hot);
	}

	.actions {
		display: flex;
		gap: 0.4rem;
		padding: 0.85rem;
		margin-top: auto;
	}

	.day-pick {
		flex: 1;
		min-width: 0;
		font-size: 0.85rem;
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
