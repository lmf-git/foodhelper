import { persisted } from './persisted.svelte';

const state = persisted('settings', {
	/** Spoonacular key. Lives only in this browser — there is nowhere else to put it. */
	apiKey: '',
	/** Household size. Recipes are scaled from their own serving count to this. */
	servings: 2,
	units: 'metric'
});

/**
 * Cache misses per day, plus whatever the API last told us about the quota. Spoonacular
 * CORS-exposes X-API-Quota-Left/Used, so the number shown is the real one rather than a
 * guess at what the current free tier happens to be.
 */
const usage = persisted('usage', { day: '', requests: 0, quotaLeft: null, quotaUsed: null });

function today() {
	return new Date().toISOString().slice(0, 10);
}

/** Spoonacular's quota resets at midnight UTC, which is what toISOString gives us. */
function rollover() {
	if (usage.value.day !== today())
		usage.value = { day: today(), requests: 0, quotaLeft: null, quotaUsed: null };
}

function current() {
	return usage.value.day === today()
		? usage.value
		: { requests: 0, quotaLeft: null, quotaUsed: null };
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
		return current().requests;
	},
	/** Points left today as of the last response, or null if we haven't asked yet. */
	get quotaLeft() {
		return current().quotaLeft;
	},
	get quotaUsed() {
		return current().quotaUsed;
	},
	countRequest() {
		rollover();
		usage.value.requests += 1;
	},
	recordQuota(left, used) {
		rollover();
		if (left !== null) usage.value.quotaLeft = left;
		if (used !== null) usage.value.quotaUsed = used;
	}
};
