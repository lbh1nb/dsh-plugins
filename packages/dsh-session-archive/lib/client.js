window.__ModuleLoader__.load({ id: "dsh-session-archive", factory: (require) => {
var module = { exports: {} }; var exports = module.exports;
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inject = void 0;
exports.apply = apply;
const react_1 = require("react");

/**
 * dsh-session-archive (client half).
 * Settings section "会话归档": lists archived (and, optionally, all) sessions
 * from the shipped stores and permanently deletes a chosen session through the
 * host's same-origin POST route. Current/running sessions are locked.
 */

const DELETE_ROUTE = "/_dsh/session-archive/delete";

const hintStyle = { opacity: 0.6, fontSize: 12, lineHeight: 1.6 };
const errStyle = { color: "#e5534b", fontSize: 12, whiteSpace: "pre-wrap" };
const rowStyle = { border: "1px solid rgba(127,127,127,.35)", borderRadius: 8, padding: "8px 12px", display: "flex", alignItems: "center", gap: 10 };
const titleStyle = { fontWeight: 600, wordBreak: "break-all" };
const subStyle = { opacity: 0.6, fontSize: 12, wordBreak: "break-all" };
const badgeStyle = { fontSize: 11, borderRadius: 4, padding: "1px 6px", border: "1px solid rgba(127,127,127,.5)", opacity: 0.75, whiteSpace: "nowrap" };
const tabBase = { padding: "4px 12px", border: "1px solid currentColor", opacity: 0.55, borderRadius: 999, background: "transparent", color: "inherit", cursor: "pointer", fontSize: 12 };
const tabActive = { padding: "4px 12px", border: "1px solid currentColor", borderRadius: 999, background: "transparent", color: "inherit", cursor: "pointer", fontSize: 12, opacity: 1, fontWeight: 600 };
const btnBase = { padding: "3px 10px", borderRadius: 6, border: "1px solid rgba(127,127,127,.5)", background: "transparent", color: "inherit", cursor: "pointer", fontSize: 12 };
const btnDanger = { padding: "3px 10px", borderRadius: 6, border: "1px solid #e5534b", background: "transparent", color: "#e5534b", cursor: "pointer", fontSize: 12 };
const btnDisabled = { padding: "3px 10px", borderRadius: 6, border: "1px solid #e5534b", background: "transparent", color: "#e5534b", fontSize: 12, opacity: 0.4, cursor: "default" };
const panelStyle = { display: "flex", flexDirection: "column", gap: 12, padding: "4px 0 24px", fontSize: 13 };
const headerStyle = { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" };
const emptyStyle = { opacity: 0.55, padding: "16px 0" };

function timeText(ms) {
  if (!ms) return "";
  try {
    const d = new Date(ms);
    const pad = (n) => (n < 10 ? "0" + n : String(n));
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) + " " + pad(d.getHours()) + ":" + pad(d.getMinutes());
  } catch (err) { return ""; }
}

function ArchivePanel(props) {
  const [filter, setFilter] = react_1.useState("all");
  const [confirmId, setConfirmId] = react_1.useState(null);
  const [busyId, setBusyId] = react_1.useState(null);
  const [error, setError] = react_1.useState(null);
  const [deletedIds, setDeletedIds] = react_1.useState({});
  const [notice, setNotice] = react_1.useState(null);

  const sessions = props.useSessions ? props.useSessions((s) => s) : null;
  const workspaces = props.useWorkspaces ? props.useWorkspaces((s) => s) : null;

  const ids = sessions && Array.isArray(sessions.ids) ? sessions.ids : [];
  const byId = sessions ? (sessions.byId || {}) : {};
  const current = sessions ? sessions.current : undefined;
  const archivedList = workspaces && Array.isArray(workspaces.archivedSessionIds) ? workspaces.archivedSessionIds : [];
  const archivedSet = new Set(archivedList);
  const wsItems = workspaces && Array.isArray(workspaces.items) ? workspaces.items : [];

  const rows = [];
  for (const id of ids) {
    if (deletedIds[id]) continue;
    const s = byId[id];
    if (s === undefined) continue;
    const archived = archivedSet.has(id);
    if (filter === "archived" && !archived) continue;
    let workspaceTitle = "";
    let cwd = s.cwd || "";
    for (const w of wsItems) {
      const members = Array.isArray(w.sessionIds) ? w.sessionIds : [];
      if (members.indexOf(id) !== -1) {
        workspaceTitle = w.title || "";
        if (cwd === "") cwd = w.path || "";
        break;
      }
    }
    rows.push({
      id,
      title: s.title || s.displayTitle || "（未命名会话）",
      cwd,
      workspaceTitle,
      running: s.running === true,
      isCurrent: id === current,
      archived,
      origin: s.origin || "",
      updatedAt: s.updatedAt || 0,
    });
  }
  rows.sort((a, b) => (a.archived === b.archived ? b.updatedAt - a.updatedAt : a.archived ? -1 : 1));

  const doDelete = async (id) => {
    setBusyId(id);
    setError(null);
    try {
      const resp = await fetch(DELETE_ROUTE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: id }),
      });
      const res = await resp.json();
      if (res && res.ok) {
        const next = Object.assign({}, deletedIds);
        next[id] = true;
        setDeletedIds(next);
        setConfirmId(null);
        setNotice((res && res.note) || "已删除。");
      } else {
        setError((res && res.reason) || "删除失败");
      }
    } catch (err) {
      setError(err && err.message ? err.message : String(err));
    } finally {
      setBusyId(null);
    }
  };

  const tab = (value, label) => react_1.createElement("button", {
    key: value,
    type: "button",
    style: filter === value ? tabActive : tabBase,
    onClick: () => setFilter(value),
  }, label);

  const children = [react_1.createElement("div", { key: "hint", style: hintStyle }, "被「归档」的会话会从侧栏消失，只能在这里找回并删除。切到「全部」可删除任意废弃会话（例如读图失败已坏死的对话）。删除会移除磁盘上的会话日志，不可恢复；被标签页保持打开的会话可删除日志，但需关闭对应标签页后才会从侧栏消失；正在运行（有任务进行中）的会话会被锁定。")];
  if (notice !== null) children.push(react_1.createElement("div", { key: "note", style: hintStyle }, notice));
  if (error !== null) children.push(react_1.createElement("div", { key: "err", style: errStyle }, error));
  if (rows.length === 0) {
    children.push(react_1.createElement("div", { key: "empty", style: emptyStyle }, filter === "archived" ? "没有归档的会话。" : "没有任何会话。"));
  }
  for (const row of rows) {
    const badges = [];
    if (row.archived) badges.push(react_1.createElement("span", { key: "arc", style: badgeStyle }, "已归档"));
    if (row.isCurrent) badges.push(react_1.createElement("span", { key: "cur", style: badgeStyle }, "当前"));
    if (row.running) badges.push(react_1.createElement("span", { key: "run", style: badgeStyle }, "运行中"));
    if (row.origin === "subagent") badges.push(react_1.createElement("span", { key: "sub", style: badgeStyle }, "子代理"));
    const locked = row.isCurrent || row.running;
    const time = timeText(row.updatedAt);
    const subLines = [];
    if (row.workspaceTitle !== "") subLines.push(row.workspaceTitle);
    if (row.cwd !== "") subLines.push(row.cwd);
    if (time !== "") subLines.push(time);
    subLines.push(row.id);

    let right;
    if (confirmId === row.id) {
      right = [
        react_1.createElement("button", { key: "yes", type: "button", style: busyId === row.id ? btnDisabled : btnDanger, disabled: busyId === row.id, onClick: () => doDelete(row.id) }, busyId === row.id ? "删除中…" : "确认删除"),
        react_1.createElement("button", { key: "no", type: "button", style: btnBase, onClick: () => setConfirmId(null) }, "取消"),
      ];
    } else {
      right = [react_1.createElement("button", {
        key: "del",
        type: "button",
        style: locked ? btnDisabled : btnDanger,
        disabled: locked || busyId === row.id,
        title: locked ? (row.isCurrent ? "当前会话不可删除" : "运行中的会话不可删除") : "",
        onClick: () => setConfirmId(row.id),
      }, "删除")];
    }

    children.push(react_1.createElement("div", { key: row.id, style: rowStyle },
      react_1.createElement("div", { style: { flex: 1, minWidth: 0 } },
        react_1.createElement("div", { style: titleStyle }, row.title),
        react_1.createElement("div", { style: subStyle }, subLines.join(" · ")),
        badges.length > 0 ? react_1.createElement("div", { style: { display: "flex", gap: 6, marginTop: 4, flexWrap: "wrap" } }, badges) : null,
      ),
      react_1.createElement("div", { style: { display: "flex", gap: 6, flexShrink: 0 } }, right),
    ));
  }

  return react_1.createElement("div", { style: panelStyle },
    react_1.createElement("div", { style: headerStyle }, tab("all", "全部"), tab("archived", "仅归档")),
    ...children,
  );
}

function apply(ctx) {
  const slots = ctx.get("slots");
  if (slots === undefined) return;
  slots.inject("settings.section", () => slots.register(
    { name: "settings.section", id: "session-archive", order: 40, label: "会话归档" },
    ArchivePanel,
  ));
}
return module.exports; } });
