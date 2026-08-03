// Ironhold combat tracker
// Loaded from Combat/Scratch.md via:  await dv.view("_scripts/tracker")
// State persists to Combat/State.md so writing never re-triggers this block.

const STATE_PATH = "Combat/State.md";
const PC_FOLDER = "PCs";
const BESTIARY_FOLDER = "Bestiary";

const app = dv.app ?? window.app;
let obsidian = null;
try { obsidian = require("obsidian"); } catch (e) { /* fallback below */ }

// ---------------------------------------------------------------- state

const blank = () => ({ round: 1, seconds: 0, name: "", rows: [], sel: 0 });

async function ensureStateFile() {
  let f = app.vault.getAbstractFileByPath(STATE_PATH);
  if (!f) {
    await app.vault.create(STATE_PATH, "---\ncombat: {}\n---\n\nAuto-managed by the tracker. Do not edit by hand.\n");
    f = app.vault.getAbstractFileByPath(STATE_PATH);
  }
  return f;
}

async function loadState() {
  const f = await ensureStateFile();
  const fm = app.metadataCache.getFileCache(f)?.frontmatter ?? {};
  const raw = fm.combat;
  if (!raw || typeof raw !== "object" || !Array.isArray(raw.rows)) return blank();
  return Object.assign(blank(), raw);
}

let saveTimer = null;
function save(S) {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    const f = await ensureStateFile();
    await app.fileManager.processFrontMatter(f, (fm) => { fm.combat = S; });
  }, 350);
}

// ---------------------------------------------------------------- data

function partyRows() {
  return app.vault.getMarkdownFiles()
    .filter(f => f.path.startsWith(PC_FOLDER + "/"))
    .map(f => {
      const fm = app.metadataCache.getFileCache(f)?.frontmatter ?? {};
      return { kind: "pc", name: f.basename, path: f.path, ac: fm.ac ?? null, init: null, conds: [] };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

function bestiaryLookup(name) {
  const needle = name.trim().toLowerCase();
  const f = app.vault.getMarkdownFiles().find(f =>
    f.path.startsWith(BESTIARY_FOLDER + "/") && f.basename.toLowerCase() === needle);
  if (!f) return null;
  const fm = app.metadataCache.getFileCache(f)?.frontmatter ?? {};
  return {
    path: f.path, ac: fm.ac ?? null, hp: fm.hp ?? null,
    saves: fm.saves ?? null, resist: fm.resistances ?? null,
    immune: fm.immunities ?? null, cr: fm.cr ?? null,
  };
}

// ---------------------------------------------------------------- helpers

function makeMonster(name, ac, hp, extra = {}) {
  return Object.assign({
    kind: "monster", name, ac: ac ?? null, hpMax: hp ?? null, hp: hp ?? null,
    log: hp != null ? [hp] : [], init: null, conds: [], path: null,
    saves: null, resist: null, immune: null, note: "", open: false,
  }, extra);
}

function parseQuickAdd(text) {
  const t = text.trim();
  if (!t) return null;
  const parts = t.split(",").map(s => s.trim()).filter(Boolean);
  if (parts.length >= 3) return { name: parts[0], ac: +parts[1] || null, hp: +parts[2] || null };
  const m = t.match(/^(.+?)\s+(\d+)\s+(\d+)$/);
  if (m) return { name: m[1].trim(), ac: +m[2], hp: +m[3] };
  return { name: t, ac: null, hp: null };
}

function uniqueName(rows, name) {
  if (!rows.some(r => r.name === name)) return name;
  let n = 2;
  while (rows.some(r => r.name === `${name} ${n}`)) n++;
  return `${name} ${n}`;
}

function hpColor(r) {
  if (r.hp == null || r.hpMax == null) return "var(--text-normal)";
  if (r.hp <= 0) return "var(--text-faint)";
  const pct = r.hp / r.hpMax;
  if (pct <= 0.25) return "var(--text-error)";
  if (pct <= 0.5) return "var(--text-warning)";
  return "var(--text-normal)";
}

function sortRows(S) {
  S.rows.sort((a, b) => (b.init ?? -99) - (a.init ?? -99));
}

// ---------------------------------------------------------------- render

const root = dv.container;
root.empty();
root.addClass("ihct");

const S = await loadState();
if (S.rows.length === 0) { S.rows = partyRows(); save(S); }

function el(parent, tag, cls, text) {
  const e = parent.createEl(tag, cls ? { cls } : undefined);
  if (text != null) e.setText(text);
  return e;
}

function render() {
  root.empty();

  // header ---------------------------------------------------------
  const head = el(root, "div", "ihct-head");
  const left = el(head, "div", "ihct-head-l");
  el(left, "span", "ihct-round", `Round ${S.round}`);
  el(left, "span", "ihct-time", `${S.seconds} sec`);
  if (S.name) el(left, "span", "ihct-encname", S.name);

  const btns = el(head, "div", "ihct-head-r");
  const bRound = el(btns, "button", null, "End round");
  bRound.onclick = () => endRound();
  const bEnd = el(btns, "button", null, "End encounter");
  bEnd.onclick = () => endEncounter();
  const bReset = el(btns, "button", null, "Reset");
  bReset.onclick = () => { Object.assign(S, blank()); S.rows = partyRows(); save(S); render(); };

  // keyboard legend ------------------------------------------------
  const keys = el(root, "div", "ihct-keys");
  [["j / k", "select"], ["digits + enter", "damage"], ["- digits", "heal"],
   ["R", "end round"], ["N", "add"], ["C", "condition"], ["space", "stat block"]]
    .forEach(([k, v]) => {
      const s = el(keys, "span", "ihct-key");
      el(s, "b", null, k); el(s, "span", null, " " + v);
    });

  // rows -----------------------------------------------------------
  S.rows.forEach((r, i) => {
    const selected = i === S.sel;
    if (r.kind === "pc") return renderPC(r, i, selected);
    renderMonster(r, i, selected);
  });

  // footer ---------------------------------------------------------
  const foot = el(root, "div", "ihct-foot");
  const qa = foot.createEl("input", { attr: { type: "text", placeholder: "Add: name, AC, HP  —  or just a Bestiary name" } });
  qa.addClass("ihct-qa");
  qa.onkeydown = (e) => { if (e.key === "Enter") { quickAdd(qa.value); qa.value = ""; } };

  const bAdd = el(foot, "button", null, "Add");
  bAdd.onclick = () => { quickAdd(qa.value); qa.value = ""; };

  const bGen = el(foot, "button", "ihct-gen", "Build monster ↗");
  bGen.onclick = () => copyGenPrompt();
}

function renderPC(r, i, selected) {
  const row = el(root, "div", "ihct-pc" + (selected ? " is-sel" : ""));
  row.onclick = () => { S.sel = i; save(S); render(); };
  const init = el(row, "span", "ihct-init");
  const ii = init.createEl("input", { attr: { type: "text", value: r.init ?? "", placeholder: "–" } });
  ii.addClass("ihct-initin");
  ii.onchange = () => { r.init = ii.value === "" ? null : +ii.value; sortRows(S); save(S); render(); };
  el(row, "span", "ihct-name", r.name);
  if (r.ac != null) el(row, "span", "ihct-ac", `AC ${r.ac}`);
  renderConds(row, r);
}

function renderMonster(r, i, selected) {
  const card = el(root, "div", "ihct-mon" + (selected ? " is-sel" : "") + (r.hp <= 0 ? " is-dead" : ""));
  card.onclick = (e) => { if (e.target.tagName !== "INPUT" && e.target.tagName !== "BUTTON") { S.sel = i; save(S); render(); } };

  const init = el(card, "span", "ihct-init");
  const ii = init.createEl("input", { attr: { type: "text", value: r.init ?? "", placeholder: "–" } });
  ii.addClass("ihct-initin");
  ii.onchange = () => { r.init = ii.value === "" ? null : +ii.value; sortRows(S); save(S); render(); };

  const body = el(card, "div", "ihct-body");
  const titleRow = el(body, "div", "ihct-titlerow");
  const nm = el(titleRow, "span", "ihct-monname", r.name);
  if (r.path) { nm.addClass("ihct-link"); nm.onclick = () => app.workspace.openLinkText(r.path, "", false); }
  if (r.ac != null) el(titleRow, "span", "ihct-ac", `AC ${r.ac}`);

  const meta = [r.saves, r.immune ? `immune ${r.immune}` : null, r.resist ? `resist ${r.resist}` : null]
    .filter(Boolean).join(" · ");
  if (meta) el(body, "div", "ihct-meta", meta);
  renderConds(body, r);
  if (r.open && r.path) renderStatBlock(body, r);

  const right = el(card, "div", "ihct-right");
  const hp = el(right, "div", "ihct-hp");
  hp.style.color = hpColor(r);
  hp.setText(r.hp == null ? "—" : String(r.hp));
  if (r.hpMax != null) el(hp, "span", "ihct-hpmax", `/${r.hpMax}`);

  const di = right.createEl("input", { attr: { type: "text", placeholder: "damage" } });
  di.addClass("ihct-dmg");
  di.onkeydown = (e) => {
    if (e.key !== "Enter") return;
    applyDamage(r, di.value);
    di.value = "";
    render();
  };
}

function renderConds(parent, r) {
  if (!r.conds || r.conds.length === 0) return;
  const wrap = el(parent, "div", "ihct-conds");
  r.conds.forEach((c, ci) => {
    const label = c.until ? `${c.text} · until round ${c.until}` : c.text;
    const pill = el(wrap, "span", "ihct-cond", label);
    pill.onclick = () => { r.conds.splice(ci, 1); save(S); render(); };
  });
}

async function renderStatBlock(parent, r) {
  const box = el(parent, "div", "ihct-sb");
  const file = app.vault.getAbstractFileByPath(r.path);
  if (!file) return;
  const md = await app.vault.cachedRead(file);
  const body = md.replace(/^---[\s\S]*?---\n/, "");
  if (obsidian?.MarkdownRenderer) {
    await obsidian.MarkdownRenderer.render(app, body, box, r.path, dv.component ?? { addChild() {}, register() {} });
  } else {
    box.createEl("pre").setText(body);
  }
}

// ---------------------------------------------------------------- actions

function applyDamage(r, raw) {
  const v = raw.trim();
  if (!v) return;
  const n = Number(v);
  if (Number.isNaN(n) || r.hp == null) return;
  r.hp = r.hp - n;                       // negative input heals
  if (r.hpMax != null && r.hp > r.hpMax) r.hp = r.hpMax;
  r.log.push(r.hp);
  save(S);
}

function quickAdd(text) {
  const p = parseQuickAdd(text);
  if (!p) return;
  const found = bestiaryLookup(p.name);
  const row = makeMonster(
    uniqueName(S.rows, p.name),
    p.ac ?? found?.ac ?? null,
    p.hp ?? found?.hp ?? null,
    found ? { path: found.path, saves: found.saves, resist: found.resist, immune: found.immune } : {}
  );
  S.rows.push(row);
  sortRows(S);
  save(S);
  render();
}

function endRound() {
  S.round += 1;
  S.seconds += 6;
  S.rows.forEach(r => { r.conds = (r.conds ?? []).filter(c => !c.until || c.until > S.round); });
  save(S);
  render();
}

function addCondition(r) {
  const text = window.prompt("Condition (add ' 2' for rounds, e.g. 'stunned 1')");
  if (!text) return;
  const m = text.match(/^(.*?)\s+(\d+)$/);
  r.conds = r.conds ?? [];
  if (m) r.conds.push({ text: m[1], until: S.round + Number(m[2]) });
  else r.conds.push({ text });
  save(S);
  render();
}

function logLine(r) {
  if (r.kind === "pc") return `${r.name}: ${r.init ?? "–"}`;
  const chain = r.log.length ? ` [HP: ${r.log.join(" -> ")}]` : "";
  return `${r.name}: ${r.init ?? "–"}${chain}`;
}

async function endEncounter() {
  const name = window.prompt("Encounter name", S.name || "Unnamed encounter");
  if (name === null) return;
  const date = new Date().toISOString().slice(0, 10);
  const slug = name.toLowerCase().replace(/[^a-z0-9æøå]+/g, "-").replace(/^-|-$/g, "");
  const path = `Encounters/${date}-${slug}.md`;

  const monsters = S.rows.filter(r => r.kind === "monster");
  const unverified = monsters.filter(r => !r.path).map(r => r.name);

  const body = [
    "---",
    `type: encounter`,
    `date: ${date}`,
    `rounds: ${S.round}`,
    `duration_seconds: ${S.seconds}`,
    `unverified: [${unverified.map(u => `"${u}"`).join(", ")}]`,
    "---",
    "",
    `# ${name}`,
    "",
    `Rounds: ${S.round} · ${S.seconds} seconds of in-world time`,
    "",
    "## Initiative and HP",
    "",
    "```",
    ...S.rows.map(logLine),
    "```",
    "",
    "## Noter",
    "",
    "",
  ].join("\n");

  await app.vault.create(path, body);
  Object.assign(S, blank());
  S.rows = partyRows();
  save(S);
  render();
  app.workspace.openLinkText(path, "", false);
}

async function copyGenPrompt() {
  const alive = S.rows.filter(r => r.kind === "monster" && r.hp > 0)
    .map(r => `${r.name} (${r.hp}/${r.hpMax} HP)`).join(", ") || "none yet";
  const prompt = [
    `Read _dm/ACTIVE.md for the current room and situation, and the three most recently`,
    `modified Bestiary/ notes for house style and formatting.`,
    ``,
    `Build one new creature that fits this room and this fight.`,
    `Party: level 11, five PCs. Currently on the field: ${alive}.`,
    `Round ${S.round}.`,
    ``,
    `Use the Bestiary template exactly. Mechanics and stat block in English.`,
    `Any read-aloud description in Danish. 5e 2014 rules only.`,
    `Write it to Bestiary/ with status: unverified, then reply with only`,
    `the line "NAME, AC, HP" so I can paste it into the tracker.`,
  ].join("\n");
  await navigator.clipboard.writeText(prompt);
  new (obsidian?.Notice ?? function () {})("Prompt copied — paste into Claude Code");
}

// ---------------------------------------------------------------- keyboard

function onKey(e) {
  if (!root.isShown?.() && !document.body.contains(root)) return;
  const tag = e.target?.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || e.target?.isContentEditable) return;

  const r = S.rows[S.sel];
  if (e.key === "j") { S.sel = Math.min(S.sel + 1, S.rows.length - 1); save(S); render(); }
  else if (e.key === "k") { S.sel = Math.max(S.sel - 1, 0); save(S); render(); }
  else if (e.key === "r" || e.key === "R") { endRound(); }
  else if (e.key === "n" || e.key === "N") { root.querySelector(".ihct-qa")?.focus(); e.preventDefault(); }
  else if (e.key === "c" || e.key === "C") { if (r) addCondition(r); }
  else if (e.key === " ") { if (r?.kind === "monster") { r.open = !r.open; save(S); render(); e.preventDefault(); } }
  else if (/^[0-9-]$/.test(e.key)) {
    const input = root.querySelectorAll(".ihct-dmg")[
      S.rows.slice(0, S.sel + 1).filter(x => x.kind === "monster").length - 1];
    if (input) { input.focus(); input.value = e.key; e.preventDefault(); }
  }
}

document.addEventListener("keydown", onKey);
if (dv.component?.register) dv.component.register(() => document.removeEventListener("keydown", onKey));

render();
