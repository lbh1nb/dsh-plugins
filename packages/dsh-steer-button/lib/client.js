window.__ModuleLoader__.load({ id: "dsh-steer-button", factory: (require) => {
var module = { exports: {} }; var exports = module.exports;
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apply = apply;
const react_1 = require("react");

/**
 * dsh-steer-button (client half, v3).
 * A quiet native-feeling pill in the composer tool row (conversation.input.right),
 * visible only while the agent is running. Clicking sends the current draft into
 * the running turn via the session binding's prompt(content, "steer").
 */

const CSS = `
.dsh-steer { display: inline-flex; align-items: center; gap: 4px; }
.dsh-steer-btn {
  display: inline-flex; align-items: center; gap: 5px;
  height: 26px; padding: 0 10px;
  border-radius: 13px;
  border: 1px solid var(--dsw-alias-border-l1, rgba(127,127,127,.25));
  background: transparent;
  color: var(--dsw-alias-label-secondary, inherit);
  font-family: inherit;
  font-size: 12px; font-weight: 500; letter-spacing: .02em;
  cursor: pointer;
  transition: background-color .15s ease, color .15s ease, border-color .15s ease;
}
.dsh-steer-btn:hover {
  background: var(--dsw-alias-interactive-bg-hover, rgba(127,127,127,.10));
  border-color: var(--dsw-alias-border-l2, rgba(127,127,127,.4));
  color: var(--dsw-alias-label-primary, inherit);
  box-shadow: 0 1px 3px rgba(0,0,0,.12);
}
.dsh-steer-btn:focus-visible {
  outline: 2px solid var(--dsw-alias-brand-primary, #1F4E79);
  outline-offset: 2px;
}
.dsh-steer-btn:disabled { opacity: .55; cursor: default; }
.dsh-steer-btn.idle { opacity: .6; filter: saturate(.4); }
.dsh-steer-btn .dsh-steer-speak { display: inline-flex; line-height: 0; }
.dsh-steer-btn:hover .dsh-steer-speak { filter: brightness(1.12); }
.dsh-steer-btn.busy .dsh-steer-speak { animation: dsh-steer-pulse .9s ease-in-out infinite; }
@keyframes dsh-steer-pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.15); } }
.dsh-steer-hint {
  font-size: 11px; color: var(--dsw-alias-label-secondary, inherit);
  white-space: nowrap; margin-left: 2px;
}
.dsh-steer-hint.ok { color: var(--dsw-alias-state-success-primary, #16a34a); }
.dsh-steer-hint.err { color: var(--dsw-alias-state-error-primary, #e5534b); }
`;

function SpeakIcon() {
  return react_1.createElement("img", {
    className: "dsh-steer-speak",
    src: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA0AAAAUCAYAAABWMrcvAAAB8klEQVR42t2SsWpUQRSGv3Nm7iYhZiUICzY2CQQjCRtXC0VITGFhYeV9ADuxtLIQYh7CNxCbbS0F3U7YwiZZRCKCpNAVA4khm725c47FbuJGjA/g38zAf374zzcjnJYA7muorGMbT6qzE3L4IdMUkgtBnMJiX4fDmud5AByg2UEAMi3nDlIMmzvV9Gl30js7VftZ6JgAChjA8vJybLVaJcDC4u03F88VNx/MbUkWTASkb8pMdV8jYPX6rXnVytO9Pb9Wr6/03NmMwVe2didRFe5c+s5ukRHV6JWB2GisXjXz16phOqWEqiCiiymVdj7rH/3oVe5/2Y/dw36U8TGcWCliSvY8hDBdlkUBEt0dd0uqmrlb99HL7VeD9uVw/R4R/HpKyUEqowBFBHe2fc302Vv0Sm0AKZ/Ho7v0RRgfQT64iABsyzqW57msN5vp2FPwZoyZulO6ewJPID7MbwB0u10ZfUw9Ouo/TqlsZVmWxRiDagwDyxHxj/xFsdN5twOsLC2tPgRuuNuUiN8zM1KSzwC1Ws1PfZtGo5GlNPVCVRfMrHRnQkRm3f2gUvGZdrv19ZjOSb1e78IUcFdELquGBVWZDUER8fftdusbrOloYAgCwPbNzM2SmXnJAPrBn8MnOw1b6m/cfnwqZ+hM41/6H0O/ALu34siJLpVXAAAAAElFTkSuQmCC",
    width: 13, height: 20,
    alt: "", draggable: false,
    "aria-hidden": true,
  });
}

function SteerButton(props, sessionsSvc) {
  const [busy, setBusy] = react_1.useState(false);
  const [hint, setHint] = react_1.useState(null);
  const [hintKind, setHintKind] = react_1.useState("info");
  const draftRef = react_1.useRef("");
  const running = props.useSession ? props.useSession((s) => s.running) : false;
  const inputState = props.useInput ? props.useInput((s) => s) : null;
  if (inputState && typeof inputState.draft === "string") draftRef.current = inputState.draft;

  react_1.useEffect(() => {
    if (hint === null) return;
    const t = setTimeout(() => setHint(null), 4000);
    return () => clearTimeout(t);
  }, [hint]);

  const doSteer = async () => {
    if (!running) {
      setHint("等我运行时才能插话（此刻可用回车排队）");
      setHintKind("info");
      return;
    }
    const draft = draftRef.current.trim();
    if (draft === "") {
      setHint("先输入纠偏内容，再点插话");
      setHintKind("info");
      return;
    }
    setBusy(true);
    setHint(null);    try {
      const binding = sessionsSvc && typeof sessionsSvc.binding === "function"
        ? sessionsSvc.binding(props.sessionId)
        : undefined;
      const session = binding && binding.session;
      if (session === undefined || typeof session.prompt !== "function") {
        setHint("⚠ 当前会话不支持插话");
        setHintKind("err");
        return;
      }
      const result = await session.prompt([{ type: "text", text: draft }], "steer");
      if (result && result.ok) {
        if (props.inputActions && typeof props.inputActions.setDraft === "function") {
          props.inputActions.setDraft("");
        }
        setHint("✓ 已插话");
        setHintKind("ok");
      } else {
        setHint("⚠ " + ((result && result.error && result.error.message) || "插话失败"));
        setHintKind("err");
      }
    } catch (err) {
      setHint("⚠ " + (err && err.message ? err.message : String(err)));
      setHintKind("err");
    } finally {
      setBusy(null);
    }
  };

  return react_1.createElement("span", { className: "dsh-steer" },
    react_1.createElement("button", {
      type: "button",
      className: "dsh-steer-btn" + (busy === true ? " busy" : "") + (!running ? " idle" : ""),
      title: running ? "把输入框内容立即注入当前轮次（等同 Ctrl+Enter）" : "空闲状态：等我在运行时才能插话",
      disabled: busy === true,
      onClick: doSteer,
    },
      react_1.createElement(SpeakIcon),
      busy === true ? "插话中…" : "插话",
    ),
    hint !== null ? react_1.createElement("span", {
      className: "dsh-steer-hint" + (hintKind === "ok" ? " ok" : hintKind === "err" ? " err" : ""),
    }, hint) : null,
  );
}

function apply(ctx) {
  const slots = ctx.get("slots");
  if (slots === undefined) return;
  const sessionsSvc = ctx.get("sessions");
  const style = document.createElement("style");
  style.textContent = CSS;
  document.head.appendChild(style);
  slots.inject("conversation.input.right", () => slots.register(
    { name: "conversation.input.right", id: "steer-button", order: 0, label: "插话" },
    (props) => SteerButton(props, sessionsSvc),
  ));
  return () => {
    if (style.parentNode) style.parentNode.removeChild(style);
  };
}
return module.exports; } });
