import { browser } from '$app/environment';

/**
 * A rune-backed value that mirrors itself into localStorage. Deep mutations are
 * picked up too, so callers can just do `plan.days[0].push(id)` and move on.
 */
export function persisted(key, initial) {
	const storageKey = `food:${key}`;

	function load() {
		if (!browser) return initial;
		try {
			const raw = localStorage.getItem(storageKey);
			return raw === null ? initial : JSON.parse(raw);
		} catch {
			return initial;
		}
	}

	let current = $state(load());

	if (browser) {
		$effect.root(() => {
			$effect(() => {
				try {
					localStorage.setItem(storageKey, JSON.stringify($state.snapshot(current)));
				} catch {
					/* quota or private mode — the in-memory value still works this session */
				}
			});
		});
	}

	return {
		get value() {
			return current;
		},
		set value(next) {
			current = next;
		},
		reset() {
			current = initial;
		}
	};
}
