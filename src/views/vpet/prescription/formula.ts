export type PrescriptionFormulaContext = {
  weight?: number | null;
};

function normalizeFormulaText(formula?: string | null) {
  return String(formula || '').trim();
}

function toFiniteNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function formatFormulaNumber(value: number) {
  return Number(value.toFixed(2));
}

function tokenizeExpression(expression: string) {
  const tokens: string[] = [];
  let index = 0;

  while (index < expression.length) {
    const char = expression[index];
    if (/\s/.test(char)) {
      index += 1;
      continue;
    }
    if ('+-*/()'.includes(char)) {
      tokens.push(char);
      index += 1;
      continue;
    }
    if (/\d/.test(char) || (char === '.' && /\d/.test(expression[index + 1] || ''))) {
      let numberText = char;
      index += 1;
      while (index < expression.length && /[\d.]/.test(expression[index])) {
        numberText += expression[index];
        index += 1;
      }
      if (!/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(numberText)) return undefined;
      tokens.push(numberText);
      continue;
    }
    return undefined;
  }

  return tokens;
}

function evaluateTokenizedExpression(tokens: string[]) {
  let index = 0;

  const parseExpression = (): number | undefined => {
    let value = parseTerm();
    while (value !== undefined && (tokens[index] === '+' || tokens[index] === '-')) {
      const operator = tokens[index];
      index += 1;
      const right = parseTerm();
      if (right === undefined) return undefined;
      value = operator === '+' ? value + right : value - right;
      if (!Number.isFinite(value)) return undefined;
    }
    return value;
  };

  const parseTerm = (): number | undefined => {
    let value = parseFactor();
    while (value !== undefined && (tokens[index] === '*' || tokens[index] === '/')) {
      const operator = tokens[index];
      index += 1;
      const right = parseFactor();
      if (right === undefined) return undefined;
      value = operator === '*' ? value * right : value / right;
      if (!Number.isFinite(value)) return undefined;
    }
    return value;
  };

  const parseFactor = (): number | undefined => {
    const token = tokens[index];
    if (token === '+' || token === '-') {
      index += 1;
      const value = parseFactor();
      if (value === undefined) return undefined;
      return token === '-' ? -value : value;
    }
    if (token === '(') {
      index += 1;
      const value = parseExpression();
      if (value === undefined || tokens[index] !== ')') return undefined;
      index += 1;
      return value;
    }
    const value = toFiniteNumber(token);
    if (value === undefined) return undefined;
    index += 1;
    return value;
  };

  const result = parseExpression();
  return result !== undefined && index === tokens.length ? result : undefined;
}

function evaluateMathExpression(expression: string, context: PrescriptionFormulaContext) {
  const weight = toFiniteNumber(context.weight);
  if (/\bweight\b/i.test(expression) && weight === undefined) return undefined;

  const replaced = expression.replace(/\bweight\b/gi, String(weight ?? 0));
  if (/[a-zA-Z_$]/.test(replaced)) return undefined;

  const tokens = tokenizeExpression(replaced);
  if (!tokens?.length) return undefined;

  const result = evaluateTokenizedExpression(tokens);
  return result === undefined ? undefined : formatFormulaNumber(result);
}

function matchWeightCondition(condition: string, weight?: number | null) {
  const normalized = condition.trim().replace(/\s+/g, '');
  if (!normalized || normalized === '*' || normalized.toLowerCase() === 'default') return true;

  const value = toFiniteNumber(weight);
  if (value === undefined) return false;

  const comparator = normalized.match(/^(<=|>=|<|>)(-?\d+(?:\.\d+)?)$/);
  if (comparator) {
    const target = Number(comparator[2]);
    if (comparator[1] === '<=') return value <= target;
    if (comparator[1] === '>=') return value >= target;
    if (comparator[1] === '<') return value < target;
    return value > target;
  }

  const range = normalized.match(/^(-?\d+(?:\.\d+)?)-(-?\d+(?:\.\d+)?)$/);
  if (range) {
    const min = Number(range[1]);
    const max = Number(range[2]);
    return value >= min && value <= max;
  }

  return false;
}

export function calculatePrescriptionFormula(formula: string | null | undefined, context: PrescriptionFormulaContext) {
  const text = normalizeFormulaText(formula);
  if (!text) return undefined;

  const rules = text
    .split(/[;\n\uFF1B]+/)
    .map(item => item.trim())
    .filter(Boolean);

  for (const rule of rules) {
    const separatorIndex = rule.indexOf('=');
    if (separatorIndex > -1) {
      const condition = rule.slice(0, separatorIndex);
      const expression = rule.slice(separatorIndex + 1);
      if (matchWeightCondition(condition, context.weight)) {
        return evaluateMathExpression(expression, context);
      }
      continue;
    }

    const result = evaluateMathExpression(rule, context);
    if (result !== undefined) return result;
  }

  return undefined;
}
