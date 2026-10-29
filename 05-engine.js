/* =====================================================================
   LeeOn — 05 MOTOR DE ACTIVIDADES (ActivityEngine)
   Un solo motor recibe una actividad (datos) y dibuja el tipo correcto.
   Para agregar una actividad NO se toca este archivo: solo 02-data.js.
   Contrato con el "ctx" que entrega la página de actividad:
     ctx.say(t)          voz por botón (siempre suena)
     ctx.sayAuto(t)      voz de refuerzo (respeta "Sonidos")
     ctx.correct(msg,{final})  respuesta correcta (final:true cierra la actividad)
     ctx.incorrect()     respuesta a revisar (suma intento/error, sin mensajes negativos)
     ctx.info(msg,mood)  mensaje amable que no cuenta como error
     ctx.setRetry(fn)    acción del botón "Intentar nuevamente"
     ctx.setAssist(fn)   ayuda extra a partir de la 2.ª pista
   ===================================================================== */

/* ---------- Arrastrar o tocar (misma acción con dedo, ratón o teclado) ---------- */
function enableDrag(el, o) {
  el.addEventListener('pointerdown', e => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const sx = e.clientX, sy = e.clientY, pid = e.pointerId;
    let dragging = false, ghost = null;
    const under = ev => { const t = document.elementFromPoint(ev.clientX, ev.clientY); return t ? t.closest(o.dropSel) : null; };
    const cleanup = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', end); window.removeEventListener('pointercancel', cancel); $$('.over').forEach(x => x.classList.remove('over')); };
    const move = ev => {
      if (ev.pointerId !== pid) return;
      if (!dragging && Math.hypot(ev.clientX - sx, ev.clientY - sy) > 10) {
        dragging = true; ghost = el.cloneNode(true); ghost.removeAttribute('id'); ghost.classList.add('ghost'); ghost.style.width = el.offsetWidth + 'px';
        document.body.appendChild(ghost); el.classList.add('dragging');
      }
      if (dragging) {
        ghost.style.left = ev.clientX + 'px'; ghost.style.top = ev.clientY + 'px';
        $$('.over').forEach(x => x.classList.remove('over'));
        const t = under(ev); if (t) t.classList.add('over');
      }
    };
    const end = ev => {
      if (ev.pointerId !== pid) return;
      cleanup();
      if (!dragging) { o.onTap(el); return; }
      const t = under(ev);
      if (ghost) ghost.remove();
      el.classList.remove('dragging');
      if (t) o.onDrop(el, t);
    };
    const cancel = () => { cleanup(); if (ghost) ghost.remove(); el.classList.remove('dragging'); };
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', end); window.addEventListener('pointercancel', cancel);
  });
  el.addEventListener('click', e => { if (e.detail === 0) o.onTap(el); });   // Enter / espacio del teclado
}
const wireSay = (host, text, ctx) => $$('[data-say]', host).forEach(b => b.addEventListener('click', () => ctx.say(text)));
const shakeEl = el => { if (el && motionOK()) { el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); } };
const tileSpeak = t => t.speak || (t.label.length === 1 && LETTER_NAME[t.label] ? LETTER_NAME[t.label] : t.label.toLowerCase());

/* ---------- Elección (multiple-choice · image-choice · fill-blank) ---------- */
function choiceCore(host, c, ctx, o) {
  o = o || {};
  const p = c.prompt || {};
  const opts = shuffle(c.options.slice());
  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:1.2rem;width:100%';
  let h = '';
  if (p.emoji) h += `<div class="p-emoji" aria-hidden="true">${p.emoji}</div>`;
  if (p.frame) h += `<div class="frame" role="img" aria-label="Palabra con un espacio vacío">${p.frame[0] ? `<span>${esc(p.frame[0])}</span>` : ''}<span class="blank" data-blank>&nbsp;</span>${p.frame[1] ? `<span>${esc(p.frame[1])}</span>` : ''}</div>`;
  if (p.word) h += `<div class="p-word">${esc(p.word)}</div>`;
  if (p.listen) h += `<button type="button" class="btn btn-soft" data-say>🔊 Escuchar</button>`;
  h += `<div class="opts">` + opts.map((op, i) => {
    const showLabel = c.labels !== false || !op.emoji;
    return `<button type="button" class="opt" data-i="${i}" aria-label="${esc(op.label || 'opción ' + (i + 1))}">${op.emoji ? `<span class="o-emoji" aria-hidden="true">${op.emoji}</span>` : ''}${showLabel && op.label ? `<span class="o-label">${esc(op.label)}</span>` : ''}</button>`;
  }).join('') + `</div>`;
  wrap.innerHTML = h;
  host.appendChild(wrap);
  if (p.listen) wireSay(wrap, p.listen, ctx);
  let done = false;
  const btns = $$('.opt', wrap);
  btns.forEach((b, i) => b.addEventListener('click', () => {
    if (done || b.classList.contains('tried')) return;
    const op = opts[i];
    if (op.speak) ctx.say(op.speak);
    if (op.correct) {
      done = true; b.classList.add('right');
      btns.forEach(x => { if (x !== b) x.classList.add('faded'); x.setAttribute('aria-disabled', 'true'); });
      const bl = $('[data-blank]', wrap); if (bl) { bl.textContent = op.label; bl.classList.add('filled'); }
      ctx.correct(o.msg, { final: o.final !== false });
      if (c.result && o.final !== false) setTimeout(() => ctx.sayAuto(c.result), 500);
      if (o.onSolved) o.onSolved();
    } else {
      b.classList.add('tried'); b.setAttribute('aria-disabled', 'true'); shakeEl(b);
      ctx.incorrect();
    }
  }));
  ctx.setRetry(() => { btns.forEach(b => { b.classList.remove('tried', 'assist'); b.removeAttribute('aria-disabled'); }); });
  ctx.setAssist(() => {   // 2.ª pista: se atenúa una opción que no es correcta
    const wrong = btns.filter((b, i) => !opts[i].correct && !b.classList.contains('tried'));
    if (wrong.length > 0 && btns.filter(b => !b.classList.contains('tried') && !b.classList.contains('faded')).length > 2) { wrong[0].classList.add('faded'); }
    else { const r = btns.find((b, i) => opts[i].correct); if (r) r.classList.add('assist'); }
  });
}
function renderChoice(a, host, ctx) { choiceCore(host, a.content, ctx, { final: true }); }

/* ---------- Unir (matching) ---------- */
function renderMatching(a, host, ctx) {
  const pairs = a.content.pairs;
  const L = pairs.map((p, i) => ({ i, it: p.a }));
  const R = shuffleNot(pairs.map((p, i) => ({ i, it: p.b })), x => x.i);
  const item = (side, x) => `<button type="button" class="mi" data-side="${side}" data-i="${x.i}" aria-pressed="false" aria-label="${esc(x.it.label || x.it.speak || 'imagen')}">${x.it.emoji ? `<span class="e" aria-hidden="true">${x.it.emoji}</span>` : ''}${x.it.label ? `<span>${esc(x.it.label)}</span>` : ''}</button>`;
  host.innerHTML = `<div class="match"><div class="col">${L.map(x => item('L', x)).join('')}</div><div class="col">${R.map(x => item('R', x)).join('')}</div></div>`;
  let sel = null, matched = 0;
  const all = $$('.mi', host);
  all.forEach(b => b.addEventListener('click', () => {
    if (b.classList.contains('done')) return;
    const side = b.dataset.side, i = +b.dataset.i;
    const it = (side === 'L' ? pairs[i].a : pairs[i].b);
    if (it.speak) ctx.say(it.speak);
    if (sel && sel.el === b) { b.setAttribute('aria-pressed', 'false'); sel = null; return; }
    if (sel && sel.side !== side) {
      const prev = sel; sel = null; prev.el.setAttribute('aria-pressed', 'false');
      if (prev.i === i) {
        matched++;
        [prev.el, b].forEach(x => { x.classList.add('done'); x.setAttribute('aria-disabled', 'true'); x.classList.remove('assist'); x.insertAdjacentHTML('afterbegin', `<span class="num">✓ ${matched}</span>`); });
        ctx.correct(matched < pairs.length ? '¡Muy bien! Sigue con otra pareja.' : null, { final: matched === pairs.length });
      } else { shakeEl(prev.el); shakeEl(b); ctx.incorrect(); }
      return;
    }
    if (sel) sel.el.setAttribute('aria-pressed', 'false');
    b.setAttribute('aria-pressed', 'true'); sel = { side, i, el: b };
  }));
  ctx.setRetry(() => { if (sel) { sel.el.setAttribute('aria-pressed', 'false'); sel = null; } });
  ctx.setAssist(() => {
    const idx = pairs.findIndex((p, i) => !$('.mi[data-side="L"][data-i="' + i + '"]', host).classList.contains('done'));
    if (idx >= 0) $$('.mi[data-i="' + idx + '"]', host).forEach(x => x.classList.add('assist'));
  });
}

/* ---------- Clasificar (drag-drop) ---------- */
function renderSort(a, host, ctx) {
  const c = a.content;
  let bank = shuffle(c.items.slice()), selected = null;
  host.innerHTML = `<div class="buckets">${c.buckets.map(b => `<div class="bucket" data-drop="${b.id}" role="button" tabindex="0" aria-label="Caja del sonido ${esc(b.label)}"><div class="bl">${esc(b.label)}</div><div class="chips" data-in="${b.id}"></div></div>`).join('')}</div><p class="muted small" style="margin:0">Arrastra la imagen, o tócala y luego toca la caja.</p><div class="tiles" data-bank></div>`;
  const bankEl = $('[data-bank]', host);
  const place = (id, bid) => {
    const it = c.items.find(x => x.id === id); if (!it) return;
    selected = null;
    if (it.bucket === bid) {
      bank = bank.filter(x => x.id !== id);
      $('[data-in="' + bid + '"]', host).insertAdjacentHTML('beforeend', `<span class="chip">${it.emoji} ${esc(it.label)}</span>`);
      drawBank(); ctx.correct(bank.length ? '¡Muy bien! Sigue con otra imagen.' : null, { final: bank.length === 0 });
    } else { drawBank(); shakeEl($('.tile', bankEl)); ctx.incorrect(); }
  };
  function drawBank() {
    bankEl.innerHTML = bank.map(it => `<button type="button" class="tile${selected === it.id ? ' sel' : ''}" data-id="${it.id}" aria-label="${esc(it.label)}"><span class="te" aria-hidden="true">${it.emoji}</span><span class="tl">${esc(it.label)}</span></button>`).join('');
    $$('.tile', bankEl).forEach(t => enableDrag(t, {
      dropSel: '.bucket',
      onTap: el => { selected = selected === el.dataset.id ? null : el.dataset.id; const it = c.items.find(x => x.id === el.dataset.id); if (it) ctx.say(it.label.toLowerCase()); drawBank(); },
      onDrop: (el, target) => place(el.dataset.id, target.dataset.drop)
    }));
  }
  $$('.bucket', host).forEach(b => {
    const go = () => { if (selected) place(selected, b.dataset.drop); else { const bk = c.buckets.find(x => x.id === b.dataset.drop); if (bk && bk.speak) ctx.say(bk.speak); } };
    b.addEventListener('click', go);
    b.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
  });
  drawBank();
  ctx.setRetry(() => { selected = null; drawBank(); });
  ctx.setAssist(() => { if (bank.length) { const it = bank[0]; selected = it.id; drawBank(); const bk = $('.bucket[data-drop="' + it.bucket + '"]', host); if (bk) bk.classList.add('over'); } });
}

/* ---------- Armar (letras · sílabas · palabras · frases) ---------- */
/* o = { answer:[tok], pool:[tok], words:bool, equation:bool, result:'CASA', prompt, onSolved } */
function builderCore(host, o, ctx) {
  host.insertAdjacentHTML('beforeend', `<div class="slots${o.words ? ' words' : ''}" data-slots></div><div class="result-line" data-res aria-live="polite"></div><div class="tiles${o.words ? ' words' : ''}" data-tiles></div><p class="muted small" style="margin:0">Arrastra las piezas, o tócalas para ponerlas en orden.</p>`);
  const slotsEl = $('[data-slots]', host), tilesEl = $('[data-tiles]', host), resEl = $('[data-res]', host);
  let slots = o.answer.map(() => null), locked = false, checking = false;
  const tiles = shuffleNot(o.pool.map(t => Object.assign({}, t, { u: uid('t') })), t => t.k);
  const inner = t => `${t.emoji ? `<span class="te" aria-hidden="true">${t.emoji}</span>` : ''}<span class="${t.emoji ? 'tl' : ''}">${esc(t.label)}</span>`;
  function draw() {
    slotsEl.innerHTML = slots.map((t, i) => `<button type="button" class="slot${t ? ' filled' : ''}${locked ? ' good' : ''}${checking ? ' check' : ''}" data-slot="${i}" aria-label="${t ? 'Espacio ' + (i + 1) + ': ' + esc(t.label) + '. Toca para quitar' : 'Espacio ' + (i + 1) + ' vacío'}">${t ? inner(t) : ''}</button>`).join('');
    tilesEl.innerHTML = tiles.filter(t => slots.indexOf(t) < 0).map(t => `<button type="button" class="tile" data-u="${t.u}" aria-label="${esc(t.label)}">${inner(t)}</button>`).join('');
    $$('.tile', tilesEl).forEach(el => enableDrag(el, { dropSel: '.slot', onTap: e => put(e.dataset.u), onDrop: (e, t) => put(e.dataset.u, +t.dataset.slot) }));
    $$('.slot', slotsEl).forEach(s => s.addEventListener('click', () => {
      if (locked) return; const i = +s.dataset.slot;
      if (slots[i]) { slots[i] = null; checking = false; draw(); }
    }));
  }
  function put(u, idx) {
    if (locked) return;
    const t = tiles.find(x => x.u === u); if (!t) return;
    const i = idx != null ? idx : slots.indexOf(null); if (i < 0) return;
    slots[i] = t; checking = false;
    ctx.say(tileSpeak(t));
    draw();
    if (slots.every(Boolean)) check();
  }
  function check() {
    const ok = slots.every((t, i) => t.k === o.answer[i].k);
    if (ok) {
      locked = true; draw();
      resEl.textContent = o.equation ? o.answer.map(t => t.label).join(' + ') + ' = ' + o.result : o.result;
      ctx.correct(null, { final: true });
      setTimeout(() => ctx.sayAuto(o.spoken || o.result), 500);
      if (o.onSolved) o.onSolved();
    } else { checking = true; draw(); shakeEl(slotsEl); ctx.incorrect(); }
  }
  ctx.setRetry(() => { if (locked) return; slots = o.answer.map(() => null); checking = false; draw(); });
  ctx.setAssist(() => {   // 2.ª pista: se coloca la primera pieza que falta
    if (locked) return;
    const i = o.answer.findIndex((a, n) => !slots[n] || slots[n].k !== a.k); if (i < 0) return;
    const t = tiles.find(x => x.k === o.answer[i].k && !(slots.indexOf(x) >= 0 && slots.indexOf(x) < o.answer.length && slots[slots.indexOf(x)].k === o.answer[slots.indexOf(x)].k));
    if (!t) return;
    const j = slots.indexOf(t); if (j >= 0) slots[j] = null;
    slots[i] = t; checking = false; draw();
    if (slots.every(Boolean)) check();
  });
  draw();
}
function renderBuilder(a, host, ctx) {
  const c = a.content, p = c.prompt || {};
  const answer = c.answer.map(k => tok(k));
  const pool = answer.concat((c.distractors || []).map(k => tok(k)));
  host.innerHTML = `${p.emoji ? `<div class="p-emoji" aria-hidden="true">${p.emoji}</div>` : ''}<button type="button" class="btn btn-soft" data-say>🔊 Escuchar</button>`;
  wireSay(host, p.listen || c.result, ctx);
  builderCore(host, { answer, pool, words: c.joiner === ' ', equation: c.equation, result: c.result, spoken: p.listen && c.joiner === ' ' ? p.listen : c.result }, ctx);
}

/* ---------- Comprensión lectora ---------- */
function renderComprehension(a, host, ctx) {
  const c = a.content, n = c.questions.length;
  let qi = 0;
  host.innerHTML = `<div class="p-emoji" aria-hidden="true">${c.emoji}</div><div class="textcard">${c.sentences.map(s => `<span class="sent">${esc(s)}</span>`).join('')}</div><button type="button" class="btn btn-soft" data-say>🔊 Escuchar el texto</button><div class="qbox" data-q></div>`;
  wireSay(host, c.sentences.join(' '), ctx);
  const qbox = $('[data-q]', host);
  function show() {
    const q = c.questions[qi];
    qbox.innerHTML = `<div class="qcount">Pregunta ${qi + 1} de ${n}</div><h3>${esc(q.q)}</h3><button type="button" class="btn btn-soft btn-sm" data-sayq>🔊 Escuchar pregunta</button><div data-qopts style="width:100%"></div>`;
    $('[data-sayq]', qbox).addEventListener('click', () => ctx.say(q.q));
    const last = qi === n - 1;
    choiceCore($('[data-qopts]', qbox), { prompt: {}, options: q.options, result: '' }, ctx, {
      final: last, msg: last ? null : '¡Muy bien! Vamos con la siguiente pregunta.',
      onSolved: () => { if (!last) setTimeout(() => { qi++; show(); }, 1200); }
    });
  }
  show();
}

/* ---------- Escritura guiada (varias formas de escribir) ---------- */
function renderWrite(a, host, ctx) {
  const c = a.content, modes = c.modes || ['keyboard'];
  const LABEL = { keyboard: '⌨️ Escribir', letters: '🔤 Con letras', words: '🧩 Con palabras', pictos: '🖼️ Con imágenes', complete: '✏️ Completar' };
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  host.innerHTML = `${c.emoji ? `<div class="p-emoji" aria-hidden="true">${c.emoji}</div>` : ''}${c.showModel ? `<div class="model" aria-label="Modelo">${esc(c.model)}</div>` : ''}<button type="button" class="btn btn-soft" data-say>🔊 Escuchar</button><div class="modes" data-modes role="group" aria-label="Elige cómo escribir">${modes.map(m => `<button type="button" class="btn" data-m="${m}" aria-pressed="false">${LABEL[m]}</button>`).join('')}</div><div data-body style="width:100%;display:flex;flex-direction:column;align-items:center;gap:1.2rem"></div>`;
  wireSay(host, c.showModel ? c.model.toLowerCase() : (c.model || '').toLowerCase(), ctx);
  const body = $('[data-body]', host), modeBtns = $$('[data-m]', host);
  const acceptSet = (c.accept || []).map(norm);
  const isRight = v => {
    v = norm(v); if (!v) return false;
    if (acceptSet.indexOf(v) >= 0) return true;
    return !!(c.contains && c.contains.every(w => v.indexOf(w) >= 0) && v.split(' ').length >= (c.minWords || 1));
  };
  const lock = () => modeBtns.forEach(b => { b.disabled = true; });
  const wrapFinal = ctx2 => Object.assign({}, ctx2, { correct: (m, o) => { lock(); ctx2.correct(m, o); } });
  const M = {
    keyboard() {
      body.innerHTML = `<input class="write-in" type="text" data-wi autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Escribe aquí" placeholder="Escribe aquí"><div class="row center"><button type="button" class="btn btn-green" data-check>✔ Comprobar</button>${SR ? '<button type="button" class="btn btn-soft" data-mic>🎤 Decir</button>' : ''}</div>`;
      const wi = $('[data-wi]', body); let k = 0;
      const go = () => {
        if (!wi.value.trim()) { ctx.info('Escribe algo y toca Comprobar.', 'encouraging'); return; }
        if (isRight(wi.value)) { wi.disabled = true; lock(); ctx.correct(null, { final: true }); ctx.sayAuto(wi.value); }
        else ctx.incorrect();
      };
      $('[data-check]', body).addEventListener('click', go);
      wi.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
      const mic = $('[data-mic]', body);
      if (mic) mic.addEventListener('click', () => {
        try { const r = new SR(); r.lang = 'es-ES'; r.onresult = e => { wi.value = e.results[0][0].transcript; }; r.onerror = () => ctx.info('No pude escuchar. Puedes escribir con el teclado.', 'encouraging'); r.start(); }
        catch (e) { ctx.info('El dictado no está disponible aquí. Puedes escribir con el teclado.', 'encouraging'); }
      });
      ctx.setRetry(() => { wi.focus(); });
      ctx.setAssist(() => { k = Math.min(c.model.length, k + 1); wi.value = c.model.slice(0, k).toLowerCase(); wi.focus(); });
    },
    letters() {
      const chars = c.model.replace(/ /g, '').split('');
      builderCore(body, { answer: chars.map(x => tok(x)), pool: chars.concat(c.distractors || []).map(x => tok(x)), result: c.model }, wrapFinal(ctx));
    },
    words() {
      const ws = c.model.split(' ');
      builderCore(body, { answer: ws.map(x => tok(x)), pool: ws.concat(c.wordBank || c.distractors || []).map(x => tok(x)), words: true, result: c.model + (ws.length > 1 ? '.' : ''), spoken: c.model.toLowerCase() }, wrapFinal(ctx));
    },
    pictos() {
      const pc = c.pictos;
      const byK = {}; pc.options.forEach(o => { byK[o.k] = o; });
      builderCore(body, { answer: pc.answer.map(k => tok(k, { emoji: byK[k].emoji, label: byK[k].label })), pool: pc.options.map(o => tok(o.k, { emoji: o.emoji, label: o.label })), words: true, result: c.model, spoken: c.model.toLowerCase() }, wrapFinal(ctx));
    },
    complete() {
      const f = c.frame;
      choiceCore(body, { prompt: { emoji: '', frame: [f.before, f.after] }, options: f.options, result: c.model }, wrapFinal(ctx), { final: true });
    }
  };
  function setMode(m) {
    modeBtns.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.m === m)));
    body.innerHTML = ''; ctx.setRetry(null); ctx.setAssist(null);
    M[m]();
  }
  modeBtns.forEach(b => b.addEventListener('click', () => setMode(b.dataset.m)));
  setMode(modes[0]);
}

/* ---------- Trazo de letras (canvas) ---------- */
function renderTracing(a, host, ctx) {
  const c = a.content;
  host.innerHTML = `<div class="modes" data-modes role="group" aria-label="Elige cómo hacerlo"><button type="button" class="btn" data-m="trace" aria-pressed="true">✏️ Trazar</button><button type="button" class="btn" data-m="pick" aria-pressed="false">🔤 Elegir la letra</button></div><div data-body style="width:100%;display:flex;flex-direction:column;align-items:center;gap:1rem"></div>`;
  const body = $('[data-body]', host), mb = $$('[data-m]', host);
  function pickMode() {
    body.innerHTML = '';
    choiceCore(body, { prompt: { emoji: '🔊', listen: 'La letra ' + c.name }, options: c.pool.map(L => oLetter(L, L === c.letter)), result: c.name }, ctx, { final: true });
  }
  function traceMode() {
    body.innerHTML = `<button type="button" class="btn btn-soft" data-say>🔊 Escuchar</button><div class="trace-box" data-tb><canvas data-cg aria-hidden="true"></canvas><canvas data-cd role="img" aria-label="Espacio para trazar la letra ${esc(c.letter)}"></canvas></div><div style="width:100%;max-width:440px">${bar(0, 'green', 'Cuánto has repasado')}</div><div class="row center"><button type="button" class="btn btn-soft" data-clear>🧽 Borrar</button><button type="button" class="btn btn-green" data-done>✔ Ya terminé</button></div>`;
    wireSay(body, 'La letra ' + c.name, ctx);
    const box = $('[data-tb]', body), cg = $('[data-cg]', body), cd = $('[data-cd]', body);
    const W_ = box.clientWidth || 360, H_ = box.clientHeight || Math.round(W_ * 0.9), dpr = Math.min(window.devicePixelRatio || 1, 2);
    let g, d;
    try { g = cg.getContext('2d'); d = cd.getContext('2d'); } catch (e) { g = null; }
    if (!g || !d) { ctx.info('Aquí no se puede trazar. Elige la letra.', 'encouraging'); mb[1].click(); return; }
    [cg, cd].forEach(cv => { cv.width = Math.round(W_ * dpr); cv.height = Math.round(H_ * dpr); });
    g.setTransform(dpr, 0, 0, dpr, 0, 0); d.setTransform(dpr, 0, 0, dpr, 0, 0);
    const fs = Math.round(H_ * 0.9), font = '700 ' + fs + 'px Andika, "Comic Sans MS", Arial, sans-serif';
    const place = cx => { cx.font = font; cx.textAlign = 'center'; cx.textBaseline = 'alphabetic'; const m = cx.measureText(c.letter); const asc = m.actualBoundingBoxAscent || fs * 0.72, dsc = m.actualBoundingBoxDescent || 0; return H_ / 2 + (asc - dsc) / 2; };
    const y0 = place(g);
    g.fillStyle = 'rgba(120,140,190,.30)'; g.fillText(c.letter, W_ / 2, y0);
    g.setLineDash([8, 8]); g.lineWidth = 3; g.strokeStyle = 'rgba(91,111,168,.9)'; g.strokeText(c.letter, W_ / 2, y0);
    // máscara de la letra: celdas de 6 px que deben quedar cubiertas
    const CS = 6, cols = Math.ceil(W_ / CS), rows = Math.ceil(H_ / CS), mask = new Uint8Array(cols * rows), cov = new Uint8Array(cols * rows);
    let total = 0, covered = 0;
    try {
      const oc = document.createElement('canvas'); oc.width = W_; oc.height = H_;
      const ox = oc.getContext('2d'); ox.fillStyle = '#000'; const yy = place(ox); ox.fillText(c.letter, W_ / 2, yy);
      const img = ox.getImageData(0, 0, W_, H_).data;
      for (let r = 0; r < rows; r++) for (let q = 0; q < cols; q++) {
        const px = Math.min(W_ - 1, q * CS + CS / 2) | 0, py = Math.min(H_ - 1, r * CS + CS / 2) | 0;
        if (img[(py * W_ + px) * 4 + 3] > 100) { mask[r * cols + q] = 1; total++; }
      }
    } catch (e) { total = 0; }
    if (!total) { ctx.info('Aquí no se puede trazar. Elige la letra.', 'encouraging'); mb[1].click(); return; }
    const ink = (getComputedStyle(document.documentElement).getPropertyValue('--blue') || '#1D64CF').trim() || '#1D64CF';
    const R = 16, fillBar = $('.bar > i', body);
    let drawing = false, last = null, finished = false;
    const mark = (x, y) => {
      for (let r = Math.max(0, Math.floor((y - R) / CS)); r <= Math.min(rows - 1, Math.floor((y + R) / CS)); r++)
        for (let q = Math.max(0, Math.floor((x - R) / CS)); q <= Math.min(cols - 1, Math.floor((x + R) / CS)); q++) {
          const i = r * cols + q;
          if (mask[i] && !cov[i] && Math.hypot(q * CS + CS / 2 - x, r * CS + CS / 2 - y) <= R) { cov[i] = 1; covered++; }
        }
    };
    const pt = e => { const b = cd.getBoundingClientRect(); return { x: (e.clientX - b.left) * (W_ / b.width), y: (e.clientY - b.top) * (H_ / b.height) }; };
    const seg = (p, q) => {
      d.strokeStyle = ink; d.lineWidth = 22; d.lineCap = 'round'; d.lineJoin = 'round'; d.globalAlpha = 0.85;
      d.beginPath(); d.moveTo(p.x, p.y); d.lineTo(q.x, q.y); d.stroke();
      const n = Math.max(1, Math.ceil(Math.hypot(q.x - p.x, q.y - p.y) / 4));
      for (let i = 0; i <= n; i++) mark(p.x + (q.x - p.x) * i / n, p.y + (q.y - p.y) * i / n);
      const pct = Math.round(100 * covered / total); if (fillBar) fillBar.style.width = Math.min(100, Math.round(pct / 0.6)) + '%';
      if (!finished && covered / total >= 0.6) finish();
    };
    const finish = () => { finished = true; drawing = false; ctx.correct('¡Lo trazaste muy bien!', { final: true }); mb.forEach(b => { b.disabled = true; }); };
    cd.addEventListener('pointerdown', e => { if (finished) return; e.preventDefault(); drawing = true; try { cd.setPointerCapture(e.pointerId); } catch (x) { /* nada */ } last = pt(e); seg(last, last); ctx.tick(); });
    cd.addEventListener('pointermove', e => { if (!drawing || finished) return; const p = pt(e); seg(last, p); last = p; });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => cd.addEventListener(ev, () => { drawing = false; }));
    $('[data-clear]', body).addEventListener('click', () => { if (finished) return; d.clearRect(0, 0, W_, H_); cov.fill(0); covered = 0; if (fillBar) fillBar.style.width = '0%'; });
    $('[data-done]', body).addEventListener('click', () => {
      if (finished) return;
      if (covered / total >= 0.6) finish(); else ctx.info('Casi lo tienes. Sigue el contorno de la letra con calma.', 'encouraging');
    });
    ctx.setRetry(() => { $('[data-clear]', body).click(); });
    ctx.setAssist(null);
  }
  mb.forEach(b => b.addEventListener('click', () => {
    mb.forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    ctx.setRetry(null); ctx.setAssist(null);
    b.dataset.m === 'trace' ? traceMode() : pickMode();
  }));
  traceMode();
}

/* ---------- Registro de tipos ---------- */
const Engine = {
  renderers: {
    'multiple-choice': renderChoice, 'image-choice': renderChoice, 'fill-blank': renderChoice,
    'matching': renderMatching, 'drag-drop': renderSort,
    'ordering': renderBuilder, 'syllable-builder': renderBuilder, 'word-builder': renderBuilder, 'sentence-builder': renderBuilder,
    'reading-comprehension': renderComprehension, 'guided-write': renderWrite, 'tracing': renderTracing
  },
  mount(activity, host, ctx) {
    const fn = this.renderers[activity.type];
    if (!fn) throw new Error('Tipo de actividad desconocido: ' + activity.type);
    host.innerHTML = '';
    fn(activity, host, ctx);
  }
};
