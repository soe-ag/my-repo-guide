## Plan: Streamlined 2-Call "Repo Brief" Analysis

**What & Why:** Replace the current 7-section, 5-call pipeline with a 2-call pipeline that produces a single focused document. The existing `/analysis/[slug]` page already renders as a single scrollable page with heading-based sidebar navigation — so the UI barely changes. All the work is in the prompts and pipeline.

**Token impact:** ~1,500 output tokens vs current ~28,000. 85% reduction. 2 API calls vs 5.

---

**Proposed sections (single scrollable output, 6 sections total):**

| Section                | Call | Format                                                                                             |
| ---------------------- | ---- | -------------------------------------------------------------------------------------------------- |
| `## Overview`          | 1    | 2–3 sentence plain english description                                                             |
| `## Tech Stack`        | 1    | Table: Category \| Tool \| Role                                                                    |
| `## Project Structure` | 1    | Bullet list: folder → one-line purpose                                                             |
| `## Data Model`        | 2    | Table per entity: Field \| Type \| Purpose                                                         |
| `## Key Flows`         | 2    | flows (max is 10, but keep the extra as list not explaning in details), each as 3–4 numbered steps |
| `## Reading Order`     | 2    | Numbered list: file → what you'll learn                                                            |

Dense tables + bullets, zero prose padding. The sidebar auto-extracts these headings (already works today).

---

**Steps**

**Phase 1 — Prompts**

1. Replace all 6 prompt functions in `lib/prompts.ts` with two: `buildOrientationPrompt` and `buildDeepDivePrompt`
2. Update `ANALYSIS_TYPES` to `['orientation', 'deepDive']` and `ANALYSIS_LABELS` accordingly
3. Both prompts instruct the AI: _no prose intros, no padding, skip sections if data is absent, use tables_ — targeting 800–1,000 tokens each

**Phase 2 — Pipeline** _(depends on Phase 1)_ 4. Rewrite `analyzeRepo` in `convex/analyze.ts` as 2 steps:

- Step 1: file tree + `package.json` + config files → `orientation`
- Step 2: schema files + route files + up to 8 key source files → `deepDive`

5. Reduce `max_tokens` from `4096` to `1500` per call
6. Reduce input context budgets (Step 1: 25k chars, Step 2: 40k chars)
7. Merge both results into one markdown string, save to `savedAnalyses`

**Phase 3 — Schema** _(parallel with Phase 2)_ 8. Update `analyses.type` in `convex/schema.ts` from the 7-value union to `v.string()` — avoids a data migration, existing records stay valid

**Phase 4 — Progress UI** _(depends on Phase 2)_ 9. Update `components/analysis-progress.tsx` to show 2 steps with descriptive labels ("Analyzing orientation…", "Deep dive…") 10. Check `app/repo/[id]/page.tsx` — if `analysis-tabs.tsx` is still referenced there, update it to match new type names

---

**Relevant files**

- `lib/prompts.ts` — replace all prompt functions, update type constants
- `convex/analyze.ts` — rewrite pipeline, reduce `max_tokens`, tighten context budgets
- `convex/schema.ts` — widen `analyses.type` to `v.string()`
- `components/analysis-progress.tsx` — update step labels
- `app/repo/[id]/page.tsx` — check for tab references to remove

**Not touched:** `/analysis/[slug]/page.tsx` — already renders as single page with anchor sidebar, works perfectly as-is.

---

**Verification**

1. Run on a known small public repo — verify all 6 sections appear in the output
2. Verify the sidebar headings correctly extract Overview / Tech Stack / Project Structure / Data Model / Key Flows / Reading Order
3. Check total response time is under 30s for a typical repo
4. Run on a large repo (100+ files) — verify truncation still keeps it within token limits
5. Confirm old saved analyses still render correctly (heading-based, format-agnostic)

---

**Decisions**

- No prose padding — AI instructed to skip sections if no data, not to invent content
- `analyses.type → v.string()`: zero-migration schema widen; existing rows remain valid
- `structure` duplicate removed — currently the same AI response is stored twice under two keys; that bloat goes away
- Reading Order replaces Learning Path as the last section — same concept, much shorter (10–15 bullet points vs 4096-token essay)
