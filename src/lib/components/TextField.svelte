<script module>
	let counter = 0;
</script>

<script>
	/** A plain input with every browser affordance (search cancel, password reveal) removed. */
	let {
		value = $bindable(''),
		type = 'text',
		placeholder = '',
		label = '',
		clearable = false,
		autocomplete = 'off',
		spellcheck = false,
		onenter
	} = $props();

	const uid = `txt-${counter++}`;
	let inputEl = $state(null);

	function clear() {
		value = '';
		inputEl?.focus();
	}
</script>

<div class="wrap">
	{#if type === 'search'}
		<svg class="icon" viewBox="0 0 16 16" aria-hidden="true">
			<circle cx="7" cy="7" r="4.4" fill="none" stroke="currentColor" stroke-width="1.6" />
			<path d="m10.4 10.4 3 3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
		</svg>
	{/if}

	<input
		bind:this={inputEl}
		id={uid}
		class:has-icon={type === 'search'}
		type={type === 'password' ? 'password' : 'text'}
		{placeholder}
		{autocomplete}
		{spellcheck}
		aria-label={label}
		bind:value
		onkeydown={(e) => {
			if (e.key === 'Enter') onenter?.();
		}}
	/>

	{#if clearable && value}
		<button type="button" class="clear" aria-label="Clear {label || 'field'}" onclick={clear}>
			<svg viewBox="0 0 12 12" aria-hidden="true">
				<path
					d="m3 3 6 6M9 3l-6 6"
					stroke="currentColor"
					stroke-width="1.6"
					stroke-linecap="round"
				/>
			</svg>
		</button>
	{/if}
</div>

<style>
	.wrap {
		position: relative;
		display: flex;
		align-items: center;
		width: 100%;
	}

	input {
		width: 100%;
		min-width: 0;
		background: var(--surface);
		border: 1px solid var(--line);
		border-radius: 9px;
		padding: 0.5rem 0.75rem;
		color: var(--text);
		transition: border-color 0.12s ease, box-shadow 0.12s ease;
	}

	input.has-icon {
		padding-left: 2.1rem;
	}

	input::placeholder {
		color: var(--muted);
	}

	input:hover {
		border-color: color-mix(in srgb, var(--accent) 45%, var(--line));
	}

	input:focus {
		outline: none;
		border-color: var(--accent);
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 16%, transparent);
	}

	/* Strip the browser's own search and password furniture. */
	input::-webkit-search-cancel-button,
	input::-webkit-search-decoration,
	input::-webkit-credentials-auto-fill-button,
	input::-ms-reveal,
	input::-ms-clear {
		display: none;
		appearance: none;
	}

	.icon {
		position: absolute;
		left: 0.7rem;
		width: 15px;
		height: 15px;
		color: var(--muted);
		pointer-events: none;
	}

	.clear {
		position: absolute;
		right: 0.45rem;
		display: grid;
		place-items: center;
		width: 20px;
		height: 20px;
		padding: 0;
		border: 0;
		border-radius: 999px;
		background: var(--surface-2);
		color: var(--muted);
	}

	.clear:hover {
		color: var(--text);
	}

	.clear svg {
		width: 10px;
		height: 10px;
	}
</style>
