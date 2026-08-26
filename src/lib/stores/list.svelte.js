import { persisted } from './persisted.svelte';

const state = persisted('list', {
	/** Which pools feed the shopping list. */
	useSelection: true,
	usePlan: true,
	/** Ticked-off line keys, so the list works as you walk the shop. */
	checked: []
});

export const list = {
	get useSelection() {
		return state.value.useSelection;
	},
	set useSelection(v) {
		state.value.useSelection = v;
	},
	get usePlan() {
		return state.value.usePlan;
	},
	set usePlan(v) {
		state.value.usePlan = v;
	},
	isChecked(key) {
		return state.value.checked.includes(key);
	},
	toggle(key) {
		state.value.checked = state.value.checked.includes(key)
			? state.value.checked.filter((k) => k !== key)
			: [...state.value.checked, key];
	},
	uncheckAll() {
		state.value.checked = [];
	}
};
