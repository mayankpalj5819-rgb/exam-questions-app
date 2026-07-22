// Test the bare LaTeX wrapping
const BARE_LATEX_CMDS = [
  'mathrm', 'text', 'mathbf', 'vec', 'bar', 'hat', 'boldsymbol',
  'frac', 'sqrt', 'cfrac', 'dfrac', 'tfrac',
  'sum', 'int', 'prod', 'lim',
  'sin', 'cos', 'tan', 'cot', 'sec', 'csc',
  'log', 'ln', 'exp', 'lg',
  'alpha', 'beta', 'gamma', 'delta', 'epsilon', 'varepsilon', 'zeta', 'eta',
  'theta', 'vartheta', 'iota', 'kappa', 'lambda', 'mu', 'nu', 'xi',
  'rho', 'sigma', 'tau', 'upsilon', 'phi', 'varphi', 'chi', 'psi', 'omega',
  'Gamma', 'Delta', 'Theta', 'Lambda', 'Xi', 'Pi', 'Sigma', 'Phi', 'Psi', 'Omega',
  'times', 'div', 'pm', 'mp', 'cdot', 'cdots', 'ldots', 'dots',
  'left', 'right',
  'underbrace', 'overbrace', 'overline', 'underline',
  'dot', 'ddot', 'tilde', 'partial', 'nabla', 'infty', 'degree',
  'quad', 'qquad',
  'neq', 'leq', 'geq', 'approx', 'equiv', 'sim', 'simeq', 'propto',
  'angle', 'perp', 'parallel',
  'in', 'notin', 'subset', 'supset', 'subseteq', 'supseteq',
  'cup', 'cap', 'forall', 'exists',
  'rightarrow', 'leftarrow', 'Rightarrow', 'Leftarrow', 'to',
  'gg', 'll', 'hbar',
].join('|');

const bareMathRegex = new RegExp(
  '(' +
  '(?:' +
    '\\\\(?:' + BARE_LATEX_CMDS + ')\\b(?:\\{(?:[^{}]|\\{[^{}]*\\})*\\})*' +
    '|' +
    '\\d+\\.?\\d*' +
    '|' +
    '(?<![a-zA-Z\\x00\\x01])[a-zA-Z](?![a-zA-Z\\x00\\x01])' +
    '|' +
    '[+\\-*/=<>^_.()\\[\\]{},:;!?]' +
    '|' +
    '[ \\t]+' +
  ')+' +
  ')',
  'g'
);

const bareCmdCheck = new RegExp('\\\\(?:' + BARE_LATEX_CMDS + ')\\b');

// Test cases
const tests = [
  'speeds $100 \\mathrm{~km} / \\mathrm{h}$ and $80 \\mathrm{~km} / \\mathrm{h}$',
  'Two cars $A$ and $B$ are moving with speeds $100 \\mathrm{~km} / \\mathrm{h}$',
  'The value of $v$ is ||||||| m',
  'g=10 m/s2',
];

// Protect $...$ first
function protectAndWrap(text: string) {
  const protectedRegions: string[] = [];
  let result = text;
  
  result = result.replace(/\$\$([\s\S]*?)\$\$/g, (_, math: string) => {
    const idx = protectedRegions.length;
    protectedRegions.push('$$' + math + '$$');
    return `\x00P${idx}\x00`;
  });
  
  result = result.replace(/\$([^\$\n]+?)\$/g, (_, math: string) => {
    const idx = protectedRegions.length;
    protectedRegions.push('$' + math + '$');
    return `\x00P${idx}\x00`;
  });
  
  result = result.replace(bareMathRegex, (match) => {
    if (bareCmdCheck.test(match)) {
      const trimmed = match.trim();
      if (trimmed.length > 0) {
        const leadingWs = match.match(/^[ \t]*/)?.[0] ?? '';
        const trailingWs = match.match(/[ \t]*$/)?.[0] ?? '';
        return leadingWs + '$' + trimmed + '$' + trailingWs;
      }
    }
    return match;
  });
  
  for (let i = protectedRegions.length - 1; i >= 0; i--) {
    result = result.replace(`\x00P${i}\x00`, protectedRegions[i]);
  }
  
  return result;
}

for (const t of tests) {
  console.log('---');
  console.log('INPUT:', t);
  console.log('OUTPUT:', protectAndWrap(t));
}
