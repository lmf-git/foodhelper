<script module>
	let counter = 0;
</script>

<script>
	/**
	 * A listbox that looks the same in every browser. Native <select> can't have its
	 * popup styled at all, so this reimplements the ARIA combobox pattern: focus stays
	 * on the trigger and the active option is tracked with aria-activedescendant.
	 *
	 * The popup is moved to <body> and positioned fixed, so it can't be clipped by a
	 * card's overflow or trapped inside the shopping list's column layout.
	 */
	let {
		value = $bindable(),
		options = [],
		placeholder = 'Select…',
		label = '',
		/** Menus that perform an action rather than hold a value keep showing the placeholder. */
		action = false,
		compact = false,
		disabled = false,
		onselect
	} = $props();

	const uid = `sel-${counter++}`;

	let open = $state(false);
	let active = $state(-1);
	let triggerEl = $state(null);
	let listEl = $state(null);
	let box = $state({ left: 0, width: 0, top: 0, bottom: 0, maxHeight: 280, above: false });

	let typed = '';
	let typedTimer;

	const selectedIndex = $derived(options.findIndex((o) => o.value === value));
	const shown = $derived(
		action || selectedIndex < 0 ? placeholder : options[selectedIndex].label
	);
	const isPlaceholder = $derived(action || selectedIndex < 0);

	function optionId(i) {
		return `${uid}-opt-${i}`;
	}

	function place() {
		if (!triggerEl) return;
		const r = triggerEl.getBoundingClientRect();
		const gap = 6;
		const below = window.innerHeight - r.bottom - gap - 8;
		const above = r.top - gap - 8;
		const wanted = Math.min(options.length * 38 + 10, 300);
		const flip = below < Math.min(wanted, 150) && above > below;

		box = {
			left: r.left,
			width: compact ? Math.max(r.width, 168) : r.width,
			top: r.bottom + gap,
			bottom: window.innerHeight - r.top + gap,
			maxHeight: Math.max(120, Math.min(wanted, flip ? above : below)),
			above: flip
		};
	}

	function openMenu(startAt) {
		if (disabled) return;
		active = startAt ?? (selectedIndex >= 0 ? selectedIndex : 0);
		open = true;
	}

	function choose(i) {
		const option = options[i];
		if (!option || option.disabled) return;
		if (!action) value = option.value;
		open = false;
		triggerEl?.focus();
		onselect?.(option.value);
	}

	function step(delta) {
		if (!options.length) return;
		let next = active;
		for (let i = 0; i < options.length; i++) {
			next = (next + delta + options.length) % options.length;
			if (!options[next].disabled) break;
		}
		active = next;
	}

	function typeahead(char) {
		clearTimeout(typedTimer);
		typed += char.toLowerCase();
		typedTimer = setTimeout(() => (typed = ''), 700);

		const found = options.findIndex(
			(o) => !o.disabled && o.label.toLowerCase().startsWith(typed)
		);
		if (found >= 0) {
			active = found;
			if (!open) openMenu(found);
		}
	}

	function onKeydown(event) {
		const { key } = event;

		if (!open) {
			if (key === 'ArrowDown' || key === 'ArrowUp' || key === 'Enter' || key === ' ') {
				event.preventDefault();
				openMenu();
			} else if (key.length === 1 && /\S/.test(key)) {
				typeahead(key);
			}
			return;
		}

		if (key === 'Escape') {
			event.preventDefault();
			open = false;
		} else if (key === 'Tab') {
			open = false;
		} else if (key === 'ArrowDown') {
			event.preventDefault();
			step(1);
		} else if (key === 'ArrowUp') {
			event.preventDefault();
			step(-1);
		} else if (key === 'Home') {
			event.preventDefault();
			active = options.findIndex((o) => !o.disabled);
		} else if (key === 'End') {
			event.preventDefault();
			active = options.findLastIndex((o) => !o.disabled);
		} else if (key === 'Enter' || key === ' ') {
			event.preventDefault();
			choose(active);
		} else if (key.length === 1 && /\S/.test(key)) {
			typeahead(key);
		}
	}

	/** Reposition while open, and close on any click that lands outside. */
	$effect(() => {
		if (!open) return;
		place();

		const reflow = () => place();
		const outside = (event) => {
			if (!triggerEl?.contains(event.target) && !listEl?.contains(event.target)) open = false;
		};

		window.addEventListener('scroll', reflow, true);
		window.addEventListener('resize', reflow);
		document.addEventListener('pointerdown', outside, true);
		return () => {
			window.removeEventListener('scroll', reflow, true);
			window.removeEventListener('resize', reflow);
			document.removeEventListener('pointerdown', outside, true);
		};
	});

	/** Keep the highlighted option in view when arrowing past the edge. */
	$effect(() => {
		if (!open || !listEl || active < 0) return;
		listEl.querySelector(`#${CSS.escape(optionId(active))}`)?.scrollIntoView({ block: 'nearest' });
	});

	function portal(node) {
		document.body.appendChild(node);
		return {
			destroy() {
				node.remove();
			}
		};
	}
</script>

<button
	bind:this={triggerEl}
	type="button"
	class="trigger"
	class:compact
	class:open
	class:placeholder={isPlaceholder}
	role="combobox"
	aria-haspopup="listbox"
	aria-expanded={open}
	aria-controls="{uid}-list"
	aria-activedescendant={open && active >= 0 ? optionId(active) : undefined}
	aria-label={label}
	{disabled}
	onclick={() => (open ? (open = false) : openMenu())}
	onkeydown={onKeydown}
>
	<span class="text">{shown}</span>
	<svg class="chev" viewBox="0 0 12 12" aria-hidden="true">
		<path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" stroke-width="1.6"
			stroke-linecap="round" stroke-linejoin="round" />
	</svg>
</button>

{#if open}
	<div
		use:portal
		bind:this={listEl}
		id="{uid}-list"
		class="list"
		role="listbox"
		aria-label={label}
		tabindex="-1"
		style:left="{box.left}px"
		style:width="{box.width}px"
		style:max-height="{box.maxHeight}px"
		style:top={box.above ? 'auto' : `${box.top}px`}
		style:bottom={box.above ? `${box.bottom}px` : 'auto'}
	>
		{#each options as option, i (option.value)}
			<!--
				Keyboard interaction lives on the combobox trigger, which keeps focus and
				points at the active option via aria-activedescendant. Options are therefore
				pointer targets only, exactly as the ARIA pattern prescribes.
			-->
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<div
				id={optionId(i)}
				tabindex="-1"
				class="option"
				class:active={i === active}
				class:chosen={!action && option.value === value}
				role="option"
				aria-selected={!action && option.value === value}
				aria-disabled={option.disabled || undefined}
				onpointerenter={() => (active = i)}
				onclick={() => choose(i)}
			>
				<span>{option.label}</span>
				{#if !action && option.value === value}
					<svg class="tick" viewBox="0 0 12 12" aria-hidden="true">
						<path d="m2.5 6.3 2.3 2.3 4.7-5" fill="none" stroke="currentColor"
							stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
					</svg>
				{/if}
			</div>
		{/each}
	</div>
{/if}

<style>
	.trigger {
		display: inline-flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		width: 100%;
		background: var(--surface);
		border: 1px solid var(--line);
		border-radius: 9px;
		padding: 0.5rem 0.65rem 0.5rem 0.75rem;
		text-align: left;
		color: var(--text);
		transition: border-color 0.12s ease, background 0.12s ease;
	}

	.trigger:hover:not(:disabled) {
		border-color: color-mix(in srgb, var(--accent) 45%, var(--line));
	}

	.trigger.open {
		border-color: var(--accent);
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 16%, transparent);
	}

	.trigger:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.trigger.compact {
		padding: 0.25rem 0.35rem 0.25rem 0.5rem;
		font-size: 0.82rem;
		border-radius: 7px;
	}

	.placeholder .text {
		color: var(--muted);
	}

	.text {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.chev {
		width: 12px;
		height: 12px;
		flex: none;
		color: var(--muted);
		transition: transform 0.15s ease;
	}

	.open .chev {
		transform: rotate(180deg);
	}

	.list {
		position: fixed;
		z-index: 100;
		overflow-y: auto;
		overscroll-behavior: contain;
		background: var(--surface);
		border: 1px solid var(--line);
		border-radius: 10px;
		box-shadow: var(--shadow);
		padding: 0.25rem;
	}

	.option {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		padding: 0.4rem 0.55rem;
		border-radius: 6px;
		font-size: 0.92rem;
		cursor: pointer;
		scroll-margin: 0.25rem;
	}

	.option[aria-disabled='true'] {
		opacity: 0.45;
		cursor: not-allowed;
	}

	.option.active {
		background: var(--accent-soft);
	}

	.option.chosen {
		font-weight: 600;
	}

	.tick {
		width: 12px;
		height: 12px;
		flex: none;
		color: var(--accent);
	}
</style>
