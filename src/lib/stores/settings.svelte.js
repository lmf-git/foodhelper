import { persisted } from './persisted.svelte';

const state = persisted('settings', {
	/** Spoonacular key. Lives only in this browser — there is nowhere else to put it. */
	apiKey: '',
	/** Household size. Recipes are scaled from their own serving count to this. */
	servings: 2,
	units: 'metric'
});

/** Cache misses per day, so the free tier's daily budget stays visible rather than surprising. */
const usage = persisted('usage', { day: '', requests: 0 });

function today() {
	return new Date().toISOString().slice(0, 10);
}

export const settings = {
	get apiKey() {
		return state.value.apiKey;
	},
	set apiKey(v) {
		state.value.apiKey = v.trim();
	},
	get servings() {
		return state.value.servings;
	},
	set servings(v) {
		state.value.servings = Math.max(1, Math.min(20, Math.round(v) || 1));
	},
	get units() {
		return state.value.units;
	},
	set units(v) {
		state.value.units = v;
	},

	get requestsToday() {
		return usage.value.day === today() ? usage.value.requests : 0;
	},
	countRequest() {
		if (usage.value.day !== today()) usage.value = { day: today(), requests: 0 };
		usage.value.requests += 1;
	}
};
