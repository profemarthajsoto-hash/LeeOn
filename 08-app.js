/* =====================================================================
   LeeOn — 08 APP: rutas (hash), eventos globales y arranque
   Rutas:  #/  #/student  #/student/dashboard  #/student/module/:id
           #/student/activity/:id  #/student/link/:id  #/student/progress  #/student/achievements
           #/student/avatar  #/teacher  #/teacher/dashboard  #/teacher/students
           #/teacher/students/:id  #/teacher/progress  #/teacher/activities  #/teacher/links
           #/teacher/analytics  #/teacher/settings  #/teacher/preview/:id
   ===================================================================== */
function route() {
  if (view.cleanup) { try { view.cleanup(); } catch (e) { console.error(e); } view.cleanup = null; }
  const parts = (location.hash || '#/').replace(/^#/, '').split('/').filter(Boolean);
  if (parts[0] === 'teacher') touchTeacher(); else setTeacherSession(false);   // salir del panel = bloquearlo
  applyPrefs();
  try {
    if (!parts.length) viewHome();
    else if (parts[0] === 'student') routeStudent(parts);
    else if (parts[0] === 'teacher') routeTeacher(parts);
    else viewHome();
  } catch (e) { console.error(e); errorView(); }
  const m = $('#main'); if (m) { m.setAttribute('tabindex', '-1'); try { m.focus({ preventScroll: true }); } catch (e) { /* nada */ } }
}
function routeStudent(p) {
  const st = currentStudent();
  if (!p[1]) return st ? go('#/student/dashboard') : viewStudentLogin();
  if (!st) { setStudentSession(null); return go('#/student'); }
  switch (p[1]) {
    case 'dashboard': return viewDashboard(st);
    case 'module': return viewModule(st, p[2]);
    case 'activity': return viewActivity(p[2], false);
    case 'link': return viewLink(st, p[2]);
    case 'progress': return viewProgress(st);
    case 'achievements': return viewAchievements(st);
    case 'avatar': return viewAvatar(st);
    default: return viewDashboard(st);
  }
}
function routeTeacher(p) {
  /* requireTeacherAuth() es la única puerta hacia cualquier vista docente: si no hay sesión
     vigente, nunca se dibuja el panel (ni el dashboard, ni estudiantes, ni enlaces...). */
  if (!p[1]) return requireTeacherAuth() ? go('#/teacher/dashboard') : viewTeacherLogin();
  if (!requireTeacherAuth()) return go('#/teacher');
  switch (p[1]) {
    case 'dashboard': return viewTDash();
    case 'students': return p[2] ? viewTStudent(p[2]) : viewTStudents();
    case 'progress': return viewTProgress();
    case 'activities': return viewTActivities();
    case 'links': return viewTLinks();
    case 'analytics': return viewTAnalytics();
    case 'settings': return viewTSettings();
    case 'preview': return viewActivity(p[2], true);
    default: return viewTDash();
  }
}

/* Un solo manejador de clics para toda la app: data-go (navegar) y data-act (acciones) */
document.addEventListener('click', e => {
  const g = e.target.closest('[data-go]');
  if (g) { e.preventDefault(); go(g.dataset.go); return; }
  const a = e.target.closest('[data-act]');
  if (a && ACT[a.dataset.act]) { e.preventDefault(); try { const r = ACT[a.dataset.act](a, e); if (r && r.catch) r.catch(console.error); } catch (err) { console.error(err); } }
});
window.addEventListener('hashchange', route);
/* Actividad del docente (cada 30 s como máximo) y bloqueo por inactividad */
let lastTouch = 0;
document.addEventListener('click', () => { const n = Date.now(); if (n - lastTouch > 30000) { lastTouch = n; touchTeacher(); } }, true);
setInterval(() => {
  const p = (location.hash || '').replace(/^#\/?/, '').split('/').filter(Boolean);
  if (p[0] === 'teacher' && p[1] && !requireTeacherAuth()) { toast('Por seguridad, el panel se bloqueó.', '🔒'); go('#/teacher'); }
}, 30000);
/* Enlace "Saltar al contenido" (no usa #hash para no chocar con el enrutador) */
const skipBtn = $('#skip'); if (skipBtn) skipBtn.addEventListener('click', () => { const m = $('#main'); if (m) m.focus(); });

/* Arranque */
bootDB();
Voice.init();
applyPrefs();
route();
