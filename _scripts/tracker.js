/*
 * Ironhold combat tracker
 * Loaded from Combat/Scratch.md via:  await dv.view("_scripts/tracker")
 *
 * Reads `ac` and `hp` from frontmatter in Bestiary/ and PCs/.
 * Persists to Combat/State.md (auto-managed — do not edit by hand).
 * Archives finished fights to Encounters/.
 *
 * Design rule: never throw into the page. Any failure renders a readable message.
 */

const STATE_PATH = "Combat/State.md";
const ENC_DIR = "Encounters";
const GKEY = "__ironhold_tracker__";
const FKEY = GKEY + "_flush";
const UIKEY = GKEY + "_ui";
const HOOKKEY = GKEY + "_hooks";

/* How long to batch disk writes. The point is to collapse a flurry of clicks into a
 * single write to Combat/State.md -- see the comment on scheduleFlush(). */
const FLUSH_MS = 1800;

/* Only steal focus back if the snapshot is this fresh, so a spontaneous Dataview
 * re-render cannot yank the cursor out of the editor minutes later. */
const FOCUS_TTL = 5000;

/* Diagnostics. RUNS increments every time Dataview executes this whole block. If it
 * climbs while you touch nothing, Dataview is auto-refreshing the view (refreshInterval
 * is 2500 ms in .obsidian/plugins/dataview/data.json). */
window[GKEY + "_runs"] = (window[GKEY + "_runs"] || 0) + 1;
const RUNS = window[GKEY + "_runs"];
let renders = 0;

const root = dv.container;

/* ---------------------------------------------------------------- state --- */

function blankState() {
  return {
    name: "",
    round: 0,
    active: 0,
    started: false,
    combatants: [],
    counters: [],
  };
}

async function readStateFile() {
  const f = app.vault.getAbstractFileByPath(STATE_PATH);
  if (!f) return null;
  const raw = await app.vault.read(f);
  const m = raw.match(/```json\s*([\s\S]*?)```/);
  if (!m) return null;
  try {
    return JSON.parse(m[1]);
  } catch (e) {
    console.error("[tracker] State.md JSON is corrupt, starting fresh", e);
    return null;
  }
}

async function writeStateFile(state) {
  const body =
    "---\ntype: combat-state\n---\n\n" +
    "> [!warning] Auto-managed by `_scripts/tracker`. Do not edit by hand.\n\n" +
    "```json\n" +
    JSON.stringify(state, null, 2) +
    "\n```\n";
  const f = app.vault.getAbstractFileByPath(STATE_PATH);
  if (f) await app.vault.modify(f, body);
  else await app.vault.create(STATE_PATH, body);
}

let state = window[GKEY] || (await readStateFile()) || blankState();
window[GKEY] = state;

/* Root cause of the "it keeps updating and jumps around" bug:
 * every write to Combat/State.md bumps Obsidian's metadata cache. Dataview sees the index
 * change and re-executes this entire DataviewJS block, which tears the tracker's DOM down
 * with no warning. Writing on every click therefore schedules a teardown on every click.
 *
 * Fix: in-memory state and window[GKEY] are authoritative and update instantly, so the
 * screen is never stale. The disk write is debounced -- mashing +/- five times now costs
 * one write instead of five. Structural actions use commitNow() and flush immediately. */
function scheduleFlush() {
  window[GKEY] = state;
  if (window[FKEY]) window.clearTimeout(window[FKEY]);
  window[FKEY] = window.setTimeout(() => {
    window[FKEY] = null;
    flush();
  }, FLUSH_MS);
}

async function flush() {
  if (window[FKEY]) {
    window.clearTimeout(window[FKEY]);
    window[FKEY] = null;
  }
  window[GKEY] = state;
  try {
    await writeStateFile(state);
  } catch (e) {
    console.error("[tracker] save failed", e);
  }
}

/* Never lose a pending write when Obsidian closes or the window loses focus.
 * Registered once per session, not once per block execution. */
if (!window[HOOKKEY]) {
  window[HOOKKEY] = true;
  const panic = () => {
    if (!window[FKEY]) return;
    window.clearTimeout(window[FKEY]);
    window[FKEY] = null;
    try {
      writeStateFile(window[GKEY]);
    } catch (e) {
      console.error("[tracker] emergency save failed", e);
    }
  };
  window.addEventListener("beforeunload", panic);
  window.addEventListener("blur", panic);
}

/* Cheap path: redraw now, save soon. */
async function commit() {
  scheduleFlush();
  render();
}

/* Structural path: redraw now, save now. */
async function commitNow() {
  render();
  await flush();
}

/* Kept for the field handlers that only need "remember this, do not redraw". */
async function persist() {
  scheduleFlush();
}

/* ---------------------------------------------------------------- roster --- */

function roster() {
  const out = [];
  try {
    for (const p of dv.pages('"Bestiary" or "PCs"')) {
      const fm = (p.file && p.file.frontmatter) || {};
      const aliases = Array.isArray(fm.aliases) ? fm.aliases : [];
      out.push({
        name: p.file.name,
        ac: fm.ac ?? null,
        hp: fm.hp ?? null,
        kind: fm.type === "pc" ? "pc" : "monster",
        aliases,
      });
    }
  } catch (e) {
    console.error("[tracker] roster lookup failed", e);
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

const ROSTER = roster();

function lookup(query) {
  const q = String(query || "").trim().toLowerCase();
  if (!q) return null;
  return (
    ROSTER.find((r) => r.name.toLowerCase() === q) ||
    ROSTER.find((r) => r.aliases.some((a) => String(a).toLowerCase() === q)) ||
    ROSTER.find((r) => r.name.toLowerCase().startsWith(q)) ||
    null
  );
}

/* ------------------------------------------------------------- ordering --- */

function ordered() {
  return state.combatants
    .map((c, i) => ({ c, i }))
    .sort((a, b) => {
      const d = (b.c.init ?? 0) - (a.c.init ?? 0);
      if (d !== 0) return d;
      return String(a.c.name).localeCompare(String(b.c.name));
    });
}

function nextTurn() {
  const n = state.combatants.length;
  if (!n) return;
  if (!state.started) {
    state.started = true;
    state.round = 1;
    state.active = 0;
    return;
  }
  state.active += 1;
  if (state.active >= n) {
    state.active = 0;
    state.round += 1;
    for (const ct of state.counters) {
      if (ct.perRound) ct.value = clamp(ct.value + ct.perRound, ct.min, ct.max);
    }
  }
}

function clamp(v, lo, hi) {
  if (typeof lo === "number" && v < lo) return lo;
  if (typeof hi === "number" && v > hi) return hi;
  return v;
}

/* --------------------------------------------------------------- render --- */

function el(parent, tag, cls, text) {
  const n = parent.createEl(tag, cls ? { cls } : undefined);
  if (text !== undefined) n.setText(String(text));
  return n;
}

/* Chromium -- and therefore Obsidian -- steps <input type="number"> up and down on wheel
 * while the input has focus. That silently rewrites HP and initiative when you scroll the
 * note, with no undo. Swallow wheel ONLY while the field is focused, so scrolling past an
 * unfocused field still scrolls the pane normally.
 *
 * { passive: false } is load-bearing: Chromium registers wheel listeners as passive by
 * default and ignores preventDefault() in passive mode. */
function guardWheel(input) {
  input.addEventListener(
    "wheel",
    (ev) => {
      if (document.activeElement !== input) return;
      ev.preventDefault();
      ev.stopPropagation();
    },
    { passive: false }
  );
  return input;
}

/* Every number field must come from here. A raw type="number" is a regression --
 * _scripts/tracker.test.mjs fails the build on one. */
function numInput(parent, key, cls) {
  const input = parent.createEl("input", { cls: "itk-num" + (cls ? " " + cls : "") });
  input.type = "number";
  if (key) input.setAttr("data-itk-key", key);
  return guardWheel(input);
}

function textInput(parent, key, cls) {
  const input = parent.createEl("input", cls ? { cls } : undefined);
  input.type = "text";
  if (key) input.setAttr("data-itk-key", key);
  return input;
}

function button(parent, label, cls, onClick) {
  const b = parent.createEl("button", { cls: "itk-btn " + (cls || "") });
  b.setText(label);
  b.onclick = async (ev) => {
    ev.preventDefault();
    try {
      await onClick();
    } catch (e) {
      console.error("[tracker] action failed", e);
    }
  };
  return b;
}

/* The element that actually scrolls, in reading view and in live preview. */
function scrollHost() {
  if (!root || !root.closest) return null;
  return root.closest(".markdown-preview-view, .cm-scroller, .view-content");
}

/* root.empty() destroys focus, caret and scroll position. Capture them first, restore
 * them after. Stored on window rather than in a local so the snapshot survives Dataview
 * re-executing the whole block -- the case where the jump was worst. */
function snapshotUI() {
  const prev = window[UIKEY] || {};
  const host = scrollHost();
  const a = document.activeElement;
  const mine = !!(
    a &&
    root.contains &&
    root.contains(a) &&
    a.getAttribute &&
    a.getAttribute("data-itk-key")
  );
  window[UIKEY] = {
    scrollTop: host ? host.scrollTop : prev.scrollTop != null ? prev.scrollTop : null,
    key: mine ? a.getAttribute("data-itk-key") : prev.key != null ? prev.key : null,
    at: mine ? Date.now() : prev.at || 0,
    selStart: mine && typeof a.selectionStart === "number" ? a.selectionStart : null,
    selEnd: mine && typeof a.selectionEnd === "number" ? a.selectionEnd : null,
  };
}

function restoreUI() {
  const snap = window[UIKEY];
  if (!snap) return;
  const host = scrollHost();
  if (host && typeof snap.scrollTop === "number") host.scrollTop = snap.scrollTop;
  if (!snap.key || Date.now() - (snap.at || 0) > FOCUS_TTL) return;
  let target = null;
  try {
    const esc = window.CSS && CSS.escape ? CSS.escape(snap.key) : snap.key;
    target = root.querySelector("[data-itk-key=" + JSON.stringify(esc) + "]");
  } catch (e) {
    return;
  }
  if (!target) return;
  target.focus({ preventScroll: true });
  /* type="number" throws on setSelectionRange in Chromium. Caret restore is best effort. */
  if (snap.selStart !== null && typeof target.setSelectionRange === "function") {
    try {
      target.setSelectionRange(snap.selStart, snap.selEnd);
    } catch (e) {
      /* not a text-selectable input */
    }
  }
}

/* ---------------------------------------------------------- surgical paint ---
 * The remaining half of the "it jumps around" bug: even with focus and scroll
 * restored, every edit still called render(), which empties the container and
 * rebuilds all rows. With 18 combatants that is a visible lurch on every keystroke.
 *
 * So the hot paths (damage, HP, temp, counters, next turn) no longer re-render.
 * They mutate state and then repaint only the handful of nodes that changed.
 * render() stays for structural changes: adding, deleting, sorting, clearing. */
const dom = {
  rows: new Map(), // combatant id -> { tr, turnCell, hp, temp }
  counters: new Map(), // counter label -> { pips, val }
  roundLabel: null,
};

function resetDom() {
  dom.rows.clear();
  dom.counters.clear();
  dom.roundLabel = null;
}

function isDown(c) {
  // null <= 0 is true in JS, and PCs carry hp: null -- without the kind check
  // every PC row renders struck through as if dead.
  return c.kind !== "pc" && typeof c.hp === "number" && c.hp <= 0;
}

function paintRow(c) {
  const r = dom.rows.get(c.id);
  if (!r) return render(); // row vanished -- fall back to a full rebuild
  r.tr.classList.toggle("itk-down", isDown(c));
  if (r.hp && document.activeElement !== r.hp) r.hp.value = c.hp ?? 0;
  if (r.temp && document.activeElement !== r.temp) r.temp.value = c.temp ?? 0;
}

function paintCounter(ct) {
  const h = dom.counters.get(ct.label);
  if (!h) return render();
  if (h.val) {
    h.val.setText(`${ct.value}${typeof ct.max === "number" ? " / " + ct.max : ""}`);
  }
  if (h.pips && typeof ct.max === "number" && ct.max <= 24) {
    const pips = h.pips.children;
    for (let i = 0; i < pips.length; i++) {
      pips[i].classList.toggle("on", i + 1 <= ct.value);
      pips[i].classList.toggle("off", i + 1 > ct.value);
    }
  }
}

function paintTurn() {
  if (dom.roundLabel) {
    dom.roundLabel.setText(state.started ? `Round ${state.round}` : "Not started");
  }
  state.combatants.forEach((c, idx) => {
    const r = dom.rows.get(c.id);
    if (!r) return;
    const on = idx === state.active && state.started;
    r.tr.classList.toggle("itk-active", on);
    if (r.turnCell) r.turnCell.setText(on ? "▶" : "");
  });
  for (const ct of state.counters) paintCounter(ct);
}

let rendering = false;

function render() {
  if (rendering) return; // a re-entrant render is always the stale one
  rendering = true;
  renders += 1;
  try {
    snapshotUI();
    root.empty();
    resetDom();
    root.addClass("itk");
    renderHeader();
    renderCounters();
    renderTable();
    renderAdd();
    renderFooter();
    restoreUI();
  } catch (e) {
    root.empty();
    const box = root.createEl("div", { cls: "itk-error" });
    box.createEl("strong").setText("Tracker error — run the fight off the runsheet.");
    box.createEl("pre").setText(String((e && e.stack) || e));
  } finally {
    rendering = false;
  }
}

function renderHeader() {
  const bar = root.createEl("div", { cls: "itk-bar" });

  const nameIn = textInput(bar, "enc-name", "itk-name");
  nameIn.placeholder = "Encounter name…";
  nameIn.value = state.name || "";
  nameIn.onchange = async () => {
    state.name = nameIn.value;
    await persist();
  };

  const rd = bar.createEl("span", { cls: "itk-round" });
  rd.setText(state.started ? `Round ${state.round}` : "Not started");
  dom.roundLabel = rd;

  button(bar, state.started ? "Next turn ▶" : "Start ▶", "itk-primary", async () => {
    const wasStarted = state.started;
    nextTurn();
    if (!wasStarted) {
      // the button's own label changes from Start to Next turn -- needs a rebuild
      render();
    } else {
      paintTurn(); // move the marker only; do not touch the other 17 rows
    }
    await flush();
  });

  button(bar, "Sort by initiative", "", async () => {
    const ord = ordered();
    const activeId = state.combatants[state.active]?.id;
    state.combatants = ord.map((o) => o.c);
    const ni = state.combatants.findIndex((c) => c.id === activeId);
    state.active = ni >= 0 ? ni : 0;
    await commitNow();
  });
}

function renderCounters() {
  const wrap = root.createEl("div", { cls: "itk-counters" });

  for (const ct of state.counters) {
    const box = wrap.createEl("div", { cls: "itk-counter" });
    el(box, "div", "itk-counter-label", ct.label);

    const pips = box.createEl("div", { cls: "itk-pips" });
    const handle = { pips, val: null };
    dom.counters.set(ct.label, handle);
    if (typeof ct.max === "number" && ct.max <= 24) {
      for (let i = 1; i <= ct.max; i++) {
        const p = pips.createEl("span", {
          cls: "itk-pip " + (i <= ct.value ? "on" : "off"),
        });
        p.setText("■");
      }
    }

    const row = box.createEl("div", { cls: "itk-counter-row" });
    button(row, "−", "", async () => {
      ct.value = clamp(ct.value - 1, ct.min, ct.max);
      paintCounter(ct);
      scheduleFlush();
    });
    handle.val = el(row, "span", "itk-counter-val", `${ct.value}${typeof ct.max === "number" ? " / " + ct.max : ""}`);
    button(row, "+", "", async () => {
      ct.value = clamp(ct.value + 1, ct.min, ct.max);
      paintCounter(ct);
      scheduleFlush();
    });
    if (ct.perRound) el(row, "span", "itk-dim", `${ct.perRound > 0 ? "+" : ""}${ct.perRound}/round`);
    button(row, "✕", "itk-ghost itk-far", async () => {
      if (!window.confirm(`Delete the "${ct.label}" counter?`)) return;
      state.counters = state.counters.filter((x) => x !== ct);
      await commitNow();
    });
  }

  const add = wrap.createEl("div", { cls: "itk-counter-add" });
  const lbl = textInput(add, "ct-label");
  lbl.placeholder = "Counter (e.g. Anchor Charge)";
  const max = numInput(add, "ct-max");
  max.placeholder = "max";
  const per = numInput(add, "ct-per");
  per.placeholder = "±/round";
  button(add, "Add counter", "", async () => {
    if (!lbl.value.trim()) return;
    const mx = max.value === "" ? null : Number(max.value);
    state.counters.push({
      label: lbl.value.trim(),
      value: mx ?? 0,
      min: 0,
      max: mx,
      perRound: per.value === "" ? 0 : Number(per.value),
    });
    await commitNow();
  });
}

function renderTable() {
  if (!state.combatants.length) {
    el(root, "p", "itk-dim", "No combatants yet. Add them below.");
    return;
  }

  const table = root.createEl("table", { cls: "itk-table" });
  const head = table.createEl("thead").createEl("tr");
  for (const h of ["", "Name", "Init", "AC", "HP", "Temp", "Conditions", ""]) {
    head.createEl("th").setText(h);
  }
  const body = table.createEl("tbody");

  state.combatants.forEach((c, idx) => {
    const tr = body.createEl("tr", {
      cls: (idx === state.active && state.started ? "itk-active " : "") + (isDown(c) ? "itk-down" : ""),
    });

    const turnCell = el(tr, "td", "itk-turn", idx === state.active && state.started ? "▶" : "");
    const handle = { tr, turnCell, hp: null, temp: null };
    dom.rows.set(c.id, handle);

    const nameCell = tr.createEl("td");
    nameCell.createEl("span", { cls: "itk-cname" }).setText(c.name);
    if (c.kind === "pc") el(nameCell, "span", "itk-tag", "PC");

    const initCell = tr.createEl("td");
    const initIn = numInput(initCell, "init:" + c.id);
    initIn.value = c.init ?? "";
    initIn.onchange = async () => {
      c.init = Number(initIn.value);
      await persist();
    };

    el(tr, "td", "", c.ac ?? "—");

    const hpCell = tr.createEl("td", { cls: "itk-hp" });
    if (c.kind === "pc") {
      el(hpCell, "span", "itk-dim", "player-tracked");
    } else {
      const cur = numInput(hpCell, "hp:" + c.id);
      cur.value = c.hp ?? 0;
      handle.hp = cur;
      cur.onchange = async () => {
        c.hp = Number(cur.value);
        paintRow(c);
        scheduleFlush();
      };
      el(hpCell, "span", "itk-dim", ` / ${c.hpMax ?? "?"}`);

      const dmg = numInput(hpCell, "dmg:" + c.id, "itk-dmg");
      dmg.placeholder = "dmg";
      dmg.onkeydown = async (ev) => {
        if (ev.key !== "Enter") return;
        const n = Number(dmg.value);
        if (!Number.isFinite(n) || n === 0) return;
        let left = n;
        if (c.temp > 0) {
          const absorbed = Math.min(c.temp, left);
          c.temp -= absorbed;
          left -= absorbed;
        }
        c.hp = (c.hp ?? 0) - left;
        dmg.value = "";
        /* This is the path the DM uses most: type damage, press Enter. It must not
         * rebuild the table -- repaint this one row and keep the cursor where it is. */
        paintRow(c);
        scheduleFlush();
        dmg.focus();
      };
    }

    const tempCell = tr.createEl("td");
    const tempIn = numInput(tempCell, "temp:" + c.id);
    tempIn.value = c.temp ?? 0;
    handle.temp = tempIn;
    tempIn.onchange = async () => {
      c.temp = Number(tempIn.value);
      paintRow(c);
      scheduleFlush();
    };

    const condCell = tr.createEl("td");
    const condIn = textInput(condCell, "cond:" + c.id, "itk-cond");
    condIn.value = c.cond || "";
    condIn.placeholder = "Stunned, Prone…";
    condIn.onchange = async () => {
      c.cond = condIn.value;
      await persist();
    };

    const actCell = tr.createEl("td");
    button(actCell, "✕", "itk-ghost", async () => {
      state.combatants = state.combatants.filter((x) => x.id !== c.id);
      if (state.active >= state.combatants.length) state.active = 0;
      await commitNow();
    });
  });
}

function renderAdd() {
  const wrap = root.createEl("div", { cls: "itk-add" });

  const listId = "itk-roster";
  const dl = wrap.createEl("datalist");
  dl.id = listId;
  for (const r of ROSTER) dl.createEl("option").value = r.name;

  const nameIn = textInput(wrap, "add-name", "itk-addname");
  nameIn.placeholder = "Name from Bestiary/ or PCs/…";
  nameIn.setAttr("list", listId);

  const initIn = numInput(wrap, "add-init");
  initIn.placeholder = "init";

  const countIn = numInput(wrap, "add-count");
  countIn.placeholder = "×n";

  const doAdd = async () => {
    const q = nameIn.value.trim();
    if (!q) return;
    const hit = lookup(q);
    const n = Math.max(1, Number(countIn.value) || 1);
    for (let i = 0; i < n; i++) {
      const label = n > 1 ? `${hit ? hit.name : q} ${i + 1}` : hit ? hit.name : q;
      state.combatants.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: label,
        kind: hit ? hit.kind : "monster",
        ac: hit ? hit.ac : null,
        hp: hit && hit.kind !== "pc" ? hit.hp : null,
        hpMax: hit && hit.kind !== "pc" ? hit.hp : null,
        temp: 0,
        init: initIn.value === "" ? null : Number(initIn.value),
        cond: "",
      });
    }
    nameIn.value = "";
    initIn.value = "";
    countIn.value = "";
    await commitNow();
  };

  nameIn.onkeydown = (ev) => {
    if (ev.key === "Enter") doAdd();
  };
  initIn.onkeydown = (ev) => {
    if (ev.key === "Enter") doAdd();
  };
  button(wrap, "Add", "itk-primary", doAdd);
}

function renderFooter() {
  const bar = root.createEl("div", { cls: "itk-foot" });

  button(bar, "Archive to Encounters/", "", async () => {
    await flush(); // the archive must reflect what is on screen
    const stamp = window.moment ? window.moment().format("YYYY-MM-DD") : new Date().toISOString().slice(0, 10);
    const safe = (state.name || "Encounter").replace(/[\\/:*?"<>|]/g, "-");
    const path = `${ENC_DIR}/${stamp} ${safe}.md`;

    const lines = [
      "---",
      "type: encounter",
      "status: played",
      `date: ${stamp}`,
      `rounds: ${state.round}`,
      "---",
      "",
      `# ${state.name || "Encounter"}`,
      "",
      `Rounds fought: **${state.round}**`,
      "",
      "| Combatant | Init | AC | HP left | Conditions |",
      "|-----------|------|----|---------|------------|",
    ];
    for (const o of ordered()) {
      const c = o.c;
      lines.push(
        `| ${c.name} | ${c.init ?? "—"} | ${c.ac ?? "—"} | ${
          c.kind === "pc" ? "player-tracked" : `${c.hp ?? "—"} / ${c.hpMax ?? "—"}`
        } | ${c.cond || "—"} |`
      );
    }
    if (state.counters.length) {
      lines.push("", "## Counters at end", "");
      for (const ct of state.counters) {
        lines.push(`- **${ct.label}:** ${ct.value}${typeof ct.max === "number" ? " / " + ct.max : ""}`);
      }
    }

    try {
      if (!app.vault.getAbstractFileByPath(ENC_DIR)) {
        await app.vault.createFolder(ENC_DIR);
      }
    } catch (e) {
      /* folder already exists */
    }
    await app.vault.create(path, lines.join("\n"));
    new Notice(`Archived to ${path}`);
  });

  button(bar, "Clear fight", "itk-danger", async () => {
    if (!window.confirm("Clear all combatants and counters?")) return;
    state = blankState();
    await commitNow();
  });

  /* "block runs" climbing on its own means Dataview is auto-refreshing the view. The DOM
   * should no longer visibly jump when it does -- that is what snapshotUI/restoreUI buy. */
  el(
    bar,
    "span",
    "itk-dim",
    `${state.combatants.length} combatants · ${window[FKEY] ? "saving…" : "saved"} · ` +
      `block runs ${RUNS} · renders ${renders}`
  );
}

render();
