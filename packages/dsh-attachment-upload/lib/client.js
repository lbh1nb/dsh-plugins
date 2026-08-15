window.__ModuleLoader__.load({ id: "dsh-attachment-upload", factory: (require) => {
var module = { exports: {} }; var exports = module.exports;
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apply = apply;
const react_1 = require("react");

/**
 * dsh-attachment-upload (client half).
 * A 📎 attach button in the composer tool row (conversation.input.left): picks
 * files, uploads them through the host route into the current workspace's
 * .dsh-attachments directory, and inserts one path reference line per file
 * into the composer draft. The user then adds their request and sends; the
 * agent reads the files with its own tools.
 */

const UPLOAD_ROUTE = "/_dsh/attachment-upload/upload";

const btnStyle = { display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 6, border: "1px solid rgba(127,127,127,.5)", background: "transparent", color: "inherit", cursor: "pointer", fontSize: 12 };
const btnBusyStyle = { display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 6, border: "1px solid rgba(127,127,127,.5)", background: "transparent", color: "inherit", cursor: "default", fontSize: 12, opacity: 0.5 };
const errStyle = { color: "#e5534b", fontSize: 11, whiteSpace: "pre-wrap", maxWidth: 420 };

function AttachmentButton(props) {
  const [busy, setBusy] = react_1.useState(false);
  const [error, setError] = react_1.useState(null);
  const fileRef = react_1.useRef(null);
  const draftRef = react_1.useRef("");
  const sessions = props.useSessions ? props.useSessions((s) => s) : null;
  const inputState = props.useInput ? props.useInput((s) => s) : null;
  if (inputState && typeof inputState.draft === "string") draftRef.current = inputState.draft;

  const upload = async (files) => {
    setBusy(true);
    setError(null);
    try {
      let cwd = null;
      const byId = sessions ? (sessions.byId || {}) : {};
      const entry = byId[props.sessionId];
      if (entry && typeof entry.cwd === "string" && entry.cwd !== "") cwd = entry.cwd;
      if (cwd === null && props.useWorkspaces) {
        const ws = props.useWorkspaces((s) => s);
        const items = ws && Array.isArray(ws.items) ? ws.items : [];
        for (const w of items) {
          const members = Array.isArray(w.sessionIds) ? w.sessionIds : [];
          if (members.indexOf(props.sessionId) !== -1 && typeof w.path === "string" && w.path !== "") { cwd = w.path; break; }
        }
      }
      if (cwd === null) throw new Error("无法确定当前工作区路径，请先在侧栏确认工作区");

      const lines = [];
      for (const file of files) {
        const buf = await file.arrayBuffer();
        const resp = await fetch(UPLOAD_ROUTE, {
          method: "POST",
          headers: {
            "Content-Type": "application/octet-stream",
            "x-file-name": encodeURIComponent(file.name),
            "x-cwd": encodeURIComponent(cwd),
          },
          body: buf,
        });
        const res = await resp.json();
        if (!(res && res.ok)) throw new Error((res && res.reason) || "上传失败");
        lines.push("📎 附件: " + res.path);
      }

      if (props.inputActions && typeof props.inputActions.setDraft === "function") {
        const current = draftRef.current;
        const addition = lines.join("\n");
        props.inputActions.setDraft(current === "" ? addition : current + "\n" + addition);
      } else {
        throw new Error("输入框不可用（inputActions 缺失）");
      }
    } catch (err) {
      setError(err && err.message ? err.message : String(err));
    } finally {
      setBusy(null);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const fileInput = react_1.createElement("input", {
    ref: fileRef,
    type: "file",
    multiple: true,
    style: { display: "none" },
    onChange: (e) => {
      const picked = e.target && e.target.files ? Array.from(e.target.files) : [];
      if (picked.length > 0) upload(picked);
    },
  });
  const button = react_1.createElement("button", {
    type: "button",
    title: "上传附件：保存到当前工作区的 .dsh-attachments 目录，并把路径引用插入输入框",
    style: busy === true ? btnBusyStyle : btnStyle,
    disabled: busy === true,
    onClick: () => { if (fileRef.current) fileRef.current.click(); },
  }, busy === true ? "上传中…" : "📎 附件");

  return react_1.createElement(react_1.Fragment, null,
    button,
    fileInput,
    error !== null ? react_1.createElement("div", { style: errStyle }, error) : null,
  );
}

function apply(ctx) {
  const slots = ctx.get("slots");
  if (slots === undefined) return;
  slots.inject("conversation.input.left", () => slots.register(
    { name: "conversation.input.left", id: "attachment-upload", order: 5, label: "附件" },
    AttachmentButton,
  ));
}
return module.exports; } });
