# AGENTS.md — Controcorrente

## Purpose
This file is the permanent operating specification for AI agents working on the Controcorrente restaurant website. Read it before changing code, content, images, CSS, navigation, publishing configuration, or repository structure.

## Core rule: minimal, surgical changes
- Change only what Paolo explicitly requests.
- Do not redesign, rewrite, reorganize, rename, “improve”, modernize, or clean up unrelated working parts.
- Preserve all existing working features unless the requested change necessarily affects them.
- Before substantial changes, inspect the current implementation and preserve a recoverable working state.
- Never delete this repository as part of hosting/deployment cleanup.

## Repository and hosting
- Canonical repository: `piol77/controcorrente`.
- This repository contains the current website and must be preserved.
- Netlify is no longer used: its projects/site were deleted and the GitHub ↔ Netlify authorization was removed.
- Do not recreate or reconnect Netlify unless Paolo explicitly asks.
- Do not assume that removing a hosting service means removing this repository.
- Before publishing, verify the actual current hosting/deployment configuration in the repository/account rather than guessing.

## Visual identity
- Keep the established Controcorrente nautical/marine identity.
- All pages and menu sections must look like parts of the same site.
- Antipasti, primi, secondi, vini/bevande and other menu areas must use a uniform visual language: same background treatment, waves/marine decoration, typography logic, spacing, cards/sections, image treatment and navigation.
- Do not allow one section to drift into a visibly different template.
- Preserve the current responsive/mobile presentation unless a change is specifically requested.
- Prefer the existing CSS/components/assets over introducing a second competing style system.
- When adding food imagery, use realistic food photography/imagery coherent with the dish and existing design; do not replace unrelated images.

## Menu content rules
When Paolo asks to add, remove, rename or change a dish:
1. Modify only the named dish(es)/field(s).
2. Leave all other dishes, prices, wording, order and styling unchanged unless explicitly requested.
3. Include a short description where the current design uses descriptions.
4. Keep prices exactly as instructed.
5. Maintain the existing layout and visual hierarchy.

### Allergens
- Show allergens only as the corresponding regional allergen-table numbers in parentheses.
- Never spell out allergen names beside dishes.
- Do not indicate sulphites.
- Do not invent allergen numbers: derive them from the actual ingredients when sufficiently known; if uncertain, flag the uncertainty instead of guessing.

### Frozen-at-origin marker
- Use `*` for ingredients/products frozen at origin.
- Always apply the marker to gamberetti/gamberoni and patatine fritte when they appear.
- Place the marker directly after the frozen ingredient name (for example `gamberetti*`, `gamberoni*`, `scampi*`), never after the price.
- Preserve the site's explanatory note for the asterisk where applicable.

## Restaurant wording and business rules
Preserve established Controcorrente wording and commercial rules unless Paolo explicitly changes them.
- Dinner cover charge: €1.50.
- Established wording includes “Comunicare allergie” and “*Ingredienti congelati all’origine”.
- For lunch, established communication includes “PRANZO CONTROCORRENTE”, reservations by 12, and acqua/caffè/coperto inclusi where currently applicable.
- Do not silently change prices, promotions, included items, booking conditions, opening information or business rules while editing another part of the site.

## Existing website features
### Anonymous visible counter
- Preserve the existing visible visit/click counter.
- Its purpose is a simple aggregate anonymous count.
- Do not add names, user identification, profiling or unnecessary tracking.
- Do not remove or replace it while editing unrelated code.

### “Tessera appunti”
- Preserve the existing notes/card (“tessera appunti”) feature and its current behavior.
- Do not remove, reset or redesign it as collateral damage from unrelated work.

## Content publishing procedure
Before committing/publishing:
1. Read this file and inspect the current site.
2. Identify exactly which files/components are required for the requested change.
3. Make the smallest viable edit.
4. Verify that navigation and all menu sections still work.
5. Check mobile/responsive rendering.
6. Check that the visual design remains uniform across sections.
7. Check prices, spelling, allergen numbers and frozen markers for changed dishes.
8. Verify that the anonymous counter still works.
9. Verify that the tessera appunti still works.
10. Ensure no unrelated content or business rule changed.
11. Preserve the repository and avoid destructive deployment/account operations unless explicitly requested.
12. After every change to dinner dishes or the daily special, update the shared English and Chinese translations in `menu-translations.js` as the final content check.

## Safety against accidental regressions
- Never bulk-delete old-looking assets until confirming they are genuinely unused by the current site.
- Never replace all menu pages/templates just to change one dish.
- Never change multiple prices because one price was requested.
- Never infer that a visually similar asset is obsolete without checking references in HTML/CSS/JS.
- If current code conflicts with these instructions, preserve the live/current behavior first and surface the conflict before destructive changes.
- If a request is ambiguous and could overwrite working content, inspect first and choose the non-destructive interpretation.

## Working style for AI/Work agents
Treat the current site as production, not as a blank design exercise. Existing approved appearance and behavior are the baseline. Paolo's explicit latest instruction overrides this file only for the specific requested change; it does not authorize unrelated changes.

When finished, report concisely:
- what was changed;
- which files were changed;
- whether checks passed;
- any uncertainty requiring Paolo's decision.

Last established: 2026-09-28.
