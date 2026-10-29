/* =====================================================================
   LeeOn — 02 DATOS
   Todo el contenido pedagógico vive aquí. Para agregar o cambiar
   actividades NO hay que tocar el motor: solo edita este archivo.
   ===================================================================== */

/* ---------- Avatares (mínimo 8). "lion" se dibuja como SVG (LeeOn). ---------- */
const AVATARS = [
  { id: 'lion', name: 'León', emoji: '🦁', bg: '#FFE2A8' },
  { id: 'panda', name: 'Panda', emoji: '🐼', bg: '#E4E4EC' },
  { id: 'rabbit', name: 'Conejo', emoji: '🐰', bg: '#FFD6E3' },
  { id: 'cat', name: 'Gato', emoji: '🐱', bg: '#FFE0C2' },
  { id: 'dog', name: 'Perro', emoji: '🐶', bg: '#EAD7C4' },
  { id: 'frog', name: 'Rana', emoji: '🐸', bg: '#CDEFC9' },
  { id: 'fox', name: 'Zorro', emoji: '🦊', bg: '#FFD3B0' },
  { id: 'penguin', name: 'Pingüino', emoji: '🐧', bg: '#CFE6FF' }
];

/* ---------- Palabras con imagen (emoji). Formato: clave: [imagen, PALABRA] ---------- */
const W = {
  gato: ['🐱', 'GATO'], perro: ['🐶', 'PERRO'], leon: ['🦁', 'LEÓN'], manzana: ['🍎', 'MANZANA'], sol: ['☀️', 'SOL'],
  mono: ['🐵', 'MONO'], mano: ['✋', 'MANO'], pato: ['🦆', 'PATO'], pan: ['🍞', 'PAN'], sapo: ['🐸', 'SAPO'],
  luna: ['🌙', 'LUNA'], casa: ['🏠', 'CASA'], mariposa: ['🦋', 'MARIPOSA'], pelota: ['⚽', 'PELOTA'], hueso: ['🦴', 'HUESO'],
  agua: ['💧', 'AGUA'],
  /* palabras con sílabas trabadas (dos consonantes seguidas: pl, gl, gr, br, cl, dr, fl, tr…) */
  plato: ['🍽️', 'PLATO'], libro: ['📚', 'LIBRO'], flor: ['🌸', 'FLOR'], tren: ['🚂', 'TREN'], globo: ['🎈', 'GLOBO'],
  dragon: ['🐉', 'DRAGÓN'], grillo: ['🦗', 'GRILLO'], brazo: ['💪', 'BRAZO'], clavo: ['🔩', 'CLAVO']
};
/* Sonidos de las letras para la voz. Los motores de voz no siempre pronuncian bien un fonema aislado;
   para mejor calidad se pueden cambiar por grabaciones (ver README). */
const PH = { M: 'mmmm', S: 'ssss', P: 'pa', L: 'llll', G: 'ga', C: 'ka', N: 'nnnn', A: 'aaaa', O: 'oooo', E: 'eeee', F: 'ffff' };
const LETTER_NAME = { M: 'eme', N: 'ene', P: 'pe', S: 'ese', L: 'ele', C: 'ce', G: 'ge', A: 'a', O: 'o', B: 'be', D: 'de', E: 'e', F: 'efe' };

/* Ayudantes para escribir opciones de forma corta */
const oImg = (k, correct, extra) => Object.assign({ emoji: W[k][0], label: W[k][1], speak: W[k][1].toLowerCase(), correct: !!correct }, extra || {});
const oTxt = (label, correct, speak) => ({ label, correct: !!correct, speak: speak || label.toLowerCase() });
const oSound = (L, correct) => ({ label: L, correct: !!correct, speak: PH[L] });
const oLetter = (L, correct) => ({ label: L, correct: !!correct, speak: LETTER_NAME[L] || L.toLowerCase() });
const tok = (s, extra) => Object.assign({ k: s, label: s }, extra || {});
const toks = arr => arr.map(s => tok(s));

/* =====================================================================
   ACTIVIDADES
   Campos: id, module, level(1-5), skill, objective, difficulty(easy|medium|challenge),
           icon, title, instruction, type, estimatedTime(min), content, hints[], audioText
   Tipos: multiple-choice · image-choice · fill-blank · matching · drag-drop ·
          ordering · syllable-builder · word-builder · sentence-builder ·
          reading-comprehension · guided-write · tracing
   ===================================================================== */
const ACTIVITIES = [];
const act = o => { o.estimatedTime = o.estimatedTime || 2; o.hints = o.hints || []; ACTIVITIES.push(o); };

/* ================= MÓDULO 1 · CONCIENCIA FONOLÓGICA ================= */
/* Nivel 1 — Escucho y reconozco */
act({ id: 'PF-01', module: 'phonological', level: 1, skill: 'Reconocimiento auditivo', objective: 'Reconocer el sonido con el que empieza una palabra conocida', difficulty: 'easy', icon: '👂',
  title: '¿Qué sonido escuchas?', instruction: 'Escucha el comienzo de GATO. Toca la letra de ese sonido.', type: 'multiple-choice',
  audioText: 'Escucha el comienzo de gato. Toca la letra de ese sonido.',
  content: { prompt: { emoji: '🐱', word: 'GATO', listen: 'gato. ga, ga, ga' }, options: [oSound('G', true), oSound('M'), oSound('S')], result: 'gato' },
  hints: ['Escucha con calma: gato. Empieza con ga, ga, ga.', 'Toca cada letra para oír su sonido.'] });

act({ id: 'PF-02', module: 'phonological', level: 1, skill: 'Identificación del sonido inicial', objective: 'Identificar palabras que comienzan con el mismo fonema', difficulty: 'easy', icon: '🐵',
  title: '¿Cuál empieza como MONO?', instruction: '¿Cuál empieza igual que MONO?', type: 'image-choice',
  audioText: '¿Cuál empieza igual que mono?',
  content: { prompt: { emoji: '🐵', word: 'MONO', listen: 'mono. mmm, mmm, mono' }, options: [oImg('manzana', true), oImg('perro'), oImg('sol')], result: 'mono, manzana' },
  hints: ['Escucha: mmm-ono, mmm-anzana.', 'Busca el que suene mmm al comienzo.'] });

act({ id: 'PF-03', module: 'phonological', level: 1, skill: 'Relación sonido–imagen', objective: 'Asociar un sonido con la imagen que comienza con él', difficulty: 'easy', icon: '🔗',
  title: 'Une sonido e imagen', instruction: 'Toca un sonido y luego su imagen.', type: 'matching',
  audioText: 'Toca un sonido y luego la imagen que empieza con ese sonido.',
  content: { pairs: [
    { a: { emoji: '🔊', label: '/m/', speak: 'mmmm' }, b: { emoji: W.mono[0], label: 'MONO', speak: 'mono' } },
    { a: { emoji: '🔊', label: '/s/', speak: 'ssss' }, b: { emoji: W.sol[0], label: 'SOL', speak: 'sol' } },
    { a: { emoji: '🔊', label: '/p/', speak: 'pa' }, b: { emoji: W.pato[0], label: 'PATO', speak: 'pato' } }] },
  hints: ['Toca el sonido y escúchalo con calma.', 'Di las palabras en voz baja: mono, sol, pato.'] });

/* Nivel 2 — Sonido inicial */
act({ id: 'PF-04', module: 'phonological', level: 2, skill: 'Identificación del sonido inicial', objective: 'Identificar la imagen que empieza con un sonido dado', difficulty: 'easy', icon: '🔊',
  title: '¿Cuál empieza con /s/?', instruction: 'Escucha el sonido y toca la imagen que empieza con él.', type: 'image-choice',
  audioText: 'Escucha el sonido. Toca la imagen que empieza con ese sonido.',
  content: { prompt: { emoji: '🔊', word: '/s/', listen: 'ssss' }, options: [oImg('sapo', true), oImg('mano'), oImg('pato')], result: 'sapo' },
  hints: ['El sonido es ssss, como una serpiente.', 'Di: ssss-apo.'] });

act({ id: 'PF-05', module: 'phonological', level: 2, skill: 'Clasificación por sonido inicial', objective: 'Clasificar palabras según su sonido inicial', difficulty: 'medium', icon: '🧺',
  title: 'Ordeno por el primer sonido', instruction: 'Lleva cada imagen a la caja del sonido con el que empieza.', type: 'drag-drop',
  audioText: 'Lleva cada imagen a la caja del sonido con el que empieza.', estimatedTime: 3,
  content: { buckets: [{ id: 'm', label: '/m/', speak: 'mmmm' }, { id: 'p', label: '/p/', speak: 'pa' }],
    items: [{ id: 'mono', emoji: '🐵', label: 'MONO', bucket: 'm' }, { id: 'mano', emoji: '✋', label: 'MANO', bucket: 'm' }, { id: 'pato', emoji: '🦆', label: 'PATO', bucket: 'p' }, { id: 'pan', emoji: '🍞', label: 'PAN', bucket: 'p' }] },
  hints: ['Toca la imagen para oír su nombre.', 'MONO y MANO empiezan con mmm.'] });

act({ id: 'PF-06', module: 'phonological', level: 2, skill: 'Identificación del sonido inicial', objective: 'Relacionar el sonido inicial de una palabra con su letra', difficulty: 'medium', icon: '🌙',
  title: '¿Con qué sonido empieza LUNA?', instruction: '¿Con qué sonido empieza LUNA?', type: 'multiple-choice',
  audioText: '¿Con qué sonido empieza luna?',
  content: { prompt: { emoji: '🌙', word: 'LUNA', listen: 'luna. lll, lll, luna' }, options: [oSound('L', true), oSound('M'), oSound('S')], result: 'luna' },
  hints: ['Escucha: llll-una.', 'La lengua sube al decir llll.'] });

/* Nivel 3 — Sonido final */
act({ id: 'PF-07', module: 'phonological', level: 3, skill: 'Identificación del sonido final', objective: 'Identificar el sonido con el que termina una palabra', difficulty: 'medium', icon: '🍞',
  title: '¿Con qué sonido termina PAN?', instruction: '¿Con qué sonido termina PAN?', type: 'multiple-choice',
  audioText: '¿Con qué sonido termina pan?',
  content: { prompt: { emoji: '🍞', word: 'PAN', listen: 'pan. pa, nnn' }, options: [oSound('N', true), oSound('M'), oSound('A')], result: 'pan' },
  hints: ['Escucha el final: pa-nnn.', 'Alarga el final: paaannn.'] });

act({ id: 'PF-08', module: 'phonological', level: 3, skill: 'Identificación del sonido final', objective: 'Encontrar palabras que terminan con el mismo sonido', difficulty: 'medium', icon: '🐱',
  title: '¿Cuál termina como GATO?', instruction: '¿Cuál termina igual que GATO?', type: 'image-choice',
  audioText: '¿Cuál termina igual que gato?',
  content: { prompt: { emoji: '🐱', word: 'GATO', listen: 'gato. ga-to, oooo' }, options: [oImg('mono', true), oImg('luna'), oImg('sol')], result: 'gato, mono' },
  hints: ['GATO termina con la o.', 'Escucha el final: mon-oooo.'] });

act({ id: 'PF-09', module: 'phonological', level: 3, skill: 'Diferenciación de sonidos', objective: 'Comparar el sonido inicial de dos palabras', difficulty: 'medium', icon: '⚖️',
  title: '¿Suenan igual al comenzar?', instruction: '¿PATO y PAN empiezan igual?', type: 'multiple-choice',
  audioText: '¿Pato y pan empiezan igual?',
  content: { prompt: { emoji: '🦆 🍞', word: 'PATO · PAN', listen: 'pato. pan.' }, options: [oTxt('✔ Sí', true, 'sí'), oTxt('✖ No', false, 'no')], result: 'pato y pan empiezan con pa' },
  hints: ['Di las dos palabras despacio: pa-to, pa-n.', 'Los dos empiezan con pa.'] });

/* Nivel 4 — Sílabas */
act({ id: 'PF-10', module: 'phonological', level: 4, skill: 'Conteo de sílabas', objective: 'Contar las sílabas de una palabra', difficulty: 'medium', icon: '👏',
  title: '¿Cuántas sílabas tiene GATO?', instruction: 'Aplaude cada parte de GATO. ¿Cuántas sílabas tiene?', type: 'multiple-choice',
  audioText: 'Aplaude cada parte de gato. ¿Cuántas sílabas tiene?',
  content: { prompt: { emoji: '🐱', word: 'GA · TO', listen: 'ga. to.' }, options: [oTxt('1', false), oTxt('2', true), oTxt('3', false)], result: 'gato tiene dos sílabas: ga, to' },
  hints: ['Aplaude con cada parte: ga (palmada), to (palmada).', 'Cuenta las palmadas.'] });

act({ id: 'PF-11', module: 'phonological', level: 4, skill: 'Identificación de sílaba inicial', objective: 'Identificar la sílaba con la que empieza una palabra', difficulty: 'medium', icon: '🌙',
  title: '¿Con qué sílaba empieza LUNA?', instruction: '¿Con qué sílaba empieza LUNA?', type: 'multiple-choice',
  audioText: '¿Con qué sílaba empieza luna?',
  content: { prompt: { emoji: '🌙', word: 'LU · NA', listen: 'lu. na.' }, options: [oTxt('LU', true), oTxt('NA', false), oTxt('MA', false)], result: 'lu' },
  hints: ['LUNA se parte en LU y NA.', 'La primera parte es lu.'] });

act({ id: 'PF-12', module: 'phonological', level: 4, skill: 'Identificación de sílaba final', objective: 'Identificar la sílaba con la que termina una palabra', difficulty: 'medium', icon: '🏠',
  title: '¿Con qué sílaba termina CASA?', instruction: '¿Con qué sílaba termina CASA?', type: 'multiple-choice',
  audioText: '¿Con qué sílaba termina casa?',
  content: { prompt: { emoji: '🏠', word: 'CA · SA', listen: 'ca. sa.' }, options: [oTxt('SA', true), oTxt('CA', false), oTxt('SO', false)], result: 'sa' },
  hints: ['CASA se parte en CA y SA.', 'La última parte es sa.'] });

/* Nivel 5 — Construcción */
act({ id: 'PF-13', module: 'phonological', level: 5, skill: 'Unión de sílabas', objective: 'Unir sílabas para formar una palabra', difficulty: 'medium', icon: '✋',
  title: 'MA + NO', instruction: 'Une las sílabas para formar la palabra.', type: 'syllable-builder',
  audioText: 'Une las sílabas para formar la palabra.',
  content: { prompt: { emoji: '✋', listen: 'ma. no.' }, answer: ['MA', 'NO'], distractors: ['PA'], joiner: '', result: 'MANO', equation: true },
  hints: ['Empieza con MA.', 'MA + NO se lee mano.'] });

act({ id: 'PF-14', module: 'phonological', level: 5, skill: 'Unión de sílabas', objective: 'Unir sílabas para formar una palabra', difficulty: 'medium', icon: '🏠',
  title: 'CA + SA', instruction: 'Arrastra las sílabas para formar la palabra.', type: 'syllable-builder',
  audioText: 'Arrastra las sílabas para formar la palabra.',
  content: { prompt: { emoji: '🏠', listen: 'ca. sa.' }, answer: ['CA', 'SA'], distractors: ['LU'], joiner: '', result: 'CASA', equation: true },
  hints: ['La casa empieza con CA.', 'CA + SA se lee casa.'] });

act({ id: 'PF-15', module: 'phonological', level: 5, skill: 'Unión de sílabas', objective: 'Ordenar cuatro sílabas para formar una palabra larga', difficulty: 'challenge', icon: '🦋', estimatedTime: 3,
  title: 'MA + RI + PO + SA', instruction: 'Ordena las sílabas: ¿qué palabra se forma?', type: 'syllable-builder',
  audioText: 'Ordena las sílabas para formar la palabra.',
  content: { prompt: { emoji: '🦋', listen: 'ma. ri. po. sa.' }, answer: ['MA', 'RI', 'PO', 'SA'], distractors: ['LU'], joiner: '', result: 'MARIPOSA', equation: true },
  hints: ['Empieza con MA.', 'Después va RI, luego PO y al final SA.'] });

/* Sílabas trabadas (dos consonantes seguidas en una sola sílaba: pl, gl, gr, br, cl, dr…).
   Se agregan como reto dentro del nivel 5, junto a la construcción de palabras. */
act({ id: 'PF-16', module: 'phonological', level: 5, skill: 'Sílabas trabadas', objective: 'Contar las sílabas de una palabra con sílaba trabada', difficulty: 'challenge', icon: '🍽️',
  title: '¿Cuántas sílabas tiene PLATO?', instruction: 'Aplaude cada parte de PLATO. ¿Cuántas sílabas tiene?', type: 'multiple-choice',
  audioText: 'Aplaude cada parte de plato. ¿Cuántas sílabas tiene?',
  content: { prompt: { emoji: '🍽️', word: 'PLA · TO', listen: 'pla. to.' }, options: [oTxt('1', false), oTxt('2', true), oTxt('3', false)], result: 'plato tiene dos sílabas: pla, to' },
  hints: ['Aplaude con cada parte: pla (palmada), to (palmada).', 'PLA suena como un solo golpe, aunque tenga dos letras juntas: la p y la l.'] });

act({ id: 'PF-17', module: 'phonological', level: 5, skill: 'Sílabas trabadas', objective: 'Asociar una sílaba trabada con la imagen que empieza con ella', difficulty: 'challenge', icon: '🔗', estimatedTime: 3,
  title: 'Sílabas trabadas', instruction: 'Une cada sílaba con la imagen que empieza con ella.', type: 'matching',
  audioText: 'Une cada sílaba con la imagen que empieza con ella.',
  content: { pairs: [
    { a: { label: 'PLA', speak: 'pla' }, b: { emoji: W.plato[0], label: 'PLATO', speak: 'plato' } },
    { a: { label: 'GRI', speak: 'gri' }, b: { emoji: W.grillo[0], label: 'GRILLO', speak: 'grillo' } },
    { a: { label: 'BRA', speak: 'bra' }, b: { emoji: W.brazo[0], label: 'BRAZO', speak: 'brazo' } }] },
  hints: ['Escucha con calma: las dos consonantes suenan juntas, pla.', 'Toca la imagen para oír su nombre.'] });

act({ id: 'PF-18', module: 'phonological', level: 5, skill: 'Sílabas trabadas', objective: 'Unir sílabas trabadas para formar una palabra', difficulty: 'challenge', icon: '🎈',
  title: 'GLO + BO', instruction: 'Une las sílabas para formar la palabra.', type: 'syllable-builder',
  audioText: 'Une las sílabas para formar la palabra.',
  content: { prompt: { emoji: '🎈', listen: 'glo. bo.' }, answer: ['GLO', 'BO'], distractors: ['CLA'], joiner: '', result: 'GLOBO', equation: true },
  hints: ['Empieza con GLO.', 'GLO + BO se lee globo.'] });

/* ================= MÓDULO 2 · LECTURA ================= */
/* Nivel 1 — Letras */
act({ id: 'LE-01', module: 'reading', level: 1, skill: 'Reconocimiento de letras', objective: 'Reconocer una letra a partir de su nombre', difficulty: 'easy', icon: '🔤',
  title: 'Toca la letra M', instruction: 'Escucha el nombre de la letra y tócala.', type: 'multiple-choice',
  audioText: 'Escucha el nombre de la letra y tócala. La letra eme.',
  content: { prompt: { emoji: '🔊', word: '', listen: 'La letra eme' }, options: [oLetter('N'), oLetter('M', true), oLetter('P')], result: 'eme' },
  hints: ['La eme tiene dos montañas: M.', 'Toca cada letra para oír su nombre.'] });

act({ id: 'LE-02', module: 'reading', level: 1, skill: 'Mayúscula y minúscula', objective: 'Asociar cada letra mayúscula con su minúscula', difficulty: 'easy', icon: 'Aa',
  title: 'Mayúscula y minúscula', instruction: 'Une cada letra grande con su letra pequeña.', type: 'matching',
  audioText: 'Une cada letra grande con su letra pequeña.',
  content: { pairs: [{ a: { label: 'M', speak: 'eme' }, b: { label: 'm', speak: 'eme' } }, { a: { label: 'P', speak: 'pe' }, b: { label: 'p', speak: 'pe' } }, { a: { label: 'S', speak: 'ese' }, b: { label: 's', speak: 'ese' } }] },
  hints: ['Mira la forma: la pequeña se parece a la grande.', 'La M grande y la m pequeña tienen montañas.'] });

act({ id: 'LE-03', module: 'reading', level: 1, skill: 'Relación letra–imagen', objective: 'Asociar una letra con la imagen que comienza con ella', difficulty: 'easy', icon: '🌙',
  title: 'Letra e imagen', instruction: 'Une cada letra con la imagen que empieza con ella.', type: 'matching',
  audioText: 'Une cada letra con la imagen que empieza con ella.',
  content: { pairs: [{ a: { label: 'L', speak: 'llll' }, b: { emoji: W.luna[0], label: 'LUNA', speak: 'luna' } }, { a: { label: 'C', speak: 'ka' }, b: { emoji: W.casa[0], label: 'CASA', speak: 'casa' } }, { a: { label: 'G', speak: 'ga' }, b: { emoji: W.gato[0], label: 'GATO', speak: 'gato' } }] },
  hints: ['Toca la imagen para oír su nombre.', 'Escucha cómo empieza cada palabra.'] });

/* Nivel 2 — Sílabas */
act({ id: 'LE-04', module: 'reading', level: 2, skill: 'Lectura de sílabas', objective: 'Reconocer una sílaba a partir de su sonido', difficulty: 'easy', icon: '🅼',
  title: 'Escucha y elige la sílaba', instruction: 'Escucha la sílaba y tócala.', type: 'multiple-choice',
  audioText: 'Escucha la sílaba y tócala.',
  content: { prompt: { emoji: '🔊', word: '', listen: 'ma' }, options: [oTxt('ME', false, 'me'), oTxt('MA', true, 'ma'), oTxt('MI', false, 'mi')], result: 'ma' },
  hints: ['Escucha bien la vocal: ma, ma.', 'Toca cada sílaba para leerla en voz alta.'] });

act({ id: 'LE-05', module: 'reading', level: 2, skill: 'Relación sílaba–imagen', objective: 'Asociar una sílaba con la imagen que empieza con ella', difficulty: 'easy', icon: '🍞',
  title: 'Sílaba e imagen', instruction: 'Une cada sílaba con la imagen que empieza con ella.', type: 'matching',
  audioText: 'Une cada sílaba con la imagen que empieza con ella.',
  content: { pairs: [{ a: { label: 'PA', speak: 'pa' }, b: { emoji: W.pan[0], label: 'PAN', speak: 'pan' } }, { a: { label: 'SO', speak: 'so' }, b: { emoji: W.sol[0], label: 'SOL', speak: 'sol' } }, { a: { label: 'LU', speak: 'lu' }, b: { emoji: W.luna[0], label: 'LUNA', speak: 'luna' } }] },
  hints: ['Lee la sílaba y di la palabra.', 'PA de PAN, SO de SOL, LU de LUNA.'] });

act({ id: 'LE-06', module: 'reading', level: 2, skill: 'Completar palabras', objective: 'Completar una palabra con la sílaba que falta', difficulty: 'medium', icon: '🏠',
  title: 'Completa: CA _', instruction: 'Elige la sílaba que falta para formar la palabra.', type: 'fill-blank',
  audioText: 'Elige la sílaba que falta para formar la palabra.',
  content: { prompt: { emoji: '🏠', frame: ['CA', ''], listen: 'ca... casa' }, options: [oTxt('SO', false), oTxt('SA', true), oTxt('PA', false)], result: 'casa' },
  hints: ['Mira la imagen: es una casa.', 'Casa termina con sa.'] });

/* Nivel 3 — Palabras */
act({ id: 'LE-07', module: 'reading', level: 3, skill: 'Lectura de palabras', objective: 'Leer una palabra y elegir la imagen que la representa', difficulty: 'medium', icon: '📖',
  title: 'Leo GATO', instruction: 'Lee la palabra y toca la imagen.', type: 'image-choice',
  audioText: 'Lee la palabra y toca la imagen.',
  content: { labels: false, prompt: { word: 'GATO', listen: 'gato' }, options: [oImg('perro'), oImg('gato', true), oImg('mono')], result: 'gato' },
  hints: ['Lee con calma: ga-to.', 'Toca el botón de escuchar para oír la palabra.'] });

act({ id: 'LE-08', module: 'reading', level: 3, skill: 'Lectura de palabras', objective: 'Escuchar una palabra y reconocerla escrita', difficulty: 'medium', icon: '👂',
  title: 'Escucha y elige la palabra', instruction: 'Escucha la palabra y toca cómo se escribe.', type: 'multiple-choice',
  audioText: 'Escucha la palabra y toca cómo se escribe.',
  content: { prompt: { emoji: '🔊', word: '', listen: 'pato' }, options: [oTxt('GATO', false), oTxt('SAPO', false), oTxt('PATO', true)], result: 'pato' },
  hints: ['Pato empieza con pa.', 'Lee cada palabra en voz baja.'] });

act({ id: 'LE-09', module: 'reading', level: 3, skill: 'Ordenar letras para formar palabras', objective: 'Ordenar letras para leer una palabra conocida', difficulty: 'challenge', icon: '🔀',
  title: 'Ordena las letras', instruction: 'Ordena las letras para formar la palabra.', type: 'word-builder',
  audioText: 'Ordena las letras para formar la palabra.',
  content: { prompt: { emoji: '🌙', listen: 'luna' }, answer: ['L', 'U', 'N', 'A'], distractors: [], joiner: '', result: 'LUNA' },
  hints: ['Empieza con la L.', 'L, U, N, A.'] });

/* Nivel 4 — Oraciones */
act({ id: 'LE-10', module: 'reading', level: 4, skill: 'Comprensión de oraciones', objective: 'Identificar quién realiza la acción en una oración', difficulty: 'medium', icon: '🐶',
  title: '¿Quién corre?', instruction: 'Lee la oración. ¿Quién corre?', type: 'image-choice',
  audioText: 'Lee la oración. ¿Quién corre?',
  content: { labels: false, prompt: { word: 'EL PERRO CORRE.', listen: 'El perro corre.' }, options: [oImg('gato'), oImg('perro', true), oImg('sapo')], result: 'el perro corre' },
  hints: ['La primera palabra importante es PERRO.', 'Lee: el, perro, corre.'] });

act({ id: 'LE-11', module: 'reading', level: 4, skill: 'Relación oración–imagen', objective: 'Relacionar una oración con la imagen que la representa', difficulty: 'medium', icon: '🖼️',
  title: 'Oración e imagen', instruction: 'Une cada oración con su imagen.', type: 'matching', estimatedTime: 3,
  audioText: 'Une cada oración con su imagen.',
  content: { pairs: [{ a: { label: 'EL PATO NADA.', speak: 'El pato nada.' }, b: { emoji: '🦆🌊', speak: 'Un pato en el agua' } }, { a: { label: 'MAMÁ COME PAN.', speak: 'Mamá come pan.' }, b: { emoji: '👩🍞', speak: 'Mamá con pan' } }, { a: { label: 'EL SOL BRILLA.', speak: 'El sol brilla.' }, b: { emoji: '☀️✨', speak: 'El sol brilla' } }] },
  hints: ['Busca en la oración palabras que veas en la imagen: PATO, PAN, SOL.', 'Toca la oración para escucharla.'] });

act({ id: 'LE-12', module: 'reading', level: 4, skill: 'Ordenar palabras en oraciones', objective: 'Ordenar palabras para formar una oración con sentido', difficulty: 'challenge', icon: '🧩',
  title: 'Ordena la oración', instruction: 'Ordena las palabras para leer la oración.', type: 'sentence-builder',
  audioText: 'Ordena las palabras para leer la oración.',
  content: { prompt: { emoji: '🐱', listen: 'El gato salta.' }, answer: ['EL', 'GATO', 'SALTA'], distractors: [], joiner: ' ', result: 'EL GATO SALTA.' },
  hints: ['La oración empieza con EL.', 'EL, GATO, SALTA.'] });

/* Nivel 5 — Textos cortos y comprensión */
act({ id: 'LE-13', module: 'reading', level: 5, skill: 'Comprensión de textos cortos', objective: 'Comprender un texto de tres oraciones y responder preguntas', difficulty: 'medium', icon: '👧',
  title: 'Lola y su gato', instruction: 'Lee el texto y responde.', type: 'reading-comprehension', estimatedTime: 4,
  audioText: 'Lee el texto y responde las preguntas.',
  content: { emoji: '👧🐱⚽', sentences: ['Lola tiene un gato.', 'El gato es pequeño.', 'El gato juega con una pelota.'],
    questions: [
      { q: '¿Quién tiene un gato?', options: [{ emoji: '👦', label: 'PEPE' }, { emoji: '👧', label: 'LOLA', correct: true }, { emoji: '👩', label: 'MAMÁ' }] },
      { q: 'Verdadero o falso: el gato es grande.', options: [oTxt('✔ Verdadero', false), oTxt('✖ Falso', true)] },
      { q: '¿Con qué juega el gato?', options: [{ emoji: '🍞', label: 'PAN' }, { emoji: '🦴', label: 'HUESO' }, { emoji: '⚽', label: 'PELOTA', correct: true }] }] },
  hints: ['Vuelve a leer la oración que habla de eso.', 'Toca 🔊 para escuchar el texto.'] });

act({ id: 'LE-14', module: 'reading', level: 5, skill: 'Comprensión de textos cortos', objective: 'Identificar dónde está el personaje y qué hace', difficulty: 'medium', icon: '🐸',
  title: 'El sapo', instruction: 'Lee el texto y responde.', type: 'reading-comprehension', estimatedTime: 4,
  audioText: 'Lee el texto y responde las preguntas.',
  content: { emoji: '🐸💧🍃', sentences: ['El sapo está en el agua.', 'El sapo salta.', 'Salta sobre una hoja.'],
    questions: [
      { q: '¿Dónde está el sapo?', options: [{ emoji: '🏠', label: 'EN LA CASA' }, { emoji: '💧', label: 'EN EL AGUA', correct: true }, { emoji: '🌙', label: 'EN LA LUNA' }] },
      { q: '¿Qué hace el sapo?', options: [{ emoji: '😴', label: 'DUERME' }, { emoji: '🍞', label: 'COME' }, { emoji: '🤸', label: 'SALTA', correct: true }] },
      { q: 'Verdadero o falso: el sapo duerme.', options: [oTxt('✔ Verdadero', false), oTxt('✖ Falso', true)] }] },
  hints: ['Busca la palabra que responde a la pregunta.', 'Toca 🔊 para escuchar el texto.'] });

act({ id: 'LE-15', module: 'reading', level: 5, skill: 'Comprensión de textos cortos', objective: 'Comprender la secuencia de un texto de cuatro oraciones', difficulty: 'challenge', icon: '🌳', estimatedTime: 5,
  title: 'En el parque', instruction: 'Lee el texto y responde.', type: 'reading-comprehension',
  audioText: 'Lee el texto y responde las preguntas.',
  content: { emoji: '👦👩⚽🍞', sentences: ['Mateo va al parque con mamá.', 'Ellos juegan con una pelota.', 'Después comen pan.'],
    questions: [
      { q: '¿Con quién va Mateo al parque?', options: [{ emoji: '👨', label: 'PAPÁ' }, { emoji: '👩', label: 'MAMÁ', correct: true }, { emoji: '👧', label: 'ANA' }] },
      { q: '¿Con qué juegan?', options: [{ emoji: '⚽', label: 'PELOTA', correct: true }, { emoji: '🦴', label: 'HUESO' }, { emoji: '🍞', label: 'PAN' }] },
      { q: 'Verdadero o falso: primero comen y después juegan.', options: [oTxt('✔ Verdadero', false), oTxt('✖ Falso', true)] }] },
  hints: ['Fíjate en la palabra DESPUÉS.', 'Toca 🔊 para escuchar el texto.'] });

/* Sílabas trabadas en lectura */
act({ id: 'LE-16', module: 'reading', level: 5, skill: 'Lectura de palabras con sílabas trabadas', objective: 'Leer una palabra con sílaba trabada y elegir la imagen que la representa', difficulty: 'challenge', icon: '📚',
  title: 'Leo LIBRO', instruction: 'Lee la palabra y toca la imagen.', type: 'image-choice',
  audioText: 'Lee la palabra y toca la imagen.',
  content: { labels: false, prompt: { word: 'LIBRO', listen: 'libro' }, options: [oImg('flor'), oImg('libro', true), oImg('tren')], result: 'libro' },
  hints: ['Lee con calma: li-bro.', 'Toca 🔊 para escuchar la palabra.'] });

act({ id: 'LE-17', module: 'reading', level: 5, skill: 'Lectura de sílabas trabadas', objective: 'Completar una palabra con la sílaba trabada que falta', difficulty: 'challenge', icon: '🐉',
  title: 'Completa: _ GÓN', instruction: 'Elige la sílaba que falta para formar la palabra.', type: 'fill-blank',
  audioText: 'Elige la sílaba que falta para formar la palabra.',
  content: { prompt: { emoji: '🐉', frame: ['', 'GÓN'], listen: 'dra... dragón' }, options: [oTxt('DRA', true), oTxt('GRA', false), oTxt('CLA', false)], result: 'dragón' },
  hints: ['Escucha el comienzo: dra-gón.', 'Las letras d y r suenan juntas: dra.'] });

act({ id: 'LE-18', module: 'reading', level: 5, skill: 'Lectura de palabras con sílabas trabadas', objective: 'Ordenar letras para leer una palabra con sílaba trabada', difficulty: 'challenge', icon: '🌸',
  title: 'Ordena las letras: FLOR', instruction: 'Ordena las letras para formar la palabra.', type: 'word-builder',
  audioText: 'Ordena las letras para formar la palabra.',
  content: { prompt: { emoji: '🌸', listen: 'flor' }, answer: ['F', 'L', 'O', 'R'], distractors: ['P'], joiner: '', result: 'FLOR' },
  hints: ['Empieza con F.', 'F, L, O, R.'] });

/* ================= MÓDULO 3 · ESCRITURA ================= */
/* Nivel 1 — Trazos y letras */
act({ id: 'ES-01', module: 'writing', level: 1, skill: 'Trazo de letras', objective: 'Repasar el trazo de una letra redonda', difficulty: 'easy', icon: '⭕',
  title: 'Repaso la letra O', instruction: 'Pasa el dedo (o el ratón) por encima de la letra O.', type: 'tracing',
  audioText: 'Pasa el dedo por encima de la letra o.',
  content: { letter: 'O', name: 'o', pool: ['O', 'A', 'U'] },
  hints: ['Empieza arriba y sigue el borde despacio.', 'Puedes borrar y volver a intentarlo.'] });

act({ id: 'ES-02', module: 'writing', level: 1, skill: 'Trazo de letras', objective: 'Repasar el trazo de una letra con líneas rectas', difficulty: 'medium', icon: '✏️',
  title: 'Repaso la letra M', instruction: 'Pasa el dedo (o el ratón) por encima de la letra M.', type: 'tracing',
  audioText: 'Pasa el dedo por encima de la letra eme.',
  content: { letter: 'M', name: 'eme', pool: ['M', 'N', 'W'] },
  hints: ['La M tiene cuatro palitos: baja, sube, baja, sube.', 'Puedes borrar y volver a intentarlo.'] });

act({ id: 'ES-03', module: 'writing', level: 1, skill: 'Completar letras', objective: 'Completar una secuencia de letras del abecedario', difficulty: 'easy', icon: '🔠',
  title: 'A B _ D', instruction: '¿Qué letra falta?', type: 'fill-blank',
  audioText: '¿Qué letra falta en a, b, punto, de?',
  content: { prompt: { frame: ['A B', 'D'], listen: 'a, be, ce, de' }, options: [oLetter('E'), oLetter('C', true), oLetter('F')], result: 'a, be, ce, de' },
  hints: ['Canta el abecedario: a, be, ce, de.', 'Después de la B viene la C.'] });

/* Nivel 2 — Copio sílabas y palabras */
act({ id: 'ES-04', module: 'writing', level: 2, skill: 'Copia de sílabas', objective: 'Copiar una sílaba usando letras', difficulty: 'easy', icon: '📝',
  title: 'Copio MA', instruction: 'Copia la sílaba MA.', type: 'guided-write',
  audioText: 'Copia la sílaba ma.',
  content: { prompt: 'Copia', model: 'MA', showModel: true, accept: ['ma'], modes: ['keyboard', 'letters'], distractors: ['E', 'O'] },
  hints: ['Mira el modelo: MA.', 'Primero la M y luego la A.'] });

act({ id: 'ES-05', module: 'writing', level: 2, skill: 'Copia de palabras', objective: 'Copiar una palabra corta', difficulty: 'easy', icon: '☀️',
  title: 'Copio SOL', instruction: 'Copia la palabra SOL.', type: 'guided-write',
  audioText: 'Copia la palabra sol.',
  content: { emoji: '☀️', prompt: 'Copia', model: 'SOL', showModel: true, accept: ['sol'], modes: ['keyboard', 'letters'], distractors: ['A', 'E'] },
  hints: ['Mira el modelo: SOL.', 'S, O, L.'] });

act({ id: 'ES-06', module: 'writing', level: 2, skill: 'Completar palabras', objective: 'Completar una palabra con la vocal que falta', difficulty: 'medium', icon: '🐱',
  title: 'G _ T O', instruction: 'Elige la letra que falta.', type: 'fill-blank',
  audioText: 'Elige la letra que falta para escribir gato.',
  content: { prompt: { emoji: '🐱', frame: ['G', 'TO'], listen: 'gato' }, options: [oLetter('A', true), oLetter('E'), { label: 'I', correct: false, speak: 'i' }], result: 'gato' },
  hints: ['Di la palabra despacio: g-a-t-o.', 'Entre G y T va la A.'] });

/* Nivel 3 — Construcción de palabras */
act({ id: 'ES-07', module: 'writing', level: 3, skill: 'Construcción de palabras', objective: 'Formar una palabra con letras móviles', difficulty: 'medium', icon: '🏠',
  title: 'Construyo CASA', instruction: 'Pon las letras en orden para escribir la palabra.', type: 'word-builder',
  audioText: 'Pon las letras en orden para escribir la palabra.',
  content: { prompt: { emoji: '🏠', listen: 'casa' }, answer: ['C', 'A', 'S', 'A'], distractors: ['M'], joiner: '', result: 'CASA' },
  hints: ['Empieza con C.', 'C, A, S, A.'] });

act({ id: 'ES-08', module: 'writing', level: 3, skill: 'Construcción de palabras', objective: 'Formar una palabra con letras móviles', difficulty: 'medium', icon: '🌙',
  title: 'Construyo LUNA', instruction: 'Pon las letras en orden para escribir la palabra.', type: 'word-builder',
  audioText: 'Pon las letras en orden para escribir la palabra.',
  content: { prompt: { emoji: '🌙', listen: 'luna' }, answer: ['L', 'U', 'N', 'A'], distractors: ['O'], joiner: '', result: 'LUNA' },
  hints: ['Empieza con L.', 'L, U, N, A.'] });

act({ id: 'ES-09', module: 'writing', level: 3, skill: 'Construcción de palabras', objective: 'Formar una palabra con letras móviles y distractores', difficulty: 'challenge', icon: '🐸',
  title: 'Construyo SAPO', instruction: 'Pon las letras en orden para escribir la palabra.', type: 'word-builder',
  audioText: 'Pon las letras en orden para escribir la palabra.',
  content: { prompt: { emoji: '🐸', listen: 'sapo' }, answer: ['S', 'A', 'P', 'O'], distractors: ['E', 'L'], joiner: '', result: 'SAPO' },
  hints: ['Empieza con S.', 'S, A, P, O.'] });

/* Nivel 4 — Construcción de frases */
act({ id: 'ES-10', module: 'writing', level: 4, skill: 'Construcción de frases', objective: 'Ordenar palabras para escribir una frase', difficulty: 'medium', icon: '🐱',
  title: 'EL GATO COME', instruction: 'Ordena las palabras para escribir la frase.', type: 'sentence-builder',
  audioText: 'Ordena las palabras para escribir la frase.',
  content: { prompt: { emoji: '🐱🍽️', listen: 'El gato come.' }, answer: ['EL', 'GATO', 'COME'], distractors: [], joiner: ' ', result: 'EL GATO COME.' },
  hints: ['La frase empieza con EL.', 'EL, GATO, COME.'] });

act({ id: 'ES-11', module: 'writing', level: 4, skill: 'Construcción de frases', objective: 'Ordenar palabras para escribir una frase con una palabra extra', difficulty: 'medium', icon: '🐶',
  title: 'EL PERRO CORRE', instruction: 'Ordena las palabras para escribir la frase.', type: 'sentence-builder',
  audioText: 'Ordena las palabras para escribir la frase. Sobra una palabra.',
  content: { prompt: { emoji: '🐶🏃', listen: 'El perro corre.' }, answer: ['EL', 'PERRO', 'CORRE'], distractors: ['SOL'], joiner: ' ', result: 'EL PERRO CORRE.' },
  hints: ['Sobra una palabra que no cuenta la historia.', 'EL, PERRO, CORRE.'] });

act({ id: 'ES-12', module: 'writing', level: 4, skill: 'Copia de frases', objective: 'Copiar una frase completa eligiendo cómo escribirla', difficulty: 'medium', icon: '👩',
  title: 'Escribo MAMÁ COME PAN', instruction: 'Escribe la frase como tú quieras.', type: 'guided-write', estimatedTime: 3,
  audioText: 'Escribe la frase. Puedes usar el teclado, palabras o completar.',
  content: { emoji: '👩🍞', prompt: 'Copia', model: 'MAMÁ COME PAN', showModel: true, accept: ['mama come pan'], modes: ['keyboard', 'words', 'complete'], distractors: ['SOL', 'LUNA'],
    frame: { before: 'MAMÁ COME', after: '.', options: [oTxt('PAN', true), oTxt('LUNA', false), oTxt('SOL', false)] } },
  hints: ['Mira el modelo y copia cada palabra.', 'MAMÁ, COME, PAN.'] });

/* Nivel 5 — Producción guiada */
act({ id: 'ES-13', module: 'writing', level: 5, skill: 'Producción escrita guiada', objective: 'Escribir el nombre de lo que se ve en una imagen', difficulty: 'medium', icon: '🐱',
  title: 'Escribe qué ves: gato', instruction: 'Escribe qué ves. Elige cómo quieres hacerlo.', type: 'guided-write', estimatedTime: 3,
  audioText: 'Escribe qué ves. Puedes escribir, usar letras, palabras o imágenes.',
  content: { emoji: '🐱', prompt: 'Escribe qué ves', model: 'GATO', showModel: false, accept: ['gato', 'el gato', 'un gato', 'mi gato', 'gatito', 'la gata', 'gata'], modes: ['keyboard', 'letters', 'words', 'pictos', 'complete'], distractors: ['E', 'R'], wordBank: ['PERRO', 'SOL'],
    pictos: { answer: ['gato'], options: [{ k: 'gato', emoji: '🐱', label: 'gato' }, { k: 'perro', emoji: '🐶', label: 'perro' }, { k: 'sol', emoji: '☀️', label: 'sol' }] },
    frame: { before: 'Veo un', after: '.', options: [oTxt('GATO', true), oTxt('PERRO', false), oTxt('SOL', false)] } },
  hints: ['Mira la imagen con calma.', 'Es un animal que dice miau.'] });

act({ id: 'ES-14', module: 'writing', level: 5, skill: 'Producción escrita guiada', objective: 'Escribir el nombre de lo que se ve en una imagen', difficulty: 'medium', icon: '🌙',
  title: 'Escribe qué ves: luna', instruction: 'Escribe qué ves. Elige cómo quieres hacerlo.', type: 'guided-write', estimatedTime: 3,
  audioText: 'Escribe qué ves. Puedes escribir, usar letras, palabras o imágenes.',
  content: { emoji: '🌙', prompt: 'Escribe qué ves', model: 'LUNA', showModel: false, accept: ['luna', 'la luna', 'una luna'], modes: ['keyboard', 'letters', 'words', 'pictos', 'complete'], distractors: ['O', 'R'], wordBank: ['SOL', 'CASA'],
    pictos: { answer: ['luna'], options: [{ k: 'luna', emoji: '🌙', label: 'luna' }, { k: 'sol', emoji: '☀️', label: 'sol' }, { k: 'casa', emoji: '🏠', label: 'casa' }] },
    frame: { before: 'Veo la', after: '.', options: [oTxt('LUNA', true), oTxt('CASA', false), oTxt('SOL', false)] } },
  hints: ['Mira la imagen: sale de noche.', 'Empieza con L.'] });

act({ id: 'ES-15', module: 'writing', level: 5, skill: 'Producción escrita guiada', objective: 'Escribir una oración corta a partir de una imagen', difficulty: 'challenge', icon: '🐶',
  title: 'Escribe una oración', instruction: 'Escribe una oración sobre la imagen. Elige cómo quieres hacerlo.', type: 'guided-write', estimatedTime: 4,
  audioText: 'Escribe una oración sobre la imagen. Puedes escribir, usar palabras, imágenes o completar.',
  content: { emoji: '🐶🏃', prompt: 'Escribe una oración', model: 'EL PERRO CORRE', showModel: false, contains: ['perro'], minWords: 2, accept: ['el perro corre'], modes: ['keyboard', 'words', 'pictos', 'complete'], distractors: ['LUNA'],
    pictos: { answer: ['perro', 'corre'], options: [{ k: 'corre', emoji: '🏃', label: 'corre' }, { k: 'perro', emoji: '🐶', label: 'perro' }, { k: 'manzana', emoji: '🍎', label: 'manzana' }, { k: 'luna', emoji: '🌙', label: 'luna' }] },
    frame: { before: 'EL PERRO', after: '.', options: [oTxt('CORRE', true), oTxt('LUNA', false), oTxt('PAN', false)] } },
  hints: ['Di quién es y qué hace: el perro… corre.', 'Puedes cambiar de modo si quieres otra ayuda.'] });

/* Sílabas trabadas en escritura */
act({ id: 'ES-16', module: 'writing', level: 5, skill: 'Escritura de sílabas trabadas', objective: 'Completar una palabra con la sílaba trabada que falta', difficulty: 'challenge', icon: '🎈',
  title: '_ BO', instruction: 'Elige la sílaba que falta.', type: 'fill-blank',
  audioText: 'Elige la sílaba que falta para escribir globo.',
  content: { prompt: { emoji: '🎈', frame: ['', 'BO'], listen: 'globo' }, options: [oTxt('GLO', true), oTxt('GRO', false), oTxt('CLO', false)], result: 'globo' },
  hints: ['Di la palabra despacio: glo-bo.', 'La g y la l suenan juntas: glo.'] });

act({ id: 'ES-17', module: 'writing', level: 5, skill: 'Escritura de sílabas trabadas', objective: 'Formar con letras móviles una palabra con sílaba trabada', difficulty: 'challenge', icon: '🍽️',
  title: 'Construyo PLATO', instruction: 'Pon las letras en orden para escribir la palabra.', type: 'word-builder',
  audioText: 'Pon las letras en orden para escribir la palabra.',
  content: { prompt: { emoji: '🍽️', listen: 'plato' }, answer: ['P', 'L', 'A', 'T', 'O'], distractors: ['B'], joiner: '', result: 'PLATO' },
  hints: ['Empieza con P.', 'P, L, A, T, O.'] });

act({ id: 'ES-18', module: 'writing', level: 5, skill: 'Producción escrita con sílabas trabadas', objective: 'Escribir el nombre de una imagen con sílaba trabada', difficulty: 'challenge', icon: '📚', estimatedTime: 3,
  title: 'Escribe qué ves: libro', instruction: 'Escribe qué ves. Elige cómo quieres hacerlo.', type: 'guided-write',
  audioText: 'Escribe qué ves. Puedes escribir, usar letras, palabras o imágenes.',
  content: { emoji: '📚', prompt: 'Escribe qué ves', model: 'LIBRO', showModel: false, accept: ['libro', 'un libro', 'el libro'], modes: ['keyboard', 'letters', 'words', 'pictos', 'complete'], distractors: ['E', 'R'], wordBank: ['FLOR', 'TREN'],
    pictos: { answer: ['libro'], options: [{ k: 'libro', emoji: '📚', label: 'libro' }, { k: 'flor', emoji: '🌸', label: 'flor' }, { k: 'tren', emoji: '🚂', label: 'tren' }] },
    frame: { before: 'Veo un', after: '.', options: [oTxt('LIBRO', true), oTxt('FLOR', false), oTxt('TREN', false)] } },
  hints: ['Mira la imagen: tiene páginas para leer.', 'Empieza con L.'] });

/* IDs de las actividades de sílabas trabadas, usados por el logro BLEND_MASTER */
const TRABADA_IDS = ['PF-16', 'PF-17', 'PF-18', 'LE-16', 'LE-17', 'LE-18', 'ES-16', 'ES-17', 'ES-18'];

/* ---------- Logros (sin ranking; cada uno se compara con el propio progreso) ---------- */
/* test(c): c.done = ids completados · c.n(mod) = # completadas · c.level(mod, L) = completas todas del nivel
            c.anyLevel(mod, L) = alguna del nivel · c.days = # de días con actividad */
const ACHIEVEMENTS = [
  { id: 'FIRST_STEP', emoji: '🏅', name: 'Primer paso', desc: 'Completa tu primera actividad.', test: c => c.done.length >= 1 },
  { id: 'FIVE_ACTIVITIES', emoji: '🖐️', name: '5 actividades', desc: 'Completa 5 actividades.', test: c => c.done.length >= 5 },
  { id: 'TEN_ACTIVITIES', emoji: '🔟', name: '10 actividades', desc: 'Completa 10 actividades.', test: c => c.done.length >= 10 },
  { id: 'FIRST_SOUND', emoji: '👂', name: 'Primer sonido', desc: 'Completa una actividad de sonidos.', test: c => c.n('phonological') >= 1 },
  { id: 'SOUND_MASTER', emoji: '🎧', name: 'Maestro de sonidos', desc: 'Completa los niveles 1, 2 y 3 de sonidos.', test: c => c.level('phonological', 1) && c.level('phonological', 2) && c.level('phonological', 3) },
  { id: 'SYLLABLE_MASTER', emoji: '👏', name: 'Maestro de sílabas', desc: 'Completa el nivel 4 de sonidos.', test: c => c.level('phonological', 4) },
  { id: 'FIRST_READER', emoji: '📗', name: 'Primera lectura', desc: 'Completa una actividad de lectura.', test: c => c.n('reading') >= 1 },
  { id: 'WORD_DETECTIVE', emoji: '🔍', name: 'Detective de palabras', desc: 'Completa el nivel 3 de lectura.', test: c => c.level('reading', 3) },
  { id: 'BIG_READER', emoji: '📚', name: 'Gran lector', desc: 'Lee un texto corto y responde.', test: c => c.anyLevel('reading', 5) },
  { id: 'WRITING_STAR', emoji: '🌟', name: 'Estrella de la escritura', desc: 'Completa una actividad de escritura.', test: c => c.n('writing') >= 1 },
  { id: 'SENTENCE_BUILDER', emoji: '🧱', name: 'Constructor de frases', desc: 'Completa el nivel 4 de escritura.', test: c => c.level('writing', 4) },
  { id: 'BIG_WRITER', emoji: '🖊️', name: 'Gran escritor', desc: 'Escribe lo que ves en el nivel 5.', test: c => c.anyLevel('writing', 5) },
  { id: 'EXPLORER', emoji: '🧭', name: 'Explorador', desc: 'Prueba los tres módulos.', test: c => c.n('phonological') >= 1 && c.n('reading') >= 1 && c.n('writing') >= 1 },
  { id: 'BLEND_MASTER', emoji: '🧩', name: 'Maestro de sílabas trabadas', desc: 'Completa las actividades de sílabas trabadas (pl, gr, bl, dr…).', test: c => TRABADA_IDS.every(id => c.done.includes(id)) },
  { id: 'THREE_DAYS', emoji: '📅', name: '3 días aprendiendo', desc: 'Aprende durante 3 días.', test: c => c.days >= 3 },
  { id: 'SEVEN_DAYS', emoji: '🌈', name: '7 días aprendiendo', desc: 'Aprende durante 7 días.', test: c => c.days >= 7 }
];

const actById = id => ACTIVITIES.find(a => a.id === id) || null;
const actsOf = (mod, level) => ACTIVITIES.filter(a => a.module === mod && (level == null || a.level === level));
