# 🦁 LeeOn — Aprendemos juntos, paso a paso

Prototipo funcional de lectoescritura inicial para niñas y niños de 6 a 8 años
(discapacidad intelectual leve, TEA, TDAH, dificultades de aprendizaje).
HTML + CSS + JavaScript sin dependencias. Los datos se guardan en `localStorage`.

## Cómo ejecutarlo

- **Rápido:** abre `index.html` en el navegador (doble clic). Todo funciona; la voz depende del navegador.
- **Como app instalable (PWA):** sirve la carpeta por http(s), por ejemplo
  `python3 -m http.server 8080` y abre `http://localhost:8080`. Desde Chrome/Edge aparece "Instalar".
  El *service worker* (`sw.js`) permite usarla sin conexión después de la primera carga.
  Si cambias archivos, sube el número de `CACHE` en `sw.js`.
- **Editar el código:** trabaja en `src/` y reconstruye el HTML único con
  `cd src && ./build.sh ../index.html pwa` (usa `./build.sh ../index.html` para la versión sin PWA).

Primera ejecución: se cargan 4 estudiantes de demostración (Ana 1234, Mateo 2345, Sofía 3456, Juan 4567).

## Acceso docente

- La pantalla inicial muestra dos botones bien diferenciados: **«👧 Soy estudiante»** y **«👩‍🏫 Panel docente»**
  (visualmente distinto, para que no se confunda con el de los niños).
- Tocar «Panel docente» **no entra directo al panel**: primero pide contraseña. También se puede llegar escribiendo
  la dirección `#/teacher` (por ejemplo `…/index.html#/teacher`) — cualquiera de las dos rutas pasa por el mismo control
  de acceso (`requireTeacherAuth()`), así que no hay forma de saltárselo cambiando la URL.
- La **primera vez** crea una contraseña (mínimo 6 caracteres) y recibe un **código de recuperación** que se muestra una sola vez.
  Después el panel siempre pide la contraseña. Tras 5 intentos fallidos espera 60 segundos.
- **Olvidé la contraseña:** «¿Olvidaste la contraseña?» + código de recuperación → contraseña nueva **sin perder datos**.
  Sin el código solo queda «Borrar todo y empezar de nuevo» (pide escribir BORRAR).
- El panel se cierra solo tras 30 minutos sin uso y **al salir de él** (cualquier pantalla de estudiante lo bloquea:
  un estudiante nunca puede quedar "convertido" en docente, y viceversa).
- Cambiar contraseña o crear un código nuevo: Configuración.
- ⚠️ Límite: es un prototipo sin servidor. La contraseña (guardada solo como huella, nunca en texto) impide que los niños entren,
  pero alguien con conocimientos técnicos y acceso al dispositivo podría leer los datos del navegador.

Enlaces a otras páginas (Wordwall, Genially…), cómo agregarlos y sus límites: ver la sección dedicada más abajo.

## Estructura

```
src/style.css          estilos, tokens de color y modos de accesibilidad
src/js/01-core.js      utilidades, servicio de localStorage, preferencias, voz y sonidos
src/js/02-data.js      ★ CONTENIDO: avatares, palabras, 54 actividades, logros
src/js/03-services.js  progreso, recomendación, refuerzo, logros, analítica, CSV, datos demo
src/js/04-ui.js        león SVG (6 emociones), avatares, barras, modal, panel de accesibilidad
src/js/05-engine.js    ActivityEngine: un motor que dibuja cada tipo de actividad
src/js/06-student.js   pantallas del estudiante
src/js/07-teacher.js   panel docente (incluye la gestión de enlaces)
src/js/07a-auth.js     contraseña del docente, código de recuperación y bloqueo por intentos
src/js/08-app.js       rutas (#/…), eventos globales y arranque
```

## Cómo agregar una actividad

Abre `src/js/02-data.js` y agrega un bloque `act({...})` en el módulo y nivel que quieras. No se toca el motor.

```js
act({ id: 'PF-19', module: 'phonological', level: 2, skill: 'Identificación del sonido inicial',
  objective: 'Identificar la imagen que empieza con /l/', difficulty: 'easy', icon: '🌙',
  title: '¿Cuál empieza con /l/?', instruction: 'Toca la imagen que empieza con /l/.',
  type: 'image-choice', audioText: 'Toca la imagen que empieza con ele.',
  content: { prompt: { emoji: '🔊', word: '/l/', listen: 'llll' },
             options: [oImg('luna', true), oImg('perro'), oImg('sol')], result: 'luna' },
  hints: ['Escucha: llll-una.'] });
```
El `id` debe ser único en todo el archivo (usa el siguiente número libre de ese módulo; hoy van hasta `-18` en los tres).

Tipos disponibles y su `content`:

| type | content |
|---|---|
| `multiple-choice`, `image-choice` | `prompt{emoji,word,listen}`, `options[{label,emoji,correct,speak}]`, `labels:false` para ocultar el texto bajo las imágenes |
| `fill-blank` | igual, con `prompt.frame:['G','TO']` (la letra o sílaba que falta) |
| `matching` | `pairs[{a:{label,emoji,speak}, b:{…}}]` |
| `drag-drop` (clasificar) | `buckets[{id,label}]`, `items[{id,emoji,label,bucket}]` |
| `syllable-builder`, `word-builder`, `sentence-builder`, `ordering` | `answer[]`, `distractors[]`, `joiner` (`''` o `' '`), `result`, `prompt` |
| `reading-comprehension` | `emoji`, `sentences[]`, `questions[{q, options[]}]` |
| `guided-write` | `model`, `accept[]`, `modes['keyboard','letters','words','pictos','complete']`, … (ver ES-13) |
| `tracing` | `letter`, `name`, `pool[]` |

Palabras con imagen: `W` (arriba del archivo). Para una palabra nueva: `nueva: ['🍌','BANANO']`.
Un tipo de actividad nuevo = una función `render…(a, host, ctx)` en `05-engine.js` y una línea en `Engine.renderers`.

**Sílabas trabadas** (dos consonantes seguidas: *pl, gl, gr, br, cl, dr, fl, tr*…): hay 9 actividades adicionales,
3 por módulo (`PF-16..18`, `LE-16..18`, `ES-16..18`), dentro del nivel 5 y con `difficulty:'challenge'`.
Usan las palabras PLATO, GRILLO, BRAZO, GLOBO, LIBRO, DRAGÓN, FLOR y TREN (agregadas a `W`).
Al completarlas las 9 se obtiene el logro **🧩 Maestro de sílabas trabadas** (`BLEND_MASTER` en `ACHIEVEMENTS`).
Para agregar más, sigue el mismo patrón y súmalas a `TRABADA_IDS` si quieres que cuenten para ese logro.

## Cómo agregar estudiantes

Panel docente (ver «Acceso docente») → **Estudiantes** → nombre (solo de pila), código de 4 números (🎲 lo crea), avatar, nivel inicial y observación opcional.
También se puede editar (nombre, código y avatar) o eliminar (con confirmación). Cada cambio se guarda al instante en
`leeon_students` y se confirma con un aviso («✅ Estudiante agregado…», «✅ Estudiante actualizado.», «✅ Estudiante eliminado.»);
no hace falta recargar la página para verlo reflejado en la lista, en su perfil ni en el saludo del tablero. Cada niño entra
tocando su tarjeta o escribiendo su código.

## Enlaces a otras páginas (Wordwall, Genially…)

Panel docente → **🔗 Enlaces** → título, dirección, módulo, nivel e ícono → **➕ Agregar enlace**.
El módulo puede ser **Conciencia fonológica**, **Lectura**, **Escritura** o **General**:
- Los tres primeros aparecen como una tarjeta «🔗 Otra página» dentro de ese módulo y nivel (siguen las mismas reglas
  de nivel abierto/cerrado que las actividades).
- **General** no pide nivel (el campo se oculta al elegirlo) y **siempre está disponible**: aparece en el tablero
  del estudiante, debajo de los tres módulos, sin depender de su progreso. Úsalo para algo que quieras ofrecer a
  cualquier niño en cualquier momento.

El niño toca la tarjeta, **▶ Abrir actividad** (se abre en otra pestaña) y, al volver, **✔ Ya terminé**.
Escribir «ejemplo.com» o «www.ejemplo.com» sin `https://` se completa solo; si el texto no llega a ser una
dirección válida, el formulario avisa y no deja guardar.

- LeeOn **no recibe** el resultado de la otra página: registra únicamente que el niño la abrió y terminó (sin puntaje ni intentos).
  Se ve en el historial, en el CSV y como participación; **no cambia el % de progreso** del módulo.
- Solo se aceptan direcciones `http(s)`. Se pueden editar y eliminar (con confirmación); al eliminar, el historial se conserva.
- Cada guardado, edición o borrado se confirma al instante con un aviso («✅ Enlace guardado.», «✅ Enlace actualizado.»,
  «✅ Enlace eliminado.») y queda escrito en `localStorage` de inmediato — no hace falta recargar la página.
- Los enlaces se guardan en `leeon_links` (localStorage) de cada dispositivo. «Borrar datos locales» los elimina; «Restaurar demo» los conserva.
- Revisa que cada página sea apta para niños (sin anuncios, chat ni inicio de sesión). Algunas páginas no se pueden incrustar,
  por eso siempre se abren en una pestaña nueva.

## Cómo modificar los niveles

- Nombres de los 5 niveles por módulo: `LEVEL_NAMES` en `01-core.js`.
- Nivel de cada actividad: campo `level` (1–5) en `02-data.js`.
- Regla de desbloqueo: `unlockedLevel()` en `03-services.js` (hoy: se abre el nivel siguiente al completar 2 de las 3 actividades del nivel actual; el nivel inicial lo fija el docente).
- Recomendación (`recommendNextActivity`): 3 actividades seguidas con 80 % o más → siguiente; promedio menor de 60 % → refuerzo. Nunca bloquea: el niño elige.
- Alerta "Requiere práctica" (`reinforcementInfo`): último intento con 3 o más respuestas por revisar, o menos de 60 % de aciertos con evidencia suficiente. Es orientación pedagógica, no un diagnóstico.

## Cómo consultar el progreso

- **Docente:** Inicio (resumen del grupo), Progreso (por estudiante y por nivel), perfil de cada estudiante
  (historial, intentos, pistas, duración, habilidades, observaciones) e Interacciones (filtros por estudiante, módulo, nivel y estado).
  **Exportar CSV** abre una ventana para copiar o descargar los resultados.
- **Estudiante:** «Mi progreso» (camino con el león) y «Mis logros». Sin rankings.
- **Datos crudos:** en la consola del navegador, `localStorage.getItem('leeon_activity_results')`.
  Claves: `leeon_students`, `leeon_activity_results`, `leeon_links`, `leeon_preferences`, `leeon_student_session`, `leeon_teacher_session`, `leeon_teacher_auth` (solo huellas).
- Configuración → **Restaurar datos de demostración** / **Borrar datos locales** (con confirmación).

## Cómo cambiar contenidos y audio

- Textos, palabras, preguntas y pistas: `02-data.js`. Mensajes del león: `PRAISE` y `TRYMSG` en `06-student.js`.
- Colores y tamaños: variables CSS al inicio de `style.css`.
- Audio: Web Speech API (`speak()`). Los sonidos aislados de letras (`PH`) dependen de la voz del dispositivo;
  para mayor calidad se pueden sustituir por grabaciones cambiando `Voice.speak` en `01-core.js`.

## Accesibilidad incluida

Botones grandes, tipografía Andika (pensada para lectura inicial), alto contraste, texto grande, botones más grandes,
menos movimiento y **modo tranquilo**, 🔊 Escuchar / 🔁 Repetir, pistas graduales, sin cronómetros, arrastrar **o** tocar
(también con teclado), foco visible, estados no dependientes solo del color, respeta `prefers-reduced-motion`.
Las preferencias se guardan por estudiante.

## Privacidad y límites del prototipo

Sin servidor: todo queda en el dispositivo. La contraseña del docente es una barrera para los niños, no seguridad de nivel institucional.
No se piden correos, apellidos, datos médicos ni diagnósticos. El dictado por voz (🎤) depende del navegador.

## Nota de diseño

Se eligió JavaScript sin framework (la primera alternativa del encargo) para que sea fácil de ejecutar y modificar.
La arquitectura sigue la misma separación pedida para React: datos → servicios → motor de actividades → vistas.
