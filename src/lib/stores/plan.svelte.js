import { persisted } from './persisted.svelte';

export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const empty = () => DAYS.map(() => []);

const state = persisted('plan', empty());

export const plan = {
	get days() {
		// Guard against a stored plan written before the day count changed.
		if (state.value.length !== DAYS.length) state.value = empty();
		return state.value;
	},
	add(day, id) {
		if (!this.days[day].includes(id)) this.days[day].push(id);
	},
	removeAt(day, index) {
		this.days[day].splice(index, 1);
	},
	move(fromDay, index, toDay) {
		if (fromDay === toDay) return;
		const [id] = this.days[fromDay].splice(index, 1);
		if (id !== undefined && !this.days[toDay].includes(id)) this.days[toDay].push(id);
	},
	clearDay(day) {
		this.days[day] = [];
	},
	clear() {
		state.value = empty();
	},
	get ids() {
		return [...new Set(this.days.flat())];
	},
	get count() {
		return this.days.reduce((n, d) => n + d.length, 0);
	}
};
