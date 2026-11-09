# CLAUDE.md — rules for code agents in this repo

This file is the **single source of truth** for agent rules in this repo.
When a rule here names a file, folder or pattern that no longer matches the
codebase, trust the codebase and tell the Lead Developer the rule is stale.

## **CRITICAL:** Writing style

Applies to every Markdown doc, README and code comment written in this repo:

- Give broad, relevant background, so the reader understands the topic and
  where it fits in the bigger picture
- Write clear, succinct, direct British English, steered towards actionable
  outcomes
- Use British spelling in prose only. Never change identifiers, APIs or CSS
  properties (e.g. `color`, `initialize`, `THREE.Color`)
- Call the person who directs, reviews and commits this work "the Lead
  Developer", never "the user". "User" means only the people who use the
  app. Plans, ADRs and hand-overs all follow this rule
- Link to a heading, in the same file or another, by its hash fragment:
  the heading text lowercased, with punctuation and markdown markers
  stripped and spaces turned to hyphens, which is how GitLab and GitHub
  build their anchors (`#critical-absolute-minimum-dependencies`). Never
  point a reader at a section by prose alone when a fragment link can take
  them there

## What this repo is

A standalone web app that renders an interactive 3D scene with Three.js,
written in standard JavaScript, CSS and HTML. There is deliberately no build
step, no package manager, no dev tooling (no linter, formatter, test runner
or git hooks), no CI/CD and no server. The files in the repo are the files
the browser runs.

- The Lead Developer is the only developer on this repo. Never ask about,
  wait for or plan around other developers' work, ownership or queues
- The site is `docs/`, which GitHub Pages publishes from the branch as
  it stands. `docs/.nojekyll`, an empty file, stops GitHub Pages running
  Jekyll, so the files are served unchanged. Nothing goes in `docs/` that
  is not part of the site
- `docs/index.html`, the only HTML file, loads one ES module entry point,
  `docs/src/main.js`, through `<script type="module">`, after an import
  map that resolves `three` (see [Three.js](#threejs))
- Browsers refuse to run module scripts from a `file://` URL, so open the
  app through any static file server started on `docs/`, such as
  `python3 -m http.server 8000 --directory docs`, then
  `http://localhost:8000/`. That server is a convenience, not part of the
  app: never add server-side code

## **CRITICAL:** Code is the source of truth, not docs

Markdown files, such as `README.md`, ADRs, plans and this file, are useful
references for intent and history, but they drift.

- **Read docs for orientation, verify against code before acting.** Before
  relying on a doc's claim about a file path, an API or a behaviour, check
  the current source.
- **When a doc and the code disagree, the code wins.** Fix or flag the doc
  instead of carrying its error into new work.
- **The same goes for Three.js.** Its API changes from release to release,
  and tutorials, answers and training data often describe an older one.
  Check a class or method against the vendored copy's source before using
  it, never against memory.

## The stack, and the rules it implies

### Standard JavaScript, no build

- Modern JavaScript as current evergreen browsers run it: ES modules in
  `.js` files. No TypeScript, no JSX, no transpiler, no bundler, no
  minifier
- Relative imports include the file extension (`./scene/lights.js`),
  because the browser needs it. The only bare specifiers are `three` and
  `three/addons/…`, which the import map resolves
- Import from Three.js by name, as from any module:
  `import { Mesh, PerspectiveCamera } from "three";`
- HTML is semantic and accessible: real `<button>`s and `<label>`s, never
  clickable `<div>`s, and the canvas has a text alternative
- CSS is plain CSS with a CSS-first ethos: custom properties for colours,
  sizes and timings, and layout done in CSS wherever CSS can do it rather
  than in JavaScript. No framework, preprocessor or CSS-in-JS
- The UI around the canvas is plain DOM, with no component framework

### Three.js

- One pinned Three.js release is vendored at `vendor/three/`: its `build/`
  and `examples/jsm/` folders, copied unchanged, beside its `LICENSE`, with
  the version number and where it came from recorded in
  `vendor/three/README.md`. `index.html` maps it:

  ```html
  <script type="importmap">
    {
      "imports": {
        "three": "./vendor/three/build/three.module.js",
        "three/addons/": "./vendor/three/examples/jsm/"
      }
    }
  </script>
  ```

- Never edit a vendored file. An upgrade is a deliberate step: replace the
  folder whole, read the
  [migration guide](https://github.com/mrdoob/three.js/wiki/Migration-Guide)
  for every release skipped, and fix what broke
- Addons under `three/addons/` count as part of Three.js, not as new
  dependencies
- One renderer and one animation loop, driven by
  `renderer.setAnimationLoop()`
- Motion is frame-rate independent: it scales with the time elapsed since
  the last frame, never by a fixed step per frame
- The per-frame path allocates nothing. Vectors, matrices and quaternions
  it needs are scratch objects created once and reused, so garbage
  collection never stutters a frame
- Whatever leaves the scene is disposed of: removing an object frees no
  GPU memory, so call `.dispose()` on its geometries, materials, textures
  and render targets, unless something else still uses them
- The canvas follows its container's size: on resize, update the camera's
  aspect, call `updateProjectionMatrix()` and `renderer.setSize()`, and cap
  the device pixel ratio with a named constant
- One scene unit is one metre. Angles are radians, except where Three.js
  takes degrees, as `PerspectiveCamera`'s field of view does, which a
  comment then says
- Keep Three.js's default colour management unless an ADR says otherwise
- Models, textures and environment maps live in `assets/`, in open formats
  (glTF/GLB, PNG, JPEG, WebP), with each one's source and licence recorded
  beside it

### **CRITICAL:** Absolute minimum dependencies

Rely on what browsers and Three.js provide, plus small helpers written in
this repo. Never add a dependency without the Lead Developer's explicit
approval and an ADR. That includes a library, a CDN script, a
`package.json`, a dev tool, a web font host, analytics, or any other hosted
service. A hosted service's ADR also records where its vendor is based:
prefer homegrown code and European infrastructure over US or Chinese
services.

The one approved dependency is Three.js, pinned and vendored as set out in
[Three.js](#threejs).

Explicitly **not** allowed: React, Vue, Svelte, Angular and their
ecosystems (react-three-fiber and drei included), Tailwind and other CSS
frameworks, TypeScript, and any bundler or package manager.

## Repository conventions

- File and folder names use kebab-case, apart from special cases like
  `README.md`, `CLAUDE.md` and `LICENSE`. A document's file name is a short
  form of its title, never the whole of it
- The layout:

  ```
  docs/              the site, published by GitHub Pages
    .nojekyll        empty; stops GitHub Pages running Jekyll
    index.html       the only HTML file
    styles/          plain CSS
    src/main.js      the entry point
    src/<group>/     thematic groups of modules
    assets/          models, textures, environment maps
    vendor/three/    the pinned Three.js release, never edited
  adr/               decisions, not published
  todo/, done/       plans, not published
  ```

- Code lives in thematic groups under `src/`, named after what they deal
  with: one word where one word says it (`scene/`, `camera/`, `input/`,
  `ui/`), kebab-case otherwise. By-kind folders (`classes/`, `utils/`,
  `helpers/`) are not used, and a sub-folder never repeats a segment of its
  own path
- Always prefer named exports over default exports
- No barrel files (`index.js` that only re-exports): import directly from
  the source
- Prefer `const foo = () => {}` over `function foo() {}` unless a function
  must be hoisted
- Destructured identifiers that are unused are prefixed with an
  underscore: `const [_foo, bar] = someArray;`
- With no formatter, format by hand as Prettier's defaults would: two-space
  indents, double quotes, semicolons, trailing commas, lines wrapped at 80
  columns. Match the code around you
- Avoid very long lines anywhere: no one can read them, and a
  one-character change diffs as the whole line. Shape data so it wraps,
  such as holding a text of several lines as an array of its lines

### Ordering within a file

1. A `@fileoverview` comment, when the file holds several functions,
   classes or constants
2. Imports: Three.js first, then the repo's own modules, each group A-Z by
   path
3. Module-level constants
4. The main exported class or function (doc comment required)
5. Further exported classes or functions (doc comment required)
6. Non-exported helpers (doc comment optional)

### Alphabetical (A-Z) ordering

A-Z is the default wherever order carries no meaning: function arguments
(mandatory A-Z, then optional A-Z), object and class properties, functions
within a file, enums and string unions, and switch cases. It is a default,
not a law. Keep a logical order where one reads better:

- Familiar sequences: `x`, `y`, `z`; `width` then `height`; a colour's
  channels as `r`, `g`, `b`, then any `a`; `position`, `rotation`, `scale`
- An order set by an API, such as a Three.js constructor's arguments
- Steps that must run in sequence, such as setting up the renderer
- Large multi-line properties, which go last for readability

## Comments

Comments use British English spelling; code identifiers use American
English: `const GRAY_COLOR = 0x808080; // mid-grey colour`.

When referring to a function, add parentheses ("call someFunction() now");
a class, no parentheses ("SomeClass"); an instance, lowercase
("someClassInstance"); an identifier that could read as a normal word,
backticks ("dispose of the old `material`").

Files with several functions, classes or constants open with:

```js
/**
 * @fileoverview
 * One-line description of this file's purpose, ending in a full stop.
 */
```

Non-trivial exported functions and classes carry a doc comment in this
shape, which formats well in editor hovers. It needs no type annotations,
but its descriptions give units wherever a value has one (metres, radians,
degrees, seconds):

```js
/** #### One-line description in simple present tense, no full stop
 * - Optional short bullet points highlighting notable aspects, each ending
 *   in a full stop.
 * @param fooBar One-line description ending in a full stop.
 * @returns One-line description ending in a full stop.
 */
```

Simple present tense means "Converts PNG to JPEG", not "Convert PNG to
JPEG" or "Function that converts PNG to JPEG".

`//` comments on their own line start with a capital and end with a full
stop, hard-wrapped to about 80 characters, in the imperative ("Convert PNG
to JPEG."). End-of-line `//` comments start lowercase with no full stop,
and are terse. Never use `/* ... */` where `//` works. A comment must stand
on its own: never refer to the prompt conversation, to code that was
changed, or to "we", "you" or "I".

## Engineering discipline

- **Research before diagnosing.** Before diagnosing an error or unexpected
  behaviour, search online: the Three.js docs, migration guide, forum and
  GitHub issues, MDN, Stack Overflow. Many issues are known bugs or
  documented breaking changes; don't guess.
- **Verify before asserting.** Anything checkable in seconds, such as a
  method's signature in the vendored source or what a browser API returns,
  is checked before it goes into code, a plan or a doc. Say which claims
  were verified, which came from reference material, and which are
  inferred.
- **Raise scope; never settle it silently.** Record every cut,
  simplification or departure from what was asked, and put it to the Lead
  Developer before the work is final.
- **Walk the work before handing it over.** Trace each change as the Lead
  Developer will meet it ("I reload the page: what do I see, and what does
  the console say?").
- **Hand-overs are honest diffs.** A write-up says, per file, what was
  added, changed and removed, and names what was not checked. Never
  describe work more favourably than the diff supports.
- **No band-aid fixes.** Never swallow errors, add `!important`, or reach
  for a `setTimeout()` to dodge an ordering problem. Find why it is broken
  and fix the cause. If the cause is out of scope (a Three.js bug, say),
  document it with `// @TODO` and a link, and still propose the proper fix.
- **Do the right thing, not the easy thing.** If the correct solution
  needs a refactor, refactor. Minimise total complexity, not diff size.
  Coherence over convenience. Flag scope concerns and propose the right fix
  rather than silently choosing the shortcut.
- **Flag redundant and derivable code.** Watch for values duplicating
  information available elsewhere, such as a property always derivable
  from another. Remove verified redundancy, report removals, and prefer a
  single source of truth.
- **Identify saved things by an assigned id.** If the app saves or exports
  anything that other things point at (a scene, a preset, a file), its
  identity is assigned by code, never derived from its content, name or
  position, and a reference quotes that id.
- **Never remove code you don't understand.** Read the full context before
  editing. Preserve behaviour by default. If code seems unnecessary, ask;
  don't delete.
- **No hard-coded values without approval.** A 3D scene is full of tuning
  numbers: field of view, light intensities, colours, speeds. Give each a
  well-named constant near its use, or in a shared module of constants when
  several modules need it, with its unit in its name or comment. If the
  correct value is uncertain, ask. Acceptable without asking: truly
  universal constants, and values dictated by an external spec (with a
  comment citing the source).

## Checking work

With no tooling, checks are manual, and honesty about them matters more.

- Work is complete only when the page loads through a static file server
  with no errors or warnings in the browser console, and the change does
  what was asked at both a desktop and a phone-sized viewport
- An agent that cannot run a browser says so in its hand-over, rather than
  implying the check was done
- Every hand-over ends with a `## Manual QA` section: numbered steps the
  Lead Developer can follow in the browser, each with an `Expect:` line
  saying what they should see
- Keep logic that needs no DOM or GPU, such as maths, parsing and state
  changes, in pure functions apart from the rendering code, so it is easy
  to reason about and could be tested if a test runner is ever approved

## Docs and decisions

- Significant decisions are recorded as ADRs in `docs/adr/NNN-<slug>.md`
  (context, decision, consequences; one page at most). `NNN` is three
  digits (`001`, `002`, …), referred to as "ADR 001". Numbers are assigned
  once, in order, and never reused. A reversal is a new ADR that names the
  one it supersedes
- Work too large for one sitting is planned in `docs/todo/<NNN-topic>/`, a
  plan-batch, as numbered plans (`01-*.md`, `02-*.md`, …). Each plan ends
  with an append-only `## Audit` section, one timestamped line per event.
  An accepted plan moves to the mirrored path under `docs/done/`, and the
  plan-batch moves whole when its last plan does

## Subagents and commits

Delegate substantive work to subagents to conserve the main session's
context, picking the tier by genuine need: Opus-class for hard reasoning
(root-cause hunts, design-heavy implementation, adversarial verification);
Sonnet-class for the mechanical majority; Haiku-class only for routine
bulk. Each brief carries its file-ownership boundaries, a pointer to this
file, and a no-commit rule. Integration stays with the main session.

Never commit: the Lead Developer reviews and commits. A suggested commit
message in a hand-over follows Conventional Commits (`type(scope):
subject`, lower-case subject, no full stop), and never contains a straight
single quote (`'`): use ’ for an apostrophe and ‘ ’ for inverted commas.
