import { persisted } from './persisted.svelte';

/** Recipes ticked while browsing. Survives reloads so a shop can be built over days. */
const state = persisted('selection', []);

export const selection = {
	get ids() {
		return state.value;
	},
	has(id) {
		return state.value.includes(id);
	},
	toggle(id) {
		state.value = state.value.includes(id)
			? state.value.filter((x) => x !== id)
			: [...state.value, id];
	},
	remove(id) {
		state.value = state.value.filter((x) => x !== id);
	},
	clear() {
		state.value = [];
	},
	get count() {
		return state.value.length;
	}
};
