/* =====================================================================
   LeeOn — 07 PANEL DOCENTE
   Inicio · Estudiantes · Progreso · Actividades · Interacciones · Configuración
   Sin rankings: las listas se ordenan alfabéticamente y cada estudiante
   se compara únicamente con su propio recorrido.
   ===================================================================== */

const tState = { hist: { module: '', level: '', status: '' }, an: { student: '', module: '', level: '', status: '' }, act: { module: '', level: '' } };
const byName = (a, b) => a.name.localeCompare(b.name, 'es');
const sortedStudents = () => getStudents().slice().sort(byName);

function tShell(active, inner) {
  const nav = [['dashboard', '🏠', 'Inicio'], ['students', '👥', 'Estudiantes'], ['progress', '📊', 'Progreso'], ['activities', '📝', 'Actividades'], ['links', '🔗', 'Enlaces'], ['analytics', '🔎', 'Interacciones'], ['settings', '⚙️', 'Configuración']];
  return `<div class="tshell"><nav class="tside" aria-label="Menú docente"><div class="brand"><span style="width:38px;display:inline-block">${lionSVG('happy')}</span> LeeOn</div>
    ${nav.map(n => `<button type="button" class="navb" data-go="#/teacher/${n[0]}" ${n[0] === active ? 'aria-current="page"' : ''}><span aria-hidden="true">${n[1]}</span> ${n[2]}</button>`).join('')}
    <button type="button" class="navb" data-act="tlogout">🔒 Salir y bloquear</button></nav>
    <main id="main" class="tmain">${inner}</main></div>`;
}

/* ---------- Inicio: resumen del grupo ---------- */
function viewTDash() {
  const g = getGroupSummary(), sts = sortedStudents();
  const rows = sts.map(s => {
    const p = getStudentProgress(s.id), an = getStudentAnalytics(s.id);
    return `<tr><td><div class="row" style="flex-wrap:nowrap">${avatarHTML(s.avatarId, 40)}<b>${esc(s.name)}</b></div></td>${MOD_ORDER.map(m => `<td class="mini">${bar(p.modules[m].pct, MOD[m].cls, MOD[m].name)}<span class="small">${p.modules[m].pct}%</span></td>`).join('')}<td>${relDay(an.lastAccess)}</td><td><button type="button" class="btn btn-sm btn-soft" data-go="#/teacher/students/${s.id}">Ver</button></td></tr>`;
  }).join('');
  const reinf = [];
  sts.forEach(s => getActivitiesNeedingReinforcement(s.id).forEach(r => reinf.push({ s, r })));
  show(tShell('dashboard', `<h1>🏠 Resumen del grupo</h1>
    <div class="grid g4" style="margin-bottom:1rem">
      <div class="card kpi"><span class="n">${g.students}</span>👥 Estudiantes</div>
      <div class="card kpi"><span class="n">${g.active}</span>🟢 Activos (7 días)</div>
      <div class="card kpi"><span class="n">${g.done}</span>🎯 Actividades realizadas</div>
      <div class="card kpi"><span class="n">${g.completed}</span>⭐ Actividades completadas</div>
      <div class="card kpi"><span class="n">${g.avg}%</span>📈 Promedio de progreso</div></div>
    <div class="card" style="margin-bottom:1rem"><h2>Progreso promedio por módulo</h2>${MOD_ORDER.map(m => barLine(MOD[m].short, g.mods[m], MOD[m].cls)).join('<div style="height:.5rem"></div>')}</div>
    <h2>Estudiantes</h2>${sts.length ? `<div class="tablewrap"><table><thead><tr><th>Estudiante</th><th>Conciencia fonológica</th><th>Lectura</th><th>Escritura</th><th>Última actividad</th><th></th></tr></thead><tbody>${rows}</tbody></table></div><p class="muted small">Orden alfabético. LeeOn no compara estudiantes entre sí.</p>` : `<div class="card empty">Aún no hay estudiantes. <button type="button" class="btn btn-orange" data-go="#/teacher/students">➕ Agregar estudiante</button></div>`}
    <h2 style="margin-top:1.4rem">🟡 Actividades que requieren práctica</h2>
    ${reinf.length ? `<ul class="notes">${reinf.slice(0, 10).map(x => `<li><b>${esc(x.s.name)}</b> · ${esc(x.r.activity.title)} <span class="pill try">🟡 Requiere práctica</span><br><span class="small muted">${x.r.info.reasons.join(' · ')}</span></li>`).join('')}</ul><p class="muted small">Es una orientación pedagógica, no un diagnóstico.${reinf.length > 10 ? ' Se muestran 10; ver el detalle en cada perfil.' : ''}</p>` : '<div class="card empty">Ninguna por ahora. ¡Buen trabajo!</div>'}`));
}

/* ---------- Formulario de estudiante (crear / editar) ---------- */
function studentForm(pf, st) {
  const av = st ? st.avatarId : 'lion';
  const lvlNames = ['Empieza desde el inicio', 'Ya reconoce sonidos', 'Reconoce sonido final', 'Trabaja con sílabas', 'Lee y escribe palabras'];
  return `<label class="fl" for="${pf}-name">Nombre (solo nombre de pila o apodo)</label><input class="f" id="${pf}-name" maxlength="20" autocomplete="off" value="${st ? esc(st.name) : ''}">
    <label class="fl" for="${pf}-code">Código (4 números)</label><div class="row"><input class="f" id="${pf}-code" inputmode="numeric" maxlength="4" autocomplete="off" style="flex:1;min-width:120px" value="${st ? esc(st.code) : ''}"><button type="button" class="btn btn-soft btn-sm" data-act="gen-code" data-pf="${pf}">🎲 Crear código</button></div>
    <label class="fl">Avatar</label><div class="row" id="${pf}-av" role="group" aria-label="Avatar">${AVATARS.map(a => `<button type="button" class="av-tile" data-av="${a.id}" aria-pressed="${a.id === av}" style="padding:.4rem" aria-label="${a.name}">${avatarHTML(a.id, 52)}</button>`).join('')}</div>
    <label class="fl" for="${pf}-lvl">Nivel inicial</label><select class="f" id="${pf}-lvl">${[1, 2, 3, 4, 5].map(n => `<option value="${n}"${st && st.level === n ? ' selected' : ''}>Nivel ${n} · ${lvlNames[n - 1]}</option>`).join('')}</select>
    ${st ? '' : `<label class="fl" for="${pf}-obs">Observaciones (opcional)</label><textarea class="f" id="${pf}-obs" rows="2" maxlength="300" placeholder="Ej.: Necesita apoyo visual"></textarea>`}
    <div class="err" id="${pf}-err" role="alert"></div><p class="small muted">No escribas apellidos, datos médicos ni diagnósticos.</p>`;
}
function wireStudentForm(root, pf) {
  $$('#' + pf + '-av .av-tile', root).forEach(b => b.addEventListener('click', () => { $$('#' + pf + '-av .av-tile', root).forEach(x => x.setAttribute('aria-pressed', String(x === b))); }));
}
ACT['gen-code'] = el => {
  const pf = el.dataset.pf; let c, n = 0;
  do { c = String(Math.floor(1000 + Math.random() * 9000)); n++; } while (getStudents().some(s => s.code === c) && n < 50);
  $('#' + pf + '-code').value = c;
};
function readStudentForm(pf, selfId) {
  const name = ($('#' + pf + '-name').value || '').trim(), code = ($('#' + pf + '-code').value || '').trim();
  const avBtn = $('#' + pf + '-av .av-tile[aria-pressed="true"]'), lvl = +$('#' + pf + '-lvl').value;
  const obsEl = $('#' + pf + '-obs'), err = $('#' + pf + '-err');
  let msg = '';
  if (!name) msg = 'Escribe el nombre del estudiante.';
  else if (!/^\d{4}$/.test(code)) msg = 'El código debe tener 4 números.';
  else if (getStudents().some(s => s.code === code && s.id !== selfId)) msg = 'Este código ya está siendo utilizado. Usa 🎲 Crear código.';
  if (msg) { err.textContent = msg; return null; }
  return { name, code, avatarId: avBtn ? avBtn.dataset.av : 'lion', level: lvl, obs: obsEl ? obsEl.value.trim() : '' };
}

/* ---------- Estudiantes ---------- */
function viewTStudents() {
  const sts = sortedStudents();
  const rows = sts.map(s => { const p = getStudentProgress(s.id); return `<tr><td><div class="row" style="flex-wrap:nowrap">${avatarHTML(s.avatarId, 40)}<b>${esc(s.name)}</b></div></td><td>${esc(s.code)}</td><td>Nivel ${p.level}</td><td>${p.avg}%</td><td><div class="row"><button type="button" class="btn btn-sm btn-soft" data-go="#/teacher/students/${s.id}">Ver</button><button type="button" class="btn btn-sm btn-ghost" data-act="edit-st" data-id="${s.id}">✏️ Editar</button><button type="button" class="btn btn-sm btn-danger" data-act="del-st" data-id="${s.id}">🗑️ Eliminar</button></div></td></tr>`; }).join('');
  show(tShell('students', `<h1>👥 Estudiantes</h1>
    <div class="card" style="margin-bottom:1.2rem;max-width:640px"><h2>➕ Agregar estudiante</h2>${studentForm('new')}<button type="button" class="btn btn-green" data-act="add-st">➕ Agregar estudiante</button></div>
    ${sts.length ? `<div class="tablewrap"><table><thead><tr><th>Estudiante</th><th>Código</th><th>Nivel</th><th>Progreso</th><th>Acciones</th></tr></thead><tbody>${rows}</tbody></table></div>` : '<div class="card empty">Todavía no hay estudiantes.</div>'}`),
    root => wireStudentForm(root, 'new'));
}
ACT['add-st'] = () => {
  const f = readStudentForm('new', null); if (!f) return;
  const st = addStudent({ name: f.name, code: f.code, avatarId: f.avatarId, level: f.level, observations: f.obs ? [{ id: uid('ob'), date: new Date().toISOString(), text: f.obs, teacherId: 'docente-1' }] : [] });
  showToast('Estudiante agregado: ' + st.name + '.', 'success'); viewTStudents();
};
ACT['edit-st'] = el => {
  const st = getStudent(el.dataset.id); if (!st) return;
  const m = openModal({
    title: '✏️ Editar estudiante', html: studentForm('ed', st),
    actions: [{ label: 'Cancelar', cls: 'btn-soft' }, {
      label: '✔ Guardar', cls: 'btn-green', onClick: () => {
        const f = readStudentForm('ed', st.id); if (!f) return false;
        updateStudent(st.id, { name: f.name, code: f.code, avatarId: f.avatarId, level: f.level });
        showToast('Estudiante actualizado.', 'success'); route();
      }
    }]
  });
  wireStudentForm(m.el, 'ed');
};
ACT['del-st'] = async el => {
  const st = getStudent(el.dataset.id); if (!st) return;
  if (await confirmDialog('🗑️ Eliminar estudiante', '¿Seguro que deseas eliminar este estudiante? (' + esc(st.name) + ') También se borrarán sus resultados.', 'Sí, eliminar', 'No, cancelar')) {
    deleteStudent(st.id); showToast('Estudiante eliminado.', 'success'); route();
  }
};

/* ---------- Historial (tabla) ---------- */
function historyRows(sid, f) {
  const reinfIds = new Set(getActivitiesNeedingReinforcement(sid).map(r => r.activity.id));
  return resultsFor(sid).slice().reverse().filter(r => {
    const a = resultActivity(r); if (!a) return false;
    if (f.module && a.module !== f.module) return false;
    if (f.level && a.level !== +f.level) return false;
    if (f.status === 'completed' && !r.completed) return false;
    if (f.status === 'incomplete' && r.completed) return false;
    if (f.status === 'reinforcement' && !reinfIds.has(a.id)) return false;
    return true;
  }).map(r => ({ r, a: resultActivity(r), flag: reinfIds.has(r.activityId) }));
}
function historyTable(rows, withName) {
  if (!rows.length) return '<div class="card empty">No hay registros con estos filtros.</div>';
  return `<div class="tablewrap"><table><thead><tr><th>Fecha</th>${withName ? '<th>Estudiante</th>' : ''}<th>Módulo</th><th>Actividad</th><th>Resultado</th><th>Intentos</th><th>Pistas</th><th>Duración</th><th>Puntaje</th></tr></thead><tbody>${rows.map(x => `<tr><td>${fmtDateShort(x.r.startedAt)}</td>${withName ? `<td>${esc((getStudent(x.r.studentId) || {}).name || '?')}</td>` : ''}<td>${MOD_ALL[x.a.module].name}</td><td>${x.r.link ? '🔗 ' : ''}${esc(x.a.title)}<br><span class="small muted">${x.r.link ? 'Enlace externo' : x.a.id + ' · ' + esc(x.a.skill)}</span></td><td>${x.r.link ? '✓ Terminó (enlace)' : x.r.completed ? '✓ Completada' : 'En progreso'}${x.flag ? '<br><span class="pill try">🟡 Requiere práctica</span>' : ''}</td><td>${x.r.link ? '—' : x.r.attempts}</td><td>${x.r.link ? '—' : x.r.hintsUsed}</td><td>${fmtDur(x.r.durationSeconds)}</td><td>${x.r.link || !x.r.completed ? '—' : x.r.score + '%'}</td></tr>`).join('')}</tbody></table></div>`;
}
const filterSelects = (f, pf, withStudent) => `<div class="filters">${withStudent ? `<label>Estudiante<select class="f" data-f="student"><option value="">Todos</option>${sortedStudents().map(s => `<option value="${s.id}"${f.student === s.id ? ' selected' : ''}>${esc(s.name)}</option>`).join('')}</select></label>` : ''}
  <label>Módulo<select class="f" data-f="module"><option value="">Todos</option>${MOD_ORDER.concat(['general']).map(m => `<option value="${m}"${f.module === m ? ' selected' : ''}>${MOD_ALL[m].name}</option>`).join('')}</select></label>
  <label>Nivel<select class="f" data-f="level"><option value="">Todos</option>${[1, 2, 3, 4, 5].map(n => `<option value="${n}"${String(f.level) === String(n) ? ' selected' : ''}>Nivel ${n}</option>`).join('')}</select></label>
  <label>Estado<select class="f" data-f="status"><option value="">Todos</option><option value="completed"${f.status === 'completed' ? ' selected' : ''}>Completadas</option><option value="incomplete"${f.status === 'incomplete' ? ' selected' : ''}>Pendientes / en progreso</option><option value="reinforcement"${f.status === 'reinforcement' ? ' selected' : ''}>Requieren refuerzo</option></select></label></div>`;

function tallyHTML(skills) {
  if (!skills.length) return '<p class="muted">Sin datos todavía.</p>';
  return skills.slice().sort((a, b) => a.skill.localeCompare(b.skill, 'es')).map(s => {
    const t = s.ok + s.not, pct = t ? Math.round(100 * s.ok / t) : 0;
    return `<div class="tally"><span class="nm">${esc(s.skill)}</span><div class="seg" role="img" aria-label="${s.ok} logradas, ${s.not} por practicar"><i class="g" style="width:${pct}%"></i><i class="y" style="width:${100 - pct}%"></i></div><span class="small" style="min-width:8.5rem">✓ ${s.ok} &nbsp; ○ ${s.not}${pct < 60 && t >= 2 ? ' 🟡' : ''}</span></div>`;
  }).join('');
}

/* ---------- Perfil detallado del estudiante ---------- */
function viewTStudent(id) {
  const st = getStudent(id);
  if (!st) return show(tShell('students', `<div class="card empty"><h2>No encontré a ese estudiante</h2><button type="button" class="btn btn-blue" data-go="#/teacher/students">← Estudiantes</button></div>`));
  const p = getStudentProgress(id), an = getStudentAnalytics(id), f = tState.hist;
  show(tShell('students', `<div class="row" style="justify-content:space-between;margin-bottom:1rem"><button type="button" class="btn btn-sm btn-ghost" data-go="#/teacher/students">← Estudiantes</button><div class="row"><button type="button" class="btn btn-sm btn-soft" data-act="edit-st" data-id="${st.id}">✏️ Editar</button><button type="button" class="btn btn-sm btn-soft" data-act="csv-one" data-id="${st.id}">📄 Exportar CSV</button></div></div>
    <div class="card row" style="margin-bottom:1rem">${avatarHTML(st.avatarId, 90)}<div><h1 style="margin:0">${esc(st.name)}</h1><div>Nivel ${p.level} · Código ${esc(st.code)}</div><div class="muted small">Último acceso: ${relDay(an.lastAccess)}</div></div></div>
    <div class="grid g2" style="margin-bottom:1rem"><div class="card"><h2>Progreso por módulo</h2>${MOD_ORDER.map(m => barLine(MOD[m].short, p.modules[m].pct, MOD[m].cls)).join('<div style="height:.5rem"></div>')}</div>
      <div class="card"><h2>Datos generales</h2><div class="grid g3">
        <div class="kpi"><span class="n">${an.totalResults}</span>Actividades realizadas</div><div class="kpi"><span class="n">${an.distinctDone}</span>Completadas</div><div class="kpi"><span class="n">${an.attempts}</span>Intentos</div>
        <div class="kpi"><span class="n">${an.accuracy}%</span>Aciertos</div><div class="kpi"><span class="n">${an.hints}</span>Pistas usadas</div><div class="kpi"><span class="n">${fmtDur(an.timeSec)}</span>Tiempo aprox.</div><div class="kpi"><span class="n">${an.linksDone}</span>🔗 Enlaces terminados</div></div></div></div>
    <div class="grid g2" style="margin-bottom:1rem"><div class="card"><h2>🟡 Requiere práctica</h2>${an.reinforcement.length ? `<ul class="notes">${an.reinforcement.map(x => `<li><b>${esc(x.activity.title)}</b> <span class="small muted">(${esc(x.activity.skill)})</span><br><span class="small">${x.info.reasons.join(' · ')}</span></li>`).join('')}</ul>` : '<p class="muted">Nada por ahora.</p>'}<p class="small muted">Orientación pedagógica, no un diagnóstico.</p>
      ${an.patterns.length ? `<h3>Patrones observados</h3><ul class="notes">${an.patterns.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}</div>
      <div class="card"><h2>Habilidades</h2>${tallyHTML(an.skills)}<p class="small muted">✓ logradas · ○ por practicar</p></div></div>
    <h2>Historial de actividades</h2>${filterSelects(f, 'h', false)}<div id="hist">${historyTable(historyRows(id, f), false)}</div>
    <div class="card" style="margin-top:1.4rem"><h2>📝 Observaciones</h2><label class="fl" for="obs-t" style="margin-top:0">Nueva observación</label><textarea class="f" id="obs-t" rows="2" maxlength="300" placeholder="Escribir observación…"></textarea><div class="row" style="margin:.6rem 0"><button type="button" class="btn btn-green btn-sm" data-act="add-obs" data-id="${st.id}">Guardar</button></div>
      ${st.observations.length ? `<ul class="notes">${st.observations.slice().sort((a, b) => new Date(b.date) - new Date(a.date)).map(o => `<li><b>${fmtDate(o.date)}</b><br>“${esc(o.text)}” <button type="button" class="btn btn-sm btn-ghost" style="min-height:40px" data-act="del-obs" data-id="${st.id}" data-ob="${o.id}" aria-label="Borrar observación">✖</button></li>`).join('')}</ul>` : '<p class="muted">Aún no hay observaciones.</p>'}</div>`),
    root => {
      $$('[data-f]', root).forEach(s => s.addEventListener('change', () => { tState.hist[s.dataset.f] = s.value; $('#hist', root).innerHTML = historyTable(historyRows(id, tState.hist), false); }));
    });
}
ACT['add-obs'] = el => {
  const t = ($('#obs-t').value || '').trim(); if (!t) return;
  const st = getStudent(el.dataset.id); if (!st) return;
  st.observations.push({ id: uid('ob'), date: new Date().toISOString(), text: t, teacherId: 'docente-1' });
  saveStudents(); toast('Observación guardada', '📝'); viewTStudent(st.id);
};
ACT['del-obs'] = async el => {
  const st = getStudent(el.dataset.id); if (!st) return;
  if (await confirmDialog('Borrar observación', '¿Seguro que deseas borrar esta observación?', 'Sí, borrar', 'Cancelar')) { st.observations = st.observations.filter(o => o.id !== el.dataset.ob); saveStudents(); viewTStudent(st.id); }
};

/* ---------- Progreso del grupo ---------- */
function viewTProgress() {
  const sts = sortedStudents();
  const lvlRows = MOD_ORDER.map(m => `<div class="card"><h3>${MOD[m].dot} ${MOD[m].name}</h3>${[1, 2, 3, 4, 5].map(L => {
    const list = actsOf(m, L), tot = list.length * sts.length;
    const done = sum(sts.map(s => list.filter(a => s.completedActivities.includes(a.id)).length));
    return barLine('Nivel ' + L, tot ? 100 * done / tot : 0, MOD[m].cls);
  }).join('<div style="height:.4rem"></div>')}<p class="small muted">${LEVEL_NAMES[m].map((n, i) => (i + 1) + ' ' + n).join(' · ')}</p></div>`).join('');
  show(tShell('progress', `<h1>📊 Progreso</h1>
    <h2>Por estudiante</h2>${sts.length ? `<div class="tablewrap"><table><thead><tr><th>Estudiante</th>${MOD_ORDER.map(m => `<th>${MOD[m].short}</th>`).join('')}<th>Promedio</th></tr></thead><tbody>${sts.map(s => { const p = getStudentProgress(s.id); return `<tr><td><a href="#/teacher/students/${s.id}"><b>${esc(s.name)}</b></a></td>${MOD_ORDER.map(m => `<td class="mini">${bar(p.modules[m].pct, MOD[m].cls, MOD[m].name)}<span class="small">${p.modules[m].done}/${p.modules[m].total} · ${p.modules[m].pct}%</span></td>`).join('')}<td>${p.avg}%</td></tr>`; }).join('')}</tbody></table></div>` : '<div class="card empty">Sin estudiantes.</div>'}
    <h2 style="margin-top:1.4rem">Por nivel (todo el grupo)</h2><div class="grid g3">${lvlRows}</div>`));
}

/* ---------- Catálogo de actividades ---------- */
function viewTActivities() {
  const f = tState.act, sts = getStudents();
  const list = ACTIVITIES.filter(a => (!f.module || a.module === f.module) && (!f.level || a.level === +f.level));
  show(tShell('activities', `<h1>📝 Actividades</h1><p class="muted">${ACTIVITIES.length} actividades. Usa <b>Probar</b> para verlas como las ve el estudiante (no se guarda ningún resultado).</p>
    <div class="filters"><label>Módulo<select class="f" data-f="module"><option value="">Todos</option>${MOD_ORDER.map(m => `<option value="${m}"${f.module === m ? ' selected' : ''}>${MOD[m].name}</option>`).join('')}</select></label>
    <label>Nivel<select class="f" data-f="level"><option value="">Todos</option>${[1, 2, 3, 4, 5].map(n => `<option value="${n}"${String(f.level) === String(n) ? ' selected' : ''}>Nivel ${n}</option>`).join('')}</select></label></div>
    <div class="tablewrap"><table><thead><tr><th>ID</th><th>Actividad</th><th>Habilidad y objetivo</th><th>Dificultad</th><th>Tipo</th><th>Completada por</th><th></th></tr></thead><tbody>${list.map(a => `<tr><td>${a.id}</td><td><b>${esc(a.title)}</b><br><span class="small muted">${MOD[a.module].short} · Nivel ${a.level}</span></td><td><b>${esc(a.skill)}</b><br><span class="small">${esc(a.objective)}</span></td><td>${DIFF[a.difficulty]}</td><td class="small">${a.type}</td><td>${sts.filter(s => s.completedActivities.includes(a.id)).length} de ${sts.length}</td><td><button type="button" class="btn btn-sm btn-soft" data-go="#/teacher/preview/${a.id}">▶ Probar</button></td></tr>`).join('')}</tbody></table></div>`),
    root => $$('[data-f]', root).forEach(s => s.addEventListener('change', () => { tState.act[s.dataset.f] = s.value; viewTActivities(); })));
}

/* ---------- Enlaces externos (Wordwall, Genially, etc.) ---------- */
const LINK_ICONS = ['🔗', '🎮', '🧩', '📺', '🎵', '🔤', '🧠', '⭐'];
function linkForm(pf, l) {
  const ic = l ? l.icon : '🔗', mod = l ? l.module : 'reading', lvl = l ? l.level : 1;
  return `<label class="fl" for="${pf}-title" style="margin-top:0">Título (lo que verá el niño)</label><input class="f" id="${pf}-title" maxlength="40" autocomplete="off" placeholder="Ej.: Sopa de letras con M" value="${l ? esc(l.title) : ''}">
    <label class="fl" for="${pf}-url">Dirección de la página (enlace)</label><input class="f" id="${pf}-url" inputmode="url" autocomplete="off" placeholder="https://wordwall.net/resource/…" value="${l ? esc(l.url) : ''}">
    <div class="row"><label class="fl" style="flex:1;min-width:180px">Módulo<select class="f" id="${pf}-mod" data-mod-select>${MOD_ORDER.concat(['general']).map(m => `<option value="${m}"${m === mod ? ' selected' : ''}>${MOD_ALL[m].dot} ${MOD_ALL[m].name}</option>`).join('')}</select></label>
    <label class="fl" style="flex:1;min-width:140px" id="${pf}-lvl-wrap">Nivel<select class="f" id="${pf}-lvl">${[1, 2, 3, 4, 5].map(n => `<option value="${n}"${n === lvl ? ' selected' : ''}>Nivel ${n}</option>`).join('')}</select></label></div>
    <p class="small muted" id="${pf}-mod-note" style="margin-top:-.3rem"></p>
    <label class="fl">Ícono</label><div class="row" id="${pf}-ic" role="group" aria-label="Ícono">${LINK_ICONS.map(i => `<button type="button" class="av-tile" data-ic="${i}" aria-pressed="${i === ic}" style="padding:.3rem .8rem;font-size:1.8rem" aria-label="Ícono ${i}">${i}</button>`).join('')}</div>
    <div class="err" id="${pf}-err" role="alert"></div>`;
}
function wireLinkForm(root, pf) {
  $$('#' + pf + '-ic .av-tile', root).forEach(b => b.addEventListener('click', () => { $$('#' + pf + '-ic .av-tile', root).forEach(x => x.setAttribute('aria-pressed', String(x === b))); }));
  const modSel = $('#' + pf + '-mod', root), lvlWrap = $('#' + pf + '-lvl-wrap', root), note = $('#' + pf + '-mod-note', root);
  const syncMod = () => {
    const isGeneral = modSel.value === 'general';
    lvlWrap.style.display = isGeneral ? 'none' : '';
    note.textContent = isGeneral ? 'Los enlaces "General" aparecen siempre en el tablero del estudiante, sin importar el nivel.' : '';
  };
  modSel.addEventListener('change', syncMod); syncMod();
}
function readLinkForm(pf) {
  const title = ($('#' + pf + '-title').value || '').trim(), url = normalizeUrl($('#' + pf + '-url').value), err = $('#' + pf + '-err');
  const ic = $('#' + pf + '-ic .av-tile[aria-pressed="true"]');
  let msg = '';
  if (!title) msg = 'Escribe un título.';
  else if (!url) msg = 'Escribe un enlace válido. Copia la dirección completa, por ejemplo https://wordwall.net/…';
  if (msg) { err.textContent = msg; return null; }
  const module = $('#' + pf + '-mod').value;
  return { title, url, module, level: module === 'general' ? 1 : +$('#' + pf + '-lvl').value, icon: ic ? ic.dataset.ic : '🔗' };
}
function viewTLinks() {
  const ls = getLinks(), sts = getStudents();
  const rows = ls.map(l => {
    const n = new Set(getActivityResults().filter(r => r.activityId === l.id && r.completed).map(r => r.studentId)).size;
    return `<tr><td><span aria-hidden="true">${esc(l.icon)}</span> <b>${esc(l.title)}</b></td><td>${MOD_ALL[l.module].dot} ${MOD_ALL[l.module].short}${l.module === 'general' ? '' : ' · Nivel ' + l.level}</td><td class="small">${esc(linkHost(l.url))}</td><td>${n} de ${sts.length}</td><td><div class="row"><a class="btn btn-sm btn-soft" href="${esc(l.url)}" target="_blank" rel="noopener noreferrer">▶ Probar</a><button type="button" class="btn btn-sm btn-ghost" data-act="edit-link" data-id="${l.id}">✏️ Editar</button><button type="button" class="btn btn-sm btn-danger" data-act="del-link" data-id="${l.id}">🗑️ Eliminar</button></div></td></tr>`;
  }).join('');
  show(tShell('links', `<h1>🔗 Enlaces</h1>
    <div class="card" style="margin-bottom:1rem;max-width:720px"><p style="margin:0 0 .4rem"><b>Agrega actividades de otras páginas</b> (Wordwall, Genially, LearningApps…). Aparecerán como una tarjeta más en el módulo y nivel que elijas.</p>
      <ul class="small muted" style="margin:.3rem 0 0;padding-left:1.2rem"><li>LeeOn <b>no recibe el resultado</b> de la otra página: solo registra que el niño la abrió y tocó “Ya terminé”. No cambia el % de progreso.</li><li>Se abre en otra pestaña. Revisa antes que sea apta para niños (sin anuncios, chat ni inicio de sesión).</li></ul></div>
    <div class="card" style="margin-bottom:1.2rem;max-width:720px"><h2>➕ Agregar enlace</h2>${linkForm('nl')}<button type="button" class="btn btn-green" data-act="add-link">➕ Agregar enlace</button></div>
    ${ls.length ? `<div class="tablewrap"><table><thead><tr><th>Enlace</th><th>Dónde aparece</th><th>Sitio</th><th>Terminado por</th><th>Acciones</th></tr></thead><tbody>${rows}</tbody></table></div>` : '<div class="card empty">Todavía no hay enlaces. Agrega el primero arriba.</div>'}`),
    root => wireLinkForm(root, 'nl'));
}
ACT['add-link'] = () => {
  const f = readLinkForm('nl'); if (!f) return;
  addLink(f); showToast('Enlace guardado.', 'success'); viewTLinks();
};
ACT['edit-link'] = el => {
  const l = getLink(el.dataset.id); if (!l) return;
  const m = openModal({
    title: '✏️ Editar enlace', html: linkForm('el', l),
    actions: [{ label: 'Cancelar', cls: 'btn-soft' }, { label: '✔ Guardar', cls: 'btn-green', onClick: () => { const f = readLinkForm('el'); if (!f) return false; updateLink(l.id, f); showToast('Enlace actualizado.', 'success'); route(); } }]
  });
  wireLinkForm(m.el, 'el');
};
ACT['del-link'] = async el => {
  const l = getLink(el.dataset.id); if (!l) return;
  if (await confirmDialog('🗑️ Eliminar enlace', '¿Quieres eliminar este enlace? (' + esc(l.title) + ') Los registros de los niños se conservan en el historial.', 'Eliminar', 'Cancelar')) { deleteLink(l.id); showToast('Enlace eliminado.', 'success'); route(); }
};

/* ---------- Interacciones (analítica de todo el grupo) ---------- */
function anRows(f) {
  const rows = [];
  const sts = f.student ? [getStudent(f.student)].filter(Boolean) : sortedStudents();
  sts.forEach(s => historyRows(s.id, f).forEach(x => rows.push(x)));
  return rows.sort((a, b) => new Date(b.r.startedAt) - new Date(a.r.startedAt));
}
function viewTAnalytics() {
  const f = tState.an, rows = anRows(f);
  const bySkill = {};
  rows.filter(x => !x.r.link).forEach(x => { const s = bySkill[x.a.skill] = bySkill[x.a.skill] || { skill: x.a.skill, ok: 0, not: 0 }; isOk(x.r) ? s.ok++ : s.not++; });
  let pend = '';
  if (f.student) { const st = getStudent(f.student); if (st) { const n = ACTIVITIES.filter(a => !st.completedActivities.includes(a.id)).length; pend = `<p><b>${esc(st.name)}</b>: ${n} actividades pendientes de ${ACTIVITIES.length}.</p>`; } }
  show(tShell('analytics', `<h1>🔎 Interacciones</h1>${filterSelects(f, 'a', true)}${pend}
    <div class="row" style="margin-bottom:.8rem"><span class="pill">${rows.length} registros</span><button type="button" class="btn btn-sm btn-soft" data-act="csv-filtered">📄 Exportar CSV</button></div>
    <div class="card" style="margin-bottom:1rem"><h2>Habilidades trabajadas</h2>${tallyHTML(Object.values(bySkill))}<p class="small muted">✓ logradas (puntaje 60% o más) · ○ por practicar. 🟡 = orientación de refuerzo.</p></div>
    ${historyTable(rows.slice(0, 150), true)}${rows.length > 150 ? '<p class="small muted">Se muestran los 150 más recientes. Usa filtros o exporta el CSV.</p>' : ''}`),
    root => $$('[data-f]', root).forEach(s => s.addEventListener('change', () => { tState.an[s.dataset.f] = s.value; viewTAnalytics(); })));
}

/* ---------- Exportar CSV (ventana con texto para copiar; descarga si el navegador lo permite) ---------- */
function openCSV(results) {
  const csv = buildCSV(results);
  const m = openModal({
    title: '📄 Resultados en CSV',
    html: `<p class="small muted">${results.length} filas. Copia el texto y pégalo en una hoja de cálculo, o descárgalo.</p><textarea class="f" id="csv-t" rows="8" readonly style="font-family:monospace;font-size:.8rem">${esc(csv)}</textarea>`,
    actions: [{ label: '📋 Copiar', cls: 'btn-soft', onClick: () => { const t = $('#csv-t'); t.select(); let ok = false; try { ok = document.execCommand('copy'); } catch (e) { /* nada */ } if (!ok && navigator.clipboard) navigator.clipboard.writeText(csv).catch(() => { }); toast('Texto copiado', '📋'); return false; } },
      { label: '⬇️ Descargar', cls: 'btn-soft', onClick: () => { try { const b = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' }), u = URL.createObjectURL(b), l = document.createElement('a'); l.href = u; l.download = 'leeon-resultados.csv'; document.body.appendChild(l); l.click(); l.remove(); setTimeout(() => URL.revokeObjectURL(u), 1000); } catch (e) { toast('Usa Copiar', '📋'); } return false; } },
      { label: 'Cerrar', cls: 'btn-blue' }]
  });
  return m;
}
ACT['csv-one'] = el => openCSV(resultsFor(el.dataset.id));
ACT['csv-filtered'] = () => openCSV(anRows(tState.an).map(x => x.r));

/* ---------- Configuración ---------- */
function viewTSettings() {
  show(tShell('settings', `<h1>⚙️ Configuración</h1>
    <div class="grid g2"><div class="card"><h2>Datos de este dispositivo</h2><p>Los datos se guardan en el navegador (localStorage).${storageOK ? '' : ' <b>Aviso:</b> el almacenamiento está bloqueado; los datos se perderán al cerrar.'}</p>
      <div class="stack" style="align-items:stretch"><button type="button" class="btn btn-soft" data-act="restore-demo">♻️ Restaurar datos de demostración</button><button type="button" class="btn btn-soft" data-act="csv-all">📄 Exportar todos los resultados (CSV)</button><button type="button" class="btn btn-danger" data-act="clear-data">🗑️ Borrar datos locales</button></div></div>
    <div class="card"><h2>🔒 Contraseña del panel</h2><p class="small muted">Solo quien la conozca puede abrir el panel docente. El panel se bloquea solo tras 30 minutos sin uso o al salir de él.</p>
      <div class="stack" style="align-items:stretch"><button type="button" class="btn btn-soft" data-act="tchange">🔑 Cambiar contraseña</button><button type="button" class="btn btn-soft" data-act="tnewcode">🧾 Nuevo código de recuperación</button><button type="button" class="btn btn-soft" data-act="tlogout">🔒 Bloquear el panel ahora</button></div></div>
    <div class="card"><h2>Accesibilidad y privacidad</h2><div class="stack" style="align-items:stretch"><button type="button" class="btn btn-soft" data-act="a11y">⚙️ Accesibilidad de esta pantalla</button><button type="button" class="btn btn-soft" data-act="privacy">🔒 Privacidad</button></div>
      <p class="small muted" style="margin-top:.8rem">Cada estudiante guarda sus propias preferencias de accesibilidad al usar LeeOn.</p></div></div>`));
}
ACT['csv-all'] = () => openCSV(getActivityResults().slice().sort((a, b) => new Date(a.startedAt) - new Date(b.startedAt)));
ACT['restore-demo'] = async () => { if (await confirmDialog('♻️ Restaurar demostración', 'Se reemplazarán los estudiantes y resultados actuales por los 4 estudiantes de demostración.', 'Sí, restaurar', 'Cancelar')) { restoreDemo(); toast('Datos de demostración cargados', '♻️'); route(); } };
ACT['clear-data'] = async () => { if (await confirmDialog('🗑️ Borrar datos locales', '¿Seguro? Se borrarán todos los estudiantes, resultados y logros de este dispositivo. No se puede deshacer.', 'Sí, borrar todo', 'Cancelar')) { clearLocalData(); toast('Datos borrados', '🗑️'); route(); } };
