/**
 * 轻量级 message / notification 实现，用于替代 antd 的对应组件。
 *
 * 纯 DOM 实现、零运行时依赖，避免 content script 为了几个 toast 打包整个 antd。
 * 样式注入一次（按 document 去重），颜色全部走 --scu-* 主题变量，自动适配深色模式。
 */

export type NoticeType = "info" | "success" | "error" | "warning";
export type NotificationPlacement = "topLeft" | "topRight" | "bottomLeft" | "bottomRight";

const STYLE_ID = "scu-plus-notice-style";
const Z_INDEX = "2147483647";

const TYPE_META: Record<NoticeType, { icon: string; color: string }> = {
    info: { icon: "ℹ", color: "var(--scu-accent, #9e1b32)" },
    success: { icon: "✓", color: "#4c9a6a" },
    error: { icon: "✕", color: "#d4544a" },
    warning: { icon: "⚠", color: "#c9862b" },
};

const SANS = 'var(--scu-sans, system-ui, -apple-system, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif)';

function ensureStyle(): void {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
        .scu-notice-msg-wrap {
            position: fixed !important; top: 20px !important; left: 0 !important; right: 0 !important;
            display: flex !important; flex-direction: column !important; align-items: center !important;
            gap: 8px !important; z-index: ${Z_INDEX} !important; pointer-events: none !important;
        }
        .scu-notice-msg {
            display: flex !important; align-items: center !important; gap: 8px !important;
            box-sizing: border-box !important; max-width: calc(100vw - 40px) !important;
            background: var(--scu-surface, #fffdf8) !important;
            color: var(--scu-ink, #1d1c1a) !important;
            border: 1px solid var(--scu-line, #e4e0d4) !important;
            border-radius: 8px !important;
            padding: 9px 16px !important; margin: 0 !important;
            font: 14px/1.5 ${SANS} !important;
            box-shadow: 0 6px 16px 0 rgba(0,0,0,.08), 0 3px 6px -4px rgba(0,0,0,.12), 0 9px 28px 8px rgba(0,0,0,.05) !important;
            pointer-events: auto !important;
            animation: scu-notice-drop .24s ease !important;
        }
        .scu-notice-icon { flex: none !important; font-style: normal !important; font-size: 15px !important; line-height: 1 !important; }
        .scu-notice-ntf-wrap {
            position: fixed !important; display: flex !important; flex-direction: column !important;
            gap: 12px !important; z-index: ${Z_INDEX} !important; pointer-events: none !important;
        }
        .scu-notice-ntf {
            position: relative !important; box-sizing: border-box !important;
            width: 336px !important; max-width: calc(100vw - 40px) !important;
            background: var(--scu-surface, #fffdf8) !important;
            color: var(--scu-ink, #1d1c1a) !important;
            border: 1px solid var(--scu-line, #e4e0d4) !important;
            border-radius: 8px !important;
            padding: 16px 32px 16px 16px !important; margin: 0 !important;
            font: 14px/1.5 ${SANS} !important;
            box-shadow: 0 6px 16px 0 rgba(0,0,0,.08), 0 3px 6px -4px rgba(0,0,0,.12), 0 9px 28px 8px rgba(0,0,0,.05) !important;
            pointer-events: auto !important;
        }
        .scu-notice-ntf.scu-notice-from-right { animation: scu-notice-in-right .24s ease !important; }
        .scu-notice-ntf.scu-notice-from-left { animation: scu-notice-in-left .24s ease !important; }
        .scu-notice-ntf-title {
            display: flex !important; align-items: center !important; gap: 8px !important;
            font-weight: 600 !important; font-size: 14px !important;
            color: var(--scu-ink, #1d1c1a) !important; margin: 0 !important; padding: 0 !important;
        }
        .scu-notice-ntf-desc {
            margin: 6px 0 0 !important; padding: 0 !important; font-size: 13px !important;
            color: var(--scu-ink-soft, #57564f) !important; word-break: break-word !important;
        }
        .scu-notice-ntf-close {
            position: absolute !important; top: 10px !important; right: 10px !important;
            width: 20px !important; height: 20px !important; padding: 0 !important;
            display: flex !important; align-items: center !important; justify-content: center !important;
            background: none !important; border: none !important; cursor: pointer !important;
            color: var(--scu-ink-faint, #8f8e85) !important; font-size: 14px !important; line-height: 1 !important;
        }
        .scu-notice-ntf-close:hover { color: var(--scu-ink, #1d1c1a) !important; }
        .scu-notice-ntf-btn-row { margin-top: 10px !important; }
        .scu-notice-btn {
            display: inline-block !important; padding: 4px 12px !important;
            font: 600 13px/1.5 ${SANS} !important; color: #fff !important;
            background: var(--scu-accent-fill, var(--scu-accent, #9e1b32)) !important;
            border: 1px solid var(--scu-accent-fill, var(--scu-accent, #9e1b32)) !important;
            border-radius: 4px !important; cursor: pointer !important;
        }
        .scu-notice-btn:hover { opacity: .85 !important; }
        .scu-notice-btn-ghost {
            display: inline-block !important; padding: 4px 12px !important;
            font: 13px/1.5 ${SANS} !important;
            color: var(--scu-ink, #1d1c1a) !important;
            background: transparent !important;
            border: 1px solid var(--scu-line-strong, #c9c4b4) !important;
            border-radius: 4px !important; cursor: pointer !important;
        }
        .scu-notice-btn-ghost:hover { border-color: var(--scu-accent, #9e1b32) !important; color: var(--scu-accent, #9e1b32) !important; }
        .scu-notice-confirm-overlay {
            position: fixed !important; inset: 0 !important; z-index: ${Z_INDEX} !important;
            background: rgba(0, 0, 0, 0.45) !important;
            display: flex !important; align-items: center !important; justify-content: center !important;
            animation: scu-notice-fade-in .18s ease !important;
        }
        .scu-notice-confirm {
            box-sizing: border-box !important; width: 400px !important; max-width: calc(100vw - 48px) !important;
            background: var(--scu-surface, #fffdf8) !important;
            color: var(--scu-ink, #1d1c1a) !important;
            border: 1px solid var(--scu-line, #e4e0d4) !important;
            border-radius: 8px !important; padding: 20px 24px !important;
            font: 14px/1.6 ${SANS} !important;
            box-shadow: 0 6px 16px 0 rgba(0,0,0,.08), 0 3px 6px -4px rgba(0,0,0,.12), 0 9px 28px 8px rgba(0,0,0,.05) !important;
            animation: scu-notice-drop .2s ease !important;
        }
        .scu-notice-confirm-title { font-weight: 600 !important; font-size: 15px !important; margin: 0 !important; }
        .scu-notice-confirm-content { margin: 8px 0 0 !important; font-size: 13px !important; color: var(--scu-ink-soft, #57564f) !important; }
        .scu-notice-confirm-footer { display: flex !important; justify-content: flex-end !important; gap: 8px !important; margin-top: 20px !important; }
        .scu-notice-leave { animation: scu-notice-out .18s ease forwards !important; }
        @keyframes scu-notice-fade-in {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        @keyframes scu-notice-drop {
            from { opacity: 0; transform: translateY(-12px); }
            to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scu-notice-in-right {
            from { opacity: 0; transform: translateX(24px); }
            to { opacity: 1; transform: translateX(0); }
        }
        @keyframes scu-notice-in-left {
            from { opacity: 0; transform: translateX(-24px); }
            to { opacity: 1; transform: translateX(0); }
        }
        @keyframes scu-notice-out {
            from { opacity: 1; }
            to { opacity: 0; }
        }
    `;
    (document.head || document.documentElement).appendChild(style);
}

/** 悬停时暂停倒计时，移开后按剩余时间继续 */
function scheduleAutoClose(el: HTMLElement, close: () => void, durationSec: number): void {
    if (!durationSec || durationSec <= 0) return;
    let remaining = durationSec * 1000;
    let start = Date.now();
    let timer = setTimeout(close, remaining);
    el.addEventListener("mouseenter", () => {
        clearTimeout(timer);
        remaining -= Date.now() - start;
    });
    el.addEventListener("mouseleave", () => {
        start = Date.now();
        timer = setTimeout(close, Math.max(remaining, 0));
    });
}

function dismiss(el: HTMLElement, onClose?: () => void): void {
    if (el.classList.contains("scu-notice-leave")) return;
    el.classList.add("scu-notice-leave");
    setTimeout(() => {
        el.remove();
        onClose?.();
    }, 180);
}

function createIcon(type: NoticeType): HTMLSpanElement {
    const meta = TYPE_META[type];
    const icon = document.createElement("span");
    icon.className = "scu-notice-icon";
    icon.textContent = meta.icon;
    icon.style.setProperty("color", meta.color, "important");
    return icon;
}

// ── message ─────────────────────────────────────────────────────

export interface MessageOptions {
    content: string;
    type?: NoticeType;
    /** 秒，默认 3；0 表示常驻 */
    duration?: number;
}

let msgWrap: HTMLElement | null = null;

function getMsgWrap(): HTMLElement {
    if (msgWrap && msgWrap.isConnected) return msgWrap;
    msgWrap = document.createElement("div");
    msgWrap.className = "scu-notice-msg-wrap";
    document.body.appendChild(msgWrap);
    return msgWrap;
}

function openMessage(opts: MessageOptions): void {
    ensureStyle();
    const el = document.createElement("div");
    el.className = "scu-notice-msg";
    el.appendChild(createIcon(opts.type ?? "info"));
    const text = document.createElement("span");
    text.textContent = opts.content;
    el.appendChild(text);
    getMsgWrap().appendChild(el);
    scheduleAutoClose(el, () => dismiss(el), opts.duration ?? 3);
}

export const message = {
    open: openMessage,
    info: (content: string, duration?: number) => openMessage({ content, type: "info", duration }),
    success: (content: string, duration?: number) => openMessage({ content, type: "success", duration }),
    error: (content: string, duration?: number) => openMessage({ content, type: "error", duration }),
    warning: (content: string, duration?: number) => openMessage({ content, type: "warning", duration }),
};

// ── notification ────────────────────────────────────────────────

export interface NotificationOptions {
    /** 标题（对应 antd 的 message 字段） */
    message: string;
    /** 正文内容 */
    description?: string;
    type?: NoticeType;
    placement?: NotificationPlacement;
    /** 秒，默认 4.5；0 表示常驻 */
    duration?: number;
    /** 底部操作按钮（自行创建，可用 .scu-notice-btn 样式类） */
    btn?: HTMLElement;
    onClose?: () => void;
}

const ntfWraps = new Map<NotificationPlacement, HTMLElement>();

function getNtfWrap(placement: NotificationPlacement): HTMLElement {
    const existing = ntfWraps.get(placement);
    if (existing && existing.isConnected) return existing;
    const wrap = document.createElement("div");
    wrap.className = "scu-notice-ntf-wrap";
    const top = placement.startsWith("top");
    const right = placement.endsWith("Right");
    wrap.style.setProperty(top ? "top" : "bottom", "20px", "important");
    wrap.style.setProperty(right ? "right" : "left", "20px", "important");
    document.body.appendChild(wrap);
    ntfWraps.set(placement, wrap);
    return wrap;
}

function openNotification(opts: NotificationOptions): () => void {
    ensureStyle();
    const placement = opts.placement ?? "topRight";
    const type = opts.type ?? "info";

    const el = document.createElement("div");
    el.className = `scu-notice-ntf ${placement.endsWith("Right") ? "scu-notice-from-right" : "scu-notice-from-left"}`;

    const title = document.createElement("div");
    title.className = "scu-notice-ntf-title";
    title.appendChild(createIcon(type));
    const titleText = document.createElement("span");
    titleText.textContent = opts.message;
    title.appendChild(titleText);
    el.appendChild(title);

    if (opts.description) {
        const desc = document.createElement("div");
        desc.className = "scu-notice-ntf-desc";
        desc.textContent = opts.description;
        el.appendChild(desc);
    }

    if (opts.btn) {
        const btnRow = document.createElement("div");
        btnRow.className = "scu-notice-ntf-btn-row";
        btnRow.appendChild(opts.btn);
        el.appendChild(btnRow);
    }

    const closeBtn = document.createElement("button");
    closeBtn.className = "scu-notice-ntf-close";
    closeBtn.textContent = "✕";
    closeBtn.setAttribute("aria-label", "关闭");
    el.appendChild(closeBtn);

    const close = () => dismiss(el, opts.onClose);
    closeBtn.addEventListener("click", close);

    getNtfWrap(placement).appendChild(el);
    scheduleAutoClose(el, close, opts.duration ?? 4.5);
    return close;
}

export const notification = {
    open: openNotification,
    info: (opts: NotificationOptions) => openNotification({ ...opts, type: "info" }),
    success: (opts: NotificationOptions) => openNotification({ ...opts, type: "success" }),
    error: (opts: NotificationOptions) => openNotification({ ...opts, type: "error" }),
    warning: (opts: NotificationOptions) => openNotification({ ...opts, type: "warning" }),
};

// ── confirm ─────────────────────────────────────────────────────

export interface ConfirmOptions {
    title: string;
    content?: string;
    okText?: string;
    cancelText?: string;
    onOk?: () => void;
    onCancel?: () => void;
}

/**
 * 确认对话框（替代 antd Modal.confirm）。
 * 点击遮罩或按 Esc 视为取消；返回 Promise<boolean>，确定时 resolve(true)。
 */
export function confirm(opts: ConfirmOptions): Promise<boolean> {
    ensureStyle();
    return new Promise(resolve => {
        const overlay = document.createElement("div");
        overlay.className = "scu-notice-confirm-overlay";

        const box = document.createElement("div");
        box.className = "scu-notice-confirm";

        const title = document.createElement("div");
        title.className = "scu-notice-confirm-title";
        title.textContent = opts.title;
        box.appendChild(title);

        if (opts.content) {
            const content = document.createElement("div");
            content.className = "scu-notice-confirm-content";
            content.textContent = opts.content;
            box.appendChild(content);
        }

        const footer = document.createElement("div");
        footer.className = "scu-notice-confirm-footer";
        const cancelBtn = document.createElement("button");
        cancelBtn.className = "scu-notice-btn-ghost";
        cancelBtn.textContent = opts.cancelText ?? "取消";
        const okBtn = document.createElement("button");
        okBtn.className = "scu-notice-btn";
        okBtn.textContent = opts.okText ?? "确定";
        footer.appendChild(cancelBtn);
        footer.appendChild(okBtn);
        box.appendChild(footer);

        overlay.appendChild(box);
        document.body.appendChild(overlay);

        const done = (ok: boolean) => {
            document.removeEventListener("keydown", onKeydown, true);
            dismiss(overlay, () => {
                if (ok) opts.onOk?.(); else opts.onCancel?.();
                resolve(ok);
            });
        };
        const onKeydown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                e.stopPropagation();
                done(false);
            }
        };
        document.addEventListener("keydown", onKeydown, true);

        okBtn.addEventListener("click", () => done(true));
        cancelBtn.addEventListener("click", () => done(false));
        overlay.addEventListener("click", (e) => {
            if (e.target === overlay) done(false);
        });
        okBtn.focus();
    });
}
