<script>
	import { buildList, formatAmount, groupByAisle, toText } from '$lib/shopping';
	import { library } from '$lib/stores/library.svelte';
	import { list } from '$lib/stores/list.svelte';
	import { plan } from '$lib/stores/plan.svelte';
	import { selection } from '$lib/stores/selection.svelte';
	import { settings } from '$lib/stores/settings.svelte';

	const sourceIds = $derived([
		...new Set([
			...(list.useSelection ? selection.ids : []),
			...(list.usePlan ? plan.ids : [])
		])
	]);

	$effect(() => {
		if (sourceIds.length) library.ensure(sourceIds);
	});

	const recipes = $derived(
		sourceIds.map((id) => library.get(id)).filter((r) => r !== undefined)
	);

	const groups = $derived(
		groupByAisle(buildList(recipes, { servings: settings.servings, units: settings.units }))
	);

	const itemCount = $derived(groups.reduce((n, g) => n + g.lines.length, 0));
	const doneCount = $derived(
		groups.reduce((n, g) => n + g.lines.filter((l) => list.isChecked(l.key)).length, 0)
	);

	let copied = $state(false);

	async function copy() {
		try {
			await navigator.clipboard.writeText(toText(groups));
			copied = true;
			setTimeout(() => (copied = false), 2000);
		} catch {
			copied = false;
		}
	}
</script>

<div class="head">
	<div>
		<h1>Shopping list</h1>
		<p class="muted">
			{itemCount} item{itemCount === 1 ? '' : 's'} from {recipes.length} recipe{recipes.length === 1
				? ''
				: 's'}
			{#if doneCount}· {doneCount} ticked off{/if}
		</p>
	</div>
	{#if itemCount}
		<div class="head-actions">
			{#if doneCount}
				<button class="btn" onclick={() => list.uncheckAll()}>Untick all</button>
			{/if}
			<button class="btn btn-primary" onclick={copy}>{copied ? 'Copied ✓' : 'Copy list'}</button>
		</div>
	{/if}
</div>

<div class="controls card">
	<label class="check">
		<input type="checkbox" bind:checked={list.useSelection} />
		Selected recipes <span class="count">{selection.count}</span>
	</label>
	<label class="check">
		<input type="checkbox" bind:checked={list.usePlan} />
		This week's plan <span class="count">{plan.count}</span>
	</label>

	<label class="servings">
		Cooking for
		<input
			class="field"
			type="number"
			min="1"
			max="20"
			value={settings.servings}
			oninput={(e) => (settings.servings = Number(e.currentTarget.value))}
		/>
	</label>

	<label class="servings">
		Units
		<select
			class="field"
			value={settings.units}
			onchange={(e) => (settings.units = e.currentTarget.value)}
		>
			<option value="metric">Metric</option>
			<option value="us">US</option>
		</select>
	</label>
</div>

{#if library.error}
	<p class="notice" role="alert">{library.error}</p>
{/if}

{#if library.loading && !itemCount}
	<p class="empty">Fetching ingredients…</p>
{:else if !sourceIds.length}
	<p class="empty">
		Nothing chosen yet. <a href="/">Tick some recipes</a> or <a href="/plan">plan a week</a>.
	</p>
{:else if !itemCount}
	<p class="empty">No ingredients came back for those recipes.</p>
{:else}
	<div class="aisles">
		{#each groups as group (group.aisle)}
			<section class="aisle card">
				<h2>{group.aisle}</h2>
				<ul>
					{#each group.lines as line (line.key)}
						<li class:done={list.isChecked(line.key)}>
							<label>
								<input
									type="checkbox"
									checked={list.isChecked(line.key)}
									onchange={() => list.toggle(line.key)}
								/>
								<span class="name">{line.name}</span>
								<span class="qty">{formatAmount(line.amount)} {line.unit}</span>
							</label>
							{#if line.from.length > 1}
								<p class="from muted">for {line.from.join(', ')}</p>
							{/if}
						</li>
					{/each}
				</ul>
			</section>
		{/each}
	</div>

	<section class="sources">
		<h2>Built from</h2>
		<ul class="chips">
			{#each recipes as recipe (recipe.id)}
				<li>
					<span>{recipe.title}</span>
					<span class="muted">· serves {recipe.servings ?? '?'}</span>
					{#if selection.has(recipe.id)}
						<button
							aria-label="Remove {recipe.title} from selection"
							onclick={() => selection.remove(recipe.id)}>×</button
						>
					{/if}
				</li>
			{/each}
		</ul>
	</section>
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

	.controls {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 1rem;
		padding: 0.8rem 1rem;
		margin-bottom: 1.25rem;
		font-size: 0.92rem;
	}

	.check,
	.servings {
		display: inline-flex;
		align-items: center;
		gap: 0.45rem;
	}

	.count {
		background: var(--surface-2);
		border-radius: 999px;
		padding: 0 0.45em;
		font-size: 0.8rem;
		font-weight: 650;
	}

	.servings input {
		width: 4rem;
		padding-block: 0.3rem;
	}

	.servings select {
		padding-block: 0.3rem;
	}

	.notice {
		background: var(--accent-soft);
		color: var(--accent);
		border-radius: 10px;
		padding: 0.7rem 0.9rem;
		font-weight: 550;
	}

	.aisles {
		columns: 320px;
		column-gap: 1rem;
	}

	.aisle {
		break-inside: avoid;
		margin-bottom: 1rem;
		padding: 0.9rem 1rem;
	}

	.aisle h2 {
		font-size: 0.78rem;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--muted);
		margin-bottom: 0.6rem;
	}

	.aisle ul {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.aisle li + li {
		border-top: 1px solid var(--line);
	}

	.aisle label {
		display: flex;
		align-items: baseline;
		gap: 0.6rem;
		padding: 0.45rem 0;
		cursor: pointer;
	}

	.name {
		flex: 1;
	}

	.qty {
		color: var(--muted);
		font-variant-numeric: tabular-nums;
		font-size: 0.9rem;
		white-space: nowrap;
	}

	.done .name,
	.done .qty {
		text-decoration: line-through;
		opacity: 0.45;
	}

	.from {
		margin: -0.3rem 0 0.4rem 1.6rem;
		font-size: 0.75rem;
	}

	.sources {
		margin-top: 1.5rem;
	}

	.sources h2 {
		font-size: 0.78rem;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--muted);
		margin-bottom: 0.6rem;
	}

	.chips {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-wrap: wrap;
		gap: 0.45rem;
	}

	.chips li {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		background: var(--surface);
		border: 1px solid var(--line);
		border-radius: 999px;
		padding: 0.25rem 0.5rem 0.25rem 0.8rem;
		font-size: 0.85rem;
	}

	.chips button {
		background: none;
		border: 0;
		color: var(--muted);
		font-size: 1.05rem;
		line-height: 1;
		padding: 0 0.25rem;
		border-radius: 999px;
	}

	.chips button:hover {
		color: var(--accent);
	}
</style>
