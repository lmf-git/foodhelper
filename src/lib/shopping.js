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

/*
 * Canonical spellings only — plurals are handled by stripping the trailing "s"
 * below. Spoonacular returns both "tsp" and "tsps", "Tbsp" and "Tbsps" for the
 * same measure, and without this the same ingredient lands on two separate lines.
 */
const UNIT_ALIASES = {
	'': '',
	gram: 'g',
	gm: 'g',
	kilogram: 'kg',
	milliliter: 'ml',
	millilitre: 'ml',
	liter: 'l',
	litre: 'l',
	teaspoon: 'tsp',
	tablespoon: 'tbsp',
	ounce: 'oz',
	pound: 'lb',
	lbs: 'lb',
	package: 'pkg',
	packages: 'pkg'
};

/** Word units that read wrong in the singular: "2 cloves", not "2 clove". */
const PLURALISE = new Set([
	'clove', 'cup', 'slice', 'serving', 'pinch', 'drop', 'strip', 'head', 'leaf',
	'scoop', 'ball', 'sprig', 'stalk', 'bunch', 'can', 'pkg', 'handful', 'piece',
	'fillet', 'sheet', 'stick'
]);

/** "tsps" -> "tsp", "eggs" -> "egg". The "ss" guard keeps words like "glass" whole. */
function singularize(word) {
	return word.length > 2 && word.endsWith('s') && !word.endsWith('ss') ? word.slice(0, -1) : word;
}

function normalizeUnit(unit) {
	const u = unit.trim().toLowerCase();
	if (u in UNIT_ALIASES) return UNIT_ALIASES[u];

	const singular = singularize(u);
	return singular in UNIT_ALIASES ? UNIT_ALIASES[singular] : singular;
}

/*
 * The grouping key for an ingredient. Spoonacular is inconsistent in both
 * directions: "butter" and "unsalted butter" are different ids that both clean to
 * "butter", while "egg" and "eggs" share one id but clean to different names. So
 * key on the cleaned name, singularized — never on the id.
 */
function identityOf(name) {
	return singularize(name.trim().toLowerCase().replace(/\s+/g, ' '));
}

/** How a unit should read next to a given amount: "2 cloves", "3 pinches", "1 clove". */
export function displayUnit(amount, unit) {
	if (!PLURALISE.has(unit) || amount === 1) return unit;
	if (unit === 'leaf') return 'leaves';
	return /(ch|sh|s|x|z)$/.test(unit) ? `${unit}es` : `${unit}s`;
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

			const key = `${identityOf(name)}|${unit}`;
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
				const qty = [formatAmount(l.amount), displayUnit(l.amount, l.unit)].filter(Boolean).join(' ');
				return `- ${l.name}${qty ? ` — ${qty}` : ''}`;
			});
			return `${aisle}\n${items.join('\n')}`;
		})
		.join('\n\n');
}
