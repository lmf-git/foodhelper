/**
 * localStorage-backed cache. The whole point of this app's data layer: Spoonacular's
 * free tier is 150 points/day, so every response we can serve from disk is a request
 * we never send.
 *
 * Entries are stored as { v: value, e: expiry epoch ms (0 = never), w: written at }.
 */

const PREFIX = 'food:c:';

/** Recipes are immutable once published, so their details never need re-fetching. */
export const FOREVER = 0;
export const ONE_DAY = 24 * 60 * 60 * 1000;

const memory = new Map();

function storage() {
	try {
		return typeof localStorage === 'undefined' ? null : localStorage;
	} catch {
		// Private-mode browsers throw on access rather than returning null.
		return null;
	}
}

function live(entry) {
	return entry.e === 0 || entry.e > Date.now();
}

export function read(key) {
	const hit = memory.get(PREFIX + key);
	if (hit) {
		if (live(hit)) return hit.v;
		drop(key);
		return null;
	}

	const store = storage();
	if (!store) return null;

	const raw = store.getItem(PREFIX + key);
	if (!raw) return null;

	try {
		const entry = JSON.parse(raw);
		if (!live(entry)) {
			drop(key);
			return null;
		}
		memory.set(PREFIX + key, entry);
		return entry.v;
	} catch {
		drop(key);
		return null;
	}
}

export function write(key, value, ttl) {
	const entry = { v: value, e: ttl === FOREVER ? 0 : Date.now() + ttl, w: Date.now() };
	memory.set(PREFIX + key, entry);

	const store = storage();
	if (!store) return;

	try {
		store.setItem(PREFIX + key, JSON.stringify(entry));
	} catch {
		// Out of quota: shed the oldest half of our own keys and try once more.
		if (evictOldest(store, 0.5)) {
			try {
				store.setItem(PREFIX + key, JSON.stringify(entry));
			} catch {
				/* memory cache still has it for this session */
			}
		}
	}
}

export function drop(key) {
	memory.delete(PREFIX + key);
	storage()?.removeItem(PREFIX + key);
}

function ourKeys(store) {
	const keys = [];
	for (let i = 0; i < store.length; i++) {
		const k = store.key(i);
		if (k?.startsWith(PREFIX)) keys.push(k);
	}
	return keys;
}

function evictOldest(store, fraction) {
	const dated = ourKeys(store).map((k) => {
		let w = 0;
		try {
			w = JSON.parse(store.getItem(k) ?? '{}').w ?? 0;
		} catch {
			/* unparseable entries sort first and get dropped */
		}
		return { k, w };
	});
	if (!dated.length) return false;

	dated.sort((a, b) => a.w - b.w);
	for (const { k } of dated.slice(0, Math.max(1, Math.ceil(dated.length * fraction)))) {
		store.removeItem(k);
		memory.delete(k);
	}
	return true;
}

/** Wipe every cached response. Exposed on the Settings page. */
export function clearAll() {
	memory.clear();
	const store = storage();
	if (store) for (const k of ourKeys(store)) store.removeItem(k);
}

export function stats() {
	const store = storage();
	if (!store) return { entries: memory.size, bytes: 0 };

	const keys = ourKeys(store);
	let bytes = 0;
	for (const k of keys) bytes += (store.getItem(k)?.length ?? 0) + k.length;
	// UTF-16 code units on disk.
	return { entries: keys.length, bytes: bytes * 2 };
}

const inflight = new Map();

/**
 * Cache-through fetch. Concurrent callers asking for the same key share a single
 * network round-trip instead of racing each other into the quota.
 */
export async function through(key, ttl, load) {
	const cached = read(key);
	if (cached !== null) return cached;

	const running = inflight.get(key);
	if (running) return running;

	const promise = load()
		.then((value) => {
			write(key, value, ttl);
			return value;
		})
		.finally(() => inflight.delete(key));

	inflight.set(key, promise);
	return promise;
}
