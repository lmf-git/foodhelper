/**
 * Spoonacular has no difficulty field, so derive one: time plus ingredient count is a
 * decent proxy for how much work a recipe actually is.
 */
export function difficultyOf(recipe) {
	const minutes = recipe.readyInMinutes ?? 0;
	const count = recipe.extendedIngredients?.length ?? 0;

	// No ingredient list yet (search results before details land): judge on time alone.
	if (!count) return minutes <= 30 ? 'easy' : minutes <= 60 ? 'medium' : 'hard';

	if (minutes <= 30 && count <= 7) return 'easy';
	if (minutes <= 60 && count <= 12) return 'medium';
	return 'hard';
}

/** The tightest maxReadyTime the API can pre-filter on for a difficulty. */
export function timeCeilingFor(difficulty) {
	if (difficulty === 'easy') return 30;
	if (difficulty === 'medium') return 60;
	return null;
}

export const DIFFICULTY_LABEL = {
	easy: 'Easy',
	medium: 'Medium',
	hard: 'Involved'
};

export function formatTime(minutes) {
	if (!minutes) return '—';
	if (minutes < 60) return `${minutes} min`;

	const h = Math.floor(minutes / 60);
	const m = minutes % 60;
	return m ? `${h} h ${m} min` : `${h} h`;
}
