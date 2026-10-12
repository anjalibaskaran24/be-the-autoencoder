// ---- Game data, answer keys and scoring rules (no UI here) ----
export const TOTAL_TIME = 180;
export const SCORING = { correct: 100, first: 25, round: 100, champion: 300 };
export const LETTERS = ['A', 'B', 'C', 'D'];

export const STAGES = [
  { id: 'input', icon: '🐱', name: 'Input', vis: 'tiles', text: 'The original image contains all its information.' },
  { id: 'encoder', icon: '🗜️', name: 'Encoder', vis: '9 values → 3 values', text: 'The Encoder learns important patterns and compresses the input.' },
  { id: 'latent', icon: '💎', name: 'Latent Space', vis: 'chips', text: 'A smaller representation that keeps the important information.' },
  { id: 'decoder', icon: '🪄', name: 'Decoder', vis: '3 values → 9 values', text: 'The Decoder uses the compressed representation to rebuild the input.' },
  { id: 'output', icon: '🖼️', name: 'Reconstruction', vis: 'tiles', text: 'The reconstructed image is compared with the original.' },
  { id: 'loss', icon: '📏', name: 'Loss', vis: '|original − output|', text: 'The difference between original and output is the reconstruction error (loss).' },
];

// Round 1: nine cat tiles; the three that best identify a cat are the answer key.
export const FEATURES = [
  { id: 'ears', e: '🔺', l: 'Pointy ears' }, { id: 'floor', e: '🟫', l: 'Floor' }, { id: 'whiskers', e: '〰️', l: 'Whiskers' },
  { id: 'sky', e: '☁️', l: 'Sky' }, { id: 'nose', e: '🔻', l: 'Nose' }, { id: 'shadow', e: '🌑', l: 'Shadow' },
  { id: 'collar', e: '🎀', l: 'Collar' }, { id: 'wall', e: '⬜', l: 'Wall' }, { id: 'rug', e: '🧶', l: 'Rug' },
];
export const FEATURE_KEY = ['ears', 'whiskers', 'nose'];

export const mismatch = (a, b) => [...a].filter((c, i) => c !== b[i]).length;
// Simple latent rule for Round 3: filled cells per row (9 cells → 3 numbers)
export const latentOf = (g) => [0, 3, 6].map((i) => [...g.slice(i, i + 3)].filter((c) => c === '1').length);

export const ROUNDS = [
  { id: 1, kind: 'pick', title: 'THE ENCODER CHALLENGE', level: 'Easy', pass: 0.6, time: '40s',
    blurb: 'Pick the 3 tiles to keep in the latent space.' },
  { id: 2, kind: 'quiz', title: 'LATENT SPACE MASTER', level: 'Medium', pass: 0.7, time: '45s',
    blurb: 'Decode, compare, and count reconstruction error.',
    qs: [
      { type: 'closest', orig: '111101111', opts: ['111111111', '100101111', '111101111', '110101011'], prompt: 'Which reconstruction matches the input?', why: 'The Decoder aims for an output identical to the input.' },
      { type: 'closest', orig: '010111010', opts: ['111111010', '010111111', '000111000', '010101010'], prompt: 'Which reconstruction has the LOWEST error?', why: 'Fewer mismatched cells means lower error in this simplified example.' },
      { type: 'count', orig: '110011001', shown: '100011101', opts: [1, 2, 3, 4], prompt: 'How many cells differ between input and output?', why: 'Reconstruction error here = number of mismatched cells.' },
      { type: 'farthest', orig: '101010101', opts: ['101010111', '111010101', '010101010', '101010101'], prompt: 'Which reconstruction has the HIGHEST error?', why: 'A worse reconstruction has more mismatched cells.' },
    ] },
  { id: 3, kind: 'quiz', title: 'AUTOENCODER CHAMPION', level: 'Hard', pass: 0.8, time: '55s',
    blurb: 'Run the full pipeline: encode, decode, compare.',
    orig: '101111010', // latent rule: filled cells per row → [2,3,1]
    qs: [
      { type: 'closest', orig: '101111010', opts: ['111101010', '101111010', '001110110', '101111011'], prompt: 'Decoder: pick the output that rebuilds the input from your latent vector.', why: 'The latent vector (2,3,1) is enough to rebuild this pattern.' },
      { type: 'closest', orig: '101111010', opts: ['101111011', '111101010', '001110110', '011111110'], prompt: 'No perfect output here. Pick the LOWEST error.', why: 'Compare each output cell by cell with the input.' },
    ] },
];

export const answerIndex = (q) => {
  if (q.type === 'count') return q.opts.indexOf(mismatch(q.orig, q.shown));
  const errs = q.opts.map((o) => mismatch(q.orig, o));
  return errs.indexOf(q.type === 'farthest' ? Math.max(...errs) : Math.min(...errs));
};

// Returns {complete, checks:[{ok,label,detail}]} for one round's answers.
export const gradeRound = (round, ans) => {
  if (round.kind === 'pick') {
    const pick = ans.pick || [];
    return { complete: pick.length === 3, checks: FEATURE_KEY.map((id) => {
      const f = FEATURES.find((x) => x.id === id);
      return { ok: pick.includes(id), label: `${f.e} ${f.l}`, detail: 'Cat-defining feature — the Encoder keeps it.' };
    }) };
  }
  const checks = []; let complete = true;
  if (round.orig) {
    const want = latentOf(round.orig);
    want.forEach((w, k) => {
      if (ans.lat?.[k] == null) complete = false;
      checks.push({ ok: ans.lat?.[k] === w, label: `Latent slot ${k + 1}`, detail: `Row ${k + 1} has ${w} filled cells → latent value ${w}.` });
    });
  }
  round.qs.forEach((q, i) => {
    if (ans[i] == null) complete = false;
    const ai = answerIndex(q);
    const errs = q.type === 'count' ? '' : ` Errors: ${q.opts.map((o, j) => `${LETTERS[j]}=${mismatch(q.orig, o)}`).join(', ')}.`;
    checks.push({ ok: ans[i] === ai, label: q.prompt, detail: `Answer: ${q.type === 'count' ? q.opts[ai] : LETTERS[ai]}.${errs} ${q.why}` });
  });
  return { complete, checks };
};
