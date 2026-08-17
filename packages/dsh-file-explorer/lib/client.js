window.__ModuleLoader__.load({ id: "dsh-file-explorer", factory: (require) => {
var module = { exports: {} }; var exports = module.exports;
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apply = apply;
const react_1 = require("react");

/**
 * dsh-file-explorer (client half, v1).
 * A collapsible right-side file panel over `shell.overlay` with an IDE-grade
 * tree, per-extension colored icons, inline preview, and file operations,
 * all through the same-origin host route /_dsh/file-explorer.
 */

const CSS = `
.dfe-root { position: fixed; top: 0; right: 0; bottom: 0; width: 0; z-index: 60; pointer-events: none; }
.dfe-panel {
  position: absolute; top: 0; right: 0; bottom: 0; width: 330px;
  display: flex; flex-direction: column;
  background: linear-gradient(180deg,
    color-mix(in srgb, #5C807D 5%, var(--dsw-alias-surface-primary, #fafafa)) 0%,
    var(--dsw-alias-surface-primary, #fafafa) 26%,
    color-mix(in srgb, #3F5F5C 7%, var(--dsw-alias-surface-primary, #fafafa)) 100%);
  color: var(--dsw-alias-label-primary, #1f2329);
  border-left: 1px solid var(--dsw-alias-border-l1, rgba(127,127,127,.25));
  box-shadow: -8px 0 24px rgba(0,0,0,.10), -1px 0 0 rgba(0,0,0,.04);
  pointer-events: auto;
  transform: translateX(100%);
  transition: transform .22s cubic-bezier(.22,.9,.34,1);
  font-family: inherit;
  overflow: hidden;
}
.dfe-deco { position: absolute; right: -6px; bottom: -8px; width: 108px; height: 108px; opacity: .4; pointer-events: none; filter: drop-shadow(0 2px 4px rgba(0,0,0,.10)); }
.dfe-deco-cloud { position: absolute; left: 0; top: 44px; width: 96px; height: 96px; opacity: .35; pointer-events: none; }

.dfe-places { border-bottom: 1px solid var(--dsw-alias-border-l1, rgba(127,127,127,.18)); padding: 4px; }
.dfe-places-head { display: flex; align-items: center; gap: 6px; padding: 3px 6px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 700; color: var(--dsw-alias-label-secondary, #6b7280); user-select: none; }
.dfe-places-head:hover { background: var(--dsw-alias-interactive-bg-hover, rgba(127,127,127,.10)); }
.dfe-places-title { color: var(--dsw-alias-label-primary, #1f2329); }
.dfe-places-hint { font-size: 10px; font-weight: 400; opacity: .7; }
.dfe-root.open .dfe-panel { transform: translateX(0); }
.dfe-backdrop { position: fixed; inset: 0; background: transparent; pointer-events: auto; z-index: 1; }
.dfe-panel { z-index: 2; }
.dfe-tab {
  position: absolute; right: 0; top: 44%;
  display: flex; flex-direction: column; align-items: center; gap: 5px;
  padding: 9px 6px;
  font-size: 12px; font-weight: 700;
  color: var(--dsw-alias-label-primary, #1f2329);
  background: color-mix(in srgb, #5C807D 10%, var(--dsw-alias-surface-primary, #fafafa));
  border: 1.5px solid #5C807D;
  border-right: none; border-radius: 12px 0 0 12px;
  cursor: pointer; pointer-events: auto;
  box-shadow: -3px 0 12px rgba(63,95,92,.22), 0 2px 8px rgba(0,0,0,.12);
  transition: transform .15s ease, background-color .15s ease, box-shadow .15s ease;
  animation: dfe-bob 2.8s ease-in-out infinite;
}
.dfe-tab:hover {
  background: color-mix(in srgb, #5C807D 22%, var(--dsw-alias-surface-primary, #fafafa));
  transform: translateX(-6px);
  box-shadow: -6px 0 16px rgba(63,95,92,.3), 0 2px 10px rgba(0,0,0,.15);
}
.dfe-tab-avatar { width: 30px; height: 30px; border-radius: 50%; border: 2px solid #5C807D; box-shadow: 0 2px 5px rgba(0,0,0,.18); }
.dfe-tab-label { writing-mode: vertical-rl; letter-spacing: .14em; }
.dfe-root.open .dfe-tab { opacity: 0; pointer-events: none; animation: none; }
@keyframes dfe-bob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
.dfe-head-avatar { width: 20px; height: 20px; border-radius: 50%; border: 1.5px solid #5C807D; flex-shrink: 0; }

.dfe-header { display: flex; align-items: center; gap: 4px; padding: 10px 10px 8px; border-bottom: 1px solid var(--dsw-alias-border-l1, rgba(127,127,127,.25)); }
.dfe-title { font-size: 12px; font-weight: 700; letter-spacing: .01em; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dfe-btn {
  display: inline-flex; align-items: center; justify-content: center;
  width: 24px; height: 24px; border: none; border-radius: 6px;
  background: transparent; color: var(--dsw-alias-label-secondary, #6b7280);
  cursor: pointer; transition: background-color .12s ease, color .12s ease;
}
.dfe-btn:hover { background: var(--dsw-alias-interactive-bg-hover, rgba(127,127,127,.10)); color: var(--dsw-alias-label-primary, #1f2329); }
.dfe-btn.danger:hover { background: rgba(229,83,75,.12); color: var(--dsw-alias-state-error-primary, #e5534b); }

.dfe-crumb { padding: 7px 12px; font-size: 11.5px; color: var(--dsw-alias-label-secondary, #6b7280); border-bottom: 1px solid var(--dsw-alias-border-l1, rgba(127,127,127,.18)); display: flex; align-items: center; gap: 6px; overflow: hidden; white-space: nowrap; }
.dfe-crumb b { color: var(--dsw-alias-label-primary, #1f2329); font-weight: 600; }

.dfe-tree { flex: 1; overflow: auto; padding: 4px; scrollbar-width: thin; }
.dfe-row {
  display: flex; align-items: center; gap: 6px;
  height: 27px; padding: 0 6px; border-radius: 6px;
  font-size: 13px; color: var(--dsw-alias-label-primary, #1f2329);
  cursor: pointer; position: relative; user-select: none;
  transition: background-color .1s ease;
}
.dfe-row:hover { background: var(--dsw-alias-interactive-bg-hover, rgba(127,127,127,.10)); }
.dfe-row.sel { background: color-mix(in srgb, var(--dsw-alias-brand-primary, #1F4E79) 12%, transparent); }
.dfe-row.sel::before {
  content: ""; position: absolute; left: 0; top: 4px; bottom: 4px; width: 2.5px;
  border-radius: 2px; background: var(--dsw-alias-brand-primary, #1F4E79);
}
.dfe-row .ico { display: inline-flex; flex-shrink: 0; width: 14px; align-items: center; justify-content: center; }
.dfe-row .name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dfe-row .meta { font-size: 10px; color: var(--dsw-alias-label-secondary, #6b7280); flex-shrink: 0; }
.dfe-chev { width: 12px; height: 12px; display: inline-flex; align-items: center; justify-content: center; color: var(--dsw-alias-label-secondary, #6b7280); transition: transform .14s ease; flex-shrink: 0; }
.dfe-chev.open { transform: rotate(90deg); }
.dfe-ops { display: none; gap: 3px; flex-shrink: 0; }
.dfe-row:hover .dfe-ops, .dfe-row.sel .dfe-ops { display: inline-flex; }
.dfe-op {
  width: 22px; height: 22px; border: 1px solid transparent; border-radius: 6px; background: transparent;
  color: var(--dsw-alias-label-secondary, #6b7280); cursor: pointer;
  display: inline-flex; align-items: center; justify-content: center;
  transition: background-color .1s ease, color .1s ease, border-color .1s ease;
}
.dfe-op:hover { background: var(--dsw-alias-interactive-bg-hover, rgba(127,127,127,.16)); color: var(--dsw-alias-label-primary, #1f2329); }
.dfe-op.rename:hover { background: var(--dsw-alias-brand-primary, #1F4E79); color: #fff; }
.dfe-op.danger:hover { background: var(--dsw-alias-state-error-primary, #e5534b); color: #fff; }
.dfe-rename-input { flex: 1; font: inherit; font-size: 12px; padding: 1px 4px; border: 1px solid var(--dsw-alias-brand-primary, #1F4E79); border-radius: 4px; outline: none; background: transparent; color: inherit; }
.dfe-confirm { display: inline-flex; gap: 4px; align-items: center; flex-shrink: 0; font-size: 11px; color: var(--dsw-alias-state-error-primary, #e5534b); }
.dfe-confirm button { font-size: 11px; border: 1px solid var(--dsw-alias-border-l1, rgba(127,127,127,.3)); background: transparent; color: inherit; border-radius: 5px; padding: 1px 8px; cursor: pointer; }
.dfe-confirm button:hover { background: var(--dsw-alias-interactive-bg-hover, rgba(127,127,127,.12)); }
.dfe-confirm .yes { border-color: var(--dsw-alias-state-error-primary, #e5534b); background: var(--dsw-alias-state-error-primary, #e5534b); color: #fff; }
.dfe-confirm .yes:hover { background: #d0433c; }

.dfe-preview { border-top: 1px solid var(--dsw-alias-border-l1, rgba(127,127,127,.25)); display: flex; flex-direction: column; max-height: 42%; min-height: 120px; }
.dfe-preview-head { display: flex; align-items: center; gap: 6px; padding: 7px 10px; font-size: 12px; color: var(--dsw-alias-label-secondary, #6b7280); border-bottom: 1px solid var(--dsw-alias-border-l1, rgba(127,127,127,.18)); }
.dfe-preview-head .fn { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 600; color: var(--dsw-alias-label-primary, #1f2329); }
.dfe-badge { font-size: 9.5px; padding: 1px 6px; border-radius: 8px; background: var(--dsw-alias-interactive-bg-hover, rgba(127,127,127,.12)); }
.dfe-preview-body { flex: 1; overflow: auto; }
.dfe-preview-body pre { margin: 0; padding: 10px 12px; font-family: Consolas, "JetBrains Mono", monospace; font-size: 12.5px; line-height: 1.55; color: var(--dsw-alias-label-primary, #1f2329); white-space: pre; }
.dfe-preview-body img { max-width: 100%; display: block; }
.dfe-preview-body .imgwrap { padding: 10px; display: flex; align-items: center; justify-content: center; min-height: 120px; background: repeating-conic-gradient(rgba(127,127,127,.08) 0 25%, transparent 0 50%) 0 0/16px 16px; }
.dfe-preview-body textarea {
  width: 100%; height: 100%; min-height: 160px; border: none; outline: none; resize: none;
  font-family: Consolas, "JetBrains Mono", monospace; font-size: 11px; line-height: 1.5;
  padding: 10px 12px; background: transparent; color: inherit; box-sizing: border-box;
}
.dfe-empty { padding: 28px 16px; text-align: center; font-size: 12px; color: var(--dsw-alias-label-secondary, #6b7280); }
.dfe-empty .big { font-size: 26px; margin-bottom: 8px; opacity: .5; }
.dfe-empty-crane { width: 81px; height: 170px; margin-bottom: 6px; opacity: .94; filter: drop-shadow(0 3px 6px rgba(0,0,0,.08)); }
.dfe-toast {
  position: absolute; left: 10px; right: 10px; bottom: 10px; z-index: 5;
  font-size: 11.5px; padding: 7px 10px; border-radius: 8px;
  background: var(--dsw-alias-surface-primary, #fafafa);
  border: 1px solid var(--dsw-alias-border-l1, rgba(127,127,127,.3));
  box-shadow: 0 4px 14px rgba(0,0,0,.12);
  animation: dfe-in .18s ease;
}
.dfe-toast.err { border-color: var(--dsw-alias-state-error-primary, #e5534b); color: var(--dsw-alias-state-error-primary, #e5534b); }
.dfe-sign { position: absolute; right: 12px; bottom: 7px; font-size: 10px; color: var(--dsw-alias-label-secondary, #6b7280); opacity: .8; pointer-events: none; z-index: 2; }
.dfe-ctx { position: fixed; z-index: 100; pointer-events: auto; background: var(--dsw-alias-surface-primary, #fafafa); border: 1px solid var(--dsw-alias-border-l1, rgba(127,127,127,.3)); border-radius: 10px; box-shadow: 0 8px 24px rgba(0,0,0,.18); padding: 4px; min-width: 136px; animation: dfe-in .12s ease; }
.dfe-ctx-item { display: flex; align-items: center; gap: 8px; padding: 7px 10px; font-size: 12.5px; border-radius: 7px; cursor: pointer; color: var(--dsw-alias-label-primary, #1f2329); user-select: none; }
.dfe-ctx-item:hover { background: var(--dsw-alias-interactive-bg-hover, rgba(127,127,127,.12)); }
.dfe-ctx-item.danger { color: var(--dsw-alias-state-error-primary, #e5534b); }
.dfe-ctx-item.danger:hover { background: rgba(229,83,75,.12); }
.dfe-ctx-sep { height: 1px; background: var(--dsw-alias-border-l1, rgba(127,127,127,.18)); margin: 4px 6px; }
@keyframes dfe-in { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
`;

const AVATAR_URI = "data:image/png;base64,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";
const SILHOUETTE_URI = "data:image/png;base64,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";
const YUNWEN_URI = "data:image/png;base64,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";



/* ---- small line icons (stroke style, currentColor) ---- */
function Ic({ d, size = 12, sw = 1.6 }) {
  return react_1.createElement("svg", {
    width: size, height: size, viewBox: "0 0 16 16", fill: "none",
    stroke: "currentColor", strokeWidth: sw, strokeLinecap: "round", strokeLinejoin: "round",
    "aria-hidden": true,
  }, react_1.createElement("path", { d }));
}
const ICONS = {
  chevron: "M6 4l4 4-4 4",
  folder: "M2.5 4.5h3.6l1.4 1.7h6a.8.8 0 0 1 .8.8v5.4a.8.8 0 0 1-.8.8H2.5a.8.8 0 0 1-.8-.8V4.5z",
  file: "M4 1.8h5.4l2.8 2.8v9.6H4z M9.4 1.8v2.9h2.9",
  refresh: "M13.2 8a5.2 5.2 0 1 1-1.5-3.7M13.4 1.9v2.6h-2.6",
  filePlus: "M4 1.8h5.4l2.8 2.8v9.6H4z M9.4 1.8v2.9h2.9 M8 8v4 M6 10h4",
  folderPlus: "M2.5 4.5h3.6l1.4 1.7h6v5.7a.8.8 0 0 1-.8.8H2.5a.8.8 0 0 1-.8-.8V4.5z M8 9v3.4 M6.3 10.7h3.4",
  trash: "M2.6 4.4h10.8M6.2 4.4V3.2h3.6v1.2M4 4.4l.6 8.8h6.8l.6-8.8M6.6 7v3.6M9.4 7v3.6",
  pencil: "M11.2 2.3l2.5 2.5-7.4 7.4-3 .5.5-3z",
  close: "M4 4l8 8M12 4l-8 8",
  panel: "M13.5 2.5h-11v11h11z M13.5 2.5V5 M9.8 5h-8",
};

const EXT_COLORS = {
  md: "#519aba", json: "#c9a227", js: "#e8d44d", mjs: "#e8d44d", cjs: "#e8d44d",
  ts: "#4f9bd4", tsx: "#4f9bd4", jsx: "#4f9bd4", css: "#6d9ee8", scss: "#c56ccf",
  html: "#e3795c", vue: "#63c69e", py: "#4b8bbe", go: "#5dc9e2", rs: "#e0926e",
  java: "#d9756c", c: "#5f8dc9", cpp: "#5f8dc9", h: "#7f9fc9", cs: "#9a7fd1",
  sh: "#7fbf7f", bat: "#7fbf7f", ps1: "#4f9bd4", yml: "#c9a227", yaml: "#c9a227",
  toml: "#b06d4f", ini: "#8a8a8a", cfg: "#8a8a8a", txt: "#8a8a8a", log: "#8a8a8a",
  png: "#63c69e", jpg: "#63c69e", jpeg: "#63c69e", gif: "#7fd6b3", webp: "#63c69e",
  svg: "#e8a35c", ico: "#63c69e", ttf: "#b06d9a", otf: "#b06d9a", mp4: "#e0716f",
  mp3: "#e0716f", wav: "#e0716f", zip: "#b58a5f", gz: "#b58a5f", "7z": "#b58a5f",
  tres: "#5fb3b3", tscn: "#5fb3b3", gd: "#5fb3b3", godot: "#5fb3b3",
};
function extOf(name) {
  const i = name.lastIndexOf(".");
  if (i < 0) return "";
  return name.slice(i + 1).toLowerCase();
}
function fileColor(name) {
  const e = extOf(name);
  return EXT_COLORS[e] || "var(--dsw-alias-label-secondary, #6b7280)";
}

async function api(action, payload = {}) {
  const res = await fetch("/_dsh/file-explorer", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...payload }),
  });
  return res.json();
}

function fmtSize(n) {
  if (n < 1024) return n + " B";
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + " KB";
  return (n / 1024 / 1024).toFixed(1) + " MB";
}

function FileExplorer(props) {
  const [open, setOpen] = react_1.useState(true);
  const [roots, setRoots] = react_1.useState([]);
  const [rootId, setRootId] = react_1.useState(null);
  const [dirs, setDirs] = react_1.useState({});   // rel -> entries
  const [expanded, setExpanded] = react_1.useState({ "": true });
  const [sel, setSel] = react_1.useState(null);    // { rel, name, dir }
  const [preview, setPreview] = react_1.useState(null); // { rel, kind, text|base64, mime }
  const [editing, setEditing] = react_1.useState(null); // { rel, content }
  const [renaming, setRenaming] = react_1.useState(null); // { rel, name }
  const [confirmDel, setConfirmDel] = react_1.useState(null); // rel
  const [ctxMenu, setCtxMenu] = react_1.useState(null); // { x, y, rel, name, dir }
  const [toast, setToast] = react_1.useState(null);
  const [showPlaces, setShowPlaces] = react_1.useState(true);

  const sessState = props.useSessions ? props.useSessions((s) => s) : null;
  const currentCwd = (function () {
    if (sessState === null || sessState === undefined) return null;
    if (!sessState.current) return null;
    const sum = sessState.byId && sessState.byId[sessState.current];
    return sum && typeof sum.cwd === 'string' ? sum.cwd : null;
  })();

  react_1.useEffect(() => {
    try {
      console.log("[dfe-dbg] props keys:", Object.keys(props || {}).join(","));
      console.log("[dfe-dbg] currentCwd:", currentCwd === null ? "NULL" : currentCwd);
    } catch (e) { console.log("[dfe-dbg] err", String(e)); }
  }, []);

  const toastTimer = react_1.useRef(null);
  function showToast(text, err = false) {
    setToast({ text, err });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }

  async function loadDirs(rels) {
    const next = { ...dirs };
    for (const rel of rels) {
      if (next[rel] !== undefined) continue;
      const r = await api("list", { rootId, rel });
      if (r.ok) next[rel] = r.entries;
    }
    setDirs(next);
  }

  function switchRoot(id) {
    setRootId(id);
    setDirs({});
    setExpanded({ "": true });
    setSel(null);
    setPreview(null);
    setEditing(null);
    api("list", { rootId: id, rel: "" }).then((x) => { if (x.ok) setDirs({ "": x.entries }); });
  }

  function renderPlaces() {
    return react_1.createElement("div", { className: "dfe-places" },
      react_1.createElement("div", { className: "dfe-places-head", onClick: () => setShowPlaces(!showPlaces) },
        react_1.createElement("span", { className: "dfe-chev" + (showPlaces ? " open" : "") },
          react_1.createElement(Ic, { d: ICONS.chevron, size: 10 })),
        react_1.createElement("span", { className: "dfe-places-title" }, "位置"),
        react_1.createElement("span", { className: "dfe-places-hint" }, "工作区与磁盘")),
      showPlaces
        ? roots.map((w) => react_1.createElement("div", {
            key: w.id,
            className: "dfe-row" + (w.id === rootId ? " sel" : ""),
            onClick: () => switchRoot(w.id),
            onContextMenu: (e) => {
              e.preventDefault();
              e.stopPropagation();
              setCtxMenu({ x: e.clientX, y: e.clientY, rel: "", name: w.title, dir: true, root: true });
            },
          },
            react_1.createElement("span", { className: "ico", style: { color: w.drive ? "#63c69e" : "#d9a44a" } },
              react_1.createElement(Ic, { d: w.drive ? ICONS.panel : ICONS.folder, size: 13 })),
            react_1.createElement("span", { className: "name" }, w.title),
            react_1.createElement("span", { className: "meta" }, w.drive ? "磁盘" : "")))
        : null);
  }

  function renderUpRow() {
    const rel = sel && sel.dir ? sel.rel : "";
    if (rel === "") return null;
    const parent = rel.includes("/") ? rel.slice(0, rel.lastIndexOf("/")) : "";
    return react_1.createElement("div", {
      className: "dfe-row dfe-up",
      onClick: () => {
        setSel({ rel: parent, name: "..", dir: true });
        setExpanded((ex) => ({ ...ex, [parent]: true }));
        loadDirs([parent]);
      },
    },
      react_1.createElement("span", { className: "ico", style: { color: "#5C807D" } },
        react_1.createElement(Ic, { d: ICONS.chevron, size: 12 })),
      react_1.createElement("span", { className: "name" }, ".. 上级目录"));
  }

  function normPath(p) {
    return String(p).replace(/\\/g, "/").replace(/\/+$/, "").toLowerCase();
  }

  react_1.useEffect(() => {
    (async () => {
      const r = await api("roots");
      if (r.ok && Array.isArray(r.roots) && r.roots.length > 0) {
        setRoots(r.roots);
        const preferred = (currentCwd !== null && currentCwd !== undefined
          ? r.roots.find((x) => normPath(x.path) === normPath(currentCwd))
          : undefined)
          ?? r.roots.find((x) => !x.drive)
          ?? r.roots[0];
        setRootId(preferred.id);
        setDirs({ "": await api("list", { rootId: preferred.id, rel: "" }).then((x) => (x.ok ? x.entries : [])) });
      }
    })();
  }, []);

  react_1.useEffect(() => {
    if (currentCwd === null || currentCwd === undefined) return;
    setRoots((rs) => {
      const hit = rs.find((x) => normPath(x.path) === normPath(currentCwd));
      if (hit !== undefined && rootId !== hit.id) switchRoot(hit.id);
      return rs;
    });
  }, [currentCwd]);

  react_1.useEffect(() => { if (rootId !== null) loadDirs(Object.keys(expanded)); }, [rootId]);

  function onRowClick(entry, rel) {
    setSel({ rel, name: entry.name, dir: entry.dir });
    if (entry.dir) {
      setExpanded((ex) => ({ ...ex, [rel]: !ex[rel] }));
      if (!expanded[rel]) loadDirs([rel]);
    } else {
      openPreview(rel, entry.name);
    }
  }

  async function openPreview(rel, name) {
    setPreview(null);
    const r = await api("read", { rootId, rel });
    if (r.ok) setPreview({ rel, name, kind: r.kind, text: r.text, base64: r.base64, mime: r.mime });
    else showToast(r.reason || "无法预览", true);
  }

  async function refresh(rel) {
    const r = await api("list", { rootId, rel });
    if (r.ok) setDirs((d) => ({ ...d, [rel]: r.entries }));
  }

  async function createEntry(dirRel, isDir) {
    const base = prompt(isDir ? "新文件夹名" : "新文件名");
    if (base === null || base.trim() === "") return;
    const name = base.trim();
    const rel = dirRel === "" ? name : dirRel + "/" + name;
    const r = await api(isDir ? "mkdir" : "write", { rootId, rel, ...(isDir ? {} : { content: "" }) });
    if (r.ok) { await refresh(dirRel); setExpanded((ex) => ({ ...ex, [dirRel]: true })); showToast("已创建 ✨ " + name); }
    else showToast(r.reason || "创建失败", true);
  }

  async function doRename(rel, oldName) {
    const name = renaming.name.trim();
    if (name === "" || name === oldName) { setRenaming(null); return; }
    const r = await api("rename", { rootId, rel, newName: name });
    if (r.ok) {
      const parentRel = rel.includes("/") ? rel.slice(0, rel.lastIndexOf("/")) : "";
      await refresh(parentRel);
      showToast("已改名 ✨");
    } else showToast(r.reason || "重命名失败", true);
    setRenaming(null);
  }

  async function doDelete(rel) {
    const r = await api("delete", { rootId, rel });
    if (r.ok) {
      const parentRel = rel.includes("/") ? rel.slice(0, rel.lastIndexOf("/")) : "";
      await refresh(parentRel);
      if (preview && preview.rel === rel) setPreview(null);
      showToast("已送它入轮回 ♻");
    } else showToast(r.reason || "删除失败", true);
    setConfirmDel(null);
  }

  async function saveEdit() {
    if (editing === null) return;
    const r = await api("write", { rootId, rel: editing.rel, content: editing.content });
    if (r.ok) { showToast("已保存 ✨"); setEditing(null); openPreview(editing.rel, editing.name); }
    else showToast(r.reason || "保存失败", true);
  }

  const currentRoot = roots.find((w) => w.id === rootId);

  function previewPane(editingState, previewData) {
    return react_1.createElement("div", { className: "dfe-preview" },
      react_1.createElement("div", { className: "dfe-preview-head" },
        react_1.createElement("span", { className: "fn" }, previewData.name),
        react_1.createElement("span", { className: "dfe-badge" }, extOf(previewData.name) || "file"),
        previewData.kind === "text" && editingState === null
          ? react_1.createElement("button", {
              className: "dfe-btn", title: "编辑",
              onClick: function () { setEditing({ rel: previewData.rel, name: previewData.name, content: previewData.text }); },
            }, react_1.createElement(Ic, { d: ICONS.pencil, size: 11 }))
          : null,
        editingState !== null
          ? react_1.createElement("button", { className: "dfe-btn", title: "保存", onClick: saveEdit }, "✓")
          : null,
        react_1.createElement("button", {
          className: "dfe-btn", title: "关闭预览",
          onClick: function () { setPreview(null); setEditing(null); },
        }, react_1.createElement(Ic, { d: ICONS.close, size: 11 }))),
      react_1.createElement("div", { className: "dfe-preview-body" },
        editingState !== null
          ? react_1.createElement("textarea", {
              value: editingState.content,
              onChange: function (e) { setEditing(Object.assign({}, editingState, { content: e.target.value })); },
              spellCheck: false,
            })
          : previewData.kind === "image"
            ? react_1.createElement("div", { className: "imgwrap" },
                react_1.createElement("img", { src: "data:" + previewData.mime + ";base64," + previewData.base64, alt: previewData.name }))
            : react_1.createElement("pre", null,
                String(previewData.text === null || previewData.text === undefined ? "" : previewData.text).slice(0, 60000))));
  }


  function renderRow(entry, rel) {
    const isSel = sel !== null && sel.rel === rel;
    const isRenaming = renaming !== null && renaming.rel === rel;
    const isConfirm = confirmDel === rel;
    const ind = (rel.match(/\//g) || []).length;
    return react_1.createElement("div", {
      key: rel,
      className: "dfe-row" + (isSel ? " sel" : ""),
      style: { paddingLeft: 4 + ind * 14 },
      onClick: () => onRowClick(entry, rel),
      onContextMenu: (e) => {
        e.preventDefault();
        e.stopPropagation();
        setCtxMenu({ x: e.clientX, y: e.clientY, rel, name: entry.name, dir: entry.dir });
      },
    },
      entry.dir
        ? react_1.createElement("span", { className: "dfe-chev" + (expanded[rel] ? " open" : "") }, react_1.createElement(Ic, { d: ICONS.chevron, size: 10 }))
        : react_1.createElement("span", { className: "dfe-chev" }),
      react_1.createElement("span", { className: "ico", style: { color: entry.dir ? "#d9a44a" : fileColor(entry.name) } },
        entry.dir
          ? react_1.createElement(Ic, { d: expanded[rel] ? ICONS.folder : ICONS.folder, size: 13 })
          : react_1.createElement(Ic, { d: ICONS.file, size: 12.5 })),
      isRenaming
        ? react_1.createElement("input", {
            className: "dfe-rename-input", autoFocus: true,
            defaultValue: entry.name,
            onFocus: (e) => e.target.select(),
            onKeyDown: (e) => {
              if (e.key === "Enter") doRename(rel, entry.name);
              if (e.key === "Escape") setRenaming(null);
            },
            onBlur: () => doRename(rel, entry.name),
            onClick: (e) => e.stopPropagation(),
          })
        : react_1.createElement("span", { className: "name" }, entry.name),
      isConfirm
        ? react_1.createElement("span", { className: "dfe-confirm", onClick: (e) => e.stopPropagation() },
            "删除?",
            react_1.createElement("button", { className: "yes", onClick: () => doDelete(rel) }, "删"),
            react_1.createElement("button", { onClick: () => setConfirmDel(null) }, "否"))
        : react_1.createElement(react_1.Fragment, null,
            react_1.createElement("span", { className: "meta" }, entry.dir ? "" : fmtSize(entry.size)),
            react_1.createElement("span", { className: "dfe-ops", onClick: (e) => e.stopPropagation() },
              react_1.createElement("button", { className: "dfe-op", title: "重命名", onClick: () => setRenaming({ rel, name: entry.name }) },
                react_1.createElement(Ic, { d: ICONS.pencil, size: 10.5 })),
              react_1.createElement("button", { className: "dfe-op danger", title: "删除", onClick: () => setConfirmDel(rel) },
                react_1.createElement(Ic, { d: ICONS.trash, size: 10.5 })),
            )));
  }

  function renderDir(rel, depth) {
    const entries = dirs[rel] ?? [];
    const children = [];
    for (const e of entries) {
      const childRel = rel === "" ? e.name : rel + "/" + e.name;
      children.push(renderRow(e, childRel));
      if (e.dir && expanded[childRel]) children.push(...renderDir(childRel, depth + 1));
    }
    return children;
  }

  return react_1.createElement("div", { className: "dfe-root" + (open ? " open" : "") },
    open ? react_1.createElement("div", { className: "dfe-backdrop", onClick: () => { setOpen(false); setCtxMenu(null); } }) : null,
    react_1.createElement("div", { className: "dfe-tab", onClick: () => setOpen(true), title: "打开文件面板" },
      AVATAR_URI.startsWith("data:") ? react_1.createElement("img", { className: "dfe-tab-avatar", src: AVATAR_URI, alt: "" }) : null,
      react_1.createElement("span", { className: "dfe-tab-label" }, "文件")),
    ctxMenu !== null
      ? react_1.createElement("div", {
          className: "dfe-ctx",
          style: { left: Math.min(ctxMenu.x, window.innerWidth - 150), top: Math.min(ctxMenu.y, window.innerHeight - 240) },
          onClick: (e) => e.stopPropagation(),
        },
          react_1.createElement("div", { className: "dfe-ctx-item", onClick: () => { api("open", { rootId, rel: ctxMenu.rel, dir: ctxMenu.dir, mode: ctxMenu.dir || ctxMenu.root ? undefined : "launch" }).then((r) => { if (!r || !r.ok) showToast("打开失败: " + ((r && (r.stderr || r.reason)) || ("exit " + (r && r.exitCode))) + " | " + ((r && r.argv) || ""), true); }); setCtxMenu(null); } },
            react_1.createElement(Ic, { d: ICONS.panel, size: 12 }), ctxMenu.dir ? "在资源管理器中打开" : "打开文件"),
          !ctxMenu.dir
            ? react_1.createElement("div", { className: "dfe-ctx-item", onClick: () => { api("open", { rootId, rel: ctxMenu.rel, dir: false }).then((r) => { if (!r || !r.ok) showToast((r && r.reason) || "打开失败", true); }); setCtxMenu(null); } },
                react_1.createElement(Ic, { d: ICONS.folder, size: 12 }), "打开所在位置")
            : null,
          react_1.createElement("div", { className: "dfe-ctx-sep" }),
          ctxMenu.dir
            ? react_1.createElement(react_1.Fragment, null,
                react_1.createElement("div", { className: "dfe-ctx-item", onClick: () => { createEntry(ctxMenu.rel, false); setCtxMenu(null); } },
                  react_1.createElement(Ic, { d: ICONS.filePlus, size: 12 }), "新建文件"),
                react_1.createElement("div", { className: "dfe-ctx-item", onClick: () => { createEntry(ctxMenu.rel, true); setCtxMenu(null); } },
                  react_1.createElement(Ic, { d: ICONS.folderPlus, size: 12 }), "新建文件夹"))
            : null,
          !ctxMenu.root
            ? react_1.createElement(react_1.Fragment, null,
                react_1.createElement("div", { className: "dfe-ctx-item", onClick: () => { setRenaming({ rel: ctxMenu.rel, name: ctxMenu.name }); setCtxMenu(null); } },
                  react_1.createElement(Ic, { d: ICONS.pencil, size: 12 }), "重命名"),
                react_1.createElement("div", { className: "dfe-ctx-sep" }),
                react_1.createElement("div", { className: "dfe-ctx-item danger", onClick: () => { setConfirmDel(ctxMenu.rel); setCtxMenu(null); } },
                  react_1.createElement(Ic, { d: ICONS.trash, size: 12 }), "删除"))
            : null)
      : null,
    react_1.createElement("div", { className: "dfe-panel", onClick: () => { if (ctxMenu !== null) setCtxMenu(null); } },
      react_1.createElement("div", { className: "dfe-header" },
        AVATAR_URI.startsWith("data:") ? react_1.createElement("img", { className: "dfe-head-avatar", src: AVATAR_URI, alt: "" }) : null,
        react_1.createElement("span", { className: "dfe-title", title: currentRoot ? currentRoot.path : "" },
          currentRoot ? currentRoot.title : "文件"),
        react_1.createElement("button", { className: "dfe-btn", title: "刷新", onClick: () => refresh(sel && sel.dir ? sel.rel : "") },
          react_1.createElement(Ic, { d: ICONS.refresh, size: 12 })),
        react_1.createElement("button", { className: "dfe-btn", title: "新建文件", onClick: () => createEntry(sel && sel.dir ? sel.rel : "", false) },
          react_1.createElement(Ic, { d: ICONS.filePlus, size: 12 })),
        react_1.createElement("button", { className: "dfe-btn", title: "新建文件夹", onClick: () => createEntry(sel && sel.dir ? sel.rel : "", true) },
          react_1.createElement(Ic, { d: ICONS.folderPlus, size: 12 })),
        react_1.createElement("button", { className: "dfe-btn", title: "收起面板", onClick: () => setOpen(false) },
          react_1.createElement(Ic, { d: ICONS.close, size: 12 })),
      ),
      react_1.createElement("div", { className: "dfe-crumb" },
        react_1.createElement(Ic, { d: ICONS.panel, size: 11 }),
        react_1.createElement("b", null, currentRoot ? currentRoot.title : "…"),
        sel && sel.dir ? react_1.createElement(react_1.Fragment, null, react_1.createElement("span", null, "/"), react_1.createElement("span", null, sel.rel)) : null),
      react_1.createElement("div", { className: "dfe-tree" },
        renderPlaces(),
        renderUpRow(),
        dirs[""] === undefined || dirs[""].length === 0
          ? react_1.createElement("div", { className: "dfe-empty" },
              react_1.createElement("img", { className: "dfe-empty-crane", src: "data:image/png;base64,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", alt: "" }),
              "空空如也——连小仙鹤都还没搬文件进来呢~")
          : renderDir("", 0)),
      preview !== null ? previewPane(editing, preview) : null,
      toast !== null
        ? react_1.createElement("div", { className: "dfe-toast" + (toast.err ? " err" : "") }, toast.text)
        : null,
      YUNWEN_URI.startsWith("data:") ? react_1.createElement("img", { className: "dfe-deco-cloud", src: YUNWEN_URI, alt: "" }) : null,
      SILHOUETTE_URI.startsWith("data:") ? react_1.createElement("img", { className: "dfe-deco", src: SILHOUETTE_URI, alt: "" }) : null,
      react_1.createElement("div", { className: "dfe-sign" }, "🕊 仙鹤司书在此"),
    ));
}

function apply(ctx) {
  const slots = ctx.get("slots");
  if (slots === undefined) return;
  const style = document.createElement("style");
  style.textContent = CSS;
  document.head.appendChild(style);
  slots.inject("shell.overlay", () => slots.register(
    { name: "shell.overlay", id: "file-explorer", order: 10, label: "文件" },
    (props) => react_1.createElement(FileExplorer, props),
  ));
  return () => {
    if (style.parentNode) style.parentNode.removeChild(style);
  };
}
return module.exports; } });
