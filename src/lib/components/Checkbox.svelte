<script module>
	let counter = 0;
</script>

<script>
	/**
	 * The native input is kept for semantics and keyboard behaviour, but stripped of
	 * every browser-drawn pixel with appearance:none — the box and tick below are ours.
	 */
	let { checked = $bindable(false), label = '', disabled = false, onchange } = $props();

	const uid = `chk-${counter++}`;
</script>

<label class="wrap" class:disabled for={uid}>
	<span class="box">
		<input
			id={uid}
			type="checkbox"
			bind:checked
			{disabled}
			onchange={(e) => onchange?.(e.currentTarget.checked)}
		/>
		<svg viewBox="0 0 14 14" aria-hidden="true">
			<path
				d="m3 7.2 2.6 2.6L11 4.4"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
		</svg>
	</span>
	{#if label}<span class="text">{label}</span>{/if}
</label>

<style>
	.wrap {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
	}

	.disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.box {
		position: relative;
		display: grid;
		place-items: center;
		width: 19px;
		height: 19px;
		flex: none;
	}

	input {
		appearance: none;
		-webkit-appearance: none;
		margin: 0;
		position: absolute;
		inset: 0;
		border: 1.5px solid var(--line);
		border-radius: 6px;
		background: var(--surface);
		cursor: inherit;
		transition: background 0.12s ease, border-color 0.12s ease;
	}

	.wrap:hover input:not(:disabled) {
		border-color: color-mix(in srgb, var(--accent) 55%, var(--line));
	}

	input:checked {
		background: var(--accent);
		border-color: var(--accent);
	}

	input:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}

	svg {
		position: relative;
		width: 13px;
		height: 13px;
		color: var(--accent-text);
		opacity: 0;
		transform: scale(0.7);
		transition: opacity 0.12s ease, transform 0.12s ease;
		pointer-events: none;
	}

	input:checked + svg {
		opacity: 1;
		transform: scale(1);
	}

	.text {
		user-select: none;
	}
</style>
