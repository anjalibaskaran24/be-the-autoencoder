import { useState, useEffect, useRef } from 'react';
import { ROUNDS, SCORING, TOTAL_TIME, STAGES, FEATURES, LETTERS, gradeRound } from './data.js';

const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
const CHEER = ['🌸', '🌼', '🌺', '🍦', '🍨', '🍧', '🪙', '🎉', '✨'];

function beep(on, notes) { // tiny WebAudio sfx, only when sound is enabled
  if (!on) return;
  try {
    const c = new (window.AudioContext || window.webkitAudioContext)();
    notes.forEach((hz, i) => { const o = c.createOscillator(), g = c.createGain(); o.frequency.value = hz; g.gain.value = 0.07;
      o.connect(g); g.connect(c.destination); o.start(c.currentTime + i * 0.12); o.stop(c.currentTime + i * 0.12 + 0.1); });
  } catch { /* audio unavailable: ignore */ }
}

const Grid = ({ g, label }) => (
  <div className="g3" role="img" aria-label={label || '3 by 3 pattern'}>{[...g].map((c, i) => <i key={i} className={c === '1' ? 'on' : ''} />)}</div>
);

function Backdrop() { // animated neural network
  const n = [[10, 20], [10, 50], [10, 80], [40, 30], [40, 70], [70, 20], [70, 50], [70, 80], [92, 50]];
  const l = [[0, 3], [1, 3], [1, 4], [2, 4], [3, 5], [3, 6], [4, 6], [4, 7], [5, 8], [6, 8], [7, 8]];
  return (<svg className="net" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
    {l.map(([a, b], i) => <line key={i} x1={n[a][0]} y1={n[a][1]} x2={n[b][0]} y2={n[b][1]} style={{ animationDelay: `${i * 0.3}s` }} />)}
    {n.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="1.3" style={{ animationDelay: `${i * 0.4}s` }} />)}</svg>);
}

function Pipeline({ onDone, doneLabel }) { // clickable explainer, also used as the tutorial
  const [i, setI] = useState(0); const s = STAGES[i];
  return (<div className="glass">
    <div className="pipe" role="tablist">{STAGES.map((x, k) => (
      <button key={x.id} role="tab" aria-selected={k === i} className={'node' + (k === i ? ' act' : '')} onClick={() => setI(k)}>
        <span>{x.icon}</span><b>{x.name}</b></button>))}</div>
    <div className="explain" key={s.id}>
      <h3>{s.icon} {s.name}</h3><p>{s.text}</p>
      {s.vis === 'tiles' ? <div className="tiles">{['🔺', '⬜', '🔺', '👁️', '🔻', '👁️', '〰️', '👄', '〰️'].map((e, k) => <span key={k}>{e}</span>)}</div>
        : s.vis === 'chips' ? <div className="chips"><span>🔺</span><span>〰️</span><span>🔻</span></div> : <div className="big">{s.vis}</div>}
    </div>
    <div className="row">
      <button className="btn ghost" disabled={i === 0} onClick={() => setI(i - 1)}>Back</button>
      {i < STAGES.length - 1 ? <button className="btn" onClick={() => setI(i + 1)}>Next</button>
        : onDone && <button className="btn pink" onClick={onDone}>{doneLabel}</button>}
    </div></div>);
}

function Modal({ title, onClose, children }) {
  useEffect(() => { const k = (e) => e.key === 'Escape' && onClose(); window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, [onClose]);
  return (<div className="overlay" role="dialog" aria-modal="true" aria-label={title}><div className="modal glass">
    <h2>{title}</h2>{children}<button className="btn ghost" autoFocus onClick={onClose}>Close</button></div></div>);
}

function Home({ onPlay, setModal }) {
  return (<main className="screen">
    <h1 className="title">🌸 BE THE AUTOENCODER! 🍦</h1>
    <p className="tag">Can you compress information and reconstruct it perfectly?</p>
    <p className="sub">Become the Encoder. Master the Latent Space. Transform back into the Decoder!</p>
    <Pipeline />
    <div className="row wrap">
      <button className="btn pink big" onClick={onPlay}>PLAY NOW</button>
      <button className="btn" onClick={() => setModal('how')}>HOW TO PLAY</button>
      <button className="btn" onClick={() => setModal('learn')}>LEARN AUTOENCODERS</button>
    </div>
    <p className="chip">⏱ {fmt(TOTAL_TIME)} total game time</p>
    <div className="cards">{ROUNDS.map((r) => (<div className="glass card" key={r.id}>
      <b>Round {r.id} · {r.level}</b><h3>{r.title}</h3><p>{r.blurb}</p><small>Pass: {r.pass * 100}% · ~{r.time}</small></div>))}</div>
    <p className="note">A simplified simulation — no real neural network is trained here.</p>
  </main>);
}

function Play({ s, d }) {
  const R = ROUNDS[s.ri], ans = s.ans;
  const set = (k, v) => d({ ans: { ...ans, [k]: v } });
  const togglePick = (id) => { const p = ans.pick || []; set('pick', p.includes(id) ? p.filter((x) => x !== id) : p.length < 3 ? [...p, id] : p); };
  return (<main className="screen play">
    <div className="glass card">
      <b>Round {R.id} · {R.level} · pass {R.pass * 100}%</b><h2>{R.title}</h2>
      {R.kind === 'pick' ? (<>
        <p>Original: a cat. Tap the <b>3 tiles</b> that best preserve what makes it a cat.</p>
        <div className="tilegrid">{FEATURES.map((f) => (<button key={f.id} aria-pressed={(ans.pick || []).includes(f.id)}
          className={'tile' + ((ans.pick || []).includes(f.id) ? ' sel' : '')} onClick={() => togglePick(f.id)}><span>{f.e}</span>{f.l}</button>))}</div>
        <div className="latent"><b>💎 Latent space</b>{[0, 1, 2].map((k) => { const f = FEATURES.find((x) => x.id === (ans.pick || [])[k]);
          return <span key={k} className={'slot' + (f ? ' full' : '')}>{f ? f.e : '?'}</span>; })}</div></>) : null}
      {R.orig && (<><p>Input pattern. Rule: each latent value = <b>filled cells in that row</b> (9 cells → 3 numbers).</p>
        <div className="row"><Grid g={R.orig} label="Input pattern" /><span className="big">🗜️ →</span>
          {[0, 1, 2].map((k) => (<button key={k} className="slot full" aria-label={`Latent slot ${k + 1}`}
            onClick={() => d({ ans: { ...ans, lat: Object.assign([null, null, null], ans.lat, { [k]: ((ans.lat?.[k] ?? -1) + 1) % 4 }) } })}>
            {ans.lat?.[k] ?? '?'}</button>))}</div><small>Tap a slot to change its number (0–3).</small></>)}
      {R.qs?.map((q, i) => (<div className="q" key={i}><h3>{q.prompt}</h3>
        <div className="row wrap"><div><small>Input</small><Grid g={q.orig} /></div>{q.type === 'count' && <div><small>Output</small><Grid g={q.shown} /></div>}</div>
        <div className="row wrap">{q.opts.map((o, j) => (<button key={j} aria-pressed={ans[i] === j} className={'opt' + (ans[i] === j ? ' sel' : '')} onClick={() => set(i, j)}>
          {q.type === 'count' ? <span className="num">{o}</span> : <><Grid g={o} label={`Option ${LETTERS[j]}`} /><b>{LETTERS[j]}</b></>}</button>))}</div></div>))}
      {s.err && <p className="err" role="alert">{s.err}</p>}
      <button className="btn pink big" onClick={d.submit}>Submit Answer</button>
    </div></main>);
}

function Feedback({ s, d }) {
  const r = s.res, last = s.ri === 2;
  return (<div className="overlay" role="dialog" aria-modal="true" aria-label="Feedback"><div className="modal glass">
    <h2>{r.passed ? '✅ Round passed!' : '❌ Not quite yet'}</h2>
    <p className="chip">{Math.round(r.pct * 100)}% (need {ROUNDS[s.ri].pass * 100}%) {r.gain > 0 && <span className="coin">+{r.gain} 🪙</span>}</p>
    <ul className="fb">{r.checks.map((c, i) => <li key={i} className={c.ok ? 'ok' : 'no'}><b>{c.ok ? '✔' : '✘'} {c.label}</b><br /><small>{c.detail}</small></li>)}</ul>
    <p className="info">{s.ri === 0 ? 'The Encoder keeps useful patterns in a compact representation.' : s.ri === 1 ? 'Lower reconstruction error = output closer to the original (under this simple mismatch measure).' : 'A bottleneck forces the model to use a limited number of values.'}</p>
    {r.passed ? <button className="btn pink big" autoFocus onClick={d.next}>{last ? 'CONTINUE — claim your trophy' : 'CONTINUE'}</button>
      : s.attempt === 1 && s.time > 10 ? <button className="btn big" autoFocus onClick={d.retry}>RETRY (1 left)</button>
        : <button className="btn big" autoFocus onClick={d.over}>See results</button>}
  </div></div>);
}

function Victory({ score, sound, onAgain, onReview }) {
  const [shown, setShown] = useState(0); const [msg, setMsg] = useState('');
  const rain = useRef(Array.from({ length: 36 }, (_, i) => ({ e: CHEER[i % CHEER.length], x: (i * 29) % 100, t: 3 + (i % 5), dl: (i % 9) * 0.4 }))).current;
  useEffect(() => { beep(sound, [523, 659, 784, 1047]);
    const step = Math.max(1, Math.ceil(score / 60)); const id = setInterval(() => setShown((v) => { if (v + step >= score) { clearInterval(id); return score; } return v + step; }), 30);
    return () => clearInterval(id); }, [score, sound]);
  const share = async () => { const text = `🏆 I became the AUTOENCODER CHAMPION with ${score} points! Can you beat me? ${location.href}`;
    try { if (navigator.share) await navigator.share({ title: 'Be the Autoencoder!', text }); else { await navigator.clipboard.writeText(text); setMsg('Score copied to clipboard!'); } }
    catch { setMsg('Sharing cancelled or unavailable.'); } };
  return (<main className="screen victory">
    <div className="rain" aria-hidden="true">{rain.map((p, i) => <span key={i} style={{ left: p.x + '%', animationDuration: p.t + 's', animationDelay: p.dl + 's' }}>{p.e}</span>)}</div>
    <div className="glass winner"><span className="ice i1">🍦</span><span className="ice i2">🍨</span><span className="ice i3">🍧</span>
      <div className="trophy">🏆</div><h1 className="title">AUTOENCODER CHAMPION!</h1>
      <p className="banner">YOU ARE THE AUTOENCODER CHAMPION!</p>
      <p>You compressed the information, mastered the latent space, and reconstructed the input!</p>
      <div className="score">{shown} 🪙</div><p>{ROUNDS.map((r) => `✅ Round ${r.id}`).join('  ')}</p>
      <div className="row wrap"><button className="btn pink" onClick={onAgain}>PLAY AGAIN</button><button className="btn" onClick={onReview}>REVIEW WHAT I LEARNED</button>
        <button className="btn" onClick={share}>SHARE MY SCORE</button></div><p role="status">{msg}</p></div></main>);
}

export default function App() {
  const init = { screen: 'home', ri: 0, attempt: 1, ans: {}, phase: 'play', res: null, score: 0, correct: 0, time: TOTAL_TIME, err: '' };
  const [s, setS] = useState(init); const [modal, setModal] = useState(null);
  const [sound, setSound] = useState(false); const [calm, setCalm] = useState(false);
  const awarded = useRef(new Set()); const locked = useRef(false);
  const d = (p) => setS((o) => ({ ...o, err: '', ...p }));

  // Global countdown: runs only while a round is being played (paused on feedback).
  useEffect(() => {
    if (s.screen !== 'play' || s.phase !== 'play') return;
    const id = setInterval(() => setS((o) => o.time <= 1 ? { ...o, time: 0, screen: 'over' } : { ...o, time: o.time - 1 }), 1000);
    return () => clearInterval(id);
  }, [s.screen, s.phase]);

  const reset = (screen) => { awarded.current = new Set(); locked.current = false; setS({ ...init, screen }); };
  d.submit = () => {
    if (locked.current || s.phase !== 'play') return; // blocks double-clicks / duplicate scoring
    const g = gradeRound(ROUNDS[s.ri], s.ans);
    if (!g.complete) return d({ err: 'Finish every selection before submitting.' });
    locked.current = true;
    let gain = 0, right = 0;
    g.checks.forEach((c, i) => { const k = `${s.ri}-${i}`; if (c.ok && !awarded.current.has(k)) { awarded.current.add(k); right++; gain += SCORING.correct + (s.attempt === 1 ? SCORING.first : 0); } });
    const pct = g.checks.filter((c) => c.ok).length / g.checks.length, passed = pct >= ROUNDS[s.ri].pass - 1e-9;
    if (passed && !awarded.current.has('r' + s.ri)) { awarded.current.add('r' + s.ri); gain += SCORING.round + (s.ri === 2 ? SCORING.champion : 0); }
    beep(sound, passed ? [660, 880] : [220]);
    d({ phase: 'feedback', res: { ...g, pct, passed, gain }, score: s.score + gain, correct: s.correct + right });
  };
  d.next = () => { locked.current = false; s.ri === 2 ? d({ screen: 'victory' }) : d({ ri: s.ri + 1, attempt: 1, ans: {}, phase: 'play', res: null }); };
  d.retry = () => { locked.current = false; d({ attempt: 2, ans: {}, phase: 'play', res: null }); };
  d.over = () => d({ screen: 'over' });
  const restart = () => { if (s.screen !== 'play' || window.confirm('Restart the game? Your progress will be lost.')) reset('tutorial'); };
  const fullscreen = () => { try { document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen(); } catch { /* unsupported */ } };

  return (<div className={'app' + (calm ? ' calm' : '')}><Backdrop />
    <div className="tools"><button className="btn mini" aria-pressed={sound} onClick={() => setSound(!sound)}>{sound ? '🔊 Sound on' : '🔇 Sound off'}</button>
      <button className="btn mini" aria-pressed={calm} onClick={() => setCalm(!calm)}>{calm ? '🧘 Calm motion' : '✨ Full motion'}</button>
      {document.fullscreenEnabled && <button className="btn mini" onClick={fullscreen}>⛶ Fullscreen</button>}</div>
    {s.screen === 'home' && <Home onPlay={() => reset('tutorial')} setModal={setModal} />}
    {s.screen === 'tutorial' && <main className="screen"><h2 className="title">Quick lesson</h2><Pipeline onDone={() => d({ screen: 'play', time: TOTAL_TIME })} doneLabel="START ROUND 1" /></main>}
    {s.screen === 'play' && (<>
      <header className="glass hud"><div className="prog">{ROUNDS.map((r, i) => <span key={r.id} className={i < s.ri || (i === s.ri && s.res?.passed) ? 'done' : i === s.ri ? 'cur' : 'lock'}>{i > s.ri ? '🔒' : i < s.ri ? '✅' : '▶'} R{r.id}</span>)}</div>
        <span>⭐ {s.score}</span><span>✔ {s.correct}</span><span>Try {s.attempt}/2</span><span className={s.time <= 20 ? 'warn' : ''}>⏱ {fmt(s.time)}</span>
        <button className="btn mini" onClick={restart}>Restart</button></header>
      <Play s={s} d={d} />{s.phase === 'feedback' && <Feedback s={s} d={d} />}</>)}
    {s.screen === 'over' && <main className="screen"><div className="glass winner"><h1 className="title">{s.time === 0 ? "⏰ Time's up!" : 'Game over'}</h1>
      <div className="score">{s.score} 🪙</div><p>Every Autoencoder needs practice before it reconstructs perfectly.</p><button className="btn pink big" onClick={() => reset('tutorial')}>PLAY AGAIN</button></div></main>}
    {s.screen === 'victory' && <Victory score={s.score} sound={sound} onAgain={() => reset('tutorial')} onReview={() => setModal('learn')} />}
    {modal === 'learn' && <Modal title="Learn Autoencoders" onClose={() => setModal(null)}><Pipeline /></Modal>}
    {modal === 'how' && <Modal title="How to play" onClose={() => setModal(null)}><ol className="how">
      <li>Learn input, encoder, latent space and decoder.</li><li>Complete the easy challenge (pass 60%).</li><li>Pass the medium challenge (70%).</li>
      <li>Solve the hard reconstruction challenge (80%).</li><li>Collect points and become the champion!</li></ol>
      <p>Each failed round gets <b>one retry</b> if time remains. The 3-minute clock pauses while you read feedback.</p></Modal>}
  </div>);
}
