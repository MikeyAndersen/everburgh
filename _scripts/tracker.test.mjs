/*
 * Static guards for _scripts/tracker.js
 *
 * Run:  node _scripts/tracker.test.mjs
 *
 * The tracker cannot be imported directly -- it is a DataviewJS block and depends on the
 * live `dv`, `app` and `window` globals. So this checks syntax plus the invariants that
 * the two fixed bugs depend on. Anything behavioural is verified at the table via the
 * "block runs / renders" readout in the tracker footer.
 */

import { readFile, writeFile, unlink } from "node:fs/promises";
import { execFile } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

const run = promisify(execFile);
const SRC = "_scripts/tracker.js";
const src = await readFile(SRC, "utf8");

let failed = 0;
function check(name, ok, detail) {
  if (ok) {
    console.log(`  ok   ${name}`);
  } else {
    failed += 1;
    console.log(`  FAIL ${name}${detail ? " -- " + detail : ""}`);
  }
}
function count(needle) {
  return src.split(needle).length - 1;
}

console.log(`\n${SRC} (${src.split("\n").length} lines)\n`);

/* --- syntax ------------------------------------------------------------- */
const tmp = join(tmpdir(), "tracker.check.mjs");
await writeFile(tmp, src, "utf8");
try {
  await run(process.execPath, ["--check", tmp]);
  check("parses as JS (top-level await, so checked as a module)", true);
} catch (e) {
  check("parses as JS", false, String(e.stderr || e.message).split("\n")[0]);
}
await unlink(tmp).catch(() => {});

/* --- bug 2: scroll wheel must never step a number field ----------------- */
check(
  "guardWheel exists",
  /function guardWheel\(/.test(src)
);
check(
  "wheel listener is non-passive (preventDefault is ignored when passive)",
  /addEventListener\(\s*["']wheel["'][\s\S]{0,400}?passive:\s*false/.test(src)
);
check(
  "wheel guard only fires while the field has focus",
  /document\.activeElement !== input/.test(src)
);
check(
  'exactly one raw `type = "number"` -- the one inside numInput()',
  count('.type = "number"') === 1,
  `found ${count('.type = "number"')}`
);
check(
  'exactly one raw `type = "text"` -- the one inside textInput()',
  count('.type = "text"') === 1,
  `found ${count('.type = "text"')}`
);
check(
  "every number field is built by numInput()",
  count("numInput(") >= 8,
  `found ${count("numInput(")} call sites, expected >= 8`
);

/* --- bug 1: writes are batched, renders do not jump --------------------- */
check(
  "persist() debounces instead of writing straight to disk",
  /async function persist\(\)\s*\{\s*scheduleFlush\(\);\s*\}/.test(src)
);
check(
  "scheduleFlush() uses a timeout",
  /function scheduleFlush\(\)[\s\S]{0,400}?setTimeout/.test(src)
);
check(
  "writeStateFile has exactly two callers: flush() and the panic handler",
  count("writeStateFile(") === 3, // 1 definition + 2 call sites
  `found ${count("writeStateFile(")} occurrences incl. the definition`
);
check(
  "pending writes are flushed on window close and blur",
  /beforeunload/.test(src) && /addEventListener\("blur"/.test(src)
);
check(
  "structural actions flush immediately",
  count("commitNow()") >= 8,
  `found ${count("commitNow()")}`
);
check(
  "render() snapshots UI state before tearing the DOM down",
  /snapshotUI\(\);\s*root\.empty\(\);/.test(src)
);
check(
  "render() restores UI state after rebuilding",
  /renderFooter\(\);\s*restoreUI\(\);/.test(src)
);
check(
  "render() is guarded against re-entrancy and always clears the guard",
  /if \(rendering\) return;/.test(src) && /finally \{\s*rendering = false;/.test(src)
);
check(
  "focus restore is time-limited so it cannot steal the cursor later",
  /FOCUS_TTL/.test(src)
);
check(
  "setSelectionRange is wrapped -- it throws on type=number in Chromium",
  /try \{\s*target\.setSelectionRange/.test(src)
);

/* --- the hot paths must not rebuild the table --------------------------- */
check(
  "surgical painters exist",
  /function paintRow\(/.test(src) && /function paintCounter\(/.test(src) && /function paintTurn\(/.test(src)
);
check(
  "render() resets the DOM registry so handles never go stale",
  /root\.empty\(\);\s*resetDom\(\);/.test(src)
);
check(
  "damage + Enter repaints one row instead of re-rendering",
  /dmg\.value = "";[\s\S]{0,260}?paintRow\(c\);\s*scheduleFlush\(\);/.test(src)
);
check(
  "HP and temp edits repaint one row instead of re-rendering",
  src.split(/paintRow\(c\);\s*\n\s*scheduleFlush\(\);/).length - 1 >= 3,
  "expected >= 3 paintRow+scheduleFlush hot paths"
);
check(
  "counter +/- repaints one counter instead of re-rendering",
  src.split(/paintCounter\(ct\);\s*\n\s*scheduleFlush\(\);/).length - 1 === 2,
  "expected exactly 2 (the - and + buttons)"
);
check(
  "Next turn moves the marker without rebuilding the table",
  /paintTurn\(\); \/\/ move the marker only/.test(src)
);
check(
  "no raw `c.hp <= 0` left -- PCs carry hp: null and null <= 0 is true",
  !/\(c\.hp <= 0 \?/.test(src) && /function isDown\(c\)/.test(src)
);

/* --- unchanged invariants from the original design ---------------------- */
check("still never throws into the page", /cls: "itk-error"/.test(src));
check("still reads ac/hp from frontmatter", /fm\.ac \?\? null/.test(src));
check("still writes State.md with the do-not-edit banner", /Auto-managed by/.test(src));

console.log(
  failed === 0 ? "\nall checks passed\n" : `\n${failed} check(s) failed\n`
);
process.exit(failed === 0 ? 0 : 1);
