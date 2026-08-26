import { FOREVER, ONE_DAY, read, through, write } from './cache';
import { settings } from './stores/settings.svelte';
import { timeCeilingFor } from './difficulty';

const BASE = 'https://api.spoonacular.com';

export class ApiError extends Error {
	constructor(message, status) {
		super(message);
		this.name = 'ApiError';
		this.status = status;
	}
}

/** Cuisines Spoonacular indexes. Kept in menu order rather than alphabetical noise. */
export const CUISINES = [
	'African', 'American', 'British', 'Cajun', 'Caribbean', 'Chinese', 'Eastern European',
	'European', 'French', 'German', 'Greek', 'Indian', 'Irish', 'Italian', 'Japanese',
	'Jewish', 'Korean', 'Latin American', 'Mediterranean', 'Mexican', 'Middle Eastern',
	'Nordic', 'Southern', 'Spanish', 'Thai', 'Vietnamese'
];

export const MEAL_TYPES = [
	'main course', 'side dish', 'appetizer', 'salad', 'soup', 'breakfast', 'dessert', 'snack'
];

async function request(path, params) {
	const key = settings.apiKey;
	if (!key) throw new ApiError('No Spoonacular API key set yet.', 0);

	const url = new URL(BASE + path);
	for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
	url.searchParams.set('apiKey', key);

	settings.countRequest();

	let response;
	try {
		response = await fetch(url);
	} catch {
		throw new ApiError('Could not reach Spoonacular. Check your connection.', 0);
	}

	if (!response.ok) {
		if (response.status === 401) throw new ApiError('That API key was rejected.', 401);
		if (response.status === 402)
			throw new ApiError("Today's quota is used up. It resets at midnight UTC.", 402);
		if (response.status === 429)
			throw new ApiError('Rate limited — too many requests at once. Wait a moment.', 429);
		throw new ApiError(`Spoonacular returned ${response.status}.`, response.status);
	}

	return response.json();
}

function detailKey(id) {
	return `recipe:${id}`;
}

/**
 * complexSearch with fillIngredients returns full ingredient lists, so anything we
 * search is already good enough to build a shopping list from — no follow-up calls.
 */
function stash(recipes) {
	for (const recipe of recipes) {
		if (recipe.extendedIngredients?.length) write(detailKey(recipe.id), recipe, FOREVER);
	}
}

/** Returns { recipes, total, cached } — `cached` says whether it cost us a request. */
export async function search(params) {
	const ceiling = params.maxReadyTime ?? timeCeilingFor(params.difficulty);

	const query = {
		number: params.number,
		offset: params.offset,
		addRecipeInformation: 'true',
		fillIngredients: 'true',
		instructionsRequired: 'true',
		sort: 'popularity'
	};
	if (params.query.trim()) query.query = params.query.trim();
	if (params.cuisine) query.cuisine = params.cuisine;
	if (params.type) query.type = params.type;
	if (ceiling) query.maxReadyTime = ceiling;

	const cacheKey = 'search:' + JSON.stringify(query);
	const cached = read(cacheKey) !== null;

	const result = await through(cacheKey, ONE_DAY, async () => {
		const raw = await request('/recipes/complexSearch', query);
		return { recipes: raw.results ?? [], total: raw.totalResults ?? 0 };
	});

	stash(result.recipes);
	return { ...result, cached };
}

/**
 * Full details for a set of recipes, hitting the network only for ids we've never
 * seen. Cached forever — a published recipe doesn't change.
 */
export async function details(ids) {
	const found = new Map();
	const missing = [];

	for (const id of new Set(ids)) {
		const cached = read(detailKey(id));
		if (cached) found.set(id, cached);
		else missing.push(id);
	}

	if (!missing.length) return found;

	// informationBulk costs one point per recipe, so ask for them all in one shot.
	const fetched = await request('/recipes/informationBulk', {
		ids: missing.join(','),
		includeNutrition: 'false'
	});

	for (const recipe of fetched ?? []) {
		write(detailKey(recipe.id), recipe, FOREVER);
		found.set(recipe.id, recipe);
	}
	return found;
}

/** Whatever we already hold for an id, without ever touching the network. */
export function cachedRecipe(id) {
	return read(detailKey(id));
}
