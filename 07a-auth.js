/* =====================================================================
   LeeOn — 07a ACCESO DEL DOCENTE (contraseña)
   El panel docente solo se abre con una contraseña que crea el docente
   la primera vez. Se guarda únicamente una HUELLA (SHA-256 con sal,
   repetida 5000 veces), nunca la contraseña.
   Además hay un código de recuperación (se muestra una sola vez).

   ⚠️ Límite honesto: LeeOn es un prototipo SIN servidor. La contraseña
   impide que los niños entren al panel, pero alguien con conocimientos
   técnicos y acceso al dispositivo podría leer los datos del navegador.
   Para uso institucional se necesita un backend con autenticación real.
   ===================================================================== */

/* ---------- SHA-256 (JavaScript puro, funciona también sin HTTPS) ---------- */
const SHA_K = (() => {
  const k = []; let n = 2;
  while (k.length < 64) { let p = true; for (let i = 2; i * i <= n; i++) if (n % i === 0) { p = false; break; } if (p) k.push(Math.floor((Math.cbrt(n) % 1) * 4294967296)); n++; }
  return k;
})();
function utf8Bytes(s) {
  const out = [], e = encodeURIComponent(s);
  for (let i = 0; i < e.length; i++) { if (e[i] === '%') { out.push(parseInt(e.substr(i + 1, 2), 16)); i += 2; } else out.push(e.charCodeAt(i)); }
  return out;
}
function sha256(str) {
  const H = [2, 3, 5, 7, 11, 13, 17, 19].map(n => Math.floor((Math.sqrt(n) % 1) * 4294967296));
  const b = utf8Bytes(str), bitLen = b.length * 8;
  b.push(0x80); while (b.length % 64 !== 56) b.push(0);
  const hi = Math.floor(bitLen / 4294967296), lo = bitLen >>> 0;
  b.push((hi >>> 24) & 255, (hi >>> 16) & 255, (hi >>> 8) & 255, hi & 255, (lo >>> 24) & 255, (lo >>> 16) & 255, (lo >>> 8) & 255, lo & 255);
  const w = new Array(64), rot = (x, n) => (x >>> n) | (x << (32 - n));
  for (let o = 0; o < b.length; o += 64) {
    for (let i = 0; i < 16; i++) w[i] = (b[o + 4 * i] << 24) | (b[o + 4 * i + 1] << 16) | (b[o + 4 * i + 2] << 8) | b[o + 4 * i + 3];
    for (let i = 16; i < 64; i++) {
      const s0 = rot(w[i - 15], 7) ^ rot(w[i - 15], 18) ^ (w[i - 15] >>> 3), s1 = rot(w[i - 2], 17) ^ rot(w[i - 2], 19) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
    }
    let [a, bb, c, d, e, f, g, h] = H;
    for (let i = 0; i < 64; i++) {
      const S1 = rot(e, 6) ^ rot(e, 11) ^ rot(e, 25), ch = (e & f) ^ (~e & g), t1 = (h + S1 + ch + SHA_K[i] + w[i]) | 0;
      const S0 = rot(a, 2) ^ rot(a, 13) ^ rot(a, 22), mj = (a & bb) ^ (a & c) ^ (bb & c), t2 = (S0 + mj) | 0;
      h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = bb; bb = a; a = (t1 + t2) | 0;
    }
    H[0] = (H[0] + a) | 0; H[1] = (H[1] + bb) | 0; H[2] = (H[2] + c) | 0; H[3] = (H[3] + d) | 0; H[4] = (H[4] + e) | 0; H[5] = (H[5] + f) | 0; H[6] = (H[6] + g) | 0; H[7] = (H[7] + h) | 0;
  }
  return H.map(x => ('00000000' + (x >>> 0).toString(16)).slice(-8)).join('');
}
function randHex(n) {
  const a = new Uint8Array(n);
  try { window.crypto.getRandomValues(a); } catch (e) { for (let i = 0; i < n; i++) a[i] = Math.floor(Math.random() * 256); }
  return Array.from(a).map(x => ('0' + x.toString(16)).slice(-2)).join('');
}
function hashSecret(secret, salt) { let h = salt + '|' + secret; for (let i = 0; i < 5000; i++) h = sha256(h + salt); return h; }

/* ---------- Servicio de contraseña ---------- */
const MIN_PASS = 6;
const hasTeacherAuth = () => { const a = lsRead(KEYS.teacherAuth, null); return !!(a && a.salt && a.hash); };
function setTeacherPassword(pass) {
  const a = lsRead(KEYS.teacherAuth, null) || {};
  a.salt = randHex(16); a.hash = hashSecret(pass, a.salt);
  lsWrite(KEYS.teacherAuth, a);
}
function checkTeacherPassword(pass) {
  const a = lsRead(KEYS.teacherAuth, null); if (!a || !a.salt) return false;
  return hashSecret(pass, a.salt) === a.hash;
}
/* Código de recuperación: se muestra UNA vez; solo se guarda su huella. */
function newRecoveryCode() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789', raw = Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  const a = lsRead(KEYS.teacherAuth, null) || {};
  a.rsalt = randHex(16); a.rhash = hashSecret(raw, a.rsalt);
  lsWrite(KEYS.teacherAuth, a);
  return raw.replace(/(.{4})(?=.)/g, '$1-');
}
function checkRecoveryCode(code) {
  const a = lsRead(KEYS.teacherAuth, null); if (!a || !a.rsalt) return false;
  return hashSecret(String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, ''), a.rsalt) === a.rhash;
}
/* Tras 5 intentos fallidos se espera 60 segundos */
function lockSecondsLeft() { const l = lsRead(KEYS.teacherLock, null); return l && l.until > Date.now() ? Math.ceil((l.until - Date.now()) / 1000) : 0; }
function registerFail() {
  const l = lsRead(KEYS.teacherLock, null) || { fails: 0, until: 0 };
  if (l.until && l.until <= Date.now()) { l.fails = 0; l.until = 0; }   // el bloqueo anterior ya terminó
  l.fails++;
  if (l.fails >= 5) { l.until = Date.now() + 60000; l.fails = 0; }
  lsWrite(KEYS.teacherLock, l);
}
const clearFails = () => lsRemove(KEYS.teacherLock);
/* Borra TODO (datos, enlaces, sesiones y contraseña) y vuelve a cargar la demostración */
function factoryReset() {
  Object.keys(KEYS).forEach(k => lsRemove(KEYS[k]));
  bootDB();
}

/* ---------- Pantalla de acceso ---------- */
function viewTeacherLogin() {
  const setup = !hasTeacherAuth();
  show(`<main id="main" class="home"><div style="width:120px">${lionSVG('happy')}</div><h1>👩‍🏫 Panel docente</h1>
    <p class="lema" style="max-width:520px">${setup ? 'Crea una contraseña para proteger el panel.' : 'Escribe tu contraseña para entrar.'}</p>
    <div class="card" style="max-width:420px;width:100%;text-align:left">
      ${setup ? `<label class="fl" for="tp-new" style="margin-top:0">Contraseña (mínimo ${MIN_PASS} caracteres)</label><input class="f" id="tp-new" type="password" autocomplete="new-password">
        <label class="fl" for="tp-new2">Repite la contraseña</label><input class="f" id="tp-new2" type="password" autocomplete="new-password">`
      : `<label class="fl" for="tp-pass" style="margin-top:0">Contraseña</label><input class="f" id="tp-pass" type="password" autocomplete="current-password">`}
      <div class="row" style="margin:.5rem 0"><button type="button" class="btn btn-sm btn-ghost" data-act="tshow" aria-pressed="false">👁 Mostrar</button></div>
      <div class="err" id="tp-err" role="alert"></div>
      <button type="button" class="btn btn-orange" style="width:100%;margin-top:.4rem" data-act="${setup ? 'tsetup' : 'tlogin'}">${setup ? 'Crear y entrar' : 'Entrar al panel'}</button>
      ${setup ? '' : '<div class="row center" style="margin-top:.6rem"><button type="button" class="btn btn-ghost btn-sm" data-act="tforgot">¿Olvidaste la contraseña?</button></div>'}
    </div>
    <div class="row center" style="margin-top:1rem"><button type="button" class="btn btn-ghost" data-go="#/">🏠 Inicio</button></div>
    <p class="muted small" style="max-width:480px;margin-top:1rem">Solo el docente puede entrar. Los datos se guardan únicamente en este dispositivo.</p></main>`, root => {
    const first = $('#tp-new', root) || $('#tp-pass', root);
    $$('input', root).forEach(i => i.addEventListener('keydown', e => { if (e.key === 'Enter') ACT[setup ? 'tsetup' : 'tlogin'](); }));
    if (first) first.focus();
  });
}
ACT.tshow = el => {
  const on = el.getAttribute('aria-pressed') !== 'true';
  el.setAttribute('aria-pressed', String(on)); el.textContent = on ? '🙈 Ocultar' : '👁 Mostrar';
  $$('#main input[type="password"], #main input[data-pw]').forEach(i => { i.type = on ? 'text' : 'password'; i.setAttribute('data-pw', '1'); });
};
/* Muestra el código de recuperación una sola vez */
function showRecoveryCode(code, onDone) {
  openModal({
    title: '🧾 Tu código de recuperación',
    html: `<p>Si olvidas la contraseña, este código te permite crear otra <b>sin perder los datos</b>. Se muestra solo esta vez.</p>
      <p style="font-family:monospace;font-size:1.6rem;font-weight:700;letter-spacing:.1em;text-align:center;background:var(--bg2);border-radius:14px;padding:.6rem" id="rc-code">${esc(code)}</p>
      <p class="small muted">Anótalo en un lugar seguro. No lo dejes en este dispositivo si lo usan los niños.</p>`,
    actions: [{ label: '📋 Copiar', cls: 'btn-soft', onClick: () => { try { navigator.clipboard.writeText(code).catch(() => { }); } catch (e) { /* nada */ } toast('Código copiado', '📋'); return false; } }, { label: '✔ Ya lo guardé', cls: 'btn-green' }],
    onClose: onDone
  });
}
function passError(p1, p2) {
  if ((p1 || '').length < MIN_PASS) return 'La contraseña debe tener al menos ' + MIN_PASS + ' caracteres.';
  if (p1 !== p2) return 'Las contraseñas no coinciden.';
  return '';
}
ACT.tsetup = () => {
  const p1 = $('#tp-new').value, p2 = $('#tp-new2').value, msg = passError(p1, p2);
  if (msg) { $('#tp-err').textContent = msg; return; }
  setTeacherPassword(p1); const code = newRecoveryCode(); setTeacherSession(true);
  showRecoveryCode(code, () => go('#/teacher/dashboard'));
};
ACT.tlogin = () => {
  const err = $('#tp-err'), wait = lockSecondsLeft();
  if (wait) { err.textContent = 'Demasiados intentos. Espera ' + wait + ' segundos.'; return; }
  const pass = $('#tp-pass').value;
  if (checkTeacherPassword(pass)) { clearFails(); setTeacherSession(true); go('#/teacher/dashboard'); }
  else { registerFail(); const w2 = lockSecondsLeft(); err.textContent = w2 ? 'Demasiados intentos. Espera ' + w2 + ' segundos.' : 'La contraseña no es correcta. Prueba otra vez.'; $('#tp-pass').select(); }
};
ACT.tlogout = () => { setTeacherSession(false); go('#/'); };

/* ---------- Olvidé mi contraseña ---------- */
ACT.tforgot = () => {
  const m = openModal({
    title: '🔑 Recuperar acceso',
    html: `<p class="small muted" style="margin-top:0">Escribe tu código de recuperación y elige una contraseña nueva. Tus datos se conservan.</p>
      <label class="fl" for="fg-code" style="margin-top:0">Código de recuperación</label><input class="f" id="fg-code" autocomplete="off" placeholder="XXXX-XXXX-XXXX" style="text-transform:uppercase">
      <label class="fl" for="fg-p1">Contraseña nueva</label><input class="f" id="fg-p1" type="password" autocomplete="new-password">
      <label class="fl" for="fg-p2">Repite la contraseña</label><input class="f" id="fg-p2" type="password" autocomplete="new-password">
      <div class="err" id="fg-err" role="alert"></div>
      <hr style="border:0;border-top:2px solid var(--line);margin:1rem 0"><p class="small muted">¿Sin código? Solo queda empezar de nuevo, y eso <b>borra todos los datos</b>.</p><button type="button" class="btn btn-danger btn-sm" data-act="tnuke">🗑️ Borrar todo y empezar de nuevo</button>`,
    actions: [{ label: 'Cancelar', cls: 'btn-soft' }, {
      label: 'Cambiar contraseña', cls: 'btn-green', onClick: () => {
        const err = $('#fg-err'), wait = lockSecondsLeft();
        if (wait) { err.textContent = 'Demasiados intentos. Espera ' + wait + ' segundos.'; return false; }
        if (!checkRecoveryCode($('#fg-code').value)) { registerFail(); err.textContent = 'Ese código no es correcto.'; return false; }
        const msg = passError($('#fg-p1').value, $('#fg-p2').value); if (msg) { err.textContent = msg; return false; }
        clearFails(); setTeacherPassword($('#fg-p1').value); const code = newRecoveryCode(); setTeacherSession(true);
        setTimeout(() => showRecoveryCode(code, () => go('#/teacher/dashboard')), 0);
      }
    }]
  });
  return m;
};
ACT.tnuke = () => {
  openModal({
    title: '🗑️ Empezar de nuevo',
    html: `<p>Se borrarán <b>todos</b> los estudiantes, resultados, enlaces y la contraseña. Se cargará de nuevo la demostración. No se puede deshacer.</p><label class="fl" for="nk-t">Para confirmar escribe BORRAR</label><input class="f" id="nk-t" autocomplete="off"><div class="err" id="nk-err" role="alert"></div>`,
    actions: [{ label: 'Cancelar', cls: 'btn-soft' }, { label: 'Borrar todo', cls: 'btn-orange', onClick: () => { if ($('#nk-t').value.trim().toUpperCase() !== 'BORRAR') { $('#nk-err').textContent = 'Escribe la palabra BORRAR.'; return false; } factoryReset(); $$('.modal-bg').forEach(x => x.remove()); toast('Todo se borró. Crea una contraseña nueva.', '🗑️'); go('#/teacher'); } }]
  });
};

/* ---------- Dentro del panel: cambiar contraseña / nuevo código ---------- */
ACT.tchange = () => {
  openModal({
    title: '🔑 Cambiar contraseña',
    html: `<label class="fl" for="cp-old" style="margin-top:0">Contraseña actual</label><input class="f" id="cp-old" type="password" autocomplete="current-password">
      <label class="fl" for="cp-p1">Contraseña nueva</label><input class="f" id="cp-p1" type="password" autocomplete="new-password">
      <label class="fl" for="cp-p2">Repite la contraseña nueva</label><input class="f" id="cp-p2" type="password" autocomplete="new-password"><div class="err" id="cp-err" role="alert"></div>`,
    actions: [{ label: 'Cancelar', cls: 'btn-soft' }, {
      label: '✔ Guardar', cls: 'btn-green', onClick: () => {
        const err = $('#cp-err'); if (!checkTeacherPassword($('#cp-old').value)) { err.textContent = 'La contraseña actual no es correcta.'; return false; }
        const msg = passError($('#cp-p1').value, $('#cp-p2').value); if (msg) { err.textContent = msg; return false; }
        setTeacherPassword($('#cp-p1').value); toast('Contraseña cambiada', '🔑');
      }
    }]
  });
};
ACT.tnewcode = () => {
  openModal({
    title: '🧾 Nuevo código de recuperación',
    html: `<p class="small muted" style="margin-top:0">El código anterior dejará de servir.</p><label class="fl" for="nc-pass" style="margin-top:0">Escribe tu contraseña para continuar</label><input class="f" id="nc-pass" type="password" autocomplete="current-password"><div class="err" id="nc-err" role="alert"></div>`,
    actions: [{ label: 'Cancelar', cls: 'btn-soft' }, { label: 'Crear código', cls: 'btn-green', onClick: () => { if (!checkTeacherPassword($('#nc-pass').value)) { $('#nc-err').textContent = 'La contraseña no es correcta.'; return false; } const code = newRecoveryCode(); setTimeout(() => showRecoveryCode(code), 0); } }]
  });
};
