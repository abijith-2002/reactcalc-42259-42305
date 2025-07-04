import React, { useState, useEffect } from 'react';
import './App.css';

/**
 * Modern Calculator App (Basic & Scientific Modes)
 * - Supports basic arithmetic AND scientific functions (sin, cos, tan, log, ln, sqrt, exponentiation)
 * - Toggle between basic and scientific layouts
 * - Clean, modern, responsive UI
 */

// Custom color theme as CSS variables
const CALC_THEME_VARS = {
  '--calc-bg': '#f6f8fa',
  '--calc-display-bg': '#ffffff',
  '--calc-display-fg': '#282c34',
  '--calc-display-shadow': 'rgba(25, 118, 210, 0.08)',
  '--calc-primary': '#1976d2',
  '--calc-primary-dark': '#115293',
  '--calc-accent': '#ff9800',
  '--calc-secondary': '#424242',
  '--calc-key-bg': '#e3eafc',
  '--calc-key-fg': '#22324a',
  '--calc-key-border': '#dde5ef',
  '--calc-key-hover-bg': '#d2dffc',
  '--calc-op-bg': '#1976d2',
  '--calc-op-fg': '#fff',
  '--calc-op-hover-bg': '#1565c0',
  '--calc-accent-bg': '#ff9800',
  '--calc-accent-fg': '#fff',
  '--calc-accent-hover-bg': '#fb8c00',
  '--calc-wide': 'min(430px, 97vw)'
};

// Set all theme vars globally
function setCalcThemeVars(vars) {
  for (const k in vars) {
    document.documentElement.style.setProperty(k, vars[k]);
  }
}

// BUTTON CONFIGURATIONS
const BASIC_BUTTONS = [
  [
    { label: 'C', type: 'action', value: 'clear', class: 'action' },
    { label: '⌫', type: 'action', value: 'backspace', class: 'action' },
    { label: '÷', type: 'operator', value: '/', class: 'operator' },
    { label: '×', type: 'operator', value: '*', class: 'operator' },
  ],
  [
    { label: '7', type: 'number', value: '7' },
    { label: '8', type: 'number', value: '8' },
    { label: '9', type: 'number', value: '9' },
    { label: '−', type: 'operator', value: '-', class: 'operator' },
  ],
  [
    { label: '4', type: 'number', value: '4' },
    { label: '5', type: 'number', value: '5' },
    { label: '6', type: 'number', value: '6' },
    { label: '+', type: 'operator', value: '+', class: 'operator' },
  ],
  [
    { label: '1', type: 'number', value: '1' },
    { label: '2', type: 'number', value: '2' },
    { label: '3', type: 'number', value: '3' },
    { label: '=', type: 'equal', value: '=', class: 'accent' },
  ],
  [
    { label: '0', type: 'number', value: '0', class: 'zero' },
    { label: '.', type: 'number', value: '.' },
  ],
];

const SCIENTIFIC_BUTTONS = [
  [
    { label: 'C', type: 'action', value: 'clear', class: 'action' },
    { label: '⌫', type: 'action', value: 'backspace', class: 'action' },
    { label: '÷', type: 'operator', value: '/', class: 'operator' },
    { label: '×', type: 'operator', value: '*', class: 'operator' },
  ],
  [
    { label: 'sin', type: 'func', value: 'sin', class: 'func' },
    { label: 'cos', type: 'func', value: 'cos', class: 'func' },
    { label: 'tan', type: 'func', value: 'tan', class: 'func' },
    { label: '√', type: 'func', value: 'sqrt', class: 'func' },
  ],
  [
    { label: 'ln', type: 'func', value: 'ln', class: 'func' },
    { label: 'log', type: 'func', value: 'log', class: 'func' },
    { label: 'x^2', type: 'func', value: 'square', class: 'func' },
    { label: 'xʸ', type: 'operator', value: '^', class: 'func' },
  ],
  [
    { label: '7', type: 'number', value: '7' },
    { label: '8', type: 'number', value: '8' },
    { label: '9', type: 'number', value: '9' },
    { label: '−', type: 'operator', value: '-', class: 'operator' },
  ],
  [
    { label: '4', type: 'number', value: '4' },
    { label: '5', type: 'number', value: '5' },
    { label: '6', type: 'number', value: '6' },
    { label: '+', type: 'operator', value: '+', class: 'operator' },
  ],
  [
    { label: '1', type: 'number', value: '1' },
    { label: '2', type: 'number', value: '2' },
    { label: '3', type: 'number', value: '3' },
    { label: '=', type: 'equal', value: '=', class: 'accent' },
  ],
  [
    { label: '0', type: 'number', value: '0', class: 'zero' },
    { label: '.', type: 'number', value: '.' },
  ],
];

// Helper to build button rows for rendering (not needed for logic)
function flattenButtons(buttonRows) {
  const flat = [];
  buttonRows.forEach((row, ri) => {
    row.forEach((btn, ci) => flat.push({ ...btn, row: ri, col: ci }));
  });
  return flat;
}

// Expression evaluators (basic and scientific)
function safeEvaluate(expr) {
  try {
    // Power operator support: replace ^ with **, also support sqrt, log, ln
    let cleaned = expr
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/√\s*\(?([0-9.]+)\)?/, 'Math.sqrt($1)')
      .replace(/\^/g, '**');
    // only allow safe characters
    if (/[^0-9+\-*/.^() ]/.test(cleaned)) return 'ERR';
    // eslint-disable-next-line no-eval
    let result = eval(cleaned);
    if (!isFinite(result)) return 'ERR';
    // Trim decimals for display
    result = Math.round((result + Number.EPSILON) * 1e8) / 1e8;
    return result.toString();
  } catch {
    return 'ERR';
  }
}

/**
 * Evaluate a mathematical expression string, supporting basic operators (^ as exponent),
 * and scientific functions: sin, cos, tan, log (base 10), ln, sqrt(x), square(x)
 */
function evaluateScientific(expr) {
  // Replace math function names with JS equivalents, handle radians for trig
  try {
    let replaced = expr
      .replace(/sin\(([^)]+)\)/g, (m, x) => `Math.sin(toRadians(${x}))`)
      .replace(/cos\(([^)]+)\)/g, (m, x) => `Math.cos(toRadians(${x}))`)
      .replace(/tan\(([^)]+)\)/g, (m, x) => `Math.tan(toRadians(${x}))`)
      .replace(/ln\(([^)]+)\)/g, (m, x) => `Math.log(${x})`)
      .replace(/log\(([^)]+)\)/g, (m, x) => `Math.log10(${x})`)
      .replace(/sqrt\(([^)]+)\)/g, (m, x) => `Math.sqrt(${x})`)
      .replace(/([0-9.]+)\^([0-9.]+)/g, (m, x, y) => `Math.pow(${x},${y})`)
      .replace(/([0-9.]+)\s*²/g, (m, x) => `Math.pow(${x},2)`)
      .replace(/÷/g, '/')
      .replace(/×/g, '*');
    // Remove any remaining unsafe tokens
    if (/[^0-9+\-*/.^() MathlogincosqrtpowtoRadians]/.test(replaced)) return 'ERR';
    // Insert toRadians helper
    // eslint-disable-next-line no-new-func
    const toRadians = deg => (Number(deg) * Math.PI) / 180;
    // eslint-disable-next-line no-new-func
    // Evaluate in a scope that provides toRadians
    // eslint-disable-next-line no-eval
    let result = eval(`(function(){${toRadians.toString()}; return ${replaced};})()`);
    if (!isFinite(result)) return 'ERR';
    result = Math.round((result + Number.EPSILON) * 1e8) / 1e8;
    return result.toString();
  } catch {
    return 'ERR';
  }
}

// PUBLIC_INTERFACE
function App() {
  // State for calculator display/input
  const [input, setInput] = useState('0');
  const [lastEval, setLastEval] = useState('');
  const [sciMode, setSciMode] = useState(false);

  // Set theme (only light for now)
  useEffect(() => {
    setCalcThemeVars(CALC_THEME_VARS);
    document.body.setAttribute('data-theme', 'light');
    // Reset on mount
    setInput('0');
    setLastEval('');
  }, []);

  // PUBLIC_INTERFACE
  const handleButtonClick = btn => {
    // Determine which logic mode
    const isScientific = sciMode;
    // Numbers and dot always same
    if (btn.type === 'number') {
      if (input === 'ERR') {
        setInput(btn.value === '.' ? '0.' : btn.value);
        setLastEval('');
        return;
      }
      // Leading zero
      if (input === '0' && btn.value !== '.') {
        setInput(btn.value);
      } else if (
        btn.value === '.' &&
        input.includes('.') &&
        /[0-9]+$/.test(input.slice(input.lastIndexOf('.') - 1))
      ) {
        // Prevent multiple dots in ONE number
        const lastNum = input.match(/(?:\d*\.\d*|\d+)$/);
        if (lastNum && lastNum[0].includes('.')) return;
        setInput(input + '.');
      } else {
        setInput(input + btn.value);
      }
    } else if (btn.type === 'operator') {
      if (input === 'ERR') return;
      if (btn.value === '^') {
        // Exponentiation: add caret (for power, e.g., 2^3)
        // If input ends with operator, replace, else append
        if (/[+\-*/^.]$/.test(input)) {
          setInput(input.slice(0, -1) + '^');
        } else {
          setInput(input + '^');
        }
        return;
      }
      // Standard operator
      if (/[+\-*/^.]$/.test(input)) {
        setInput(input.slice(0, -1) + btn.value);
      } else {
        setInput(input + btn.value);
      }
    } else if (btn.type === 'equal') {
      // Evaluate current input
      if (input === 'ERR') return;
      let result;
      if (isScientific) {
        // Try scientific-safe expression
        let expr = input;

        // Replace any "²" at end with "^2"
        expr = expr.replace(/([0-9.)]+)²/g, 'square($1)');
        // Replace "square(...)" with "(...)^2" for logic
        expr = expr.replace(/square\(([^\)]+)\)/g, '($1)^2');

        // Simple function args (e.g., "sin(" append closing if missing
        let opened = (expr.match(/\(/g) || []).length;
        let closed = (expr.match(/\)/g) || []).length;
        if (opened > closed) {
          expr += ')'.repeat(opened - closed);
        }
        // Accept a trailing func with a value (e.g. "sin30" or "log10")
        expr = expr.replace(/(sin|cos|tan|log|ln|sqrt)(\d+(\.\d+)?)/g, '$1($2)');

        result = evaluateScientific(expr);
      } else {
        // Basic mode
        result = safeEvaluate(input);
      }
      setLastEval(input + ' =');
      setInput(result);
    } else if (btn.value === 'clear') {
      setInput('0');
      setLastEval('');
    } else if (btn.value === 'backspace') {
      if (input === 'ERR' || input.length === 1) {
        setInput('0');
      } else {
        setInput(input.slice(0, -1));
      }
    } else if (btn.type === 'func' && isScientific) {
      if (input === 'ERR') return;
      // Supported: sin, cos, tan, ln, log, sqrt, square
      if (btn.value === 'sin' ||
          btn.value === 'cos' ||
          btn.value === 'tan' ||
          btn.value === 'ln' ||
          btn.value === 'log' ||
          btn.value === 'sqrt'
      ) {
        // Insert func(value) if previous is a number or close paren
        if (input === '0' || input === '') {
          setInput(`${btn.value}(`);
        } else if (/[0-9)]$/.test(input)) {
          setInput(input + ` ${btn.value}(`);
        } else {
          setInput(input + `${btn.value}(`);
        }
      } else if (btn.value === 'square') {
        // Square current/last number
        let m = input.match(/([0-9.]+)$/);
        if (m) {
          setInput(input.replace(/([0-9.]+)$/, ($0) => `(${parseFloat($0)})²`));
        } else if (input !== 'ERR') {
          // If ends with close paren, square the expression in it
          if (/\)$/.test(input)) {
            // Find matching '('
            let depth = 0, idx = input.length - 1;
            for (; idx >= 0; idx--) {
              if (input[idx] === ')') depth++;
              else if (input[idx] === '(') depth--;
              if (depth === 0) break;
            }
            if (idx >= 0) {
              setInput(input + '²');
              return;
            }
          }
          setInput(input + '²');
        }
      }
    }
  };

  // Handle keyboard support (basic only, for simplicity)
  useEffect(() => {
    // PUBLIC_INTERFACE
    function handleKey(e) {
      const key = e.key;
      const opMap = { '/': '/', '*': '*', '-': '-', '+': '+', 'Enter': '=', '=': '=' };
      if (/\d/.test(key)) {
        handleButtonClick({ type: 'number', value: key });
      } else if (key === '.') {
        handleButtonClick({ type: 'number', value: key });
      } else if (opMap[key]) {
        if (opMap[key] === '=') handleButtonClick({ type: 'equal', value: '=' });
        else handleButtonClick({ type: 'operator', value: opMap[key] });
      } else if (key === 'Backspace') {
        handleButtonClick({ type: 'action', value: 'backspace' });
      } else if (key.toLowerCase() === 'c') {
        handleButtonClick({ type: 'action', value: 'clear' });
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
    // eslint-disable-next-line
  }, [input, sciMode]);

  // Render calculator
  const buttons = sciMode ? SCIENTIFIC_BUTTONS : BASIC_BUTTONS;

  // Layout:
  // - Toggle button ("Scientific Mode")
  // - Calculator display
  // - Button grid (conditionally with extra function rows)
  // - Footer

  return (
    <div className="calculator-outer">
      <div className="calculator">
        <button
          className="theme-toggle"
          style={{ right: 20, left: 'auto', top: 18, position: 'absolute', fontWeight: 600 }}
          onClick={() => setSciMode((m) => !m)}
          aria-label="Toggle scientific mode"
          tabIndex={0}
        >
          {sciMode ? 'Basic Mode' : 'Scientific Mode'}
        </button>
        <div className="calc-display" aria-label="Calculator display">
          <div className="calc-last">{lastEval || '\u00A0'}</div>
          <div className="calc-input" data-testid="display">{input}</div>
        </div>

        <div className="calc-buttons">
          {buttons.map((row, rIdx) => (
            <div className="calc-row" key={rIdx}>
              {row.map((btn, cIdx) => {
                let className = "calc-btn";
                if (btn.class === 'operator') className += " calc-btn-operator";
                if (btn.class === 'accent') className += " calc-btn-accent";
                if (btn.class === 'action') className += " calc-btn-action";
                if (btn.class === 'zero') className += " calc-btn-zero";
                if (btn.class === 'func') className += " calc-btn-func";
                return (
                  <button
                    key={btn.label + cIdx}
                    className={className}
                    tabIndex={0}
                    aria-label={btn.label}
                    onClick={() => handleButtonClick(btn)}
                    style={btn.class === 'zero' ? { flex: 2 } : undefined}
                  >
                    {btn.label}
                  </button>
                );
              })}
              {/* in last row of number grid, add divide/backspace buttons if basic mode (so rows are balanced) */}
              {!sciMode && rIdx === 4 && (
                <>
                  <button
                    className="calc-btn calc-btn-action"
                    onClick={() => handleButtonClick({ type: 'action', value: 'backspace' })}
                    aria-label="Backspace"
                  >⌫</button>
                  <button
                    className="calc-btn calc-btn-operator"
                    onClick={() => handleButtonClick({ type: 'operator', value: '/' })}
                    aria-label="Divide"
                  >÷</button>
                </>
              )}
            </div>
          ))}
        </div>
        <footer className="calc-footer">
          <small>
            Modern Calculator &mdash; React &middot; {new Date().getFullYear()} &middot; {sciMode ? 'Scientific' : 'Basic'}
          </small>
        </footer>
      </div>
    </div>
  );
}

export default App;
