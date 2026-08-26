<script module>
	let counter = 0;
</script>

<script>
	/**
	 * A stepper rather than <input type="number">: the native spinners look different in
	 * every browser and vanish on touch. Uses inputmode="numeric" on a text input so
	 * phones still get a number pad without the spinner chrome.
	 */
	let { value = $bindable(1), min = 1, max = 99, label = '' } = $props();

	const uid = `num-${counter++}`;
	let draft = $state(String(value));

	// Keep the visible text in step with the value when it changes from elsewhere.
	$effect(() => {
		if (Number(draft) !== value) draft = String(value);
	});

	function clamp(n) {
		return Math.max(min, Math.min(max, n));
	}

	function commit() {
		const parsed = Number(draft.replace(/[^\d]/g, ''));
		value = Number.isFinite(parsed) && parsed > 0 ? clamp(parsed) : min;
		draft = String(value);
	}

	function nudge(delta) {
		value = clamp(value + delta);
		draft = String(value);
	}
</script>

<div class="stepper">
	<button
		type="button"
		aria-label="Decrease {label}"
		disabled={value <= min}
		onclick={() => nudge(-1)}
	>
		<svg viewBox="0 0 12 12" aria-hidden="true">
			<path d="M2.5 6h7" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" />
		</svg>
	</button>

	<input
		id={uid}
		type="text"
		inputmode="numeric"
		aria-label={label}
		bind:value={draft}
		onblur={commit}
		onkeydown={(e) => {
			if (e.key === 'Enter') commit();
			else if (e.key === 'ArrowUp') {
				e.preventDefault();
				nudge(1);
			} else if (e.key === 'ArrowDown') {
				e.preventDefault();
				nudge(-1);
			}
		}}
	/>

	<button
		type="button"
		aria-label="Increase {label}"
		disabled={value >= max}
		onclick={() => nudge(1)}
	>
		<svg viewBox="0 0 12 12" aria-hidden="true">
			<path
				d="M6 2.5v7M2.5 6h7"
				stroke="currentColor"
				stroke-width="1.7"
				stroke-linecap="round"
			/>
		</svg>
	</button>
</div>

<style>
	.stepper {
		display: inline-flex;
		align-items: center;
		background: var(--surface);
		border: 1px solid var(--line);
		border-radius: 9px;
		overflow: hidden;
	}

	.stepper:focus-within {
		border-color: var(--accent);
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 16%, transparent);
	}

	button {
		display: grid;
		place-items: center;
		width: 30px;
		height: 32px;
		border: 0;
		background: none;
		color: var(--muted);
	}

	button:hover:not(:disabled) {
		background: var(--surface-2);
		color: var(--text);
	}

	button:disabled {
		opacity: 0.35;
		cursor: not-allowed;
	}

	button svg {
		width: 12px;
		height: 12px;
	}

	input {
		width: 2.4rem;
		border: 0;
		background: none;
		text-align: center;
		padding: 0;
		font-variant-numeric: tabular-nums;
		font-weight: 600;
	}

	input:focus {
		outline: none;
	}
</style>
