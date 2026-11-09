# Three.js, vendored

This folder holds one pinned release of [Three.js](https://threejs.org/), the
app's only dependency. `docs/index.html` maps the bare specifiers `three` and
`three/addons/…` to it through an import map, so the browser loads it with no
build step. The [Three.js section of CLAUDE.md](../../../CLAUDE.md#threejs)
sets out the rulings this folder follows: minified files downloaded once from
jsDelivr, and only the files that code loads.

- **Version:** 0.187.0 (release r187)
- **Unminified source, for checking APIs:**
  [`r187` on GitHub](https://github.com/mrdoob/three.js/tree/r187/src), or
  the npm tarball `https://registry.npmjs.org/three/-/three-0.187.0.tgz`
- **`LICENSE` (MIT):** copied unchanged from that tarball, whose integrity
  matched the npm registry's on 9 November 2026

## Build files

Each is jsDelivr's Terser-minified copy of the release file, downloaded on
9 November 2026. Its final `//# sourceMappingURL=/sm/….map` line was deleted;
nothing else was changed.

- `build/three.core.js`
  - From: `https://cdn.jsdelivr.net/npm/three@0.187.0/build/three.core.min.js`
  - SHA-256 as downloaded:
    `60880f0fd017e6ad08a80c2f0f7015c336ba0a5b6dbdde733b9272ca89eb95e2`
  - SHA-256 as stored:
    `1c2045247e10cf74d52baf3b1d83874faf7d8efe3f01e602f3ae0b35b0c8d181`
- `build/three.module.js`
  - From:
    `https://cdn.jsdelivr.net/npm/three@0.187.0/build/three.module.min.js`
  - SHA-256 as downloaded:
    `49bfc58c4097915b4fcf08ed1ee245c0da687f02d35908f38266dbd3d5324ac2`
  - SHA-256 as stored:
    `7e54c328b21a9b589c7c2558ca791704521fb62e19644fe65f448657ab78cc4d`

## Addons

Addons are fetched into `examples/jsm/` one file at a time, only when code
imports them, in the same way as the build files. Each is listed here with
its path under `examples/jsm/`, its source URL and its checksums.

None are vendored yet.

## Upgrading

Never edit a file here, beyond deleting the source-map line when it is
fetched. To upgrade, fetch both build files and each listed addon afresh for
the new version, replace `LICENSE` from the new release's tarball, update
this file, read the
[migration guide](https://github.com/mrdoob/three.js/wiki/Migration-Guide)
for every release skipped, and fix what broke.
