/* =====================================================================
   LeeOn — 04 COMPONENTES DE INTERFAZ
   León (SVG con emociones), avatares, barras, modal, avisos y panel
   de accesibilidad. Cada componente devuelve HTML (string) o abre un modal.
   ===================================================================== */

/* ---------- León LeeOn ---------- */
/* mood: happy | thinking | encouraging | celebrating | neutral | surprised */
function lionSVG(mood) {
  mood = mood || 'happy';
  const M = '#E8902E', MD = '#C9701A', ink = '#2B1B12';
  let petals = '';
  for (let i = 0; i < 14; i++) {
    const ang = i / 14 * Math.PI * 2;
    petals += `<circle cx="${(100 + Math.cos(ang) * 64).toFixed(1)}" cy="${(104 + Math.sin(ang) * 64).toFixed(1)}" r="25" fill="${M}" stroke="${MD}" stroke-width="2"/>`;
  }
  const eye = (cx, cy, rx, ry, px, py) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${ink}"/><circle cx="${cx + 2 + (px || 0)}" cy="${cy - 3 + (py || 0)}" r="2.4" fill="#fff"/>`;
  const line = d => `<path d="${d}" fill="none" stroke="${ink}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>`;
  const star = (cx, cy, r, f) => { let p = ''; for (let i = 0; i < 10; i++) { const rr = i % 2 ? r * 0.45 : r, a = -Math.PI / 2 + i * Math.PI / 5; p += (cx + Math.cos(a) * rr).toFixed(1) + ',' + (cy + Math.sin(a) * rr).toFixed(1) + ' '; } return `<polygon points="${p}" fill="${f}"/>`; };
  let eyes = '', mouth = '', extra = '';
  const smile = line('M86 137 Q100 152 114 137');
  if (mood === 'celebrating') {
    eyes = line('M71 102 Q80 89 89 102') + line('M111 102 Q120 89 129 102');
    mouth = `<path d="M85 135 Q100 162 115 135 Z" fill="#7A2E1B"/><ellipse cx="100" cy="148" rx="9" ry="5" fill="#FF8DA1"/>`;
    extra = `<g class="deco">${star(28, 34, 11, '#FFD84D')}${star(176, 26, 9, '#FF8DA1')}${star(184, 88, 7, '#7FD6FF')}${star(16, 92, 7, '#9BE38F')}</g>`;
  } else if (mood === 'thinking') {
    eyes = eye(80, 99, 6, 7.5, 2, -2) + eye(120, 99, 6, 7.5, 2, -2) + line('M69 83 Q80 75 91 82') + line('M110 87 Q120 84 130 88');
    mouth = line('M91 141 Q104 147 113 138');
    extra = `<g class="deco"><circle cx="152" cy="52" r="3.5" fill="#fff" stroke="${MD}"/><circle cx="160" cy="42" r="5" fill="#fff" stroke="${MD}"/><circle cx="172" cy="28" r="15" fill="#fff" stroke="${MD}" stroke-width="2"/><text x="172" y="34" text-anchor="middle" font-size="18" font-weight="700" fill="#1A2A4A" font-family="sans-serif">?</text></g>`;
  } else if (mood === 'encouraging') {
    eyes = eye(80, 98, 6.5, 8) + eye(120, 98, 6.5, 8) + line('M69 87 Q79 79 91 81') + line('M109 81 Q121 79 131 87');
    mouth = smile;
    extra = `<g class="deco"><path d="M176 50 C162 39 167 27 176 34 C185 27 190 39 176 50Z" fill="#FF6B81"/></g>`;
  } else if (mood === 'surprised') {
    eyes = eye(80, 98, 8, 10) + eye(120, 98, 8, 10);
    mouth = `<ellipse cx="100" cy="143" rx="7" ry="9" fill="#7A2E1B"/>`;
  } else if (mood === 'neutral') {
    eyes = eye(80, 99, 6, 7) + eye(120, 99, 6, 7);
    mouth = line('M90 139 Q100 145 110 139');
  } else { // happy
    eyes = eye(80, 98, 6.5, 8) + eye(120, 98, 6.5, 8);
    mouth = smile;
  }
  return `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
${petals}<circle cx="100" cy="104" r="66" fill="${M}"/>
<circle cx="54" cy="58" r="18" fill="#F2B04D" stroke="${MD}" stroke-width="2"/><circle cx="54" cy="58" r="9" fill="#FF9F8F"/>
<circle cx="146" cy="58" r="18" fill="#F2B04D" stroke="${MD}" stroke-width="2"/><circle cx="146" cy="58" r="9" fill="#FF9F8F"/>
<ellipse cx="100" cy="108" rx="56" ry="52" fill="#FFC95C" stroke="#E9A93A" stroke-width="2"/>
<ellipse cx="100" cy="132" rx="30" ry="22" fill="#FFF1D0"/>
<circle cx="66" cy="124" r="9" fill="#FF9E8A" opacity=".45"/><circle cx="134" cy="124" r="9" fill="#FF9E8A" opacity=".45"/>
${eyes}
<path d="M90 116 Q100 109 110 116 Q109 126 100 129 Q91 126 90 116Z" fill="#B8533A"/>
<path d="M100 129 L100 136" stroke="${ink}" stroke-width="3" stroke-linecap="round"/>
${mouth}${extra}</svg>`;
}
function lionFig(mood, size, bob) {
  return `<span class="lion${bob && motionOK() ? ' bob' : ''}" style="width:${size || 120}px" role="img" aria-label="LeeOn, el león amigo">${lionSVG(mood)}</span>`;
}
/* Componente LionAssistant: león + globo de mensaje */
function lionAssistant(mood, message, sub, size) {
  return `<div class="lion-assist">${lionFig(mood, size || 120, true)}<div class="bubble" role="status">${esc(message)}${sub ? `<small>${esc(sub)}</small>` : ''}</div></div>`;
}

/* ---------- Avatar ---------- */
function avatarHTML(id, size) {
  size = size || 64;
  const a = AVATARS.find(x => x.id === id) || AVATARS[0];
  const inner = a.id === 'lion' ? `<span style="width:${Math.round(size * .9)}px;display:block">${lionSVG('happy')}</span>` : `<span style="font-size:${Math.round(size * .58)}px" aria-hidden="true">${a.emoji}</span>`;
  return `<span class="avatar" style="width:${size}px;height:${size}px;background:${a.bg}" role="img" aria-label="Avatar ${esc(a.name)}">${inner}</span>`;
}

/* ---------- Barras de progreso (siempre con el porcentaje escrito: no dependen del color) ---------- */
function bar(pct, cls, label) {
  pct = clamp(Math.round(pct || 0), 0, 100);
  return `<div class="bar ${cls || ''}" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}" aria-label="${esc(label || 'Progreso')}"><i style="width:${pct}%"></i></div>`;
}
function barLine(label, pct, cls) {
  return `<div class="barline"><span class="lbl">${esc(label)}</span>${bar(pct, cls, label)}<span class="pct">${Math.round(pct)}%</span></div>`;
}

/* ---------- Avisos no invasivos ---------- */
/* toast(texto, emoji, tipo?) — tipo solo cambia el color del borde (success|error|warning|info); no cambia el texto ni el emoji, así que sigue funcionando igual para cualquier llamada existente que no lo use. */
function toast(text, emoji, kind) {
  const host = $('#toasts'); if (!host) return;
  const el = document.createElement('div');
  el.className = 'toast' + (kind ? ' toast--' + kind : '');
  el.setAttribute('role', kind === 'error' || kind === 'warning' ? 'alert' : 'status');
  el.textContent = (emoji ? emoji + ' ' : '') + text;
  host.appendChild(el);
  setTimeout(() => el.remove(), 4200);
}
/* showToast(mensaje, tipo) — confirmación reutilizable para el panel docente.
   tipo: 'success' (✅), 'error' (⛔), 'warning' (⚠️) o 'info' (🦁). El mensaje ya debe
   traer su propio texto (p. ej. showToast('Estudiante actualizado.', 'success')). */
function showToast(message, kind) {
  const EMOJI = { success: '✅', error: '⛔', warning: '⚠️', info: '🦁' };
  toast(message, EMOJI[kind] || '', kind || 'info');
}

/* ---------- Modal accesible (foco atrapado, Esc para cerrar) ---------- */
function openModal(opt) {
  const prev = document.activeElement;
  const bg = document.createElement('div'); bg.className = 'modal-bg';
  const id = uid('mt');
  bg.innerHTML = `<div class="modal" role="dialog" aria-modal="true" aria-labelledby="${id}"><h2 id="${id}">${opt.title || ''}</h2><div class="mbody">${opt.html || ''}</div><div class="row" style="margin-top:1rem;justify-content:flex-end" id="${id}-acts"></div></div>`;
  document.body.appendChild(bg);
  const box = $('.modal', bg);
  const api = {
    el: box,
    close() { bg.remove(); document.removeEventListener('keydown', onKey, true); if (prev && prev.focus) { try { prev.focus(); } catch (e) { /* nada */ } } if (opt.onClose) opt.onClose(); }
  };
  const acts = $('#' + id + '-acts', bg);
  (opt.actions || [{ label: 'Cerrar', cls: 'btn-soft' }]).forEach(a => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'btn ' + (a.cls || 'btn-soft'); b.textContent = a.label;
    b.addEventListener('click', () => { if (a.onClick) { const keep = a.onClick(api); if (keep === false) return; } api.close(); });
    acts.appendChild(b);
  });
  function onKey(e) {
    if (e.key === 'Escape') { e.stopPropagation(); api.close(); return; }
    if (e.key === 'Tab') {
      const f = $$('button,input,select,textarea,[href],[tabindex]:not([tabindex="-1"])', box).filter(x => !x.disabled && x.offsetParent !== null);
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }
  document.addEventListener('keydown', onKey, true);
  bg.addEventListener('mousedown', e => { if (e.target === bg) api.close(); });
  const f0 = $('input,select,textarea,.mbody button', box) || $('button', box); if (f0) f0.focus();
  return api;
}
function confirmDialog(title, text, yes, no) {
  return new Promise(res => {
    let answered = false;
    openModal({
      title, html: `<p>${text}</p>`,
      actions: [
        { label: no || 'Cancelar', cls: 'btn-soft', onClick: () => { answered = true; res(false); } },
        { label: yes || 'Sí', cls: 'btn-orange', onClick: () => { answered = true; res(true); } }
      ],
      onClose: () => { if (!answered) res(false); }
    });
  });
}

/* ---------- Panel de accesibilidad ---------- */
const A11Y_ITEMS = [
  ['audioEnabled', '🔊 Sonidos automáticos', 'Voz y efectos suaves'],
  ['autoRead', '🗣️ Leer instrucciones', 'Se leen solas al abrir la actividad'],
  ['largeText', '🔠 Texto grande', ''],
  ['highContrast', '◉ Alto contraste', ''],
  ['largeButtons', '👆 Botones grandes', ''],
  ['reducedMotion', '🧩 Menos movimiento', 'Sin animaciones'],
  ['calmMode', '🌙 Modo tranquilo', 'Menos sonidos, sin adornos y sin movimiento']
];
function openA11y() {
  const draw = () => {
    const p = prefs();
    return A11Y_ITEMS.map(([k, label, sub]) => `<button type="button" class="toggle" role="switch" aria-checked="${p[k] ? 'true' : 'false'}" data-k="${k}"><span>${label}${sub ? `<br><small class="muted" style="font-weight:400">${sub}</small>` : ''}</span><span class="sw">${p[k] ? 'Sí' : 'No'}</span></button>`).join('') +
      `<button type="button" class="btn btn-soft" id="a11y-test" style="width:100%">🔊 Probar la voz</button>
       <p class="small muted" style="margin-top:.8rem">Tus cambios se guardan en este dispositivo${currentStudent() ? ' para ' + esc(currentStudent().name) : ''}. En cada actividad encuentras 🔊 Escuchar y 🔁 Repetir.</p>`;
  };
  const m = openModal({ title: '⚙️ Accesibilidad', html: draw(), actions: [{ label: '✔ Listo', cls: 'btn-blue' }] });
  const body = $('.mbody', m.el);
  const wire = () => {
    $$('.toggle', body).forEach(b => b.addEventListener('click', () => {
      const p = prefs(); p[b.dataset.k] = !p[b.dataset.k];
      savePrefs(p); body.innerHTML = draw(); wire();
      const nb = $('[data-k="' + b.dataset.k + '"]', body); if (nb) nb.focus();
    }));
    const t = $('#a11y-test', body); if (t) t.addEventListener('click', () => speak('Hola, soy LeeOn. Aprendemos juntos, paso a paso.', { user: true }));
  };
  wire();
}

/* Texto de privacidad (prototipo local) */
function openPrivacy() {
  openModal({
    title: '🔒 Privacidad',
    html: `<p>LeeOn almacena los datos de este prototipo en el dispositivo utilizado. No solicita información personal innecesaria.</p>
      <p>Solo se guardan: nombre de pila o apodo, código, avatar, progreso, resultados de las actividades y observaciones del docente.</p>
      <p>El panel docente se abre con una contraseña. Se guarda solo una huella cifrada de la contraseña, no la contraseña.</p>
      <p class="small muted">Este prototipo no tiene servidor: la contraseña evita que los niños entren al panel, pero no ofrece seguridad de nivel institucional (alguien con conocimientos técnicos y acceso al dispositivo podría ver los datos). No escribas datos sensibles, médicos ni diagnósticos.</p>`
  });
}
