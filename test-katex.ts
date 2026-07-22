import katex from 'katex';

const tests = [
  '100 \\mathrm{~km} / \\mathrm{h}',
  '100 \\mathrm{km} / \\mathrm{h}',
  'v = 100 \\text{km/h}',
  '\\mathrm{m/s}',
  '\\frac{1}{2}mv^2',
  'x(t) = 4t^3 - 3t',
  '\\left( \\frac{1}{2} \\right)',
];

for (const t of tests) {
  try {
    const result = katex.renderToString(t, {
      displayMode: false,
      throwOnError: true,
      strict: false,
      trust: true,
    });
    console.log('OK:', t.substring(0, 40), '→', result.substring(0, 80));
  } catch (e: any) {
    console.log('FAIL:', t.substring(0, 40), '→', e.message);
  }
}
