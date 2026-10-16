import { useMemo, useRef, useState, useCallback, useLayoutEffect } from "react";
import { tokenize } from "../../lib/highlight.js";

const LINE_HEIGHT = 20; // px — must match .rr-code-layer line-height in editor.css
const TAB = "  ";

/**
 * CodeEditor — syntax-highlighted editor built on a real <textarea> so native
 * selection, undo, IME, mobile keyboards and screen readers keep working.
 * A highlighted <pre> sits behind the transparent textarea; both scroll together.
 *
 * Keyboard: Tab indents (2 spaces), Shift+Tab outdents, Enter keeps indentation.
 * Escape releases the Tab trap so the next Tab moves focus out (WCAG 2.1.2).
 */
export default function CodeEditor({
  value,
  onChange,
  language = "javascript",
  id = "code-editor-textarea",
  ariaLabel = "Code editor",
  placeholder = "",
  minRows = 18,
  disabled = false,
}) {
  const taRef = useRef(null);
  const preRef = useRef(null);
  const gutterRef = useRef(null);
  const [trapTab, setTrapTab] = useState(true);

  const tokens = useMemo(() => tokenize(value || "", language), [value, language]);
  const lineCount = Math.max((value || "").split("\n").length, minRows);

  const syncScroll = useCallback(() => {
    const ta = taRef.current;
    if (!ta) return;
    if (preRef.current) {
      preRef.current.scrollTop = ta.scrollTop;
      preRef.current.scrollLeft = ta.scrollLeft;
    }
    if (gutterRef.current) gutterRef.current.scrollTop = ta.scrollTop;
  }, []);

  // Selection to restore synchronously after React commits the new value
  // (avoids a caret race when keys arrive faster than a frame).
  const pendingSel = useRef(null);
  useLayoutEffect(() => {
    const sel = pendingSel.current;
    const ta = taRef.current;
    if (sel && ta) {
      ta.setSelectionRange(sel[0], sel[1]);
      pendingSel.current = null;
    }
  }, [value]);

  const apply = (next, selStart, selEnd = selStart) => {
    pendingSel.current = [selStart, selEnd];
    onChange(next);
  };

  const handleKeyDown = (e) => {
    const ta = e.currentTarget;
    const { selectionStart: s, selectionEnd: en } = ta;
    const text = value || "";

    if (e.key === "Escape") {
      setTrapTab(false); // next Tab leaves the editor
      return;
    }
    if (e.key !== "Tab") setTrapTab(true);

    if (e.key === "Tab" && trapTab) {
      e.preventDefault();
      const lineStart = text.lastIndexOf("\n", s - 1) + 1;
      if (s !== en || e.shiftKey) {
        // Indent / outdent every selected line
        const blockEnd = en;
        const block = text.slice(lineStart, blockEnd);
        const lines = block.split("\n");
        let delta0 = 0;
        let deltaAll = 0;
        const changed = lines.map((ln, i) => {
          if (e.shiftKey) {
            const rm = ln.startsWith(TAB) ? 2 : ln.startsWith(" ") ? 1 : 0;
            if (i === 0) delta0 = -rm;
            deltaAll -= rm;
            return ln.slice(rm);
          }
          if (i === 0) delta0 = TAB.length;
          deltaAll += TAB.length;
          return TAB + ln;
        });
        apply(text.slice(0, lineStart) + changed.join("\n") + text.slice(blockEnd), Math.max(lineStart, s + delta0), en + deltaAll);
      } else {
        apply(text.slice(0, s) + TAB + text.slice(en), s + TAB.length);
      }
      return;
    }

    if (e.key === "Enter" && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      const lineStart = text.lastIndexOf("\n", s - 1) + 1;
      const indent = (text.slice(lineStart, s).match(/^[ \t]*/) || [""])[0];
      const prev = text[s - 1];
      const extra = prev === "{" || prev === "(" || prev === "[" || prev === ":" ? TAB : "";
      const insert = "\n" + indent + extra;
      apply(text.slice(0, s) + insert + text.slice(en), s + insert.length);
    }
  };

  return (
    <div className="rr-code" data-disabled={disabled || undefined}>
      <div ref={gutterRef} className="rr-code-gutter" aria-hidden="true">
        {Array.from({ length: lineCount }, (_, i) => (
          <div key={i}>{i + 1}</div>
        ))}
      </div>
      <div className="rr-code-body" style={{ minHeight: minRows * LINE_HEIGHT }}>
        <pre ref={preRef} className="rr-code-layer rr-code-pre" aria-hidden="true">
          <code>
            {tokens.map((t, i) =>
              t.type === "plain" ? t.text : <span key={i} className={`tok-${t.type}`}>{t.text}</span>
            )}
            {"\n"}
          </code>
        </pre>
        <textarea
          ref={taRef}
          id={id}
          aria-label={ariaLabel}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onScroll={syncScroll}
          spellCheck="false"
          autoCapitalize="off"
          autoCorrect="off"
          wrap="off"
          rows={minRows}
          placeholder={placeholder}
          className="rr-code-layer rr-code-input"
        />
      </div>
    </div>
  );
}
