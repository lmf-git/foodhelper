<script>
	import { formatTime } from '$lib/difficulty';
	import { library } from '$lib/stores/library.svelte';
	import { DAYS, plan } from '$lib/stores/plan.svelte';
	import { selection } from '$lib/stores/selection.svelte';

	// Ids can outlive the recipe cache (cleared storage, another device), so top up.
	$effect(() => {
		const ids = plan.ids;
		if (ids.length) library.ensure(ids);
	});

	const minutes = $derived(
		plan.ids.reduce((total, id) => total + (library.get(id)?.readyInMinutes ?? 0), 0)
	);

	function addSelectionTo(day) {
		for (const id of selection.ids) plan.add(day, id);
	}
</script>

<div class="head">
	<div>
		<h1>The week</h1>
		<p class="muted">
			{plan.count} meal{plan.count === 1 ? '' : 's'} planned
			{#if minutes}· about {formatTime(minutes)} at the stove{/if}
		</p>
	</div>
	<div class="head-actions">
		{#if plan.count}
			<button class="btn" onclick={() => plan.clear()}>Clear week</button>
			<a class="btn btn-primary" href="/list">Shopping list →</a>
		{/if}
	</div>
</div>

{#if library.error}
	<p class="notice" role="alert">{library.error}</p>
{/if}

<div class="week">
	{#each DAYS as day, dayIndex (day)}
		<section class="day card">
			<header>
				<h2>{day}</h2>
				{#if selection.count && !plan.days[dayIndex].length}
					<button class="ghost" onclick={() => addSelectionTo(dayIndex)}>
						+ {selection.count} selected
					</button>
				{/if}
			</header>

			{#if plan.days[dayIndex].length}
				<ul>
					{#each plan.days[dayIndex] as id, entryIndex (id)}
						{@const recipe = library.get(id)}
						<li>
							{#if recipe?.image}
								<img src={recipe.image} alt="" loading="lazy" />
							{:else}
								<span class="ph" aria-hidden="true">🍽️</span>
							{/if}
							<div class="who">
								<span class="title"
									>{recipe?.title ?? (library.loading ? 'Loading…' : `Recipe ${id}`)}</span
								>
								{#if recipe}<span class="muted small">{formatTime(recipe.readyInMinutes)}</span>{/if}
							</div>
							<select
								class="mover"
								aria-label="Move {recipe?.title ?? 'meal'} to another day"
								value=""
								onchange={(e) => {
									const to = Number(e.currentTarget.value);
									e.currentTarget.value = '';
									if (!Number.isNaN(to)) plan.move(dayIndex, entryIndex, to);
								}}
							>
								<option value="" disabled>↔</option>
								{#each DAYS as target, i (target)}
									{#if i !== dayIndex}<option value={i}>{target}</option>{/if}
								{/each}
							</select>
							<button
								class="ghost remove"
								aria-label="Remove {recipe?.title ?? 'meal'} from {day}"
								onclick={() => plan.removeAt(dayIndex, entryIndex)}
							>
								×
							</button>
						</li>
					{/each}
				</ul>
			{:else}
				<p class="blank">Nothing yet</p>
			{/if}
		</section>
	{/each}
</div>

{#if plan.count === 0}
	<p class="empty">
		Nothing planned. <a href="/">Browse recipes</a> and use each card's “Add to day” menu.
	</p>
{/if}

<style>
	.head {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		align-items: flex-start;
		justify-content: space-between;
		margin-bottom: 1.25rem;
	}

	.head h1 {
		font-size: clamp(1.6rem, 4vw, 2.2rem);
	}

	.head p {
		margin: 0.35rem 0 0;
		font-size: 0.92rem;
	}

	.head-actions {
		display: flex;
		gap: 0.5rem;
	}

	.head-actions a {
		text-decoration: none;
	}

	.notice {
		background: var(--hot-soft);
		color: var(--hot);
		border-radius: 10px;
		padding: 0.7rem 0.9rem;
		font-weight: 500;
	}

	.week {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
		gap: 0.75rem;
		align-items: start;
	}

	.day {
		padding: 0.75rem;
	}

	.day header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		margin-bottom: 0.6rem;
	}

	.day h2 {
		font-size: 0.82rem;
		text-transform: uppercase;
		letter-spacing: 0.07em;
		color: var(--muted);
	}

	ul {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	li {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		background: var(--surface-2);
		border-radius: 10px;
		padding: 0.35rem;
	}

	li img,
	.ph {
		width: 38px;
		height: 38px;
		border-radius: 8px;
		object-fit: cover;
		flex: none;
		display: grid;
		place-items: center;
		background: var(--surface);
	}

	.who {
		display: flex;
		flex-direction: column;
		min-width: 0;
		flex: 1;
	}

	.title {
		font-size: 0.85rem;
		font-weight: 500;
		line-height: 1.25;
		overflow: hidden;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
	}

	.small {
		font-size: 0.75rem;
	}

	.ghost {
		background: none;
		border: 0;
		color: var(--muted);
		border-radius: 8px;
		padding: 0.15rem 0.4rem;
		font-size: 0.8rem;
		font-weight: 600;
	}

	.ghost:hover {
		background: var(--surface);
		color: var(--text);
	}

	.remove {
		font-size: 1.15rem;
		line-height: 1;
	}

	.mover {
		background: none;
		border: 0;
		color: var(--muted);
		font-size: 0.8rem;
		width: 2rem;
		flex: none;
	}

	.blank {
		margin: 0;
		padding: 0.5rem 0.35rem;
		font-size: 0.85rem;
		color: var(--muted);
		opacity: 0.7;
	}
</style>
