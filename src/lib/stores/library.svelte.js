import { SvelteMap } from 'svelte/reactivity';
import { cachedRecipe, details } from '$lib/spoonacular';

/**
 * Recipes the app currently needs on screen. `get` is a pure read so it is safe to
 * call from a `$derived` or a template; everything that fills the map happens in
 * `ensure`, which pages call from an effect.
 */
const known = new SvelteMap();

let loading = $state(false);
let error = $state('');

export const library = {
	get loading() {
		return loading;
	},
	get error() {
		return error;
	},
	get(id) {
		return known.get(id);
	},

	/**
	 * Make sure every id is on screen: pull what the cache already holds, then make a
	 * single bulk request for whatever is genuinely unseen.
	 */
	async ensure(ids) {
		const missing = [];

		for (const id of ids) {
			if (known.has(id)) continue;
			const onDisk = cachedRecipe(id);
			if (onDisk) known.set(id, onDisk);
			else missing.push(id);
		}

		if (!missing.length) return;

		loading = true;
		error = '';
		try {
			const fetched = await details(missing);
			for (const [id, recipe] of fetched) known.set(id, recipe);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Could not load those recipes.';
		} finally {
			loading = false;
		}
	}
};
