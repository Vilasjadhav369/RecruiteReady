/**
 * Tiny dependency-free syntax highlighter for the coding editor.
 * Supports: javascript, python, java, cpp. Returns an array of {type, text}
 * tokens; the editor renders them as <span class="tok-*">. It only colours text
 * (it never evaluates or transforms the code).
 */
const KEYWORDS = {
  javascript: "break case catch class const continue default delete do else export extends finally for function if import in instanceof let new of return static super switch this throw try typeof var void while yield async await null undefined true false",
  python: "and as assert async await break class continue def del elif else except finally for from global if import in is lambda None nonlocal not or pass raise return try while with yield True False self",
  java: "abstract boolean break byte case catch char class const continue default do double else enum extends final finally float for if implements import instanceof int interface long new null package private protected public return short static super switch this throw throws try void volatile while true false var String",
  cpp: "auto bool break case catch char class const constexpr continue default delete do double else enum explicit false float for friend if inline int long namespace new nullptr operator private protected public return short signed sizeof static struct switch template this throw true try typedef typename union unsigned using virtual void while std string vector include",
};

const TYPE_HINT = {
  javascript: /\b(?:Array|Map|Set|Object|Math|Number|String|Promise|JSON|console)\b/,
  python: /\b(?:int|str|list|dict|set|tuple|len|range|print|input|enumerate|zip|sorted|sum|min|max)\b/,
  java: /\b(?:List|ArrayList|Map|HashMap|Set|HashSet|Arrays|Math|Integer|System|Scanner)\b/,
  cpp: /\b(?:cout|cin|endl|vector|map|set|unordered_map|pair|min|max|sort)\b/,
};

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const cache = {};
function buildRegex(lang) {
  if (cache[lang]) return cache[lang];
  const kw = (KEYWORDS[lang] || KEYWORDS.javascript).split(" ").map(esc).join("|");
  const comment = lang === "python" ? "#[^\\n]*" : "\\/\\/[^\\n]*|\\/\\*[\\s\\S]*?(?:\\*\\/|$)";
  const str =
    lang === "python"
      ? "\"\"\"[\\s\\S]*?(?:\"\"\"|$)|'''[\\s\\S]*?(?:'''|$)|\"(?:\\\\.|[^\"\\\\\\n])*\"?|'(?:\\\\.|[^'\\\\\\n])*'?"
      : "\"(?:\\\\.|[^\"\\\\\\n])*\"?|'(?:\\\\.|[^'\\\\\\n])*'?|`(?:\\\\.|[^`\\\\])*`?";
  const re = new RegExp(
    `(${comment})|(${str})|(\\b\\d[\\d_]*(?:\\.\\d+)?\\b)|(\\b(?:${kw})\\b)|(\\b[A-Za-z_]\\w*(?=\\())`,
    "g"
  );
  cache[lang] = re;
  return re;
}

export function tokenize(code, lang = "javascript") {
  const re = buildRegex(lang);
  const hint = TYPE_HINT[lang];
  const out = [];
  let last = 0;
  re.lastIndex = 0;
  let m;
  while ((m = re.exec(code))) {
    if (m.index > last) out.push({ type: "plain", text: code.slice(last, m.index) });
    const text = m[0];
    let type = "plain";
    if (m[1]) type = "comment";
    else if (m[2]) type = "string";
    else if (m[3]) type = "number";
    else if (m[4]) type = "keyword";
    else if (m[5]) type = hint && hint.test(text) ? "builtin" : "fn";
    out.push({ type, text });
    last = m.index + text.length;
    if (text.length === 0) re.lastIndex++; // safety against zero-width matches
  }
  if (last < code.length) out.push({ type: "plain", text: code.slice(last) });
  return out;
}
