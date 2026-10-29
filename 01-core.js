/* =====================================================================
   LeeOn — 01 NÚCLEO
   Utilidades, servicio de almacenamiento (localStorage), preferencias,
   voz (Web Speech API) y efectos de sonido suaves.
   ===================================================================== */

/* ---------- Utilidades ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = p => (p || 'id') + '_' + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-3);
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const sum = a => a.reduce((x, y) => x + y, 0);
const avg = a => (a.length ? sum(a) / a.length : 0);
const pick = a => a[Math.floor(Math.random() * a.length)];
const norm = s => String(s == null ? '' : s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-zñ0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();

function shuffle(a) {
  const b = a.slice();
  for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; }
  return b;
}
/* Mezcla evitando que el resultado quede igual al orden correcto (si hay más de 1 elemento distinto) */
function shuffleNot(a, keyFn) {
  const k = keyFn || (x => x);
  const target = a.map(k).join('|');
  if (new Set(a.map(k)).size < 2) return a.slice();
  for (let i = 0; i < 20; i++) { const b = shuffle(a); if (b.map(k).join('|') !== target) return b; }
  return a.slice().reverse();
}
const dayKey = d => { const x = new Date(d); return x.getFullYear() + '-' + (x.getMonth() + 1) + '-' + x.getDate(); };
const fmtDate = iso => { const d = new Date(iso); return String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0') + '/' + d.getFullYear(); };
const fmtDateShort = iso => { const d = new Date(iso); return String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0'); };
function relDay(iso) {
  if (!iso) return 'Sin actividad';
  const a = new Date(); a.setHours(0, 0, 0, 0);
  const b = new Date(iso); b.setHours(0, 0, 0, 0);
  const n = Math.round((a - b) / 86400000);
  return n <= 0 ? 'Hoy' : n === 1 ? 'Ayer' : 'Hace ' + n + ' días';
}
function fmtDur(sec) {
  sec = Math.round(sec || 0);
  if (sec < 60) return sec + ' s';
  const m = Math.floor(sec / 60), s = sec % 60;
  return m < 60 ? m + ' min' + (s >= 30 ? ' ' + s + ' s' : '') : Math.floor(m / 60) + ' h ' + (m % 60) + ' min';
}

/* ---------- Constantes de módulos ---------- */
const MOD = {
  phonological: { id: 'phonological', name: 'Conciencia fonológica', short: 'Sonidos', dot: '🔵', icon: '👂', cls: 'blue', desc: 'Escucha y juega con los sonidos' },
  reading: { id: 'reading', name: 'Lectura', short: 'Lectura', dot: '🟢', icon: '📖', cls: 'green', desc: 'Lee letras, palabras y cuentos' },
  writing: { id: 'writing', name: 'Escritura', short: 'Escritura', dot: '🟠', icon: '✏️', cls: 'orange', desc: 'Escribe letras, palabras y frases' }
};
const MOD_ORDER = ['phonological', 'reading', 'writing'];
/* "General" no es un módulo de aprendizaje (no tiene actividades ni progreso propio):
   solo sirve para clasificar enlaces que no son de un módulo concreto. Por eso vive
   aparte de MOD/MOD_ORDER y nunca debe agregarse a ese arreglo. Los enlaces "general"
   se muestran siempre en el tablero del estudiante, sin depender de ningún nivel. */
const MOD_GENERAL = { id: 'general', name: 'General', short: 'General', dot: '⭐', icon: '🌟', cls: 'gray', desc: 'Para cualquier momento' };
const MOD_ALL = Object.assign({ general: MOD_GENERAL }, MOD);
/* Nombres de los 5 niveles de cada módulo (para cambiar la progresión edita aquí) */
const LEVEL_NAMES = {
  phonological: ['Escucho y reconozco', 'Sonido inicial', 'Sonido final', 'Sílabas', 'Construyo palabras'],
  reading: ['Letras', 'Sílabas', 'Palabras', 'Oraciones', 'Textos cortos'],
  writing: ['Trazos y letras', 'Copio sílabas y palabras', 'Construyo palabras', 'Construyo frases', 'Escribo lo que veo']
};
const DIFF = { easy: '🟢 Fácil', medium: '🟡 En progreso', challenge: '🔵 Desafío' };

/* ---------- Servicio de almacenamiento ---------- */
const KEYS = {
  students: 'leeon_students',
  results: 'leeon_activity_results',
  prefs: 'leeon_preferences',
  teacher: 'leeon_teacher_session',
  student: 'leeon_student_session',
  links: 'leeon_links',
  teacherAuth: 'leeon_teacher_auth',   // { salt, hash, rsalt, rhash } (solo huellas, nunca la contraseña)
  teacherLock: 'leeon_teacher_lock',   // bloqueo temporal tras intentos fallidos
  seeded: 'leeon_seeded_v1'
};
const memStore = {};       // respaldo en memoria si localStorage no está disponible
let storageOK = true;
function lsRead(key, fallback) {
  try {
    const v = window.localStorage.getItem(key);
    if (v === null) return (!storageOK && key in memStore) ? memStore[key] : fallback;   // la copia en memoria solo se usa si el almacenamiento falló
    return JSON.parse(v);
  } catch (e) { storageOK = false; return key in memStore ? memStore[key] : fallback; }
}
function lsWrite(key, val) {
  memStore[key] = val;
  try { window.localStorage.setItem(key, JSON.stringify(val)); return true; }
  catch (e) { storageOK = false; console.warn('LeeOn: no se pudo guardar', key); return false; }
}
function lsRemove(key) {
  delete memStore[key];
  try { window.localStorage.removeItem(key); } catch (e) { /* nada */ }
}
function lsHas(key) {
  try { return window.localStorage.getItem(key) !== null; } catch (e) { return key in memStore; }
}

/* Base de datos en memoria (se sincroniza con localStorage en cada cambio) */
const DB = { students: [], results: [], links: [], prefs: null };
const DEFAULT_PREFS = { audioEnabled: true, autoRead: false, reducedMotion: false, largeText: false, highContrast: false, largeButtons: false, calmMode: false };

function getStudents() { return DB.students; }
function saveStudents() { lsWrite(KEYS.students, DB.students); }
function getStudent(id) { return DB.students.find(s => s.id === id) || null; }
function addStudent(data) {
  const st = Object.assign({
    id: uid('st'), name: '', code: '', avatarId: 'lion', createdAt: new Date().toISOString(), level: 1,
    completedActivities: [], achievements: [], preferences: Object.assign({}, DEFAULT_PREFS),
    observations: [], lastAccess: null, avatarChosen: true
  }, data);
  DB.students.push(st); saveStudents(); return st;
}
function updateStudent(id, patch) {
  const st = getStudent(id); if (!st) return null;
  Object.assign(st, patch); saveStudents(); return st;
}
function deleteStudent(id) {
  DB.students = DB.students.filter(s => s.id !== id);
  DB.results = DB.results.filter(r => r.studentId !== id);
  saveStudents(); saveResults();
  if (getSession().student === id) setStudentSession(null);
}
function getActivityResults() { return DB.results; }
function saveResults() { lsWrite(KEYS.results, DB.results); }
function saveActivityResult(res) { DB.results.push(res); saveResults(); return res; }
function resultsFor(studentId) { return DB.results.filter(r => r.studentId === studentId).sort((a, b) => new Date(a.startedAt) - new Date(b.startedAt)); }

/* ---------- Enlaces externos (los agrega cada docente) ---------- */
/* link = { id, title, url, module, level, icon, createdAt } */
function getLinks() { return DB.links; }
function saveLinks() { lsWrite(KEYS.links, DB.links); }
function getLink(id) { return DB.links.find(l => l.id === id) || null; }
function addLink(d) {
  const l = Object.assign({ id: uid('link'), title: '', url: '', module: 'reading', level: 1, icon: '🔗', createdAt: new Date().toISOString() }, d);
  DB.links.push(l); saveLinks(); return l;
}
function updateLink(id, patch) { const l = getLink(id); if (!l) return null; Object.assign(l, patch); saveLinks(); return l; }
function deleteLink(id) { DB.links = DB.links.filter(l => l.id !== id); saveLinks(); }
/* Solo se aceptan direcciones http(s). Si falta el "https://", se agrega. Devuelve null si no es válida. */
function normalizeUrl(raw) {
  let u = String(raw || '').trim(); if (!u) return null;
  if (!/^[a-z][a-z0-9+.-]*:/i.test(u)) u = 'https://' + u;
  try { const x = new URL(u); if (x.protocol !== 'https:' && x.protocol !== 'http:') return null; if (x.hostname.indexOf('.') < 0) return null; return x.href; }
  catch (e) { return null; }
}
const linkHost = url => { try { return new URL(url).hostname.replace(/^www\./, ''); } catch (e) { return ''; } };

function getAccessibilityPreferences() { return Object.assign({}, DEFAULT_PREFS, DB.prefs || {}); }
function saveAccessibilityPreferences(p) { DB.prefs = Object.assign({}, DEFAULT_PREFS, p); lsWrite(KEYS.prefs, DB.prefs); }

/* Sesiones */
/* La sesión docente caduca sola tras 30 min sin actividad y se cierra al salir del panel. */
const TEACHER_IDLE_MS = 30 * 60 * 1000;
function getSession() {
  let t = lsRead(KEYS.teacher, null);
  if (t && (!t.last || Date.now() - t.last > TEACHER_IDLE_MS)) { lsRemove(KEYS.teacher); t = null; }
  return { student: lsRead(KEYS.student, null), teacher: t };
}
function touchTeacher() { const t = getSession().teacher; if (t) { t.last = Date.now(); lsWrite(KEYS.teacher, t); } }   // no revive una sesión ya caducada
function setStudentSession(id) { if (id) lsWrite(KEYS.student, id); else lsRemove(KEYS.student); }
function setTeacherSession(on) { if (on) lsWrite(KEYS.teacher, { teacherId: 'docente-1', since: new Date().toISOString(), last: Date.now() }); else lsRemove(KEYS.teacher); }
/* Guardia única para toda vista/ruta docente: true solo si hay una sesión docente vigente (ver 07a-auth.js para la expiración por inactividad). Ninguna pantalla del panel debe dibujarse sin pasar por aquí primero. */
function requireTeacherAuth() { return !!getSession().teacher; }
function currentStudent() { const id = getSession().student; return id ? getStudent(id) : null; }

/* ---------- Preferencias de accesibilidad ---------- */
/* Si hay un estudiante con sesión se usan sus preferencias; si no, las globales. */
function prefs() {
  const s = currentStudent();
  return Object.assign({}, DEFAULT_PREFS, s ? s.preferences : DB.prefs);
}
function savePrefs(p) {
  const s = currentStudent();
  if (s) { s.preferences = Object.assign({}, DEFAULT_PREFS, p); saveStudents(); }
  else saveAccessibilityPreferences(p);
  applyPrefs();
}
function applyPrefs() {
  const p = prefs(), h = document.documentElement.classList;
  h.toggle('lt', !!p.largeText);
  h.toggle('hc', !!p.highContrast);
  h.toggle('lb', !!p.largeButtons);
  h.toggle('rm', !!p.reducedMotion);
  h.toggle('calm', !!p.calmMode);
}
const motionOK = () => {
  const p = prefs();
  if (p.reducedMotion || p.calmMode) return false;
  try { return !window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return true; }
};

/* ---------- Voz (Web Speech API) ---------- */
const Voice = {
  supported: 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window,
  last: '', voice: null,
  init() {
    if (!this.supported) return;
    const pickVoice = () => {
      try {
        const vs = window.speechSynthesis.getVoices();
        this.voice = vs.find(v => /^es[-_](CO|MX|US|419)/i.test(v.lang)) || vs.find(v => /^es/i.test(v.lang)) || null;
      } catch (e) { /* nada */ }
    };
    pickVoice();
    try { window.speechSynthesis.onvoiceschanged = pickVoice; } catch (e) { /* nada */ }
  },
  /* opts.user = true → el niño pulsó un botón de audio (suena aunque los sonidos automáticos estén apagados) */
  speak(text, opts) {
    opts = opts || {};
    if (!text) return false;
    this.last = text;
    if (!this.supported) return false;
    if (!opts.user && !prefs().audioEnabled) return false;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = this.voice ? this.voice.lang : 'es-ES';
      if (this.voice) u.voice = this.voice;
      u.rate = opts.rate || 0.85; u.pitch = 1.05;
      window.speechSynthesis.speak(u);
      return true;
    } catch (e) { return false; }
  },
  stop() { try { if (this.supported) window.speechSynthesis.cancel(); } catch (e) { /* nada */ } }
};
const speak = (t, o) => Voice.speak(t, o);

/* ---------- Efectos de sonido suaves (WebAudio, volumen bajo) ---------- */
let audioCtx = null;
function sfx(kind) {
  const p = prefs();
  if (!p.audioEnabled || p.calmMode) return;
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const seqs = { ok: [523, 659, 784], badge: [659, 784, 988, 1319], soft: [392, 349] };
    const seq = seqs[kind] || seqs.soft;
    let t = audioCtx.currentTime;
    seq.forEach(f => {
      const o = audioCtx.createOscillator(), g = audioCtx.createGain();
      o.type = 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.06, t + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
      o.connect(g); g.connect(audioCtx.destination); o.start(t); o.stop(t + 0.25); t += 0.13;
    });
  } catch (e) { /* sin audio: la app sigue funcionando */ }
}
