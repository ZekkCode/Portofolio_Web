---
name: paper-to-code-components
description: Use when implementing Paper MCP, Paper-to-code, design-to-code, Viewfinder, or Paper-exported JSX in React/Next.js apps with component candidates, tokens, and shadcn reuse.
---

# Paper-to-Code Componentization

You turn Paper designs into React/Next code with component boundaries identified before JSX grows.

Hard rule: before writing implementation JSX for a Paper design, map the design hierarchy and component candidates. Pixel fidelity and componentization are both required.

## RED/GREEN Intent

This skill prevents these Paper-to-code failures:

- Dumping a whole artboard into one giant route or component
- Spotting repeated cards, rows, or controls only after the file is huge
- Collapsing distinct icons or logos into one `name`-switched mega-component
- Rebuilding a list, row, or card in a new section instead of reusing a component already extracted for it
- Removing Viewfinder `data-paper-*` attributes from useful roots
- Adding client hooks only to manage static visual variants
- Building from whichever artboard is easiest to convert instead of the one the stakeholder treats as canonical — multi-iteration files routinely include simplified handoff/cleanup frames
- Flattening a chart into pixels: dropping error bars, whiskers, ranges, or stacked segments and modelling one value where the design encodes several
- Re-deriving a chart from a screenshot or from className literals when transforms make those literals wrong
- Dumping every component into one flat folder so data charts sit intermixed with prose, chrome, and decoration

GREEN outcome: repeated visual groups are extracted once, components are grouped by kind (data visualizations in their own folder, not intermixed with chrome and prose), page files read as composition, charts carry every data dimension the design encodes, and the build still matches Paper — reconciled against the artboard the stakeholder considers canonical, not whichever one it was built from.

## 1. Extract the Design Hierarchy First

Before coding, inspect the Paper selection/tree/screenshot and identify:

1. Page shell and semantic regions
2. Navigation, hero, content sections, sidebars, overlays, and footers
3. Repeated cards, rows, messages, list items, badges, pills, and controls
4. Icon button variants, CTA variants, input variants, and menu items
5. Reusable asset treatments: avatars, logo lockups, screenshot frames, masks, shadows, and image crops

Scan the entire design, not one section at a time. The same row, list, or card pattern often reappears in sections far apart on the canvas, styled to look section-specific. A title-and-description list under one heading and the same list under another heading are one component. Catalog each recurring structure once, noting every section it appears in.

**Pick the canonical frame first.** A Paper file often holds many parallel iterations of the same screen, plus handoff/cleanup frames — and they are not interchangeable. The most code-ready artboard (clean, named flex cells) is frequently a *simplified* handoff frame where fiddly detail was dropped (chart error bars, extra states, decorations), while the visually richest version is an absolute-positioned exploration. Do not default to whichever is easiest to convert. Confirm which frame is canonical from the user's current selection or by asking; when frames disagree on what a component shows or how much data it carries, build the richer encoding and flag the discrepancy instead of silently shipping the simpler one.

Write a short hierarchy note in your working context before implementation. Do not skip this because the export looks straightforward.

## 2. Choose Component Candidates

Create a named component when any of these are true:

1. A visual group appears two or more times, including near-duplicates
2. A semantic region has a reusable role, such as `PricingCard`, `MessageRow`, or `FeatureSection`
3. A control has variants, such as `IconButton`, `Pill`, `Badge`, or `CTAButton`
4. A repeated card, row, message, or list item changes only text, icon, media, color, or state
5. An asset treatment repeats, such as an avatar frame, logo mark, image mask, or screenshot shell

Near-duplicates use variant props or slots. Do not copy and tweak the same JSX block.

Before building each section, check the candidates you already cataloged for a structural match and reuse it. Do not create a second component for a pattern you already have just because it sits in a different section or holds different text.

## 3. One Component Per Icon

Icons and logos that differ in their actual artwork are distinct components, not variants of a shared one.

1. Give every visually distinct icon or logo its own named component, named for what it depicts: `<Kimi />`, `<OpenAI />`, `<Anthropic />`, `<Gemini />`, `<MiniMax />`.
2. Never bundle distinct icons behind one component that switches on a `name`, `type`, or `variant` prop, or an internal map or `switch`. No `BrandIcon name="kimi"`, no `<Icon type="openai" />`, no `icons[name]` lookup that inlines many `<svg>` bodies.
3. The near-duplicate-to-variant rule in Section 2 does NOT apply to icons. Different vector paths are different artwork, so they are different components. Variant props are for shared markup that differs by text, color, size, or state, never for swapping one `<svg>` body for another.
4. Shared chrome around an icon is the exception worth extracting. If every logo sits in the same dashed-circle frame, make one `LogoFrame` or `AvatarFrame` wrapper and pass the distinct icon component in as `children`. The frame is shared; the mark stays per-icon.
5. Put each icon in its own file under the project's icon location, match the exported SVG exactly (viewBox, paths, fills), and reuse existing icon components or an installed icon set before hand-rolling new ones.

**Bad:** `BrandIcon({ name })` with a `switch (name)` returning ten different `<svg>` blocks.

**Good:** `Kimi`, `OpenAI`, `Anthropic`, `Gemini`, and `MiniMax` as separate components, each its own SVG, with a shared `LogoFrame` wrapping whichever mark is passed in.

## 4. Define Boundaries and Props

For each component candidate, define before or while coding:

1. Component name based on the reusable structural UI role, not the content of the first place it appears or Paper layer names. A title-plus-description list is `LabeledList` or `DefinitionList`, not `FailureList`; a content-specific name hides the component from the next section that needs it
2. Responsibility in one sentence
3. Props for changing text, icons, media, hrefs, state, and visual variants
4. `children` or named slots for flexible content areas
5. The root element that keeps relevant `data-paper-*` attributes
6. File placement by kind — which folder the component lives in. Group by responsibility instead of one flat dump: data-visualization/chart components in a dedicated folder (e.g. `components/charts/`), layout/chrome (nav, header, footer) together, typography/prose primitives together, and decoration (watermarks, background figures) separate. Icons go in the project's icon location (§3). A flat folder where a `Leaderboard` chart sits beside a `Watermark` and a `Para` buries the substantive data components and blurs which files are figures versus chrome. Within each group, use flat kebab-case files imported directly (shadcn style) — not folder-per-component with `index.ts` barrels, which trip React Doctor's `no-barrel-import` (§9).

Keep one-off decorative leaf elements inside the nearest semantic component. Extract repeated decoration into a small component only when the treatment repeats.

## 5. Implementation Rules

- Preserve Paper visual fidelity: spacing, typography, color, radius, shadows, image crops, and responsive behavior must still match the design.
- Keep Viewfinder/Paper `data-paper-*` attributes on useful rendered roots. If splitting exported JSX, move the relevant attributes to the new component's root.
- Use the project's existing styling system: Tailwind where nearby code uses Tailwind, CSS modules where nearby code uses CSS modules, and existing tokens when present.
- Prefer React Server Components in Next.js. Add `"use client"` only for state, browser APIs, event handlers that need client behavior, or client-only animation libraries.
- Do not add hooks for static presentational variants. Use props, classes, CSS variables, or data attributes.
- Reuse existing app components, icons, assets, and helpers before creating new local versions.
- Reuse the components you extracted earlier in the same pass. A structure that recurs across sections gets one component rendered with different props, not a near-copy per section.

## 6. Standardize Arbitrary Values

When Paper-exported JSX contains arbitrary values, preserve the rendered pixels and move the values into named project tokens in `globals.css` before completion.

Tokenize arbitrary values for:

1. Typography: `text-[21px]/9.5`, `tracking-[-0.02em]`, font families, font weights
2. Colors: `text-[color(display-p3_...)]`, arbitrary backgrounds, borders, gradients
3. Shape and depth: `rounded-[13px]`, custom shadows, outlines, rings
4. Layout and spacing: arbitrary widths, heights, gaps, padding, margins, transforms

Use the local Tailwind/CSS pattern already present in `globals.css`, such as `@theme`, CSS variables, or project token aliases. Replace opaque inline arbitrary classes with named utilities backed by those tokens. Do not change the visual value while naming it.

For sizing and spacing, first reach for Tailwind v4's built-in spacing scale, not an arbitrary bracket. Utilities like `w-`, `h-`, `max-w-`, `min-w-`, `p-`, `m-`, `gap-`, `inset-`, `top-`/`left-` take a bare number where `<n>` = n × 0.25rem (4px at the default scale), so a pixel value that lands on the scale must use the scale utility: `max-w-[1160px]` → `max-w-290`, `gap-[24px]` → `gap-6`, `h-[96px]` → `h-24`. A linter will flag `max-w-[1160px]` precisely because `max-w-290` already exists. Keep `[...]` brackets only for values that do NOT land on the scale (e.g. `w-[17.18px]` or a one-off `max-w-[680px]` that you would otherwise tokenize).

**Bad:** Introduce a layout width as `max-w-[1160px]` / `max-w-[840px]` — both land on the scale and will be flagged.

**Good:** Write `max-w-290` / `max-w-210` (1160 ÷ 4, 840 ÷ 4) using the v4 spacing scale.

**Bad:** Keep `text-[21px]/9.5 tracking-[-0.02em] text-[color(display-p3_0.251_0.251_0.251)]` inline because it matches Paper.

**Good:** Add matching `globals.css` tokens for the 21px text size, line-height, tracking, and P3 color, then use the named utilities in the component.

**Keep intentional one-offs; tokenize only what the design repeats.** Tokenizing is for values the design uses consistently. When an element deliberately deviates — a brand mark drawn in a different shade than its provider token, a specific fill alpha, one chart series' exact width — keep the design's actual value for that instance instead of snapping it to the nearest existing token. Match the design first; abstract only where the design is genuinely consistent. Collapsing a deliberate deviation into a generic token silently changes the design.

## 7. Reuse shadcn Before Custom Markup

Before creating custom JSX for controls or common UI surfaces, deeply search for shadcn candidates.

1. Search the project for existing shadcn components, especially `components/ui`, `components.json`, imports from `@/components/ui/*`, and local wrappers around shadcn primitives.
2. Check `https://ui.shadcn.com/` for canonical components that match the pasted design, including Button, Card, Tabs, Input, Dialog, Badge, Dropdown Menu, Accordion, Tooltip, Select, Checkbox, Radio Group, Switch, Sheet, Popover, and Table.
3. If a local or canonical shadcn component matches the semantic role, repurpose and restyle it to match the Paper paste instead of recreating equivalent markup.
4. Record the searched local paths, shadcn website component names, and reuse/no-match decision in your working notes or final response.
5. Only create custom markup after documenting why no existing or canonical shadcn component fits the semantic role.

## 8. Port the Real Fonts, Don't Substitute

Paper font stacks name a real typeface first and end in a generic fallback, e.g. `font-['EKBaumerUniwidthTRIAL-Regular','EK_Baumer_Uniwidth_TRIAL_',system-ui,sans-serif]`. The `system-ui`/`sans-serif`/`serif` tail is NOT the design — it renders only when the real font is missing. Mapping those names to Geist, Georgia, or a bare system stack silently reskins every line of text, and is the most common reason a faithful-looking conversion still reads "slightly off."

1. Port the actual font files. With paper-sync they ship under `.paper-sync/<fileId>/public/paper-assets/fonts/*.otf` and are declared in that file's `paper.css`; otherwise take them from the design's source. Copy the weights the design uses into the app (e.g. `public/fonts/`), declare `@font-face` with matching `font-weight`/`font-style`, and point the tokens at the real family.
2. Keep every DISTINCT typeface as its own token. Designs routinely use several families by role — an editorial body face, a serif display face, a UI/label face, a numeric/mono face, a code face. Do not collapse them into one `--font-sans`/`--font-mono`. Map each Paper stack to a named token by role (`--font-sans`, `--font-serif`, `--font-data`, `--font-numeric`, `--font-mono`) and apply the right one per element. Collapsing a body face and a data/label face into Geist is a fidelity bug even when the text content is correct.
3. Match weights and styles with real cuts via `@font-face` (400 / 500 / italic). Keep `font-synthesis: none` so a missing cut fails visibly instead of faux-bolding into a different look.
4. Trial/licensed fonts: port them for local parity and flag that production needs licensed copies. Do not substitute a lookalike to dodge licensing — that reintroduces the exact drift.

**Bad:** `--font-sans: var(--font-geist-sans), system-ui` and `--font-serif: Georgia` because the trial fonts "aren't available."

**Good:** Copy `ekbaumeruniwidthtrial-*.otf`, `testmartinaplantijn-*.otf`, and `gtmechanik*trial-*.otf` into `public/fonts`, add `@font-face` per weight, and set `--font-sans`/`--font-serif`/`--font-data`/`--font-numeric` to the real families with Geist/system only as fallback.

## 9. Charts and Data Visualizations Are Semantic, Not Pixels

A chart in Paper is geometry, not a chart. Bars, error bars, whiskers, hatches, axes, gridlines, trend lines, and stacked segments are piles of rectangles, 1px lines, and rotated/transformed nodes with magic numbers. `get_jsx` / copy-as-Tailwind reproduces those pixels faithfully and the *meaning* not at all. Treat every chart as a data-driven component and reverse-engineer the encoding before rendering it.

1. **Recover the data model, with full dimensionality.** Count what each mark encodes: a plain bar is one number; a bar with an error bar is three (value + low/high); a box-and-whisker is up to five; a stacked bar is N segments. Model every dimension as a data field and render marks from that data. If a value the design shows has no field to live in, you are dropping data — add the field, do not flatten to the single number the simplest frame happens to show.
2. **Read computed geometry, not className literals.** Transforms make the literal `w`/`h` wrong: a whisker is often `w-[7px] h-[73px] rotate-90`, so its real horizontal length is the rotated height. Use `get_computed_styles` for post-transform `left`/`width`, find the axis tick nodes, and convert pixels to domain units (%, score, tokens) from that scale. Never read the bracketed class or eyeball a screenshot for chart values.
3. **One logical mark can be several overlapping primitives.** A single bar may be a hatch rect `[0, lo]` + a bordered box `[0, median]` + a whisker line with end caps `[lo, hi]`. Infer the grouping and express it as one component driven by the data, not as the loose stack of positioned rects the export hands you.
4. **Port the design's real numbers; never invent them.** Chart figures are often illustrative placeholders — port the design's actual extracted geometry as the data and say it is placeholder. If the numbers must be real, get them from the user. Eyeballing widths off a render is the failure this section exists to prevent.
5. **Co-locate the charts; import them directly — no barrels.** Keep data-visualization components together (e.g. `components/charts/`), separate from prose, chrome, and decoration. Import each by its direct file path; do NOT add a barrel / `index.ts` that re-exports them, and do NOT use a folder-per-component layout (which forces per-folder `index.ts` barrels). React Doctor's `no-barrel-import` rule flags barrels because importing one symbol pulls the whole barrel into the bundle (extra code, slower load). Prefer flat kebab-case files (shadcn style). A genuine registry that aggregates and *uses* every member (e.g. an `iconsByName` map) is fine — that's a module with real logic, not a re-export barrel.

**Bad:** Paste the exported chart — dozens of `left-[675.98px] … rotate-90` rects and 1px lines — into the component, or model a box-and-whisker as one `width: pass%` bar because that is what the cleanest artboard showed.

**Good:** Define `{ value, ciLo, ciHi }` per row, read each segment's post-transform geometry with `get_computed_styles`, convert against the axis ticks, and render one `<Bar>` / `<Whisker>` component from the data.

## 10. Verify Against the Source Render

Componentization and tokenization drift in ways that read as "close but not right" — substituted fonts, rounded spacing, or dropped decorations (a code-chip background, a hairline, a badge). Reading the code is not enough; compare pixels before claiming fidelity.

**Diff against the canonical frame, not the one you built from.** In a multi-iteration file these differ — verifying against the artboard you converted will always pass while still not matching what the stakeholder sees. If the reference shows data or elements your component has no field or structure for (error bars, extra segments, badges, states), that is a version/iteration mismatch: flag it and confirm the source frame; do not silently ship the simpler version or invent data. See the `reconcile-paper-sync` skill.

1. Screenshot the built page AND the reference at the SAME width — mismatched widths hide layout differences (compare a 1300px capture to a 1300px capture, not 820 vs 1200). Use the Paper screenshot, or the paper-sync `?preview#<FRAME>` render, as the reference. Diff typography (typeface, size, line-height, weight, tracking), color, spacing, and every decorative element.
2. Reconcile layout structure, not only styles: the stacking ORDER of sections (is the nav above or below the header band?), the content column WIDTH and text MEASURE (does the same paragraph wrap to the same number of lines?), and the page margins. An arbitrary `max-w-*` that looks fine in isolation is wrong if the design's measure is wider or narrower — match the design's width, don't invent one.
3. Reconcile each remaining difference back to the source values. A flow/responsive layout will not be pixel-identical to absolute Paper coordinates, but element order, typeface, type scale, colors, width/measure, and per-element decorations must match.
4. Watch for silently dropped leaf elements: background chips behind inline code, underlines, dashed outlines, dividers, and small markers are easy to lose when converting absolute nodes to flow.

## Example

**Bad:** Paste the full Paper export into `app/page.tsx`, duplicate six testimonial cards inline, and plan to "clean it up later" after pixel matching.

**Good:** Before coding, identify `HeroSection`, `FeatureCard`, `TestimonialCard`, and `IconButton`. Implement `FeatureCard({ icon, title, body, tone })`, render the six cards from data, and keep each component's root `data-paper-*` attribute where Viewfinder needs it.

## Escape Hatches Closed

| You Think | Do This Instead |
|---|---|
| "The export is small enough." | Still map hierarchy and extract repeated groups before completion. |
| "I'll componentize later." | Componentize during implementation. Later cleanup is not the workflow. |
| "Pixel matching requires one giant file." | Match pixels with component props, slots, and local styles. |
| "These groups are almost the same, not identical." | Use variant props or slots unless the semantic responsibility differs. |
| "I already built a list like this in another section." | Reuse the component you extracted. The same structure across distant sections is one component, named for its role, not its first use. |
| "Each brand icon is just an icon variant." | Distinct SVG artwork is a distinct component. Make `<Kimi />`, `<OpenAI />`, and so on; never one `BrandIcon name=...` switch. |
| "The user only asked to paste the design." | Paper-to-code implementation includes component boundaries. |
| "`data-paper-*` attributes clutter the JSX." | Keep them on useful roots so Viewfinder can map code back to design. |
| "This static variant needs a hook." | Use props/classes/CSS instead. Hooks are for behavior, not static appearance. |
| "Arbitrary Tailwind is the only way to match pixels." | Put the same values in `globals.css` tokens and use the named utilities. |
| "This exact pixel width needs a `[...]` arbitrary value." | If it lands on the 4px spacing scale, use the v4 scale utility (`max-w-290`, not `max-w-[1160px]`). Brackets are for off-scale values only. |
| "A quick component search found nothing obvious." | Search local shadcn usage and `https://ui.shadcn.com/` before writing custom equivalents. |
| "The font stack has a `system-ui` fallback, so the fallback is fine." | The fallback only shows because the real font is missing. Self-host the actual font files and `@font-face` them. |
| "One `--font-sans` covers all the text." | Designs use several typefaces by role. Keep body / serif / data / numeric / code as separate tokens. |
| "It reads correctly, so it matches." | Screenshot the build against the Paper frame (or paper-sync `?preview`) and reconcile typeface, spacing, and dropped decorations. |
| "I'll build from the cleanest artboard." | A clean handoff frame is often a simplified one. Confirm which iteration is canonical and build the richer encoding. |
| "It's a chart, I'll paste the exported rects." | A chart is a data-driven component. Recover a data model with every dimension (value, ranges, segments) and render marks from data. |
| "A barrel / `index.ts` keeps imports tidy." | Barrels trip React Doctor's `no-barrel-import` — importing one symbol ships the whole barrel. Use flat kebab-case files (shadcn) + direct imports. |
| "All the components can live in one folder." | Group by kind. Put data-visualization/chart components in a dedicated folder, separate from chrome, prose, and decoration. |
| "The class says `h-[73px]`, so the bar is 73 tall." | Transforms make literals lie (a rotated whisker). Read computed post-transform geometry and convert via the axis ticks. |
| "This series should use the provider color token." | If the design used a specific shade here, keep it. Tokenize only values the design uses consistently. |
| "I verified against the design I converted." | Verify against the artboard the stakeholder treats as canonical; in a multi-iteration file it may not be the one you built from. |

## Before Marking Complete, You MUST:

1. Document the Paper hierarchy and component candidates before or during coding
2. Extract every repeated visual group, control, card, row, message, and repeated asset treatment into a named component
3. Reuse one component for any structure that recurs across sections; name components by reusable role (`LabeledList`), not by the first section's content (`FailureList`)
4. Give each visually distinct icon or logo its own component; never bundle multiple SVGs behind one `name`- or `variant`-switched component
5. Define prop shapes for extracted components before their JSX becomes duplicated
6. Keep route/page files as composition, not giant copied JSX exports
7. Preserve Paper visual fidelity after componentization
8. Keep relevant Viewfinder/Paper `data-paper-*` attributes on rendered roots
9. Move arbitrary Paper values into `globals.css` tokens without changing their rendered values; use Tailwind v4 spacing-scale utilities (e.g. `max-w-290`, `gap-6`) for on-scale sizes instead of `[...]` brackets
10. Deeply search local shadcn components and `https://ui.shadcn.com/`; record the searched candidates and repurpose/restyle matches before creating custom markup
11. Use the project's existing styling system and avoid unnecessary client components/hooks
12. Port the fonts the Paper export references (self-host the real files + `@font-face`); keep each distinct typeface as its own token; never ship the `system-ui`/Georgia fallback as if it were the design
13. Screenshot the built page against the Paper frame (or paper-sync `?preview#<frame>`) at the SAME width and reconcile element stacking order, content width / text measure, typeface, type scale, color, spacing, and any dropped decorations
14. Read `package.json` and run available scripts named `lint`, `typecheck`, `test`, and `build` with the repo's package manager; if a script is missing, state that it is missing
15. Review the final diff and remove duplicated JSX blocks before responding
16. Confirm which artboard is canonical when the file holds multiple iterations or a simplified handoff frame, and reconcile the build against that frame rather than the one it was converted from
17. For every chart or data visualization, model each data dimension the design encodes (value plus ranges / segments / error bars), derive marks from computed geometry and the axis scale rather than className literals or screenshots, and mark ported figures as placeholders unless given real numbers
18. Group components by kind — data-visualization/chart components in a dedicated folder (e.g. `components/charts/`), separate from layout/chrome, prose, and decoration — rather than leaving them intermixed in one flat folder

Do not skip any step. No exceptions for "small export," "just this once," "the user did not ask," "pixel matching first," or "I'll refactor after it works."
