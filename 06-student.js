/* =====================================================================
   LeeOn — 06 VISTAS DEL ESTUDIANTE
   Recorrido: Bienvenida → Elige quién eres → Elige tu misión →
   Actividad → Retroalimentación → Logro → Progreso
   ===================================================================== */

const ACT = {};                       // acciones de botones: data-act="nombre"
const appEl = () => $('#app');
const view = { cleanup: null };       // función de limpieza de la vista actual
function go(hash) { if (location.hash === hash) route(); else location.hash = hash; }
function show(html, after) {
  appEl().innerHTML = html;
  const m = $('#main'); if (m) { m.setAttribute('tabindex', '-1'); }
  window.scrollTo(0, 0);
  if (after) after(appEl());
}
function emptyState(emoji, title, text, btnLabel, hash) {
  return `<div class="wrap"><div class="card empty" style="max-width:560px;margin:3rem auto"><div style="font-size:4rem">${emoji}</div><h2>${esc(title)}</h2><p>${esc(text)}</p><button type="button" class="btn btn-blue" data-go="${hash}">${btnLabel}</button></div></div>`;
}
const errorView = () => show(`<main id="main" class="wrap"><div class="card empty" style="max-width:560px;margin:3rem auto">${lionFig('thinking', 130, true)}<h2>Ups. Vamos a volver a intentarlo.</h2><button type="button" class="btn btn-blue" data-go="#/">🏠 Inicio</button></div></main>`);

function studentBar(st) {
  return `<div class="topbar"><div class="who">${avatarHTML(st.avatarId, 52)}<span>${esc(st.name)}</span></div>
    <div class="row"><button type="button" class="btn icon-btn btn-ghost" data-go="#/student/dashboard">🏠 Inicio</button>
    <button type="button" class="btn icon-btn btn-ghost" data-act="a11y">⚙️ Accesibilidad</button>
    <button type="button" class="btn icon-btn btn-ghost" data-act="logout">🚪 Salir</button></div></div>`;
}

/* ---------- Inicio ---------- */
/* La pantalla inicial NO muestra ningún botón docente: los niños no ven el panel.
   El docente entra manteniendo pulsado el león ~2 segundos, o con la dirección #/teacher.
   En ambos casos el panel pide contraseña (ver 07a-auth.js). */
function viewHome() {
  show(`<main id="main" class="home">
    <div class="welcome-bubble">¡Bienvenido a LeeOn!</div>
    ${lionFig('happy', 190, true)}
    <h1>🦁 LeeOn</h1>
    <p class="lema">Aprendemos juntos, paso a paso</p>
    <div class="stack">
      <button type="button" class="btn btn-xl btn-blue" data-go="#/student">👧 Soy estudiante</button>
      <button type="button" class="btn btn-xl btn-teacher" data-go="#/teacher">👩‍🏫 Panel docente</button>
    </div>
    <p class="small muted" style="max-width:360px;text-align:center;margin-top:.3rem">El panel docente pide contraseña: los estudiantes no pueden entrar por accidente.</p>
    <div class="row center home-foot"><button type="button" class="btn btn-ghost btn-sm" data-act="a11y">⚙️ Accesibilidad</button><button type="button" class="btn btn-ghost btn-sm" data-act="privacy">🔒 Privacidad</button></div>
  </main>`);
}

/* ---------- Acceso del estudiante (sin correo: perfil o código) ---------- */
function viewStudentLogin() {
  const sts = getStudents().slice().sort((a, b) => a.name.localeCompare(b.name, 'es'));
  show(`<main id="main" class="wrap">
    <div class="topbar"><button type="button" class="btn icon-btn btn-ghost" data-go="#/">🏠 Inicio</button><button type="button" class="btn icon-btn btn-ghost" data-act="a11y">⚙️ Accesibilidad</button></div>
    <div class="row center" style="margin-bottom:1rem">${lionAssistant('happy', '¿Quién eres?', 'Toca tu nombre', 120)}</div>
    ${sts.length ? `<div class="grid g4">${sts.map(s => `<button type="button" class="student-card" data-act="login" data-id="${s.id}">${avatarHTML(s.avatarId, 92)}<span>${esc(s.name)}</span><span class="code">Código: ${esc(s.code)}</span></button>`).join('')}</div>`
      : `<div class="card empty"><p>Todavía no hay perfiles. Pide a tu docente que cree el tuyo.</p></div>`}
    <div class="card" style="margin-top:1.5rem;max-width:520px;margin-left:auto;margin-right:auto">
      <label class="fl" for="code-in" style="margin-top:0">¿Tienes un código?</label>
      <div class="row"><input id="code-in" class="f" inputmode="numeric" maxlength="4" autocomplete="off" style="flex:1;min-width:120px;font-size:1.5rem;letter-spacing:.2em" placeholder="1234"><button type="button" class="btn btn-green" data-act="login-code">Entrar</button></div>
      <div id="code-err" class="err" role="alert"></div>
    </div></main>`, root => {
    $('#code-in', root).addEventListener('keydown', e => { if (e.key === 'Enter') ACT['login-code'](); });
  });
}
function loginStudent(id) {
  const st = getStudent(id); if (!st) return errorView();
  setStudentSession(id); st.lastAccess = new Date().toISOString(); saveStudents(); applyPrefs();
  go(st.avatarChosen === false ? '#/student/avatar' : '#/student/dashboard');
}
ACT.login = el => loginStudent(el.dataset.id);
ACT['login-code'] = () => {
  const v = ($('#code-in').value || '').trim();
  const st = getStudents().find(s => s.code === v);
  if (st) loginStudent(st.id); else { $('#code-err').textContent = 'No encontré ese código. Prueba otra vez o toca tu nombre.'; }
};
ACT.logout = () => { Voice.stop(); setStudentSession(null); applyPrefs(); go('#/'); };

/* ---------- Tablero del estudiante ---------- */
function viewDashboard(st) {
  const prog = getStudentProgress(st.id), rec = recommendNextActivity(st.id);
  const general = getLinks().filter(l => l.module === 'general');
  const generalCards = general.map(l => {
    const did = resultsFor(st.id).some(r => r.activityId === l.id && r.completed);
    return `<button type="button" class="act-card" data-act="open-link" data-id="${l.id}"><span class="ic" aria-hidden="true">${esc(l.icon)}</span><span class="t">${esc(l.title)}</span><span class="meta"><span class="pill">🔗 Otra página</span><span class="pill ${did ? 'ok' : ''}">${did ? '✓ Hecha' : '⭐ Nueva'}</span></span>${did ? '<span class="small muted">🔁 Practicar de nuevo</span>' : ''}</button>`;
  }).join('');
  show(`<main id="main" class="wrap">${studentBar(st)}
    <div style="margin-bottom:1.2rem">${lionAssistant('happy', '¡Hola, ' + st.name + '!', '¿Qué quieres aprender hoy?', 130)}</div>
    ${rec ? `<section class="card reco" aria-label="Recomendación"><div class="em" aria-hidden="true">${rec.activity.icon}</div><div style="flex:1;min-width:180px"><div class="small">🦁 LeeOn te recomienda…</div><h3 style="margin:.1rem 0">${esc(rec.activity.title)}</h3><div class="muted small">${esc(rec.reason)}</div></div><button type="button" class="btn btn-orange" data-go="#/student/activity/${rec.activity.id}">▶ Empezar</button></section>` : ''}
    <h2 style="margin-top:1.4rem">Elige tu misión</h2>
    <div class="grid g3">${MOD_ORDER.map(m => { const M = MOD[m], p = prog.modules[m]; return `<button type="button" class="mod-card mod-${M.cls}" data-go="#/student/module/${m}"><span class="big" aria-hidden="true">${M.icon}</span><h3>${M.dot} ${M.short}</h3><span class="sub">${M.name}</span>${bar(p.pct, '', M.name)}<span>⭐ ${p.done} de ${p.total} actividades</span></button>`; }).join('')}</div>
    ${general.length ? `<h2 style="margin-top:1.4rem">${MOD_GENERAL.dot} ${MOD_GENERAL.name}</h2><div class="grid g3">${generalCards}</div>` : ''}
    <div class="quick">
      <button type="button" class="btn btn-soft" data-go="#/student/achievements">⭐ Mis logros</button>
      <button type="button" class="btn btn-soft" data-go="#/student/progress">📈 Mi progreso</button>
      <button type="button" class="btn btn-soft" data-go="#/student/avatar">👤 Mi avatar</button>
    </div></main>`);
}

/* ---------- Página de un módulo ---------- */
const STATUS_TXT = {
  completed: ['ok', '✓ Hecha'], 'in-progress': ['try', '▶ Seguir'], reinforcement: ['try', '💪 Practicar'], locked: ['lock', '🔒 Pronto'], available: ['', '⭐ Nueva']
};
function viewModule(st, mid) {
  const M = MOD[mid]; if (!M) return errorView();
  const sm = statusMap(st), unl = unlockedLevel(st, mid), rec = recommendNextActivity(st.id);
  const p = getStudentProgress(st.id).modules[mid];
  let secs = '';
  for (let L = 1; L <= 5; L++) {
    const list = actsOf(mid, L), lks = linksOf(mid, L);
    const linkCards = lks.map(l => {
      const locked = L > unl, did = resultsFor(st.id).some(r => r.activityId === l.id && r.completed);
      return `<button type="button" class="act-card" data-act="open-link" data-id="${l.id}" ${locked ? 'aria-disabled="true"' : ''}><span class="ic" aria-hidden="true">${esc(l.icon)}</span><span class="t">${esc(l.title)}</span><span class="meta"><span class="pill">🔗 Otra página</span><span class="pill ${locked ? 'lock' : did ? 'ok' : ''}">${locked ? '🔒 Pronto' : did ? '✓ Hecha' : '⭐ Nueva'}</span></span>${did ? '<span class="small muted">🔁 Practicar de nuevo</span>' : ''}</button>`;
    }).join('');
    secs += `<section class="level-sec" aria-label="Nivel ${L}"><h2>${L > unl ? '🔒' : '🎯'} Nivel ${L} · ${esc(LEVEL_NAMES[mid][L - 1])}</h2><div class="grid g3">${list.map(a => {
      const s = sm[a.id], t = STATUS_TXT[s], isRec = rec && rec.activity.id === a.id && s !== 'locked';
      return `<button type="button" class="act-card${isRec ? ' reco-on' : ''}" data-act="open-act" data-id="${a.id}" ${s === 'locked' ? 'aria-disabled="true"' : ''}>${isRec ? '<span class="ribbon">🦁 Recomendada</span>' : ''}<span class="ic" aria-hidden="true">${a.icon}</span><span class="t">${esc(a.title)}</span><span class="meta"><span class="pill">${DIFF[a.difficulty]}</span><span class="pill ${t[0]}">${t[1]}</span></span>${s === 'completed' ? '<span class="small muted">🔁 Practicar de nuevo</span>' : ''}</button>`;
    }).join('')}${linkCards}</div></section>`;
  }
  show(`<main id="main" class="wrap">${studentBar(st)}
    <div class="mhead mod-${M.cls}"><div class="row" style="justify-content:space-between"><h1>${M.icon} ${M.short}</h1><button type="button" class="btn btn-sm" data-go="#/student/dashboard">← Volver</button></div><p style="margin:.2rem 0 .6rem">${M.name} · ${M.desc}</p>${bar(p.pct, '', M.name)}<p style="margin:.4rem 0 0" class="small">⭐ ${p.done} de ${p.total} actividades</p></div>
    <div class="row center" style="margin:1rem 0">${lionAssistant('encouraging', 'Elige tu misión', 'Puedes escoger cualquiera que esté abierta', 100)}</div>
    ${secs}</main>`);
}
ACT['open-act'] = el => {
  if (el.getAttribute('aria-disabled') === 'true') { toast('Completa 2 actividades del nivel anterior para abrir esta.', '🦁'); return; }
  go('#/student/activity/' + el.dataset.id);
};

/* ---------- Enlace externo (lo agregó el docente): pantalla intermedia y registro ---------- */
ACT['open-link'] = el => {
  if (el.getAttribute('aria-disabled') === 'true') { toast('Completa 2 actividades del nivel anterior para abrir esta.', '🦁'); return; }
  go('#/student/link/' + el.dataset.id);
};
function viewLink(st, id) {
  const l = getLink(id);
  if (!l) return show(emptyState('🦁', 'Ups. No encontré esa actividad.', 'Vamos a volver a tu misión.', '🏠 Inicio', '#/student/dashboard'));
  const isGeneral = l.module === 'general';
  if (!isGeneral && l.level > unlockedLevel(st, l.module)) { toast('Esa actividad todavía está cerrada.', '🔒'); return go('#/student/module/' + l.module); }
  const M = MOD_ALL[l.module], backHash = isGeneral ? '#/student/dashboard' : '#/student/module/' + l.module;
  const did = resultsFor(st.id).filter(r => r.activityId === l.id && r.completed).length;
  show(`<div class="abar"><button type="button" class="btn btn-sm btn-ghost" data-go="#/student/dashboard">🏠 Inicio</button><button type="button" class="btn btn-sm btn-ghost" data-go="${backHash}">← Volver</button><div class="atitle">${M.icon} ${M.short}${isGeneral ? '' : ' · Nivel ' + l.level} · 🔗 Otra página</div><button type="button" class="btn btn-sm btn-ghost" data-act="a11y" aria-label="Accesibilidad">⚙️</button></div>
    <main id="main" class="awrap">
      <section class="card ins"><p class="instruction">Vas a jugar en otra página. Cuando termines, vuelve aquí.</p><button type="button" class="btn btn-soft" id="say-ins">🔊 Escuchar instrucción</button></section>
      <section class="card stage" style="text-align:center">
        <div class="p-emoji" aria-hidden="true">${esc(l.icon)}</div><h2 style="margin:0">${esc(l.title)}</h2>
        ${did ? `<span class="pill ok">✓ Ya la hiciste ${did > 1 ? did + ' veces' : ''}</span>` : ''}
        <a class="btn btn-orange btn-xl" id="l-open" href="${esc(l.url)}" target="_blank" rel="noopener noreferrer">▶ Abrir actividad</a>
        <div class="stack" id="l-after" hidden><p class="muted" style="margin:0">Cuando termines, vuelve a esta pantalla.</p><button type="button" class="btn btn-green btn-xl" id="l-done">✔ Ya terminé</button></div>
      </section>
      <div id="done"></div>
      <div class="row center" style="margin-top:1rem">${lionAssistant('happy', '¡Vamos paso a paso!', 'Toca Abrir para empezar', 90)}</div>
    </main>`, root => {
    let openedAt = null;
    $('#say-ins', root).addEventListener('click', () => speak('Vas a jugar en otra página. Cuando termines, vuelve aquí.', { user: true }));
    $('#l-open', root).addEventListener('click', () => { if (!openedAt) openedAt = Date.now(); $('#l-after', root).hidden = false; });
    $('#l-done', root).addEventListener('click', () => {
      const secs = openedAt ? Math.min(1200, (Date.now() - openedAt) / 1000) : 1;   // tiempo aproximado (máx. 20 min)
      const fresh = recordLinkParticipation(st.id, l, secs, openedAt ? new Date(openedAt).toISOString() : null).fresh;
      sfx(fresh.length ? 'badge' : 'ok'); fresh.forEach(f => toast('¡Nuevo logro! ' + f.name, f.emoji));
      $('#l-after', root).hidden = true;
      $('#done', root).innerHTML = `<section class="card done-card" aria-live="polite">${lionFig('celebrating', 130, true)}<h2>¡Muy bien!</h2><p class="muted">🦁 Lo registré. ¡LeeOn está orgulloso de tu esfuerzo!</p>${fresh.length ? `<div class="newach">${fresh.map(f => `<span class="pill ok">${f.emoji} ¡Nuevo logro! ${esc(f.name)}</span>`).join('')}</div>` : ''}<div class="row center"><button type="button" class="btn btn-green" data-go="${backHash}">🗺️ Elegir misión</button><button type="button" class="btn btn-soft" id="b-again">🔁 Practicar de nuevo</button></div></section>`;
      $('#b-again', root).addEventListener('click', () => viewLink(st, id));
      const d = $('#done .done-card', root); if (d && d.scrollIntoView) d.scrollIntoView({ behavior: motionOK() ? 'smooth' : 'auto', block: 'nearest' });
    });
  });
}

/* ---------- Actividad ---------- */
const PRAISE = ['¡Excelente!', '¡Muy bien!', '¡Lo estás logrando!', '¡Excelente trabajo!', '¡Tú puedes!'];
const TRYMSG = ['Casi lo tienes. Vamos a intentarlo otra vez.', '¡Inténtalo otra vez!', 'Vamos paso a paso.'];
const GENERIC_HINTS = ['Mira con calma y escucha otra vez.', 'Toca 🔊 para oírlo de nuevo. Tú puedes.', 'Te ayudo un poquito más.'];

function viewActivity(id, preview) {
  const a = actById(id), st = currentStudent();
  if (!a) return show(emptyState('🦁', 'Ups. No encontré esa actividad.', 'Vamos a volver al inicio.', '🏠 Inicio', preview ? '#/teacher/activities' : '#/student/dashboard'));
  if (!preview) {
    if (!st) return go('#/student');
    if (statusMap(st)[a.id] === 'locked') { toast('Esa actividad todavía está cerrada.', '🔒'); return go('#/student/module/' + a.module); }
  }
  const M = MOD[a.module];
  const list = ACTIVITIES.filter(x => x.module === a.module);
  const sm = st && !preview ? statusMap(st) : null;
  const idx = list.findIndex(x => x.id === a.id);
  const openable = x => !sm || sm[x.id] !== 'locked';
  const prev = list.slice(0, idx).reverse().find(openable), next = list.slice(idx + 1).find(openable);
  const homeHash = preview ? '#/teacher/activities' : '#/student/dashboard';
  const backHash = preview ? '#/teacher/activities' : '#/student/module/' + a.module;

  show(`<div class="abar"><button type="button" class="btn btn-sm btn-ghost" data-go="${homeHash}">🏠 Inicio</button><button type="button" class="btn btn-sm btn-ghost" data-go="${backHash}">← Volver</button><div class="atitle">${M.icon} ${M.short} · Nivel ${a.level} · ${DIFF[a.difficulty]}${preview ? ' · Vista previa' : ''}</div><button type="button" class="btn btn-sm btn-ghost" data-act="a11y" aria-label="Accesibilidad">⚙️</button></div>
    <main id="main" class="awrap">
      <section class="card ins" aria-label="Instrucción"><p class="instruction">${esc(a.instruction)}</p><button type="button" class="btn btn-soft" id="say-ins">🔊 Escuchar instrucción</button></section>
      <section class="card stage" id="stage" aria-label="Actividad"></section>
      <div id="done"></div>
      <div class="dock"><div class="fb" id="fb"><span id="fb-lion"></span><div class="msg" id="fb-msg" role="status" aria-live="polite"></div><div class="acts" id="fb-acts"></div></div>
        <div class="afoot"><button type="button" class="btn btn-soft" id="b-hint">💡 Pista</button><button type="button" class="btn btn-soft" id="b-repeat">🔁 Repetir</button>
        ${prev ? `<button type="button" class="btn btn-ghost" data-go="#/${preview ? 'teacher/preview' : 'student/activity'}/${prev.id}">◀ Anterior</button>` : ''}${next ? `<button type="button" class="btn btn-ghost" data-go="#/${preview ? 'teacher/preview' : 'student/activity'}/${next.id}">Siguiente ▶</button>` : ''}</div></div>
    </main>`, root => {
    const fbEl = $('#fb', root), fbMsg = $('#fb-msg', root), fbActs = $('#fb-acts', root), fbLion = $('#fb-lion', root);
    const sess = { startedAt: new Date().toISOString(), last: Date.now(), active: 0, attempts: 0, errors: 0, hints: 0, hintIdx: 0, consec: 0, completed: false, saved: false };
    let retryFn = null, assistFn = null;
    const tick = () => { const n = Date.now(); sess.active += Math.min(n - sess.last, 45000); sess.last = n; };

    /* --- Retroalimentación (sin mensajes negativos) --- */
    function setFb(mood, msg, kind, acts) {
      fbLion.innerHTML = lionFig(mood, 64, false);
      fbMsg.textContent = msg; fbEl.className = 'fb ' + (kind || '');
      fbActs.innerHTML = '';
      (acts || []).forEach(k => {
        if (k === 'retry' && !retryFn) return;
        const b = document.createElement('button'); b.type = 'button'; b.className = 'btn btn-sm btn-soft';
        b.textContent = k === 'hint' ? '💡 Pista' : k === 'listen' ? '🔊 Escuchar' : '🔄 Intentar nuevamente';
        b.addEventListener('click', () => { if (k === 'hint') doHint(false); else if (k === 'listen') speak(a.audioText || a.instruction, { user: true }); else { if (retryFn) retryFn(); setFb('happy', 'Vamos otra vez. ¡Tú puedes!', ''); } });
        fbActs.appendChild(b);
      });
    }
    function doHint(auto) {
      tick(); sess.hints++;
      const hs = a.hints && a.hints.length ? a.hints : GENERIC_HINTS;
      const text = hs[Math.min(sess.hintIdx, hs.length - 1)];
      if (sess.hintIdx >= 1 && assistFn) { try { assistFn(); } catch (e) { /* nada */ } }
      sess.hintIdx++;
      setFb('thinking', (auto ? 'Te ayudo con una pista. ' : '') + text, 'soft', ['listen', 'retry']);
      speak(text, { user: !auto });
    }
    const ctx = {
      tick, say: t => speak(t, { user: true }), sayAuto: t => speak(t),
      setRetry: f => { retryFn = f; }, setAssist: f => { assistFn = f; },
      info: (m, mood) => setFb(mood || 'encouraging', m, 'soft'),
      correct: (msg, o) => {
        if (sess.completed) return;
        tick(); sess.attempts++; sess.consec = 0;
        if (o && o.final) finish(); else { setFb('celebrating', msg || pick(PRAISE), 'good'); sfx('ok'); }
      },
      incorrect: () => {
        if (sess.completed) return;
        tick(); sess.attempts++; sess.errors++; sess.consec++; sfx('soft');
        if (sess.consec >= 3) { sess.consec = 0; doHint(true); }
        else setFb('encouraging', pick(TRYMSG), 'soft', ['hint', 'listen', 'retry']);
      }
    };

    function makeResult(completed) {
      const score = completed ? clamp(100 - 15 * sess.errors - 6 * sess.hints, 40, 100) : 0;
      return { id: uid('res'), studentId: st.id, activityId: a.id, module: a.module, score, attempts: sess.attempts, errors: sess.errors, hintsUsed: sess.hints, completed, durationSeconds: Math.max(1, Math.round(sess.active / 1000)), startedAt: sess.startedAt, completedAt: completed ? new Date().toISOString() : undefined };
    }
    function finish() {
      sess.completed = true; tick();
      const score = clamp(100 - 15 * sess.errors - 6 * sess.hints, 40, 100), stars = score >= 85 ? 3 : score >= 65 ? 2 : 1;
      let fresh = [];
      if (!preview && st) { fresh = recordActivityResult(makeResult(true)).fresh; sess.saved = true; }
      setFb('celebrating', pick(PRAISE), 'good'); fbActs.innerHTML = '';
      sfx(fresh.length ? 'badge' : 'ok');
      fresh.forEach(f => toast('¡Nuevo logro! ' + f.name, f.emoji));
      const rec = !preview && st ? recommendNextActivity(st.id) : null;
      const nextAct = rec && rec.activity.id !== a.id ? rec.activity : (next || null);
      $('#done', root).innerHTML = `<section class="card done-card" aria-live="polite">${lionFig('celebrating', 130, true)}<h2>${preview ? '¡Actividad resuelta!' : '¡Excelente trabajo!'}</h2>
        <div class="stars" role="img" aria-label="${stars} estrellas">${Array.from({ length: stars }).map(() => '<span>⭐</span>').join('')}</div>
        ${preview ? '<p class="muted small">Vista previa: este resultado no se guarda.</p>' : '<p class="muted">🦁 ¡LeeOn está orgulloso de tu esfuerzo!</p>'}
        ${fresh.length ? `<div class="newach">${fresh.map(f => `<span class="pill ok">${f.emoji} ¡Nuevo logro! ${esc(f.name)}</span>`).join('')}</div>` : ''}
        ${nextAct && !preview ? `<div class="small">🦁 LeeOn te recomienda: <b>${esc(nextAct.title)}</b></div>` : ''}
        <div class="row center">${nextAct ? `<button type="button" class="btn btn-green" data-go="#/${preview ? 'teacher/preview' : 'student/activity'}/${nextAct.id}">▶ Siguiente actividad</button>` : ''}<button type="button" class="btn btn-soft" id="b-again">🔁 Practicar de nuevo</button><button type="button" class="btn btn-soft" data-go="${backHash}">🗺️ ${preview ? 'Volver' : 'Elegir misión'}</button></div></section>`;
      $('#b-again', root).addEventListener('click', () => viewActivity(a.id, preview));
      const d = $('#done .done-card', root); if (d && d.scrollIntoView) d.scrollIntoView({ behavior: motionOK() ? 'smooth' : 'auto', block: 'nearest' });
    }

    /* --- Botones fijos --- */
    $('#say-ins', root).addEventListener('click', () => speak(a.audioText || a.instruction, { user: true }));
    $('#b-hint', root).addEventListener('click', () => { if (!sess.completed) doHint(false); });
    $('#b-repeat', root).addEventListener('click', () => speak(Voice.last || a.audioText || a.instruction, { user: true }));

    setFb('happy', '¡Vamos paso a paso!', '');
    try { Engine.mount(a, $('#stage', root), ctx); }
    catch (e) { console.error(e); $('#stage', root).innerHTML = `<div class="empty">${lionFig('thinking', 110)}<p>Ups. Vamos a volver a intentarlo.</p><button type="button" class="btn btn-blue" data-go="${backHash}">← Volver</button></div>`; }
    if (prefs().autoRead) setTimeout(() => speak(a.audioText || a.instruction), 400);

    /* Al salir: si hubo intentos sin terminar, se guarda como "en progreso" (nunca se penaliza el tiempo) */
    view.cleanup = () => {
      Voice.stop();
      if (!preview && st && !sess.completed && !sess.saved && sess.attempts > 0) { tick(); saveActivityResult(makeResult(false)); const s2 = getStudent(st.id); if (s2) { s2.lastAccess = new Date().toISOString(); saveStudents(); } }
    };
  });
}

/* ---------- Mi progreso: camino donde avanza el león ---------- */
function viewProgress(st) {
  const prog = getStudentProgress(st.id), rec = recommendNextActivity(st.id), sm = statusMap(st), an = getStudentAnalytics(st.id);
  const paths = MOD_ORDER.map(m => {
    const M = MOD[m];
    const nodes = actsOf(m).map((a, i) => {
      const s = sm[a.id], isNext = rec && rec.activity.id === a.id;
      const cls = s === 'completed' || (s === 'reinforcement' && st.completedActivities.includes(a.id)) ? 'done' : s === 'locked' ? 'lockd' : '';
      const face = cls === 'done' ? '✓' : s === 'locked' ? '🔒' : String(i + 1);
      return `<button type="button" class="node ${cls}${isNext ? ' next' : ''}" data-act="open-act" data-id="${a.id}" ${s === 'locked' ? 'aria-disabled="true"' : ''} aria-label="${esc(a.title)}: ${cls === 'done' ? 'hecha' : s === 'locked' ? 'cerrada' : 'abierta'}">${isNext ? `<span class="lionpin">${lionSVG('happy')}</span>` : ''}${face}${i % 3 === 0 ? `<span class="lvl">Nivel ${a.level}</span>` : ''}</button>`;
    }).join('');
    return `<section class="path-row" aria-label="Camino de ${M.short}"><h3>${M.dot} ${M.short}</h3><div class="path">${nodes}</div></section>`;
  }).join('');
  show(`<main id="main" class="wrap">${studentBar(st)}
    <h1>⭐ Mi progreso</h1>
    <div style="margin-bottom:1rem">${lionAssistant('celebrating', 'Has completado ' + prog.completed + (prog.completed === 1 ? ' actividad.' : ' actividades.'), '¡Sigue así, paso a paso!', 120)}</div>
    ${rec ? `<section class="card reco" style="margin-bottom:1rem"><div class="em" aria-hidden="true">${rec.activity.icon}</div><div style="flex:1;min-width:180px"><div class="small">Tu próximo reto es…</div><h3 style="margin:.1rem 0">${esc(rec.activity.title)}</h3></div><button type="button" class="btn btn-orange" data-go="#/student/activity/${rec.activity.id}">▶ Continúa desde aquí</button></section>` : ''}
    <div class="card" style="margin-bottom:1rem">${MOD_ORDER.map(m => barLine(MOD[m].short, prog.modules[m].pct, MOD[m].cls)).join('<div style="height:.5rem"></div>')}</div>
    <div class="grid g4" style="margin-bottom:1.4rem">
      <div class="card stat"><b>${prog.completed}</b>actividades hechas</div>
      <div class="card stat"><b>${an.accuracy}%</b>aciertos</div>
      <div class="card stat"><b>${an.attempts}</b>intentos</div>
      <div class="card stat"><b>${st.achievements.length}</b>logros ⭐</div></div>
    <h2>Mi camino</h2><p class="muted small">Toca un círculo para jugar. El león te muestra dónde seguir.</p>${paths}
    <div class="row center"><button type="button" class="btn btn-soft" data-go="#/student/achievements">🏅 Ver mis logros</button><button type="button" class="btn btn-soft" data-go="#/student/dashboard">🗺️ Elegir misión</button></div></main>`);
}

/* ---------- Logros ---------- */
function viewAchievements(st) {
  const got = ACHIEVEMENTS.filter(a => st.achievements.includes(a.id)).length;
  show(`<main id="main" class="wrap">${studentBar(st)}
    <h1>🏅 Mis logros</h1>
    <div style="margin-bottom:1rem">${lionAssistant(got ? 'celebrating' : 'encouraging', got ? '¡Tienes ' + got + (got === 1 ? ' logro!' : ' logros!') : 'Aquí guardaré tus logros', got ? '¡LeeOn está orgulloso de ti!' : 'Completa una actividad para conseguir el primero', 110)}</div>
    <div class="grid g4">${ACHIEVEMENTS.map(a => { const on = st.achievements.includes(a.id); return `<div class="card badge${on ? '' : ' off'}"><div class="be" aria-hidden="true">${a.emoji}</div><div class="bn">${esc(a.name)}</div><div class="bd">${on ? '✓ ¡Lo lograste!' : '🔒 ' + esc(a.desc)}</div></div>`; }).join('')}</div>
    <div class="row center" style="margin-top:1.4rem"><button type="button" class="btn btn-soft" data-go="#/student/dashboard">🗺️ Elegir misión</button></div></main>`);
}

/* ---------- Mi avatar ---------- */
function viewAvatar(st) {
  show(`<main id="main" class="wrap">${studentBar(st)}
    <h1>👤 Elige tu avatar</h1>
    <div style="margin-bottom:1rem">${lionAssistant('happy', '¿Con quién quieres aprender?', 'Toca uno', 110)}</div>
    <div class="grid g4" role="group" aria-label="Avatares">${AVATARS.map(av => `<button type="button" class="av-tile" data-act="pick-avatar" data-id="${av.id}" aria-pressed="${av.id === st.avatarId}">${avatarHTML(av.id, 84)}<span>${av.name}</span></button>`).join('')}</div>
    <div class="row center" style="margin-top:1.4rem"><button type="button" class="btn btn-green btn-xl" data-go="#/student/dashboard">✔ Listo</button></div></main>`);
}
ACT['pick-avatar'] = el => {
  const st = currentStudent(); if (!st) return;
  updateStudent(st.id, { avatarId: el.dataset.id, avatarChosen: true });
  viewAvatar(getStudent(st.id));
  const b = $('.av-tile[data-id="' + el.dataset.id + '"]'); if (b) b.focus();
};
ACT.a11y = () => openA11y();
ACT.privacy = () => openPrivacy();
