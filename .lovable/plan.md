# Citizen Legal AI — Precedent Retrieval Prototype

A single-page, frontend-only demonstration site built exactly to the provided specification. No backend, no external calls, no extra pages or features.

## What gets built

**Header (68–72px)** — document-search icon, "Citizen Legal AI", subtitle "Precedent Retrieval Prototype", and an outlined "Demonstration Only" badge on the right. No nav links.

**Search area** — heading "Find Similar Legal Precedents", supporting text, labelled "Case description" textarea prefilled with the given bail description, the given placeholder, three input hints, primary "Search Similar Cases" button (disabled while empty), secondary "Clear" text button, and the verification disclaimer beneath.

**Search behaviour** — clicking Search shows a restrained skeleton for ~600ms, then renders the five hardcoded records. Any non-empty query returns the same records.

**Results layout** — desktop two-column: 250–270px filter panel on the left, result list on the right. On mobile, filters become a collapsible "Filters" section above the results.

**Filter panel "Refine Results"** — Court level (All / Supreme Court / High Court), Year (All / 2023 / 2022 / 2021 / 2020), Legal issue (Regular Bail, Prolonged Custody, Documentary Evidence, Witness Interference, Flight Risk), plus "Reset filters". Filtering runs locally over the dataset.

**Transparency strip** — one small line above the list: "Prototype retrieval flow: case description → semantic and legal-term matching → fused ranking → source-linked evidence".

**Result header** — "5 Similar Precedents", subline "Ranked using semantic similarity and legal-term matching", and a static "Hybrid relevance" label on the right. No sorting.

**Each precedent row** — rank number, title, "Fictional demo record" badge, court, year, demo citation, "Demo relevance" percentage, procedural posture, matched legal issues, matched evidence passage in a light neutral area with a thin blue left border (only the key phrases highlighted), outcome highlight, an expandable "Why it matched" panel (first result open by default), and a visually present but disabled "Demo source" button with the specified tooltip.

**States** — pre-search empty state text; filtered-to-zero state with a "Reset filters" button. No illustrations.

**Footer** — thin border, two lines only, exactly as specified.

## Design system

Tokens added to `src/styles.css`: warm off-white background #F7F5F0, navy #102A43, blue #286FAE, teal #218A8D, saffron #C88A22, text #1F2937, muted #64748B, border #D8DEE6. Serif headings (e.g. Source Serif / Lora) + clean sans-serif UI text loaded via a `<link>` in the root route. Max width ~1280px, 6–10px radii, thin borders, very subtle shadows. No gradients, glassmorphism, illustrations, or decorative animation.

## Technical notes

- `src/data/precedents.ts` — the five records typed as `Precedent[]`, with the verbatim provided text; matched-evidence highlight phrases stored as a per-record array so highlighting is data-driven, not generated.
- `src/routes/index.tsx` replaces the placeholder home page and holds query/loading/filter state with `useState`.
- Presentation components under `src/components/legal/`: `SiteHeader`, `SearchPanel`, `FilterPanel`, `ResultsHeader`, `PrecedentItem`, `WhyItMatched`, `ResultSkeleton`, `SiteFooter`.
- Accessibility: `<label htmlFor>` on the textarea, fieldset/legend for filter groups, `aria-expanded`/`aria-controls` on the expand control, `aria-disabled` + accessible tooltip text on "Demo source", visible focus rings, semantic landmarks.
- Route `head()` gets a prototype-specific title and description.
- The uploaded PDF is treated as background reading only; nothing from it is embedded in the site.
