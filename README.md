# Mise

A meal planner and shopping-list builder. Pick recipes, drop them onto a week, and the
ingredients add themselves up into one aisle-ordered list.

No backend: it's a static SvelteKit build that talks to Spoonacular straight from the
browser and keeps everything else in `localStorage`.

Plain JavaScript, no TypeScript.

## Running it

```sh
npm install
npm run dev
```

## The API key

Open Settings and paste a Spoonacular key — free, no card needed:
<https://spoonacular.com/food-api/console#Dashboard>

The free tier is small (a key issued in Aug 2026 reported a 50-point daily budget, not
the 150 the older docs mention), which is why the caching below matters. Settings shows
the real points remaining, read from the `X-API-Quota-Left` header Spoonacular exposes
on every response.

The key lives in `localStorage` and nowhere else. There's no `.env`, no build-time
variable, and nothing baked into the deployed files — a key compiled into a static
build is readable by anyone who visits the site, so there's no point pretending it's a
secret. Each browser brings its own, and each person spends their own quota.

## Cutting down requests

The free tier is small, so the data layer is built around not spending it:

- **Searches** are cached for 24 hours, keyed on the exact filter combination. Repeating
  a search costs nothing.
- **Recipes** are cached indefinitely — a published recipe doesn't change.
- Searching asks for `fillIngredients`, so results arrive with full ingredient lists
  already attached. Building a shopping list from recipes you've browsed needs **zero**
  extra requests.
- Anything that does need fetching goes through `informationBulk` in one call rather
  than one call per recipe.
- Concurrent callers asking for the same thing share a single in-flight request.
- Search only fires on submit, never per keystroke.
- The Settings page shows requests used today, points remaining, and what's on disk.
  `localStorage` quota errors evict the oldest half of the cache rather than failing
  the write.

## Difficulty

Spoonacular has no difficulty field, so `src/lib/difficulty.js` derives one from time
plus ingredient count: **Easy** ≤30 min and ≤7 ingredients, **Medium** ≤60 min and ≤12,
**Involved** beyond that. The API can pre-filter on time, so the ingredient half of the
rule is applied client-side to whatever comes back.

## Deploying to Netlify

`netlify.toml` is set up already — build `npm run build`, publish `build`, with a
catch-all rewrite to the SPA shell. Point Netlify at the repo and that's it: no
functions, no server, no environment variables to configure.

## Layout

```
src/lib/
  components/
    Select.svelte       listbox — the ARIA combobox pattern, popup portalled to <body>
    Checkbox.svelte     native input stripped with appearance:none, custom box and tick
    TextField.svelte    text/search/password, browser furniture removed
    NumberField.svelte  stepper; inputmode=numeric so phones get a keypad, no spinners
  spoonacular.js        API client — the only thing that makes network calls
  cache.js              localStorage cache: TTLs, quota eviction, request dedup
  shopping.js           merges ingredients across recipes, groups by aisle
  difficulty.js         the easy/medium/involved heuristic
  stores/
    persisted.svelte.js a $state rune mirrored into localStorage
    settings.svelte.js  API key, household size, units, daily request count
    selection.svelte.js recipes ticked while browsing
    plan.svelte.js      the seven-day board
    list.svelte.js      which pools feed the list, plus ticked-off items
    library.svelte.js   recipes currently on screen
```

## Form controls

Every control is hand-rolled — no component library, no dependencies.

`Select` is a real reimplementation rather than a restyle, because a native `<select>`
popup can't be styled at all. It follows the ARIA combobox pattern: focus stays on the
trigger, the highlighted option is announced via `aria-activedescendant`, and it
supports arrows, Home/End, Enter, Escape, Tab and type-to-jump. The popup is moved to
`<body>` and positioned `fixed`, so a card's `overflow` or the shopping list's column
layout can't clip it, and it flips above the trigger when there's no room below.

`Checkbox` keeps the native `<input>` for semantics and keyboard handling but removes
every browser-drawn pixel with `appearance: none`. `NumberField` avoids
`<input type="number">` entirely — its spinners differ per browser and disappear on
touch — using `inputmode="numeric"` with its own buttons instead.

`npm run check` runs `svelte-check` over the templates. It pulls in the `typescript`
package because that's the binary svelte-check drives, but nothing in `src/` is
TypeScript and `checkJs` is off.

## Notes on the shopping list

Quantities are scaled from each recipe's own yield to your household size before being
summed. The same ingredient measured two different ways (200 g of cheese in one recipe,
a cup in another) stays on two lines rather than being guessed at. Grams and millilitres
promote to kg and litres past 1000. Each line records which recipes it came from.
