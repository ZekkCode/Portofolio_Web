# ZEKKTECH — P0 STABILITY + P1 SITE-WIDE ANTI-SLOP

**Antigravity implementation prompt**  
Repository: `https://github.com/ZekkCode/Portofolio_Web`  
Workspace: `E:\ProjectZekk\Porotofolio-Zekk`  
Reference branch: `master`, observed HEAD `5d0b204d8e78f97c8e00c374549d056e1ada73cc` (commit dated 2026-11-13 23:17 UTC).  
Use local workspace files as the authority if more recent than GitHub. Never reset or overwrite uncommitted work.

## Task and non-negotiable constraints

You are a senior frontend designer/engineer and performance investigator. **The entire public ZekkTech website requires an anti-AI-slop design audit and implementation**, not only Academic Journey. The user specifically rejects arbitrary status pills, decorative category badges, `#01`/`#02` card numbering, redundant text, overused icon tiles, stacked borders/rings/shadows, and template-like repeated card structures. Make the interface feel personally designed, understated, and editorial.

**P0: First prove the site does not hang and Lenis + GSAP scrolling is smooth.** The latest GitHub commit already claims to fix scroll lag; verify its actual behavior in the local working tree and a production build. Do not duplicate or regress the existing fix. Only start P1 visual refactoring after P0 passes reproducible checks. When P0 fails, report blockers and prioritize stability instead of disguising them with static or disabled visual effects.

Maintain all signature experiences when the browser supports them: Lanyard 3D/physics/drag, two-way GSAP parallax, Lenis, ShapeGrid animation, stationary Sticker Peel with corner peeling, randomized sticker placement on full refresh, interactive CV Folder, Miss Minute, Tech Stack marquee, horizontal Academic/Career navigation and year-based logo emphasis. No visible Lite/Balanced/Full toggle. Do not reduce the project to static cards for a Lighthouse score. Respect `prefers-reduced-motion` for accessibility.

**Do not:** modify personal history, delete CMS records, rewrite entire layouts, reset Supabase, change R2 permissions, alter security, add new decorative UI patterns, create PRs, merge, deploy, or push automatically. Keep IDs/EN, light/dark mode, responsive layouts, admin CRUD, image references, accessible semantics and SEO intact.

## Phase 0 — Read and apply the user's skills

Read the actual `.agents/skills/<skill>/SKILL.md` files in the local repository before touching code:

- Design audit: `anti-slop-design`, `design-taste-frontend`, `better-layout`, `better-icons`, `improve-ui`, `ui-design-brain`, `ui-styling`.
- Editorial content: `anti-slop`, `anti-ai-slop-writing`, `stop-slop`.
- Motion: `gsap-scrolltrigger`.
- Quality/accessibility: `web-quality-seo`.
- Data safety, **only if CMS fields need adjustment**: `supabase`, `supabase-postgres-best-practices`.

Use each skill only where relevant. The repo contains the skill files; do not claim a skill is missing before checking it. Do not install a parallel design system or animation library. Record exactly which skills influenced each change.

## Phase 1 — Audit all sections and WRITE Markdown reports in the repository

First create **real Markdown files on disk**, not only chat commentary:

1. `docs/audits/ZEKKTECH-SITEWIDE-ANTI-SLOP-AUDIT.md`
2. `docs/audits/ZEKKTECH-P0-SCROLL-PERFORMANCE-TRACE.md`
3. `docs/audits/ZEKKTECH-SITEWIDE-VISUAL-QA.md`

The anti-slop audit must have a table with columns: **Section / File / Specific DOM or class / Why this is visual noise / Keep-or-change decision / Proposed replacement / Priority / Screenshot evidence / Result**. Include **all** public sections, not only the two seen in screenshots. Audit mobile and desktop, both themes, and Indonesian/English texts. Report each proposed removal's information value. Do not use a simplistic rule such as “delete every badge”; the objective is intentional hierarchy.

Before changes, capture screenshots of actual representative pages and section states. Compare after. Preserve screenshot files under an appropriate local audit directory if existing project practices allow, and link them from the Markdown reports.

## Verified code findings to inspect (from GitHub `master` at `5d0b204`)

These are **confirmed source patterns**, not proof that each produces an actual browser failure. Recheck local code and exact line numbers before editing.

| Component | Concrete source evidence | Required review |
|---|---|---|
| `src/components/academic-journey-section.tsx` | A header renders `#0{idx + 1} • {edu.startYear}` (near line 445); a colored `rounded-full` status pill follows (near 448), and the active card has `border-brand shadow-lg ring-1 ring-brand/20` (near 406). | Remove arbitrary numbered labels; show year only once in the relevant location; status if essential becomes a subdued text detail, not a badge; simplify active treatment. Keep school CRUD logos and horizontal timeline. |
| `src/components/achievements-section.tsx` | `getCategoryBadge` maps `program` to `Program Terpilih`, `leadership` to `Kepemimpinan`, each with colored icon/border/pill (near lines 28–100). | Remove colored category badge visual treatment; place the actual achievement title first; keep category in data and display as simple muted metadata only if useful. Do not label participation as an award. |
| `src/components/experience-timeline.tsx` | Multiple active node and card treatments, `shadow-md ring-1 ring-brand/20` on active card (near line 314). | Keep timeline navigation/progress and active focus, simplify node/card emphasis. |
| `src/components/projects-section.tsx` | Cards generate and render `#{indexNum}` (near lines 89, 310); category tag in card header. | Remove decorative sequence number. Keep IT/Design *functional filter tabs*; a project category is optional small metadata, not a badge competing with thumbnail/title. |
| `src/components/blog-preview-section.tsx` | Category overlaid in a pill on thumbnail; date, action, domain and `Tab Baru` repeated in a second footer row (per current component). | Remove unnecessary overlay and redundant bottom metadata; keep article title, image, publication date, excerpt, accessible external link. |
| `src/components/services-section.tsx` | Repeated nested rounded icon-box + bordered/shadowed card pattern. | Use simpler icon-and-text hierarchy; keep service actions and working responsive grid. |
| `src/components/certificates-section.tsx` | Tabs use selected-state pill/button styling; certificate cards have their own hover treatment. | **Keep actual filtering controls and selected state**; reduce decorative labels and redundant borders, not interactive function. |
| `src/app/page.tsx` | Hero/header, About stats, Contact and Footer contain multiple pill/border/gradient/hover patterns. | Review the whole page, protect primary CTAs, the branding, and the 3D Hero. Remove only duplicative decoration. |
| `src/components/portfolio-pill-nav.tsx` | Floating pill nav with selected state. | Preserve meaningful active navigation; only tune alignment, spacing and hover if needed. Not every pill-shaped control is AI slop. |
| `src/app/admin/components/*` | Dense admin cards/status panels. | Admin statuses such as Published, Draft, Error and Upload Progress are functional. Simplify unnecessary ornaments without erasing operational information. |

## Phase 2 — P0: Verify and repair the still-reported hanging and scroll regression

**Important latest commit detail:** GitHub HEAD `5d0b204` is `fix(perf): resolve scroll lag, WebGL2 sticker churn, Lenis/GSAP sync, parallax and timeline scrubbing`. Source already includes:

- `src/components/smooth-scroll.tsx`: Lenis GSAP ticker and a coalesced `ScrollTrigger.refresh()` scheduler with `ResizeObserver` on body and geometry thresholds.
- `src/components/academic-journey-section.tsx` and `src/components/experience-timeline.tsx`: progress updates through DOM transforms, indexed React state only upon changes, cached scroll bounds, and manual interaction override.
- `src/components/background-stickers.tsx`: `triggerOnce` near-viewport mounting for Sticker Peel; shared compositor work is claimed in code comments.

**Do not claim these fixes failed or succeeded from static inspection alone.** Profile the **local working tree** and a production build and compare to any pre-fix reproducible baseline.

### Diagnose, don't blindly patch

1. Check whether development mode vs production mode differs. Use `npm run build` and run the production server on a free local port; do not kill unrelated user processes.
2. Record Chrome DevTools Performance traces of an ordinary continuous scroll, rapid reversal, Academic/Career timeline section, sticker entry, Lanyard drag, and CV open/close. Include CPU throttling and real mobile if available.
3. Instrument or inspect: `ScrollTrigger.refresh` count and call stack; Lenis instance/ticker count; `requestAnimationFrame` count and task cost; body and nested ResizeObservers; DOM layout reads/writes; React commits; WebGL context count; shader/context churn; long tasks and long animation frames.
4. Check if `gsap.ticker.lagSmoothing(0)` is suitable for the installed versions and observed timing; change only when tested. Confirm one Lenis RAF driver, one scroll update bridge, and clean Strict Mode lifecycle.
5. Check the body `ResizeObserver` in `smooth-scroll.tsx` and another body observer in `portfolio-pill-nav.tsx`: are multiple measurements/reflows being triggered on ordinary layout changes? Do not remove necessary measurement without replacement.
6. Academic/Career still set `container.scrollLeft = maxScroll * p` in `ScrollTrigger.onUpdate`. Validate that manual swipe, CSS scroll-snap, and vertical-scroll-driven scrubbing do not fight each other. Remove or decouple conflicting ownership if trace reproduces jank. Preserve horizontal timeline.
7. `projects-section.tsx` updates perspective transforms from pointer movement and measures `getBoundingClientRect()` on mouse moves. Evaluate event cost and frame scheduling under realistic activity, but do not treat it as the cause without evidence.
8. Sticker compositor and canvas scaling: verify number of contexts, stable lifecycle, no repeated mount churn and acceptable FPS under scroll. Keep peeling.
9. If a browser hangs, identify the actual blocking script/stack and record it. A Lighthouse score is not enough evidence.

### P0 exit criteria

- Scrolling down and up responds smoothly and parallax is visibly bidirectional.
- No browser hang in repeated sessions; a tester can reach the bottom and back.
- No runaway refresh/ResizeObserver loop, RAF duplication, or context churn.
- Timeline vertical-to-horizontal interactions do not trap scroll or compete with manual swipe.
- No essential effect removed as a shortcut.
- Record actual trace findings, measured results and test environment in `docs/audits/ZEKKTECH-P0-SCROLL-PERFORMANCE-TRACE.md`; mark cases **PASS / FAIL / NOT TESTED**.

If performance remains unstable, do not proceed with P1 and do not claim success. Present a prioritized blocker list.

## Phase 3 — Design direction and rules (site-wide)

Design the public portfolio as **minimal, deliberate, editorial, contemporary developer/design portfolio**, with ZekkTech's existing cobalt-blue identity, typography, square-grid background and authentic technology stickers. Do not copy a SaaS analytics dashboard or generic AI landing page. Keep animation and content, reduce ornament.

### Remove/de-emphasize when purely decorative

- `#01`, `#02`, etc. on ordinary project, education and achievement cards. These are not ranked lists.
- Saturated category/status pills like `Program Terpilih`, `Kepemimpinan`, `LULUS`, `MAHASISWA AKTIF` in content card headers when they add no immediate decision value. Preserve the underlying facts and semantics; render relevant statuses as small plain text in secondary details.
- Icon + badge + border + shadow + progress dot stacked around the same piece of metadata.
- Color-coded categories that imply significance unsupported by content.
- Redundant metadata repeated in card header and footer.
- Nested rounded boxes for noninteractive logos/icons if a simple inline image works.
- Decorative lines where spacing already groups information.
- Repetitive gradients, glow, hover-lift, heavy rings and animated highlights on every card.
- Generic marketing copy that asserts unverified awards, accomplishments or technical capabilities.

### Keep when functional

- Actual filter tabs and their selected state.
- Draft/Published/Failed badges in admin when they convey operation state.
- New/Expired/Verified statuses **only if supported by actual content and meaningful to the user**.
- Primary CTA button, focus ring, invalid/error state, accessible touch target.
- Timeline year and progress indicator, but avoid showing the same year in multiple prominent positions.
- School/university *authentic logos* from CRUD; keep subtle scale-on-active animation without clipping.
- Interactive elements: true Sticker Peel, Lanyard physics, GSAP/Lenis, ShapeGrid, Miss Minute, CV.

### Visual constraints

- A single primary hierarchy per card: **title or institution name → subtitle/program/organization → period/context → optional details/action**.
- Use muted body text for metadata and consistent 1px borders only where needed.
- Standardize spacing, radii, surfaces and card padding via existing tokens. No new random style values or full theme rebrand.
- Avoid tiny 10px text as a workaround for crowded cards. Keep accessible text and responsive readability.
- Desktop and mobile layouts must respect ID/EN string lengths.
- Preserve logical DOM reading order, keyboard navigation, alt text, reduced motion and visible focus.
- Stickers are background decoration, so simplify **content** instead of flattening the background.

## Phase 4 — Component-specific visual implementation

### Academic Journey

- Remove hardcoded sequence indicator `#0{idx + 1}` from card headers and other unnecessary badges.
- Period should be easy to identify once; keep year-based progress in timeline without duplicating it as multiple badges.
- Small real logo beside institution name, not an oversized nested icon tile. Existing safe fallback only when no real logo is supplied.
- Keep degree/major, location, description and expandable studies/projects available.
- Remove competing active ring + elevated shadow + multiple blue borders. One subtle emphasis mechanism is enough.
- Keep horizontal navigation, manual swipe, bidirectional scroll movement, keyboard arrows and institutional-logo scale effect.

### Achievements & Recognition

- Remove colored `getCategoryBadge` presentation, but keep `AchievementItem.category` values intact for CMS.
- Reorder visual hierarchy to title, organization, date, concise summary, evidence link.
- If category genuinely adds information, use a plain muted text label rather than an icon+colored pill. The category is *not* evidence of an award.
- Do not change claims about awards, selections or leadership without source records; flag unverified marketing copy for review.

### Career Experience

- Show role/organization first. Metadata smaller and consistent.
- Simplify timeline markers and active card treatment without losing horizontal scroll and progress semantics.
- Do not add new numbered card tags or decorative badges.

### Projects IT / Design

- Remove decorative `#{indexNum}` card index and adjust corresponding props and markup safely.
- Preserve functional category filter, repository/demo links, case study preview, image and accessible labels.
- Make thumbnail and project title the focus. Role/category in unobtrusive metadata when meaningful.
- Assess tilt hover behavior for readability and performance; preserve if smooth, fix if trace proves it causes jank.

### Services, Certificates, Blog, FAQ, Contact, Hero, About, Footer

- Review each public section against the audit matrix and remove formulaic extra layers.
- Services: simplify icon tiles and repeated hover elevation while retaining service CTA.
- Certificates: preserve functional filters and evidence/credential links; remove only unrelated decorative pills.
- Blog: remove overlaid category pill and redundant domain/“new tab” footer treatment if unnecessary; do not hide actual publication information.
- FAQ: maintain disclosure interactions, clear focus/expanded state; avoid decorative card within card.
- Contact: primary action and contact methods should be clear and trustworthy, not surrounded by unrelated decoration.
- Hero: keep branding and full 3D Lanyard; reduce secondary ornaments only if actually competing with main message.
- Header/nav/footer: retain usable navigation labels and selected states; avoid deleting functional controls simply because they are rounded.

### Admin (separate design judgment)

Apply restraint where safe, but **never remove content lifecycle badges, error/warning signals, form validation, or administrative controls**. Preserve CMS accessibility and workflows. The public portfolio gets priority; admin redesign should not slow P0 or introduce breaking changes.

## Phase 5 — Verify content, CMS, accessibility and performance

Test before/after on:
- Desktop: 1366×768, 1440×900, 1920×1080.
- Mobile: 320×568, 390×844, 430×932.
- Light and dark themes, ID/EN, touch/mouse, keyboard.

Acceptance checklist:

1. No arbitrary numbered cards on Academic/Projects.
2. No decorative badge clutter in Academic and Achievements.
3. Information remains available and accurate; no record/claim dropped silently.
4. The same restraint is applied to all public sections according to audit findings.
5. Authentic logos are preserved and loaded from current CMS data.
6. Career/Academic horizontal timeline, scroll progress, mobile swipe and reverse scroll still work.
7. All signature effects remain visibly interactive.
8. No scroll hang; browser performance trace supports claims.
9. No unnecessary additional CSS animation that could regress performance.
10. No new contrast/focus/keyboard/ID-EN/CLS regressions.
11. Admin CRUD, published-only public rendering, and security unaffected.

Run the project's real scripts (inspect `package.json` first). At minimum attempt:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

If a command cannot run, mark **NOT TESTED** and explain the actual blocker. Do not invent screenshots, Lighthouse results, FPS or benchmark numbers.

## Deliverable and workflow

- Make the Markdown reports under `docs/audits/` **as real tracked files**.
- Include a before/after table and specific component/file references in the audit.
- Apply changes incrementally, only after P0 scroll stability passes.
- After every section change, compare screenshots and interactive behavior before proceeding.
- Summarize actual changes, tests, outstanding findings and risks in `docs/audits/ZEKKTECH-SITEWIDE-VISUAL-QA.md`.
- Keep all changes in the user's existing local workspace/branch. No PR, merge, deployment or push without request.

**Definition of done:** ZekkTech remains visually distinctive and fully interactive, no longer repeats the AI-template badge/number/card styling across sections, and scrolls smoothly without browser hang. The GitHub P0 perf fix must be verified by runtime evidence rather than assumed successful.
