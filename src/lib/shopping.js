/** Roughly the order you walk a supermarket, so the list doesn't zig-zag. */
const AISLE_ORDER = [
	'Produce',
	'Meat',
	'Seafood',
	'Cheese',
	'Milk, Eggs, Other Dairy',
	'Bakery/Bread',
	'Refrigerated',
	'Frozen',
	'Pasta and Rice',
	'Canned and Jarred',
	'Baking',
	'Spices and Seasonings',
	'Oil, Vinegar, Salad Dressing',
	'Condiments',
	'Nuts',
	'Savory Snacks',
	'Sweet Snacks',
	'Beverages',
	'Alcoholic Beverages',
	'Ethnic Foods',
	'Health Foods',
	'Gourmet',
	'Not in Grocery Store/Homemade',
	'Other'
];

export function aisleRank(aisle) {
	const i = AISLE_ORDER.indexOf(aisle);
	return i === -1 ? AISLE_ORDER.length : i;
}

/** Spoonacular sometimes tags one ingredient with several aisles; the first is the useful one. */
function aisleOf(ingredient) {
	const raw = ingredient.aisle?.split(';')[0]?.trim();
	return raw && raw.length ? raw : 'Other';
}

const UNIT_ALIASES = {
	'': '',
	g: 'g',
	gram: 'g',
	grams: 'g',
	gs: 'g',
	kg: 'kg',
	kgs: 'kg',
	kilogram: 'kg',
	kilograms: 'kg',
	ml: 'ml',
	milliliter: 'ml',
	milliliters: 'ml',
	millilitre: 'ml',
	l: 'l',
	liter: 'l',
	liters: 'l',
	litre: 'l',
	tsp: 'tsp',
	teaspoon: 'tsp',
	teaspoons: 'tsp',
	tbsp: 'tbsp',
	tablespoon: 'tbsp',
	tablespoons: 'tbsp',
	cup: 'cup',
	cups: 'cup',
	oz: 'oz',
	ounce: 'oz',
	ounces: 'oz',
	lb: 'lb',
	pound: 'lb',
	pounds: 'lb',
	clove: 'clove',
	cloves: 'clove',
	serving: 'serving',
	servings: 'serving',
	pinch: 'pinch',
	pinches: 'pinch',
	slice: 'slice',
	slices: 'slice'
};

function normalizeUnit(unit) {
	const u = unit.trim().toLowerCase();
	return UNIT_ALIASES[u] ?? u;
}

function titleCase(name) {
	return name.replace(/\b[a-z]/g, (c) => c.toUpperCase());
}

/** Bump grams to kilos and millilitres to litres once the number gets silly. */
function scaleUnit(amount, unit) {
	if (unit === 'g' && amount >= 1000) return { amount: amount / 1000, unit: 'kg' };
	if (unit === 'ml' && amount >= 1000) return { amount: amount / 1000, unit: 'l' };
	return { amount, unit };
}

export function formatAmount(amount) {
	if (!Number.isFinite(amount)) return '';
	if (amount >= 10) return String(Math.round(amount));
	if (amount >= 1) return String(Math.round(amount * 10) / 10);
	return String(Math.round(amount * 100) / 100);
}

/**
 * Roll a set of recipes into one shopping list: same ingredient in the same unit
 * gets added together, anything measured differently stays on its own line rather
 * than being guessed at.
 *
 * `options` is { servings, units } — every recipe is scaled from its own yield to
 * `servings` before anything is summed.
 */
export function buildList(recipes, options) {
	const lines = new Map();

	for (const recipe of recipes) {
		const base = recipe.servings && recipe.servings > 0 ? recipe.servings : options.servings;
		const factor = options.servings / base;

		for (const ingredient of recipe.extendedIngredients ?? []) {
			const measure = ingredient.measures?.[options.units];
			const rawAmount = (measure?.amount ?? ingredient.amount ?? 0) * factor;
			const unit = normalizeUnit(measure?.unitShort ?? ingredient.unit ?? '');
			const name = titleCase((ingredient.nameClean || ingredient.name || '').trim());
			if (!name) continue;

			const identity = ingredient.id ?? name.toLowerCase();
			const key = `${identity}|${unit}`;
			const existing = lines.get(key);

			if (existing) {
				existing.amount += rawAmount;
				if (!existing.from.includes(recipe.title)) existing.from.push(recipe.title);
			} else {
				lines.set(key, {
					key,
					name,
					aisle: aisleOf(ingredient),
					amount: rawAmount,
					unit,
					from: [recipe.title]
				});
			}
		}
	}

	return [...lines.values()]
		.map((line) => ({ ...line, ...scaleUnit(line.amount, line.unit) }))
		.sort((a, b) => aisleRank(a.aisle) - aisleRank(b.aisle) || a.name.localeCompare(b.name));
}

export function groupByAisle(lines) {
	const groups = new Map();

	for (const line of lines) {
		const bucket = groups.get(line.aisle);
		if (bucket) bucket.push(line);
		else groups.set(line.aisle, [line]);
	}

	return [...groups.entries()]
		.map(([aisle, group]) => ({ aisle, lines: group }))
		.sort((a, b) => aisleRank(a.aisle) - aisleRank(b.aisle));
}

/** Plain-text list for pasting into a notes app or a message. */
export function toText(groups) {
	return groups
		.map(({ aisle, lines }) => {
			const items = lines.map((l) => {
				const qty = [formatAmount(l.amount), l.unit].filter(Boolean).join(' ');
				return `- ${l.name}${qty ? ` — ${qty}` : ''}`;
			});
			return `${aisle}\n${items.join('\n')}`;
		})
		.join('\n\n');
}
