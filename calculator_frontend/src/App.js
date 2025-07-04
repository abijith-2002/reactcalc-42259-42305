import React, { useState, useEffect } from 'react';
import './App.css';

/**
 * Modern Light-Themed Calculator App
 * - Supports basic arithmetic (add, subtract, multiply, divide)
 * - Button-based input
 * - Clear ("C") and backspace ("⌫") functionality
 * - Responsive design
 * - Color theme: primary (#1976d2), accent (#ff9800), secondary (#424242), modern style
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
  '--calc-wide': 'min(400px, 92vw)'
};

function setCalcThemeVars(vars) {
  for (const k in vars) {
    document.documentElement.style.setProperty(k, vars[k]);
  }
}

// Button configuration for calculator layout
const BUTTONS = [
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

// Helper to flatten rows for rendering
function flattenButtons(buttonRows) {
  const flat = [];
  buttonRows.forEach((row, ri) => {
    row.forEach((btn, ci) => flat.push({ ...btn, row: ri, col: ci }));
  });
  return flat;
}

function evaluateExpression(expr) {
  // Basic safe arithmetic evaluation
  try {
    // Replace unicode multiplication/division for eval
    const cleaned = expr.replace(/×/g, '*').replace(/÷/g, '/');
    // eslint-disable-next-line no-eval
    // Extra: Don't evaluate if invalid expression
    if (/[^0-9+\-*/.() ]/.test(cleaned)) return 'ERR';
    // Prevent repeated operators
    // eslint-disable-next-line no-eval
    let result = eval(cleaned);
    if (!isFinite(result)) return 'ERR';
    // Trim trailing decimals
    result = Math.round((result + Number.EPSILON) * 100000000) / 100000000;
    return result.toString();
  } catch {
    return 'ERR';
  }
}

// PUBLIC_INTERFACE
function App() {
  // Calculator display/input state
  const [input, setInput] = useState('0');
  const [lastEval, setLastEval] = useState('');
  // Light theme only, but expose for expansion
  useEffect(() => {
    setCalcThemeVars(CALC_THEME_VARS);
    document.body.setAttribute('data-theme', 'light');
    // Reset on mount
    setInput('0');
    setLastEval('');
  }, []);

  // PUBLIC_INTERFACE
  const handleButtonClick = (btn) => {
    if (btn.type === 'number') {
      if (input === 'ERR') {
        setInput(btn.value === '.' ? '0.' : btn.value);
        setLastEval('');
        return;
      }
      // Leading zeros
      if (input === '0' && btn.value !== '.') {
        setInput(btn.value);
      } else if (btn.value === '.' && input.includes('.') && /[0-9]+$/.test(input.slice(input.lastIndexOf('.') - 1))) {
        // Prevent duplicate dots in a single number
        const lastNum = input.match(/(?:\d*\.\d*|\d+)$/);
        if (lastNum && lastNum[0].includes('.')) return;
        setInput(input + '.');
      } else {
        setInput(input + btn.value);
      }
    } else if (btn.type === 'operator') {
      if (input === 'ERR') return;
      // Avoid two operators
      if (/[\+\-\*\/.]$/.test(input)) {
        setInput(input.slice(0, -1) + btn.value);
      } else {
        setInput(input + btn.value);
      }
    } else if (btn.type === 'equal') {
      if (input === 'ERR') return;
      if (!/^[0-9\-+*/. ()]+$/.test(input)) { setInput('ERR'); return; }
      let result = evaluateExpression(input);
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
    }
  };

  // Handle keyboard support for numbers/operators/Enter/Backspace/C
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
  }, [input]);

  // Render calculator layout
  return (
    <div className="calculator-outer">
      <div className="calculator">
        <div className="calc-display" aria-label="Calculator display">
          <div className="calc-last">{lastEval || '\u00A0'}</div>
          <div className="calc-input" data-testid="display">{input}</div>
        </div>
        <div className="calc-buttons">
          {/* Render button grid */}
          {BUTTONS.map((row, rIdx) => (
            <div className="calc-row" key={rIdx}>
              {row.map((btn, cIdx) => {
                let className = "calc-btn";
                if (btn.class === 'operator') className += " calc-btn-operator";
                if (btn.class === 'accent') className += " calc-btn-accent";
                if (btn.class === 'action') className += " calc-btn-action";
                if (btn.class === 'zero') className += " calc-btn-zero";
                return (
                  <button
                    key={btn.label}
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
              {/* 0 row needs one extra column */}
              {rIdx === 4 && (
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
            Modern Calculator &mdash; React &middot; {new Date().getFullYear()}
          </small>
        </footer>
      </div>
    </div>
  );
}

export default App;
