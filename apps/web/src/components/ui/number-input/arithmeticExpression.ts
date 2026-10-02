const OPERATORS = new Set(['+', '-', '*', '/']);

export function isArithmeticOperator(key: string) {
  return OPERATORS.has(key);
}

/** True when text contains an operator beyond a leading sign, i.e. Base UI can't parse it as a number. */
export function isArithmeticExpression(text: string) {
  return /[*/]|[\d.]\s*[+-]/.test(text);
}

/**
 * Evaluates `+ - * /` with standard precedence, left to right within equal precedence.
 * Returns null for malformed input or non-finite results (division by zero) so callers never show NaN/Infinity.
 */
export function evaluateArithmeticExpression(expression: string): number | null {
  const tokens = tokenize(expression.replaceAll(/\s/g, ''));

  if (!tokens?.length) {
    return null;
  }

  let index = 0;

  const readOperand = () => {
    let sign = 1;

    if (tokens[index] === '+' || tokens[index] === '-') {
      sign = tokens[index] === '-' ? -1 : 1;
      index++;
    }

    const token = tokens[index++];
    return token === undefined || isArithmeticOperator(token) ? Number.NaN : sign * Number(token);
  };

  const readTerm = () => {
    let value = readOperand();

    while (tokens[index] === '*' || tokens[index] === '/') {
      const operator = tokens[index++];
      const operand = readOperand();
      value = operator === '*' ? value * operand : value / operand;
    }

    return value;
  };

  let result = readTerm();

  while (tokens[index] === '+' || tokens[index] === '-') {
    const operator = tokens[index++];
    const operand = readTerm();
    result = operator === '+' ? result + operand : result - operand;
  }

  if (index !== tokens.length || !Number.isFinite(result)) {
    return null;
  }

  // Drop floating point noise such as 0.1 + 0.2 = 0.30000000000000004.
  return Number(result.toPrecision(12));
}

function tokenize(text: string) {
  const tokenPattern = /\d+(?:\.\d*)?|\.\d+|[-+*/]/y;
  const tokens: string[] = [];

  while (tokenPattern.lastIndex < text.length) {
    const match = tokenPattern.exec(text);

    if (!match) {
      return null;
    }

    tokens.push(match[0]);
  }

  return tokens;
}
