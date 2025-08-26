// Elements
const expEl = document.getElementById("expression");
const resEl = document.getElementById("result");
let expr = "";

/* ================= Expression Evaluator (Safe) ===========================
   Shunting-yard → RPN → stack evaluation.
   Supports: + − × ÷ (ASCII + - * /), parentheses, decimals, unary minus.
===========================================================================*/
const mapOps = {
  "×": "*",
  "÷": "/",
  "−": "-",
  "+": "+",
  "-": "-",
  "*": "*",
  "/": "/",
  "(": "(",
  ")": ")",
};

// Break input string into tokens (numbers, operators, parentheses)
function tokenize(s) {
  const tokens = [];
  let i = 0;
  const isDigit = (c) => /[0-9]/.test(c);
  const asOp = (c) => mapOps[c] ?? null;

  while (i < s.length) {
    const c = s[i];

    if (c === " ") {
      i++;
      continue;
    }

 
    if (isDigit(c) || c === ".") {
      let num = c;
      i++;
      let dotCount = c === "." ? 1 : 0;

      while (i < s.length && (isDigit(s[i]) || s[i] === ".")) {
        if (s[i] === ".") {
          dotCount++;
          if (dotCount > 1) return null; 
        }
        num += s[i++];
      }

      if (num === ".") return null;
      tokens.push({ type: "num", value: parseFloat(num) });
      continue;
    }

   
    const op = asOp(c);
    if (op) {
      if (op === "-") {
        const prev = tokens[tokens.length - 1];
        if (!prev || (prev.type === "op" && prev.value !== ")")) {
          tokens.push({ type: "num", value: 0 });
        }
      }
      tokens.push({ type: "op", value: op });
      i++;
      continue;
    }

    return null;
  }
  return tokens;
}

// Convert tokens → Reverse Polish Notation (Shunting-yard algorithm)
function toRPN(tokens) {
  const out = [];
  const st = [];
  const prec = { "+": 1, "-": 1, "*": 2, "/": 2 };
  for (const t of tokens) {
    if (t.type === "num") {
      out.push(t);
      continue;
    }
    const v = t.value;
    if (v === "(") {
      st.push(t);
      continue;
    }
    if (v === ")") {
      let foundParen = false;
      while (st.length) {
        const top = st.pop();
        if (top.value === "(") {
          foundParen = true;
          break;
        }
        out.push(top);
      }
      if (!foundParen) return null; 
      continue;
    }
    while (st.length) {
      const top = st[st.length - 1].value;
      if (top === "(") break;
      if ((prec[top] || 0) >= (prec[v] || 0)) out.push(st.pop());
      else break;
    }
    st.push(t);
  }
  while (st.length) {
    if (st[st.length - 1].value === "(") return null; 
    out.push(st.pop());
  }
  return out;
}

// Evaluate an RPN expression via stack
function evalRPN(rpn) {
  const s = [];
  for (const t of rpn) {
    if (t.type === "num") {
      s.push(t.value);
      continue;
    }
    const b = s.pop(),
      a = s.pop();
    if (a === undefined || b === undefined) return NaN;
    switch (t.value) {
      case "+":
        s.push(a + b);
        break;
      case "-":
        s.push(a - b);
        break;
      case "*":
        s.push(a * b);
        break;
      case "/":
        s.push(b === 0 ? NaN : a / b);
        break;
      default:
        return NaN;
    }
  }
  return s.length === 1 ? s[0] : NaN;
}

// Wrapper to tokenize → RPN → evaluate, returns number or "Error"
function safeEvaluate(text) {
  try {
    const toks = tokenize(text);
    if (!toks) return "Error";
    if (!toks.length) return "";
    const rpn = toRPN(toks);
    if (!rpn) return "Error";
    const v = evalRPN(rpn);
    return Number.isFinite(v) ? v : "Error";
  } catch {
    return "Error";
  }
}

/* =================== UI / Interactions ================================== */

// Update display: expression + live result preview
function render() {
  expEl.textContent = expr || "0";
  const preview = safeEvaluate(expr);
  resEl.innerHTML =
    expr && preview !== "" && preview !== "Error" ? preview : "&nbsp;";
}

// Append a value to current expression
function append(val) {
  expr += val;
  render();
}

// Clear the whole expression
function clearAll() {
  expr = "";
  render();
}

// Remove last character
function backspace() {
  expr = expr.slice(0, -1);
  render();
}

// Evaluate expression and update display
function equals() {
  const v = safeEvaluate(expr);
  if (v === "" || v === "Error") {
    resEl.textContent = "Error"; 
    return;
  }
  expr = String(v);
  render();
}

// Copy result (or expression) to clipboard
async function copyResult() {

  let text = resEl.textContent.trim();
  if (!text || text === " ") {
    const v = safeEvaluate(expr);
    if (v && v !== "Error") text = String(v);
    else text = expr;
  }
  if (!text) return;

  try {
    await navigator.clipboard.writeText(text);
    alert("Copied: " + text);
  } catch {
    alert("Copy failed");
  }
}

/* ================== Event Bindings ====================================== */

/* Buttons (event delegation) */
document.querySelector(".buttons").addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;
  const val = btn.dataset.value;
  const action = btn.dataset.action;
  if (val != null) return append(val);
  if (action === "clear") return clearAll();
  if (action === "backspace") return backspace();
  if (action === "equals") return equals();
  if (action === "copy") return copyResult();
});

/* Keyboard support */
document.addEventListener("keydown", (e) => {
  const k = e.key;
  if (/^[0-9]$/.test(k) || ["+", "-", "*", "/", "(", ")", "."].includes(k)) {
    append(k);
    return;
  }
  if (k === "Enter" || k === "=") {
    e.preventDefault();
    equals();
    return;
  }
  if (k === "Backspace") {
    backspace();
    return;
  }
  if (k === "Escape") {
    clearAll();
    return;
  }
  if (k.toLowerCase() === "c") {
    e.preventDefault();
    copyResult();
    return;
  }
});

/* Start */
render();
