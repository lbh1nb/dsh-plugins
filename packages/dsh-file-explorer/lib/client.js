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
  background: var(--dsw-alias-surface-primary, rgba(250,250,250,.96));
  color: var(--dsw-alias-label-primary, #1f2329);
  border-left: 1px solid var(--dsw-alias-border-l1, rgba(127,127,127,.25));
  box-shadow: -8px 0 24px rgba(0,0,0,.10), -1px 0 0 rgba(0,0,0,.04);
  pointer-events: auto;
  transform: translateX(100%);
  transition: transform .22s cubic-bezier(.22,.9,.34,1);
  font-family: inherit;
}
.dfe-root.open .dfe-panel { transform: translateX(0); }
.dfe-tab {
  position: absolute; right: 0; top: 44%;
  width: 26px; padding: 10px 4px;
  writing-mode: vertical-rl; letter-spacing: .12em;
  font-size: 11px; font-weight: 600;
  color: var(--dsw-alias-label-secondary, #6b7280);
  background: var(--dsw-alias-surface-primary, #fafafa);
  border: 1px solid var(--dsw-alias-border-l1, rgba(127,127,127,.25));
  border-right: none; border-radius: 8px 0 0 8px;
  cursor: pointer; pointer-events: auto;
  box-shadow: -2px 0 8px rgba(0,0,0,.06);
  transition: color .15s ease, background-color .15s ease;
}
.dfe-tab:hover { color: var(--dsw-alias-label-primary, #1f2329); background: var(--dsw-alias-interactive-bg-hover, rgba(127,127,127,.10)); }
.dfe-root.open .dfe-tab { opacity: 0; pointer-events: none; }

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

.dfe-crumb { padding: 6px 12px; font-size: 10.5px; color: var(--dsw-alias-label-secondary, #6b7280); border-bottom: 1px solid var(--dsw-alias-border-l1, rgba(127,127,127,.18)); display: flex; align-items: center; gap: 6px; overflow: hidden; white-space: nowrap; }
.dfe-crumb b { color: var(--dsw-alias-label-primary, #1f2329); font-weight: 600; }

.dfe-tree { flex: 1; overflow: auto; padding: 4px; scrollbar-width: thin; }
.dfe-row {
  display: flex; align-items: center; gap: 6px;
  height: 25px; padding: 0 6px; border-radius: 6px;
  font-size: 12px; color: var(--dsw-alias-label-primary, #1f2329);
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
.dfe-ops { display: none; gap: 2px; flex-shrink: 0; }
.dfe-row:hover .dfe-ops { display: inline-flex; }
.dfe-op {
  width: 20px; height: 20px; border: none; border-radius: 5px; background: transparent;
  color: var(--dsw-alias-label-secondary, #6b7280); cursor: pointer;
  display: inline-flex; align-items: center; justify-content: center;
  transition: background-color .1s ease, color .1s ease;
}
.dfe-op:hover { background: var(--dsw-alias-interactive-bg-hover, rgba(127,127,127,.16)); color: var(--dsw-alias-label-primary, #1f2329); }
.dfe-op.danger:hover { background: rgba(229,83,75,.14); color: var(--dsw-alias-state-error-primary, #e5534b); }
.dfe-rename-input { flex: 1; font: inherit; font-size: 12px; padding: 1px 4px; border: 1px solid var(--dsw-alias-brand-primary, #1F4E79); border-radius: 4px; outline: none; background: transparent; color: inherit; }
.dfe-confirm { display: inline-flex; gap: 4px; align-items: center; flex-shrink: 0; font-size: 11px; color: var(--dsw-alias-state-error-primary, #e5534b); }
.dfe-confirm button { font-size: 11px; border: 1px solid var(--dsw-alias-border-l1, rgba(127,127,127,.3)); background: transparent; color: inherit; border-radius: 5px; padding: 1px 8px; cursor: pointer; }
.dfe-confirm button:hover { background: var(--dsw-alias-interactive-bg-hover, rgba(127,127,127,.12)); }
.dfe-confirm .yes { border-color: var(--dsw-alias-state-error-primary, #e5534b); background: var(--dsw-alias-state-error-primary, #e5534b); color: #fff; }
.dfe-confirm .yes:hover { background: #d0433c; }

.dfe-preview { border-top: 1px solid var(--dsw-alias-border-l1, rgba(127,127,127,.25)); display: flex; flex-direction: column; max-height: 42%; min-height: 120px; }
.dfe-preview-head { display: flex; align-items: center; gap: 6px; padding: 6px 10px; font-size: 11px; color: var(--dsw-alias-label-secondary, #6b7280); border-bottom: 1px solid var(--dsw-alias-border-l1, rgba(127,127,127,.18)); }
.dfe-preview-head .fn { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 600; color: var(--dsw-alias-label-primary, #1f2329); }
.dfe-badge { font-size: 9.5px; padding: 1px 6px; border-radius: 8px; background: var(--dsw-alias-interactive-bg-hover, rgba(127,127,127,.12)); }
.dfe-preview-body { flex: 1; overflow: auto; }
.dfe-preview-body pre { margin: 0; padding: 10px 12px; font-family: Consolas, "JetBrains Mono", monospace; font-size: 11px; line-height: 1.5; color: var(--dsw-alias-label-primary, #1f2329); white-space: pre; }
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
@keyframes dfe-in { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
`;

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

function FileExplorer() {
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
  const [toast, setToast] = react_1.useState(null);

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

  react_1.useEffect(() => {
    (async () => {
      const r = await api("roots");
      if (r.ok && Array.isArray(r.roots) && r.roots.length > 0) {
        setRoots(r.roots);
        setRootId(r.roots[0].id);
        setDirs({ "": await api("list", { rootId: r.roots[0].id, rel: "" }).then((x) => (x.ok ? x.entries : [])) });
      }
    })();
  }, []);

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
    return react_1.createElement("div", { key: rel, className: "dfe-row" + (isSel ? " sel" : ""), style: { paddingLeft: 4 + ind * 14 }, onClick: () => onRowClick(entry, rel) },
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
    react_1.createElement("div", { className: "dfe-tab", onClick: () => setOpen(true), title: "打开文件面板" }, "文件"),
    react_1.createElement("div", { className: "dfe-panel" },
      react_1.createElement("div", { className: "dfe-header" },
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
        dirs[""] === undefined || dirs[""].length === 0
          ? react_1.createElement("div", { className: "dfe-empty" },
              react_1.createElement("img", { className: "dfe-empty-crane", src: "data:image/png;base64,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", alt: "" }),
              "空空如也——连小仙鹤都还没搬文件进来呢~")
          : renderDir("", 0)),
      preview !== null ? previewPane(editing, preview) : null,
      toast !== null
        ? react_1.createElement("div", { className: "dfe-toast" + (toast.err ? " err" : "") }, toast.text)
        : null,
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
    () => react_1.createElement(FileExplorer),
  ));
  return () => {
    if (style.parentNode) style.parentNode.removeChild(style);
  };
}
return module.exports; } });
