/* =====================================================================
   LeeOn — 03 SERVICIOS
   progressService + analyticsService + datos de demostración.
   Ninguna función de aquí toca el DOM.
   ===================================================================== */

/* Cuántos "pasos" tiene una actividad (para calcular aciertos = pasos correctos / intentos) */
function stepsOf(a) {
  const c = a.content || {};
  if (a.type === 'matching') return c.pairs.length;
  if (a.type === 'drag-drop') return c.items.length;
  if (a.type === 'reading-comprehension') return c.questions.length;
  return 1;
}

/* ---------- Progreso ---------- */
function moduleProgress(st, mod) {
  const list = actsOf(mod);
  return Math.round(100 * list.filter(a => st.completedActivities.includes(a.id)).length / list.length);
}
/* Nivel máximo abierto en un módulo: parte del nivel inicial que fijó el docente
   y sube cuando se completan 2 de las 3 actividades del nivel actual. */
function unlockedLevel(st, mod) {
  let L = clamp(st.level || 1, 1, 5);
  while (L < 5) {
    const done = actsOf(mod, L).filter(a => st.completedActivities.includes(a.id)).length;
    if (done >= 2) L++; else break;
  }
  return L;
}
const studentLevel = st => Math.min.apply(null, MOD_ORDER.map(m => unlockedLevel(st, m)));

function getStudentProgress(studentId) {
  const st = getStudent(studentId); if (!st) return null;
  const out = { level: studentLevel(st), completed: st.completedActivities.length, total: ACTIVITIES.length, modules: {} };
  MOD_ORDER.forEach(m => {
    const list = actsOf(m), done = list.filter(a => st.completedActivities.includes(a.id)).length;
    out.modules[m] = { pct: moduleProgress(st, m), done, total: list.length, unlocked: unlockedLevel(st, m) };
  });
  out.avg = Math.round(avg(MOD_ORDER.map(m => out.modules[m].pct)));
  return out;
}

/* ---------- Refuerzo ---------- */
/* Orientación pedagógica (NO es un diagnóstico). results = resultados de UNA actividad, en orden cronológico. */
function reinforcementInfo(results) {
  if (!results.length) return null;
  const rec = results.slice(-3), last = rec[rec.length - 1];
  if (last.completed && last.errors <= 2) return null;           // ya lo logró (con 2 errores o menos): sin alerta
  const att = sum(rec.map(r => r.attempts)), err = sum(rec.map(r => r.errors));
  const acc = att ? 1 - err / att : 1;
  if (err < 2) return null;              // un solo error no es evidencia suficiente
  const reasons = [];
  if (acc < 0.6) reasons.push('Menos del 60% de aciertos');
  if (rec.filter(r => r.errors >= 3).length >= 2) reasons.push('Varios intentos repetidos');
  if (last.errors >= 4) reasons.push('Varias respuestas para revisar');
  return reasons.length ? { acc: Math.round(acc * 100), reasons } : null;
}
function getActivitiesNeedingReinforcement(studentId) {
  const rs = resultsFor(studentId), out = [];
  ACTIVITIES.forEach(a => {
    const info = reinforcementInfo(rs.filter(r => r.activityId === a.id));
    if (info) out.push({ activity: a, info });
  });
  return out;
}

/* Estado de todas las actividades para un estudiante: locked | available | in-progress | completed | reinforcement */
function statusMap(st) {
  const rs = resultsFor(st.id), by = {}, map = {};
  rs.forEach(r => { (by[r.activityId] = by[r.activityId] || []).push(r); });
  const unl = {}; MOD_ORDER.forEach(m => { unl[m] = unlockedLevel(st, m); });
  ACTIVITIES.forEach(a => {
    if (a.level > unl[a.module]) map[a.id] = 'locked';
    else if (reinforcementInfo(by[a.id] || [])) map[a.id] = 'reinforcement';
    else if (st.completedActivities.includes(a.id)) map[a.id] = 'completed';
    else if ((by[a.id] || []).length) map[a.id] = 'in-progress';
    else map[a.id] = 'available';
  });
  return map;
}

/* ---------- Recomendación (nunca bloquea: el niño puede elegir otra) ---------- */
function recommendNextActivity(studentId) {
  const st = getStudent(studentId); if (!st) return null;
  const sm = statusMap(st);
  const done = resultsFor(studentId).filter(r => r.completed && !r.link);   // los enlaces externos no cuentan para recomendar
  const last3 = done.slice(-3);
  // 1) Si los últimos resultados fueron bajos → reforzar con calma
  if (last3.length && avg(last3.map(r => r.score)) < 60) {
    const weakest = last3.slice().sort((a, b) => a.score - b.score)[0];
    const a = actById(weakest.activityId);
    if (a) return { activity: a, kind: 'reinforce', reason: 'Vamos a practicar esta otra vez, con calma.' };
  }
  const todo = ACTIVITIES.filter(a => sm[a.id] !== 'locked' && !st.completedActivities.includes(a.id));
  const lastAct = done.length ? actById(done[done.length - 1].activityId) : null;
  const lastMod = lastAct ? lastAct.module : null;
  const strong = last3.length === 3 && last3.every(r => r.score >= 80);   // 80% o más en 3 actividades
  const byProgress = MOD_ORDER.slice().sort((x, y) => moduleProgress(st, x) - moduleProgress(st, y));
  const order = strong && lastMod ? [lastMod].concat(byProgress.filter(m => m !== lastMod)) : byProgress;
  for (const m of order) {
    const t = todo.find(a => a.module === m);
    if (t) return { activity: t, kind: strong ? 'next' : 'continue', reason: strong ? '¡Vas muy bien! Este es el siguiente paso.' : (done.length ? 'Sigue con tu camino.' : '¡Empecemos juntos!') };
  }
  // 2) Todo lo disponible está completo → practicar lo más flojo
  const best = {}; done.forEach(r => { best[r.activityId] = Math.max(best[r.activityId] || 0, r.score); });
  const list = Object.keys(best).sort((a, b) => best[a] - best[b]);
  const a = list.length ? actById(list[0]) : ACTIVITIES[0];
  return { activity: a, kind: 'practice', reason: '¡Has completado todo lo abierto! Practiquemos otra vez.' };
}

/* ---------- Logros ---------- */
function achContext(st) {
  const done = st.completedActivities, has = id => done.includes(id);
  const days = new Set(resultsFor(st.id).map(r => dayKey(r.completedAt || r.startedAt))).size;
  return {
    done, days,
    n: m => actsOf(m).filter(a => has(a.id)).length,
    level: (m, L) => actsOf(m, L).every(a => has(a.id)),
    anyLevel: (m, L) => actsOf(m, L).some(a => has(a.id))
  };
}
function evaluateAchievements(st) {
  const c = achContext(st), fresh = [];
  ACHIEVEMENTS.forEach(a => {
    if (!st.achievements.includes(a.id) && a.test(c)) { st.achievements.push(a.id); fresh.push(a); }
  });
  return fresh;
}

/* Guarda el resultado, actualiza progreso y logros. Devuelve los logros nuevos. */
function recordActivityResult(res) {
  saveActivityResult(res);
  const st = getStudent(res.studentId); if (!st) return { fresh: [] };
  if (res.completed && !st.completedActivities.includes(res.activityId)) st.completedActivities.push(res.activityId);
  st.lastAccess = res.completedAt || res.startedAt;
  const fresh = evaluateAchievements(st);
  saveStudents();
  return { fresh };
}

/* ---------- Analítica ---------- */
const isOk = r => r.completed && r.score >= 60;
function getStudentAnalytics(studentId) {
  const st = getStudent(studentId); if (!st) return null;
  const rs = resultsFor(studentId), own = rs.filter(r => !r.link), bySkill = {};
  own.forEach(r => {
    const a = actById(r.activityId); if (!a) return;
    const s = bySkill[a.skill] = bySkill[a.skill] || { skill: a.skill, module: a.module, ok: 0, not: 0 };
    isOk(r) ? s.ok++ : s.not++;
  });
  const skills = Object.values(bySkill);
  const attempts = sum(own.map(r => r.attempts)), errors = sum(own.map(r => r.errors));
  const last = rs[rs.length - 1];
  const reinforcement = getActivitiesNeedingReinforcement(studentId);
  // Patrones: habilidades con al menos 2 registros y menos del 70% de éxito
  const patterns = skills.filter(s => s.ok + s.not >= 2 && s.ok / (s.ok + s.not) < 0.7)
    .sort((a, b) => a.ok / (a.ok + a.not) - b.ok / (b.ok + b.not)).slice(0, 3)
    .map(s => 'Presenta mayor dificultad en ' + s.skill.charAt(0).toLowerCase() + s.skill.slice(1) + '.');
  return {
    totalResults: rs.length, completed: rs.filter(r => r.completed).length,
    distinctDone: st.completedActivities.length, linksDone: rs.filter(r => r.link).length,
    attempts, errors, hints: sum(own.map(r => r.hintsUsed)),
    accuracy: attempts ? Math.round(100 * (1 - errors / attempts)) : 0,
    timeSec: sum(rs.map(r => r.durationSeconds)),
    lastAccess: last ? (last.completedAt || last.startedAt) : st.lastAccess,
    skills, reinforcement, patterns
  };
}
function getGroupSummary() {
  const sts = getStudents(), week = Date.now() - 7 * 86400000;
  const rs = getActivityResults();
  const activeIds = new Set(rs.filter(r => new Date(r.startedAt).getTime() >= week).map(r => r.studentId));
  const progs = sts.map(s => getStudentProgress(s.id));
  const mods = {}; MOD_ORDER.forEach(m => { mods[m] = Math.round(avg(progs.map(p => p.modules[m].pct))); });
  return {
    students: sts.length, active: sts.filter(s => activeIds.has(s.id)).length,
    done: rs.length, completed: rs.filter(r => r.completed).length,
    avg: Math.round(avg(progs.map(p => p.avg))), mods
  };
}

/* ---------- Enlaces externos ---------- */
/* Un resultado puede venir de una actividad de LeeOn o de un enlace del docente (r.link === true). */
function resultActivity(r) {
  const a = actById(r.activityId); if (a) return a;
  if (r.link) return { id: 'ENLACE', title: r.linkTitle || 'Enlace', module: r.module, level: r.level || 1, skill: 'Actividad externa' };
  return null;
}
const linksOf = (mod, level) => getLinks().filter(l => l.module === mod && (level == null || l.level === level));
/* Registra que el niño abrió el enlace y marcó "Ya terminé". No hay puntaje: LeeOn no recibe resultados de la otra página.
   No cambia el % de progreso del módulo, pero sí cuenta como participación y como día de aprendizaje. */
function recordLinkParticipation(studentId, link, durationSeconds, startedAtIso) {
  const st = getStudent(studentId); if (!st) return { fresh: [] };
  const now = new Date().toISOString();
  saveActivityResult({
    id: uid('res'), studentId, activityId: link.id, module: link.module, level: link.level, link: true, linkTitle: link.title,
    score: 100, attempts: 0, errors: 0, hintsUsed: 0, completed: true,
    durationSeconds: Math.max(1, Math.round(durationSeconds || 1)), startedAt: startedAtIso || now, completedAt: now
  });
  st.lastAccess = now;
  const fresh = evaluateAchievements(st);
  saveStudents();
  return { fresh };
}

/* ---------- Exportación CSV ---------- */
function buildCSV(rows) {
  const q = v => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
  const head = ['Estudiante', 'Fecha', 'Módulo', 'Actividad', 'Resultado', 'Puntaje', 'Intentos', 'Pistas', 'Duración (s)'];
  const lines = [head.map(q).join(',')];
  rows.forEach(r => {
    const st = getStudent(r.studentId), a = resultActivity(r);
    lines.push([st ? st.name : '?', fmtDate(r.startedAt), MOD_ALL[r.module].name, a ? (r.link ? '🔗 ' : a.id + ' ') + a.title : r.activityId,
      r.completed ? 'Completada' : 'En progreso', r.score, r.attempts, r.hintsUsed, r.durationSeconds].map(q).join(','));
  });
  return lines.join('\n');
}

/* ---------- Datos de demostración ---------- */
function rng(seed) { // generador pseudoaleatorio con semilla (resultados demo reproducibles)
  let a = seed >>> 0;
  return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
function seedDemo() {
  const rand = rng(20260920), DAY = 86400000, now = Date.now();
  const ri = (a, b) => a + Math.floor(rand() * (b - a + 1));
  const profiles = [
    { name: 'Ana', code: '1234', avatarId: 'lion', level: 1, counts: { phonological: 12, reading: 11, writing: 8 }, weak: ['Completar palabras'], span: 9, last: 0,
      obs: [{ d: 4, t: 'Lee palabras frecuentes con autonomía.' }] },
    { name: 'Mateo', code: '2345', avatarId: 'panda', level: 1, counts: { phonological: 10, reading: 9, writing: 6 }, weak: ['Identificación del sonido final'], span: 6, last: 1,
      prefs: { calmMode: true, reducedMotion: true }, obs: [{ d: 3, t: 'Necesita apoyo para reconocer sonidos finales.' }] },
    { name: 'Sofía', code: '3456', avatarId: 'rabbit', level: 1, counts: { phonological: 9, reading: 12, writing: 10 }, weak: ['Construcción de palabras'], span: 5, last: 0, obs: [] },
    { name: 'Juan', code: '4567', avatarId: 'frog', level: 1, counts: { phonological: 5, reading: 3, writing: 2 }, weak: ['Clasificación por sonido inicial', 'Reconocimiento de letras'], span: 2, last: 4,
      prefs: { autoRead: true, largeButtons: true, largeText: true }, obs: [{ d: 4, t: 'Requiere apoyo visual para construir frases.' }] }
  ];
  DB.students = []; DB.results = [];
  profiles.forEach((p, pi) => {
    const st = {
      id: 'demo-' + p.code, name: p.name, code: p.code, avatarId: p.avatarId, createdAt: new Date(now - (p.span + p.last + 2) * DAY).toISOString(),
      level: p.level, completedActivities: [], achievements: [], preferences: Object.assign({}, DEFAULT_PREFS, p.prefs || {}),
      observations: p.obs.map(o => ({ id: uid('ob'), date: new Date(now - o.d * DAY).toISOString(), text: o.t, teacherId: 'docente-1' })),
      lastAccess: null, avatarChosen: true
    };
    let weakSeen = 0;
    MOD_ORDER.forEach(m => {
      const list = actsOf(m).slice(0, p.counts[m]);
      list.forEach((a, j) => {
        const f = (j + 0.5) / Math.max(1, list.length);
        const daysAgo = p.last + Math.round((1 - f) * (p.span - 1));
        const weak = p.weak.indexOf(a.skill) >= 0;
        let minute = 0;
        const mk = (errors, hints, completed) => {
          const steps = stepsOf(a);
          const t0 = new Date(now - daysAgo * DAY); t0.setHours(9 + (pi % 3), 5 + ((j * 7 + pi * 11) % 40) + minute, 0, 0);
          if (t0.getTime() > now) t0.setTime(now - (list.length - j + 1) * 6 * 60000);
          minute += 15;
          const dur = Math.round(a.estimatedTime * 60 * (0.5 + rand()) + errors * 12);
          st.completedActivities.indexOf(a.id) < 0 && completed && st.completedActivities.push(a.id);
          DB.results.push({
            id: uid('res'), studentId: st.id, activityId: a.id, module: m,
            score: completed ? clamp(100 - 15 * errors - 6 * hints, 40, 100) : 0,
            attempts: completed ? steps + errors : errors, errors, hintsUsed: hints, completed,
            durationSeconds: dur, startedAt: t0.toISOString(), completedAt: completed ? new Date(t0.getTime() + dur * 1000).toISOString() : undefined
          });
        };
        if (weak) {
          if (rand() < 0.5) mk(ri(1, 2), 0, false);
          mk(ri(3, 5), ri(1, 2), true);
          weakSeen++;
          if (weakSeen > 1 && rand() < 0.4) mk(0, 0, true);   // la 1.ª queda como "requiere práctica"; algunas siguientes se recuperan
        } else {
          if (rand() < 0.12) mk(1, 0, false);
          const e = rand() < 0.28 ? 1 : (rand() < 0.08 ? 2 : 0);
          mk(e, e && rand() < 0.3 ? 1 : 0, true);
        }
      });
    });
    const mine = DB.results.filter(r => r.studentId === st.id);
    st.lastAccess = mine.map(r => r.completedAt || r.startedAt).sort().pop() || null;
    evaluateAchievements(st);
    DB.students.push(st);
  });
  saveStudents(); saveResults();
  saveAccessibilityPreferences(DEFAULT_PREFS);
  lsWrite(KEYS.seeded, true);
}
function restoreDemo() {
  setStudentSession(null);
  seedDemo();
}
function clearLocalData() {
  setStudentSession(null);
  DB.students = []; DB.results = []; DB.links = [];
  saveStudents(); saveResults(); saveLinks();
  saveAccessibilityPreferences(DEFAULT_PREFS);
  lsWrite(KEYS.seeded, true);   // evita que se vuelvan a cargar los datos demo automáticamente
}
/* Carga los datos al abrir la app; si es la primera vez, crea los datos demo. */
function bootDB() {
  const first = !lsHas(KEYS.students) && !lsRead(KEYS.seeded, false);
  const ss = lsRead(KEYS.students, []), rs = lsRead(KEYS.results, []);
  DB.students = Array.isArray(ss) ? ss : [];
  DB.results = Array.isArray(rs) ? rs : [];
  const ls = lsRead(KEYS.links, []);
  DB.links = Array.isArray(ls) ? ls.filter(l => l && l.id && normalizeUrl(l.url) && MOD_ALL[l.module]) : [];
  DB.students.forEach(s => {          // migración defensiva: asegura todos los campos
    s.completedActivities = s.completedActivities || []; s.achievements = s.achievements || [];
    s.observations = s.observations || []; s.preferences = Object.assign({}, DEFAULT_PREFS, s.preferences || {});
    s.level = clamp(+s.level || 1, 1, 5);
  });
  DB.prefs = Object.assign({}, DEFAULT_PREFS, lsRead(KEYS.prefs, {}) || {});
  if (first) seedDemo();
  return first;
}
