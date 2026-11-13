'use strict';

/* ============================================================
   Oráculo — PWA que adivina el número que estás pensando.
   Los datos se quedan en este móvil (localStorage).
   ============================================================ */

const STORAGE_KEY = 'oraculo-v1';
const APP_VERSION = 'v4';
const MONTHS = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
const WEEKDAYS = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
const WEEKDAYS_MON = ['lunes','martes','miércoles','jueves','viernes','sábado','domingo'];

const PLACE_MAP = {
  hospital: 'hospital', clinic: 'clínica', doctors: 'consulta médica',
  school: 'escuela', kindergarten: 'guardería', university: 'universidad',
  college: 'facultad', library: 'biblioteca', pharmacy: 'farmacia',
  restaurant: 'restaurante', cafe: 'café', bar: 'bar', pub: 'pub',
  bank: 'banco', atm: 'cajero', cinema: 'cine', theatre: 'teatro',
  fuel: 'gasolinera', parking: 'aparcamiento', police: 'policía',
  fire_station: 'bomberos', townhall: 'ayuntamiento', post_office: 'correos',
  place_of_worship: 'lugar de culto', gym: 'gimnasio', dentists: 'dentista',
  marketplace: 'mercado', community_centre: 'centro cívico',
  bus_station: 'estación de autobús', ferry_terminal: 'terminal de ferry',
  supermarket: 'supermercado', convenience: 'tienda', bakery: 'panadería',
  mall: 'centro comercial', department_store: 'grandes almacenes',
  clothes: 'tienda de ropa', hairdresser: 'peluquería',
  park: 'parque', playground: 'parque infantil',
  sports_centre: 'polideportivo', pitch: 'campo deportivo',
  stadium: 'estadio', fitness_centre: 'gimnasio', garden: 'jardín',
  swimming_pool: 'piscina', hotel: 'hotel', museum: 'museo',
  attraction: 'atracción', viewpoint: 'mirador',
  supermarket_shop: 'supermercado'
};

const FUN_IDS = [
  'year','primes','osos','pares','dedos','dado','meses',
  'impares','estrellas','pizza','monedas','dias','fibonacci','cohete','manzanas'
];

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

function $(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function withTimeout(promise, ms, fallback) {
  let id;
  const t = new Promise((resolve) => {
    id = setTimeout(() => resolve(fallback), ms);
  });
  return Promise.race([promise, t]).finally(() => clearTimeout(id));
}

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const r = (x) => x * Math.PI / 180;
  const dlat = r(lat2 - lat1), dlon = r(lon2 - lon1);
  const a = Math.sin(dlat / 2) ** 2 + Math.cos(r(lat1)) * Math.cos(r(lat2)) * Math.sin(dlon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function moonPhase(date) {
  const synodic = 29.53058867;
  const newMoon = Date.UTC(2000, 0, 6, 18, 14);
  const days = (date.getTime() - newMoon) / 86400000;
  const cycle = ((days % synodic) + synodic) % synodic;
  const names = ['nueva', 'creciente', 'cuarto creciente', 'gibosa creciente', 'llena', 'gibosa menguante', 'cuarto menguante', 'menguante'];
  const idx = Math.floor((cycle / synodic) * 8) % 8;
  const icons = ['\uD83C\uDF11', '\uD83C\uDF12', '\uD83C\uDF13', '\uD83C\uDF14', '\uD83C\uDF15', '\uD83C\uDF16', '\uD83C\uDF17', '\uD83C\uDF18'];
  return { name: names[idx], icon: icons[idx], frac: cycle / synodic };
}

function currentYear() { return new Date().getFullYear(); }

function uniqueYearDigits(year) {
  return [...new Set(String(year).split('').map(Number))];
}

/* ---------- progression rule (t2u) ---------- */
/* Advance ONLY on first-attempt hit.
   Later hit but attempts <= ceil(n/2) → repeat same phase.
   attempts > ceil(n/2) → previous phase (never below 0). */

function attemptThreshold(nOptions) {
  return Math.ceil(nOptions / 2);
}

function phaseOutcome(attempts, nOptions) {
  const threshold = attemptThreshold(nOptions);
  if (attempts <= 0) attempts = 1;
  if (attempts === 1) {
    return {
      action: 'advance',
      threshold,
      title: '\u00A1A la primera!',
      message: '\u00A1A la primera! Siguiente fase',
      banner: 'win'
    };
  }
  if (attempts <= threshold) {
    return {
      action: 'repeat',
      threshold,
      title: 'Bien, pero no a la primera',
      message: 'Repetimos fase',
      banner: 'stay'
    };
  }
  return {
    action: 'back',
    threshold,
    title: 'Me cost\u00f3 demasiado',
    message: 'Volvemos a la fase anterior',
    banner: 'back'
  };
}

function applyPhaseOutcome(phaseIndex, outcome, maxIndex) {
  if (outcome.action === 'advance') return Math.min(phaseIndex + 1, maxIndex);
  if (outcome.action === 'back') return Math.max(phaseIndex - 1, 0);
  return phaseIndex;
}

function defaultStore() {
  return {
    version: 1,
    history: [],
    phase: 0,
    funOrder: shuffle(FUN_IDS),
    lastAnswer: null,
    lastGameTs: null,
    orientationGranted: false,
    motionGranted: false,
    installHintDismissed: false
  };
}

function loadStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultStore();
    const s = JSON.parse(raw);
    const d = defaultStore();
    return {
      ...d,
      ...s,
      history: Array.isArray(s.history) ? s.history : [],
      funOrder: Array.isArray(s.funOrder) && s.funOrder.length === FUN_IDS.length
        ? s.funOrder
        : d.funOrder,
      phase: Number.isFinite(s.phase) ? Math.max(0, s.phase | 0) : 0
    };
  } catch {
    return defaultStore();
  }
}

function saveStore(store) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch (e) {
    console.warn('No se pudo guardar', e);
    toast('No se pudo guardar el historial (almacenamiento lleno).');
  }
}

function resetStore() {
  const s = defaultStore();
  saveStore(s);
  return s;
}
function rangeChallenge(max) {
  const options = Array.from({ length: max }, (_, i) => i + 1);
  return {
    id: 'rango-1-' + max,
    kind: 'range',
    shortName: 'Del 1 al ' + max,
    title: 'Piensa en un n\u00famero del 1 al ' + max,
    subtitle: 'Conc\u00e9ntrate. Yo lo adivinar\u00e9.',
    options,
    question: (n) => '\u00bfEs el ' + n + '?',
    label: (n) => String(n),
    visual: 'range'
  };
}

function funChallenge(id) {
  const year = currentYear();
  const yDigits = uniqueYearDigits(year);
  const makers = {
    year: () => ({
      id: 'digitos-anio-' + year,
      kind: 'fun',
      shortName: 'D\u00edgitos de ' + year,
      title: 'Piensa en un d\u00edgito de este a\u00f1o',
      subtitle: year + '  \u2192  ' + yDigits.join(' \u00b7 '),
      options: yDigits,
      question: (n) => '\u00bfEs el ' + n + '?',
      label: (n) => String(n),
      visual: 'year',
      year
    }),
    primes: () => ({
      id: 'primos-10',
      kind: 'fun',
      shortName: 'Primos del 1 al 10',
      title: 'Piensa en un n\u00famero primo del 1 al 10',
      subtitle: 'Los primos: 2, 3, 5 y 7',
      options: [2, 3, 5, 7],
      question: (n) => '\u00bfEs el ' + n + '?',
      label: (n) => String(n),
      visual: 'primes'
    }),
    osos: () => ({
      id: 'osos',
      kind: 'fun',
      shortName: 'Osos',
      title: 'Piensa en osos\u2026 \u00bfcu\u00e1ntos osos hay?',
      subtitle: 'Imagina un claro del bosque y cuenta.',
      options: [1, 2, 3, 4, 5],
      question: (n) => '\u00bfHay ' + n + (n === 1 ? ' oso?' : ' osos?'),
      label: (n) => n + (n === 1 ? ' oso' : ' osos'),
      visual: 'osos',
      emoji: '\uD83D\uDC3B'
    }),
    pares: () => ({
      id: 'pares-10',
      kind: 'fun',
      shortName: 'Pares del 2 al 10',
      title: 'Piensa en un n\u00famero par del 2 al 10',
      subtitle: '2, 4, 6, 8 o 10',
      options: [2, 4, 6, 8, 10],
      question: (n) => '\u00bfEs el ' + n + '?',
      label: (n) => String(n),
      visual: 'pares'
    }),
    dedos: () => ({
      id: 'dedos',
      kind: 'fun',
      shortName: 'Dedos de una mano',
      title: '\u00bfCu\u00e1ntos dedos levantas?',
      subtitle: 'Una mano, de 1 a 5. Elige en tu cabeza.',
      options: [1, 2, 3, 4, 5],
      question: (n) => '\u00bfLevantas ' + n + (n === 1 ? ' dedo?' : ' dedos?'),
      label: (n) => String(n),
      visual: 'dedos'
    }),
    dado: () => ({
      id: 'dado',
      kind: 'fun',
      shortName: 'Cara del dado',
      title: 'Lanza el dado en tu mente\u2026 \u00bfqu\u00e9 sale?',
      subtitle: 'Seis caras, una coincidencia.',
      options: [1, 2, 3, 4, 5, 6],
      question: (n) => '\u00bfHa salido un ' + n + '?',
      label: (n) => String(n),
      visual: 'dado'
    }),
    meses: () => ({
      id: 'meses',
      kind: 'fun',
      shortName: 'Meses del a\u00f1o',
      title: 'Piensa en un mes\u2026 el de su n\u00famero',
      subtitle: 'Enero es 1, diciembre es 12.',
      options: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      question: (n) => '\u00bfEs ' + MONTHS[n - 1] + '?',
      label: (n) => MONTHS[n - 1],
      visual: 'meses'
    }),
    impares: () => ({
      id: 'impares-9',
      kind: 'fun',
      shortName: 'Impares del 1 al 9',
      title: 'Piensa en un n\u00famero impar del 1 al 9',
      subtitle: '1, 3, 5, 7 o 9',
      options: [1, 3, 5, 7, 9],
      question: (n) => '\u00bfEs el ' + n + '?',
      label: (n) => String(n),
      visual: 'impares'
    }),
    estrellas: () => ({
      id: 'estrellas',
      kind: 'fun',
      shortName: 'Estrellas',
      title: 'Mira al cielo\u2026 \u00bfcu\u00e1ntas estrellas ves?',
      subtitle: 'Elige de 1 a 5 en tu imaginaci\u00f3n.',
      options: [1, 2, 3, 4, 5],
      question: (n) => '\u00bfVes ' + n + (n === 1 ? ' estrella?' : ' estrellas?'),
      label: (n) => String(n),
      visual: 'estrellas',
      emoji: '\u2B50'
    }),
    pizza: () => ({
      id: 'pizza',
      kind: 'fun',
      shortName: 'Porciones de pizza',
      title: '\u00bfCu\u00e1ntas porciones de pizza te comer\u00edas?',
      subtitle: 'Sin verg\u00fcenza: 1, 2, 3, 4, 6 u 8.',
      options: [1, 2, 3, 4, 6, 8],
      question: (n) => '\u00bfTe comer\u00edas ' + n + (n === 1 ? ' porci\u00f3n?' : ' porciones?'),
      label: (n) => String(n),
      visual: 'pizza',
      emoji: '\uD83C\uDF55'
    }),
    monedas: () => ({
      id: 'monedas',
      kind: 'fun',
      shortName: 'Monedas',
      title: 'Tienes monedas en el bolsillo\u2026 \u00bfcu\u00e1ntas?',
      subtitle: 'Piensa un n\u00famero del 1 al 5.',
      options: [1, 2, 3, 4, 5],
      question: (n) => '\u00bfTienes ' + n + (n === 1 ? ' moneda?' : ' monedas?'),
      label: (n) => String(n),
      visual: 'monedas',
      emoji: '\uD83E\uDE99'
    }),
    dias: () => ({
      id: 'dias-semana',
      kind: 'fun',
      shortName: 'D\u00edas de la semana',
      title: 'Elige un d\u00eda de la semana',
      subtitle: 'Lunes es 1, domingo es 7.',
      options: [1, 2, 3, 4, 5, 6, 7],
      question: (n) => '\u00bfEs ' + WEEKDAYS_MON[n - 1] + '?',
      label: (n) => WEEKDAYS_MON[n - 1],
      visual: 'dias'
    }),
    fibonacci: () => ({
      id: 'fibonacci',
      kind: 'fun',
      shortName: 'Fibonacci',
      title: 'Piensa en un n\u00famero de Fibonacci (hasta 13)',
      subtitle: '1, 2, 3, 5, 8 o 13',
      options: [1, 2, 3, 5, 8, 13],
      question: (n) => '\u00bfEs el ' + n + '?',
      label: (n) => String(n),
      visual: 'fibonacci'
    }),
    cohete: () => ({
      id: 'cohete',
      kind: 'fun',
      shortName: 'Cuenta atr\u00e1s',
      title: 'Cuenta atr\u00e1s de un cohete\u2026 \u00bfen qu\u00e9 n\u00famero te quedas?',
      subtitle: '5, 4, 3, 2 o 1\u2026 \u00a1y despegue!',
      options: [5, 4, 3, 2, 1],
      question: (n) => '\u00bfTe quedas en el ' + n + '?',
      label: (n) => String(n),
      visual: 'cohete'
    }),
    manzanas: () => ({
      id: 'manzanas',
      kind: 'fun',
      shortName: 'Manzanas',
      title: 'Piensa en manzanas\u2026 \u00bfcu\u00e1ntas hay en el \u00e1rbol?',
      subtitle: 'Puede haber 1, 2, 3, 4 o 6.',
      options: [1, 2, 3, 4, 6],
      question: (n) => '\u00bfHay ' + n + (n === 1 ? ' manzana?' : ' manzanas?'),
      label: (n) => String(n),
      visual: 'manzanas',
      emoji: '\uD83C\uDF4E'
    })
  };
  const fn = makers[id];
  if (!fn) return rangeChallenge(5);
  const c = fn();
  c.funId = id;
  return c;
}

function buildLadder(funOrder) {
  const ladder = [rangeChallenge(2), rangeChallenge(3), rangeChallenge(4)];
  let max = 5;
  const order = (funOrder && funOrder.length) ? funOrder : FUN_IDS;
  for (const id of order) {
    ladder.push(funChallenge(id));
    ladder.push(rangeChallenge(Math.min(12, max)));
    max += 1;
  }
  return ladder;
}

function ensureLadderLength(store, ladder) {
  while (store.phase >= ladder.length) {
    const cycle = store.funOrder[(ladder.length - 3) % store.funOrder.length];
    ladder.push(funChallenge(cycle));
    ladder.push(rangeChallenge(12));
  }
  return ladder;
}

function challengeAt(store) {
  let ladder = buildLadder(store.funOrder);
  ladder = ensureLadderLength(store, ladder);
  return { challenge: ladder[store.phase], ladder };
}

const DICE_FACES = ['\u2680', '\u2681', '\u2682', '\u2683', '\u2684', '\u2685'];
const FINGER_ICONS = ['\u261D\uFE0F', '\u270C\uFE0F', '\uD83E\uDD1F', '\uD83D\uDD96', '\uD83E\uDD1A'];

function renderVisual(ch, highlight) {
  const v = ch.visual;
  if (v === 'year') {
    const y = String(ch.year || currentYear());
    const digits = y.split('').map((d) => '<span>' + esc(d) + '</span>').join('');
    return '<div class="visual-box"><div class="visual-year">' + digits + '</div>' +
      '<p class="muted" style="margin:8px 0 0">Elige uno de sus d\u00edgitos distintos: ' +
      esc(ch.options.join(', ')) + '</p></div>';
  }
  if (v === 'osos' || v === 'estrellas' || v === 'pizza' || v === 'monedas' || v === 'manzanas') {
    const emoji = ch.emoji || '\uD83D\uDC3B';
    const groups = ch.options.map((n) => {
      const on = highlight === n ? ' style="outline:2px solid var(--gold);background:rgba(251,191,36,0.12)"' : '';
      return '<div class="emoji-group"' + on + '><div>' + emoji.repeat(n) + '</div><div class="g-n">' + n + '</div></div>';
    }).join('');
    return '<div class="visual-box"><div class="emoji-row">' + groups + '</div></div>';
  }
  if (v === 'dado') {
    const faces = ch.options.map((n) => {
      const on = highlight === n ? ' style="filter:drop-shadow(0 0 8px #fbbf24)"' : '';
      return '<span' + on + '>' + (DICE_FACES[n - 1] || n) + '</span>';
    }).join(' ');
    return '<div class="visual-box"><div class="dice-row">' + faces + '</div></div>';
  }
  if (v === 'dedos') {
    const row = ch.options.map((n) => {
      const on = highlight === n ? ' style="outline:2px solid var(--gold);border-radius:12px;padding:4px"' : '';
      return '<span' + on + ' title="' + n + '">' + (FINGER_ICONS[n - 1] || n) + '</span>';
    }).join(' ');
    return '<div class="visual-box"><div class="dice-row">' + row + '</div></div>';
  }
  if (v === 'meses') {
    const cells = MONTHS.map((m, i) => {
      const on = highlight === i + 1 ? ' style="background:rgba(251,191,36,0.25);color:var(--gold)"' : '';
      return '<span' + on + '>' + (i + 1) + ' ' + m.slice(0, 3) + '.</span>';
    }).join('');
    return '<div class="visual-box"><div class="month-grid">' + cells + '</div></div>';
  }
  if (v === 'dias') {
    const cells = WEEKDAYS_MON.map((d, i) => {
      const on = highlight === i + 1 ? ' style="background:rgba(251,191,36,0.25);color:var(--gold)"' : '';
      return '<span' + on + '>' + (i + 1) + ' ' + esc(d) + '</span>';
    }).join('');
    return '<div class="visual-box"><div class="week-grid">' + cells + '</div></div>';
  }
  if (v === 'primes' || v === 'pares' || v === 'impares' || v === 'fibonacci' || v === 'cohete' || v === 'range') {
    const chips = ch.options.map((n) => {
      const style = highlight === n ? ' style="background:rgba(251,191,36,0.25);color:var(--gold)"' : '';
      return '<span class="pill"' + style + '>' + esc(ch.label(n)) + '</span>';
    }).join('');
    return '<div class="visual-box"><div class="pill-row" style="justify-content:center">' + chips + '</div></div>';
  }
  return '';
}

function renderGuessVisual(ch, n) {
  if (ch.emoji) {
    return '<div class="visual-box" style="margin-top:0"><div class="emoji-row" style="font-size:2.4rem">' +
      ch.emoji.repeat(Math.min(n, 12)) + '</div></div>';
  }
  if (ch.visual === 'dado') {
    return '<div class="visual-box" style="margin-top:0"><div class="dice-row">' + (DICE_FACES[n - 1] || n) + '</div></div>';
  }
  return '';
}
const SIGNAL_META = [
  { key: 'geo', icon: '\uD83D\uDCCD', name: 'Ubicaci\u00f3n' },
  { key: 'place', icon: '\uD83D\uDCCC', name: 'Lugar cercano' },
  { key: 'weekday', icon: '\uD83D\uDCC5', name: 'D\u00eda de la semana' },
  { key: 'time', icon: '\uD83D\uDD50', name: 'Hora' },
  { key: 'temp', icon: '\uD83C\uDF21\uFE0F', name: 'Temperatura' },
  { key: 'humidity', icon: '\uD83D\uDCA7', name: 'Humedad' },
  { key: 'battery', icon: '\uD83D\uDD0B', name: 'Bater\u00eda' },
  { key: 'orientation', icon: '\uD83D\uDCF1', name: 'Posici\u00f3n del m\u00f3vil' },
  { key: 'speed', icon: '\uD83C\uDFC3', name: 'Velocidad' },
  { key: 'motion', icon: '\uD83D\uDCF3', name: 'Movimiento' },
  { key: 'network', icon: '\uD83D\uDCE1', name: 'Red' },
  { key: 'theme', icon: '\uD83C\uDF16', name: 'Tema claro/oscuro' },
  { key: 'light', icon: '\uD83D\uDCA1', name: 'Luz ambiental' },
  { key: 'moon', icon: '\uD83C\uDF19', name: 'Fase lunar' },
  { key: 'since', icon: '\u23F3', name: 'Desde la \u00faltima partida' }
];

function timeBand(hour) {
  if (hour < 6) return 'madrugada';
  if (hour < 12) return 'ma\u00f1ana';
  if (hour < 15) return 'mediod\u00eda';
  if (hour < 20) return 'tarde';
  return 'noche';
}

function emptyContext() {
  return {
    ts: Date.now(),
    available: {},
    weekday: null, weekdayName: null,
    hour: null, minute: null, timeBand: null,
    lat: null, lon: null, accuracy: null,
    country: null, city: null, region: null,
    placeType: null, placeName: null, placeDist: null,
    temp: null, humidity: null, weatherCode: null,
    battery: null, charging: null,
    orientation: null, orientationRaw: null,
    speed: null, speedBand: null,
    motion: null, motionBand: null,
    network: null, networkDownlink: null,
    colorScheme: null,
    illuminance: null,
    moon: null, moonIcon: null,
    sinceLastMs: null, sinceLastBand: null,
    notes: {}
  };
}

function describeAvailability() {
  return {
    geo: { android: 's\u00ed (con permiso)', ios: 's\u00ed (con permiso)' },
    place: { android: 's\u00ed, si hay ubicaci\u00f3n', ios: 's\u00ed, si hay ubicaci\u00f3n' },
    weekday: { android: 's\u00ed', ios: 's\u00ed' },
    time: { android: 's\u00ed', ios: 's\u00ed' },
    temp: { android: 's\u00ed, v\u00eda Open-Meteo', ios: 's\u00ed, v\u00eda Open-Meteo' },
    humidity: { android: 's\u00ed, v\u00eda Open-Meteo', ios: 's\u00ed, v\u00eda Open-Meteo' },
    battery: { android: 's\u00ed, en Chrome', ios: 'no (Safari no lo permite)' },
    orientation: { android: 's\u00ed', ios: 's\u00ed, con bot\u00f3n de permiso' },
    speed: { android: 's\u00ed, si hay GPS', ios: 's\u00ed, si hay GPS' },
    motion: { android: 's\u00ed', ios: 's\u00ed, con bot\u00f3n de permiso' },
    network: { android: 's\u00ed, en Chrome', ios: 'no suele estar' },
    theme: { android: 's\u00ed', ios: 's\u00ed' },
    light: { android: 'casi nunca (API experimental)', ios: 'no' },
    moon: { android: 's\u00ed, calculada', ios: 's\u00ed, calculada' },
    since: { android: 's\u00ed', ios: 's\u00ed' }
  };
}

let lastOrientation = null;
let lastMotion = null;
let orientationListenerOn = false;
let motionListenerOn = false;

function postureFromEvent(e) {
  const beta = e.beta, gamma = e.gamma;
  if (beta == null && gamma == null) return null;
  const b = beta || 0, g = gamma || 0;
  if (Math.abs(b) < 25 && Math.abs(g) < 25) return 'plano';
  if (b > 150 || b < -150) return 'boca abajo';
  if (Math.abs(g) > 50) return 'horizontal';
  if (b > 40 && b < 140) return 'vertical';
  if (b < -40) return 'inclinado atr\u00e1s';
  return 'inclinado';
}

function onOrient(e) {
  lastOrientation = { beta: e.beta, gamma: e.gamma, alpha: e.alpha, posture: postureFromEvent(e), ts: Date.now() };
}
function onMotion(e) {
  const a = e.accelerationIncludingGravity || e.acceleration;
  if (!a) return;
  const mag = Math.sqrt((a.x || 0) ** 2 + (a.y || 0) ** 2 + (a.z || 0) ** 2);
  const shake = Math.abs(mag - 9.8);
  lastMotion = { mag, shake, ts: Date.now() };
}

async function requestOrientationPermission() {
  const results = { orientation: false, motion: false };
  try {
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      const s = await DeviceOrientationEvent.requestPermission();
      results.orientation = s === 'granted';
    } else {
      results.orientation = typeof DeviceOrientationEvent !== 'undefined';
    }
  } catch { results.orientation = false; }
  try {
    if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
      const s = await DeviceMotionEvent.requestPermission();
      results.motion = s === 'granted';
    } else {
      results.motion = typeof DeviceMotionEvent !== 'undefined';
    }
  } catch { results.motion = false; }
  if (results.orientation && !orientationListenerOn) {
    window.addEventListener('deviceorientation', onOrient, true);
    orientationListenerOn = true;
  }
  if (results.motion && !motionListenerOn) {
    window.addEventListener('devicemotion', onMotion, true);
    motionListenerOn = true;
  }
  return results;
}

function startSensorListenersIfPossible() {
  if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission !== 'function') {
    if (!orientationListenerOn) {
      window.addEventListener('deviceorientation', onOrient, true);
      orientationListenerOn = true;
    }
  }
  if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission !== 'function') {
    if (!motionListenerOn) {
      window.addEventListener('devicemotion', onMotion, true);
      motionListenerOn = true;
    }
  }
}

function getPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('no-geo'));
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true, timeout: 8000, maximumAge: 30000
    });
  });
}

function watchSpeed(ms) {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null);
    const samples = [];
    let id;
    const done = () => {
      if (id != null) navigator.geolocation.clearWatch(id);
      resolve(samples);
    };
    const t = setTimeout(done, ms);
    try {
      id = navigator.geolocation.watchPosition((p) => {
        samples.push({
          lat: p.coords.latitude,
          lon: p.coords.longitude,
          speed: p.coords.speed,
          ts: p.timestamp
        });
        if (samples.length >= 4) { clearTimeout(t); done(); }
      }, () => { clearTimeout(t); done(); }, {
        enableHighAccuracy: true, timeout: 6000, maximumAge: 0
      });
    } catch {
      clearTimeout(t);
      resolve(samples);
    }
  });
}

function computeSpeed(samples, fallback) {
  if (fallback != null && Number.isFinite(fallback) && fallback >= 0) return fallback;
  if (!samples || samples.length < 2) return null;
  let best = null;
  for (let i = 1; i < samples.length; i++) {
    const a = samples[i - 1], b = samples[i];
    const dt = (b.ts - a.ts) / 1000;
    if (dt <= 0.2) continue;
    const d = haversine(a.lat, a.lon, b.lat, b.lon);
    const v = d / dt;
    if (best == null || v > best) best = v;
  }
  return best;
}

function speedBand(mps) {
  if (mps == null) return null;
  if (mps < 0.6) return 'quieto';
  if (mps < 2.5) return 'andando';
  if (mps < 6) return 'corriendo';
  return 'veh\u00edculo';
}

async function reverseGeocode(lat, lon) {
  const url = 'https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=' +
    encodeURIComponent(lat) + '&longitude=' + encodeURIComponent(lon) + '&localityLanguage=es';
  const res = await fetch(url);
  if (!res.ok) throw new Error('geo ' + res.status);
  const j = await res.json();
  return {
    country: j.countryName || j.countryCode || null,
    city: j.city || j.locality || j.principalSubdivision || null,
    region: j.principalSubdivision || null,
    raw: j
  };
}

async function fetchWeather(lat, lon) {
  const url = 'https://api.open-meteo.com/v1/forecast?latitude=' +
    encodeURIComponent(lat) + '&longitude=' + encodeURIComponent(lon) +
    '&current=temperature_2m,relative_humidity_2m,weather_code&timezone=auto';
  const res = await fetch(url);
  if (!res.ok) throw new Error('wx ' + res.status);
  const j = await res.json();
  const c = j.current || {};
  return { temp: c.temperature_2m, humidity: c.relative_humidity_2m, weatherCode: c.weather_code };
}

function classifyPlace(tags) {
  const amenity = tags.amenity || tags.healthcare;
  const shop = tags.shop;
  const leisure = tags.leisure;
  const tourism = tags.tourism;
  const key = amenity || shop || leisure || tourism;
  if (!key) return null;
  const name = PLACE_MAP[key] || PLACE_MAP[key + '_shop'] || key.replace(/_/g, ' ');
  return { type: name, raw: key, displayName: tags.name || name };
}

async function fetchNearbyPlace(lat, lon) {
  const q = '[out:json][timeout:8];\n(' +
    'nwr(around:200,' + lat + ',' + lon + ')[amenity];' +
    'nwr(around:200,' + lat + ',' + lon + ')[shop];' +
    'nwr(around:200,' + lat + ',' + lon + ')[leisure];' +
    'nwr(around:200,' + lat + ',' + lon + ')[tourism];' +
    'nwr(around:200,' + lat + ',' + lon + ')[healthcare];' +
    ');\nout center 25;';
  const urls = [
    'https://overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter'
  ];
  let data = null;
  for (const url of urls) {
    try {
      const res = await withTimeout(fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
        body: 'data=' + encodeURIComponent(q)
      }), 9000, null);
      if (!res || !res.ok) continue;
      data = await res.json();
      break;
    } catch { /* try next */ }
  }
  if (!data || !data.elements) return null;
  let best = null, bestD = Infinity;
  for (const el of data.elements) {
    const elat = el.lat || (el.center && el.center.lat);
    const elon = el.lon || (el.center && el.center.lon);
    if (elat == null) continue;
    const tags = el.tags || {};
    const place = classifyPlace(tags);
    if (!place) continue;
    const d = haversine(lat, lon, elat, elon);
    if (d < bestD) { bestD = d; best = Object.assign({}, place, { dist: Math.round(d) }); }
  }
  return best;
}

async function readBattery() {
  if (!navigator.getBattery) return null;
  const b = await navigator.getBattery();
  return { level: Math.round(b.level * 100), charging: !!b.charging };
}

function readNetwork() {
  const c = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (!c) return null;
  return { type: c.effectiveType || c.type || null, downlink: c.downlink, saveData: !!c.saveData };
}

function readAmbientLight() {
  return new Promise((resolve) => {
    if (typeof AmbientLightSensor !== 'function') return resolve(null);
    try {
      const s = new AmbientLightSensor({ frequency: 1 });
      const t = setTimeout(() => { try { s.stop(); } catch (_) {} resolve(null); }, 1500);
      s.addEventListener('reading', () => {
        clearTimeout(t);
        const v = s.illuminance;
        try { s.stop(); } catch (_) {}
        resolve(v);
      });
      s.addEventListener('error', () => { clearTimeout(t); resolve(null); });
      s.start();
    } catch {
      resolve(null);
    }
  });
}

function sinceBand(ms) {
  if (ms == null) return 'primera vez';
  if (ms < 2 * 60 * 1000) return 'hace instantes';
  if (ms < 60 * 60 * 1000) return 'hace minutos';
  if (ms < 24 * 60 * 60 * 1000) return 'hace horas';
  return 'hace d\u00edas';
}
async function collectSignals(store, onProgress) {
  const ctx = emptyContext();
  const now = new Date();
  ctx.weekday = now.getDay();
  ctx.weekdayName = WEEKDAYS[ctx.weekday];
  ctx.hour = now.getHours();
  ctx.minute = now.getMinutes();
  ctx.timeBand = timeBand(ctx.hour);
  ctx.available.weekday = true;
  ctx.available.time = true;

  const moon = moonPhase(now);
  ctx.moon = moon.name;
  ctx.moonIcon = moon.icon;
  ctx.available.moon = true;

  ctx.colorScheme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'oscuro' : 'claro';
  ctx.available.theme = true;

  if (store.lastGameTs) {
    ctx.sinceLastMs = Date.now() - store.lastGameTs;
    ctx.sinceLastBand = sinceBand(ctx.sinceLastMs);
  } else {
    ctx.sinceLastBand = 'primera vez';
  }
  ctx.available.since = true;

  const net = readNetwork();
  if (net && net.type) {
    ctx.network = net.type;
    ctx.networkDownlink = net.downlink;
    ctx.available.network = true;
  } else {
    ctx.available.network = false;
    ctx.notes.network = 'Este navegador no expone el tipo de red.';
  }

  if (onProgress) onProgress(ctx);

  const tasks = [];

  tasks.push((async () => {
    try {
      const bat = await withTimeout(readBattery(), 2000, null);
      if (bat) {
        ctx.battery = bat.level;
        ctx.charging = bat.charging;
        ctx.available.battery = true;
      } else {
        ctx.available.battery = false;
        ctx.notes.battery = 'La API de bater\u00eda no est\u00e1 disponible (t\u00edpico en iPhone y Firefox).';
      }
    } catch {
      ctx.available.battery = false;
    }
    if (onProgress) onProgress(ctx);
  })());

  tasks.push((async () => {
    const light = await readAmbientLight();
    if (light != null) {
      ctx.illuminance = light;
      ctx.available.light = true;
    } else {
      ctx.available.light = false;
      ctx.notes.light = 'El sensor de luz ambiental casi nunca est\u00e1 expuesto en la web.';
    }
    if (onProgress) onProgress(ctx);
  })());

  tasks.push((async () => {
    await new Promise((r) => setTimeout(r, 600));
    if (lastOrientation && lastOrientation.posture && Date.now() - lastOrientation.ts < 5000) {
      ctx.orientation = lastOrientation.posture;
      ctx.orientationRaw = { beta: lastOrientation.beta, gamma: lastOrientation.gamma };
      ctx.available.orientation = true;
    } else if (screen.orientation && screen.orientation.type) {
      const t = screen.orientation.type;
      ctx.orientation = t.includes('landscape') ? 'horizontal' : (t.includes('portrait') ? 'vertical' : t);
      ctx.available.orientation = true;
      ctx.notes.orientation = 'Usando la orientaci\u00f3n de la pantalla (el giroscopio no respondi\u00f3).';
    } else {
      ctx.available.orientation = false;
      ctx.notes.orientation = 'Activa los sensores de movimiento (en iPhone hay que pulsar el bot\u00f3n).';
    }
    if (lastMotion && Date.now() - lastMotion.ts < 4000) {
      ctx.motion = Math.round(lastMotion.shake * 10) / 10;
      ctx.motionBand = lastMotion.shake < 0.8 ? 'quieto' : (lastMotion.shake < 3 ? 'suave' : 'agitado');
      ctx.available.motion = true;
    } else {
      ctx.available.motion = false;
    }
    if (onProgress) onProgress(ctx);
  })());

  tasks.push((async () => {
    let pos = null;
    try {
      pos = await getPosition();
    } catch (e) {
      ctx.available.geo = false;
      ctx.available.place = false;
      ctx.available.temp = false;
      ctx.available.humidity = false;
      ctx.available.speed = false;
      ctx.notes.geo = e && e.code === 1
        ? 'Permiso de ubicaci\u00f3n denegado.'
        : 'No se pudo obtener la ubicaci\u00f3n.';
      if (onProgress) onProgress(ctx);
      return;
    }
    ctx.lat = pos.coords.latitude;
    ctx.lon = pos.coords.longitude;
    ctx.accuracy = Math.round(pos.coords.accuracy || 0);
    ctx.available.geo = true;
    if (onProgress) onProgress(ctx);

    const speedSamplesP = watchSpeed(2500);
    const geoExtras = await Promise.allSettled([
      withTimeout(reverseGeocode(ctx.lat, ctx.lon), 7000, null),
      withTimeout(fetchWeather(ctx.lat, ctx.lon), 7000, null),
      withTimeout(fetchNearbyPlace(ctx.lat, ctx.lon), 9000, null)
    ]);

    const rg = geoExtras[0].status === 'fulfilled' ? geoExtras[0].value : null;
    if (rg) {
      ctx.country = rg.country;
      ctx.city = rg.city;
      ctx.region = rg.region;
    }

    const wx = geoExtras[1].status === 'fulfilled' ? geoExtras[1].value : null;
    if (wx) {
      ctx.temp = wx.temp;
      ctx.humidity = wx.humidity;
      ctx.weatherCode = wx.weatherCode;
      ctx.available.temp = ctx.temp != null;
      ctx.available.humidity = ctx.humidity != null;
    } else {
      ctx.available.temp = false;
      ctx.available.humidity = false;
      ctx.notes.temp = 'No se pudo consultar el tiempo (Open-Meteo).';
    }

    const place = geoExtras[2].status === 'fulfilled' ? geoExtras[2].value : null;
    if (place) {
      ctx.placeType = place.type;
      ctx.placeName = place.displayName;
      ctx.placeDist = place.dist;
      ctx.available.place = true;
    } else {
      ctx.available.place = false;
      ctx.notes.place = 'No se encontr\u00f3 un lugar cercano o Overpass no respondi\u00f3.';
    }

    const samples = await withTimeout(speedSamplesP, 3000, []);
    const spd = computeSpeed(samples, pos.coords.speed);
    if (spd != null && Number.isFinite(spd)) {
      ctx.speed = Math.round(spd * 10) / 10;
      ctx.speedBand = speedBand(ctx.speed);
      ctx.available.speed = true;
    } else {
      ctx.available.speed = false;
    }
    if (onProgress) onProgress(ctx);
  })());

  await Promise.all(tasks);
  return ctx;
}

function signalValueText(key, ctx) {
  switch (key) {
    case 'geo':
      if (ctx.city || ctx.country) return [ctx.city, ctx.region, ctx.country].filter(Boolean).join(', ');
      if (ctx.lat != null) return ctx.lat.toFixed(3) + ', ' + ctx.lon.toFixed(3);
      return 'no disponible';
    case 'place':
      if (ctx.placeType) {
        const d = ctx.placeDist != null ? ' a ' + ctx.placeDist + ' m' : '';
        return (ctx.placeName && ctx.placeName !== ctx.placeType ? ctx.placeName + ' \u00b7 ' : '') + ctx.placeType + d;
      }
      return 'no disponible';
    case 'weekday': return ctx.weekdayName || '\u2014';
    case 'time':
      if (ctx.hour == null) return '\u2014';
      return String(ctx.hour).padStart(2, '0') + ':' + String(ctx.minute).padStart(2, '0') + ' \u00b7 ' + ctx.timeBand;
    case 'temp': return ctx.temp != null ? ctx.temp + ' \u00b0C' : 'no disponible';
    case 'humidity': return ctx.humidity != null ? ctx.humidity + ' %' : 'no disponible';
    case 'battery':
      if (ctx.battery == null) return 'no disponible';
      return ctx.battery + ' %' + (ctx.charging ? ' \u00b7 cargando' : '');
    case 'orientation': return ctx.orientation || 'no disponible';
    case 'speed':
      if (ctx.speed == null) return 'no disponible';
      return ctx.speed + ' m/s \u00b7 ' + (ctx.speedBand || '');
    case 'motion': return ctx.motionBand ? (ctx.motionBand + ' (' + ctx.motion + ')') : 'no disponible';
    case 'network': return ctx.network || 'no disponible';
    case 'theme': return ctx.colorScheme || '\u2014';
    case 'light': return ctx.illuminance != null ? ctx.illuminance + ' lux' : 'no disponible';
    case 'moon': return (ctx.moonIcon || '') + ' ' + (ctx.moon || '\u2014');
    case 'since': return ctx.sinceLastBand || '\u2014';
    default: return '\u2014';
  }
}

function signalState(key, ctx) {
  if (ctx.available[key] === true) return 'ok';
  if (ctx.available[key] === false) return 'off';
  if (key === 'geo') return ctx.lat != null ? 'ok' : (ctx.notes.geo ? 'off' : 'wait');
  if (key === 'place') return ctx.available.place ? 'ok' : (ctx.available.geo === false ? 'off' : (ctx.lat ? 'wait' : 'off'));
  if (key === 'temp' || key === 'humidity' || key === 'speed') {
    return ctx.available[key] ? 'ok' : (ctx.available.geo === false ? 'off' : (ctx.lat ? 'wait' : 'off'));
  }
  return ctx.available[key] ? 'ok' : 'wait';
}
function tempBand(t) {
  if (t == null) return null;
  if (t < 8) return 'fr\u00edo';
  if (t < 16) return 'fresco';
  if (t < 23) return 'templado';
  if (t < 29) return 'c\u00e1lido';
  return 'caluroso';
}
function humidBand(h) {
  if (h == null) return null;
  if (h < 35) return 'seco';
  if (h < 70) return 'normal';
  return 'h\u00famedo';
}
function batteryBand(b) {
  if (b == null) return null;
  if (b < 15) return 'cr\u00edtica';
  if (b < 30) return 'baja';
  if (b < 70) return 'media';
  if (b < 95) return 'alta';
  return 'llena';
}

function discretize(ctx) {
  if (!ctx) return {};
  return {
    weekday: ctx.weekdayName || null,
    timeBand: ctx.timeBand || null,
    tempBand: tempBand(ctx.temp),
    humidBand: humidBand(ctx.humidity),
    batteryBand: batteryBand(ctx.battery),
    charging: ctx.charging == null ? null : (ctx.charging ? 'cargando' : 'desenchufado'),
    orientation: ctx.orientation || null,
    speedBand: ctx.speedBand || null,
    country: ctx.country || null,
    city: ctx.city || null,
    placeType: ctx.placeType || null,
    colorScheme: ctx.colorScheme || null,
    network: ctx.network || null,
    motionBand: ctx.motionBand || null,
    moon: ctx.moon || null,
    sinceLastBand: ctx.sinceLastBand || null
  };
}

const FEATURE_LABELS = {
  weekday: 'd\u00eda de la semana',
  timeBand: 'franja horaria',
  tempBand: 'temperatura',
  humidBand: 'humedad',
  batteryBand: 'bater\u00eda',
  charging: 'carga',
  orientation: 'posici\u00f3n del m\u00f3vil',
  speedBand: 'velocidad',
  country: 'pa\u00eds',
  city: 'ciudad',
  placeType: 'tipo de lugar',
  colorScheme: 'tema de pantalla',
  network: 'tipo de red',
  motionBand: 'movimiento',
  moon: 'fase lunar',
  sinceLastBand: 'tiempo entre partidas'
};

function positionBucket(idx, n) {
  if (n <= 1) return '\u00fanico';
  if (idx === 0) return 'el primero';
  if (idx === n - 1) return 'el \u00faltimo';
  const rel = idx / (n - 1);
  if (rel < 0.35) return 'de los primeros';
  if (rel > 0.65) return 'de los \u00faltimos';
  return 'del medio';
}

function relativePos(answer, options) {
  const i = options.indexOf(answer);
  if (i < 0 || options.length <= 1) return 0.5;
  return i / (options.length - 1);
}

function entropy(labels) {
  if (!labels.length) return 0;
  const c = new Map();
  for (const l of labels) c.set(l, (c.get(l) || 0) + 1);
  let h = 0;
  for (const n of c.values()) {
    const p = n / labels.length;
    h -= p * Math.log2(p);
  }
  return h;
}

function featureInfluence(history) {
  if (history.length < 4) return [];
  const classes = history.map((h) => positionBucket(h.options.indexOf(h.answer), h.options.length));
  const H = entropy(classes);
  const out = [];
  for (const key of Object.keys(FEATURE_LABELS)) {
    const groups = new Map();
    let used = 0;
    history.forEach((h, i) => {
      const f = discretize(h.context)[key];
      if (f == null || f === '') return;
      used++;
      if (!groups.has(f)) groups.set(f, []);
      groups.get(f).push(classes[i]);
    });
    if (used < 4 || groups.size < 2) continue;
    let cond = 0;
    for (const g of groups.values()) cond += (g.length / used) * entropy(g);
    const ig = H - cond;
    if (ig > 0.02) out.push({ key, label: FEATURE_LABELS[key], gain: ig });
  }
  out.sort((a, b) => b.gain - a.gain);
  return out;
}

function rankCandidates(challenge, context, store, exclude) {
  const options = challenge.options.filter((o) => !(exclude || []).includes(o));
  const nAll = challenge.options.length;
  const hist = store.history || [];
  const feats = discretize(context);
  const featKeys = Object.keys(feats).filter((k) => feats[k] != null && feats[k] !== '');
  const lastAnswer = store.lastAnswer;
  const same = hist.filter((h) => h.challengeId === challenge.id);

  const posCounts = {};
  let posTotal = 0;
  for (const h of hist) {
    const b = positionBucket(h.options.indexOf(h.answer), h.options.length);
    posCounts[b] = (posCounts[b] || 0) + 1;
    posTotal++;
  }

  const fav = new Map();
  for (const h of hist) fav.set(h.answer, (fav.get(h.answer) || 0) + 1);

  let repeats = 0, pairs = 0;
  for (let i = 1; i < hist.length; i++) {
    pairs++;
    if (hist[i].answer === hist[i - 1].answer) repeats++;
  }
  const repeatRate = pairs ? (repeats + 0.4) / (pairs + 1) : 0.25;

  const relBins = [0, 0, 0, 0, 0];
  for (const h of hist) {
    const r = relativePos(h.answer, h.options);
    relBins[clamp(Math.round(r * 4), 0, 4)]++;
  }

  function featDist(a, b) {
    let ag = 0, tot = 0;
    for (const k of featKeys) {
      const bv = b[k];
      if (bv == null) continue;
      tot++;
      if (String(bv) === String(a[k])) ag++;
    }
    if (!tot) return 1;
    return 1 - ag / tot;
  }
  const knn = hist.map((h) => ({
    h,
    d: featDist(feats, discretize(h.context))
  })).sort((a, b) => a.d - b.d).slice(0, 8);

  const knnVotes = new Map();
  for (const item of knn) {
    const h = item.h, d = item.d;
    const w = Math.exp(-d * 4) * (h.challengeId === challenge.id ? 1.5 : 0.7);
    let opt;
    if (h.challengeId === challenge.id && options.includes(h.answer)) {
      opt = h.answer;
    } else {
      const r = relativePos(h.answer, h.options);
      opt = challenge.options[Math.round(r * (nAll - 1))];
    }
    if (options.includes(opt)) knnVotes.set(opt, (knnVotes.get(opt) || 0) + w);
  }

  const cards = {
    weekday: 7, timeBand: 5, tempBand: 5, humidBand: 3, batteryBand: 5,
    charging: 2, orientation: 6, speedBand: 4, country: 8, city: 12,
    placeType: 12, colorScheme: 2, network: 5, motionBand: 3, moon: 8, sinceLastBand: 4
  };

  const scored = options.map((opt) => {
    const idx = challenge.options.indexOf(opt);
    let logp = Math.log(1 / nAll);
    const reasons = [];

    const pos = positionBucket(idx, nAll);
    if (posTotal >= 3) {
      const p = ((posCounts[pos] || 0) + 1) / (posTotal + 5);
      const lift = p / (1 / 5);
      logp += 0.9 * Math.log(lift);
      if (lift > 1.25) {
        reasons.push({ text: 'Sueles elegir ' + pos + ' de la lista', weight: lift - 1 });
      }
    }

    if (posTotal >= 3) {
      const bin = clamp(Math.round(relativePos(opt, challenge.options) * 4), 0, 4);
      const p = (relBins[bin] + 1) / (posTotal + 5);
      logp += 0.5 * Math.log(p / 0.2);
    }

    if (hist.length >= 3) {
      const fc = fav.get(opt) || 0;
      if (fc > 0) {
        const lift = (fc + 0.3) / (hist.length / Math.max(nAll, 2) + 0.3);
        logp += 0.7 * Math.log(Math.max(lift, 0.2));
        if (fc >= 2 && lift > 1.2) {
          reasons.push({ text: 'El ' + opt + ' es de tus n\u00fameros favoritos (' + fc + ' veces)', weight: lift });
        }
      }
    }

    if (lastAnswer != null) {
      if (opt === lastAnswer) {
        logp += Math.log(Math.max(repeatRate, 0.05));
        if (repeatRate > 0.4) reasons.push({ text: 'A veces repites el n\u00famero anterior', weight: repeatRate });
      } else {
        logp += Math.log(Math.max(1 - repeatRate, 0.2));
      }
    }

    if (same.length >= 2) {
      const ansCount = same.filter((h) => h.answer === opt).length;
      const prior = (ansCount + 1) / (same.length + nAll);
      logp += 0.8 * Math.log(prior * nAll);
      for (const k of featKeys) {
        const V = cards[k] || 6;
        const matchAnd = same.filter((h) => h.answer === opt && discretize(h.context)[k] === feats[k]).length;
        const p = (matchAnd + 0.5) / (ansCount + 0.5 * V);
        logp += 1.1 * Math.log(p + 1e-6);
        if (matchAnd >= 2) {
          reasons.push({
            text: 'En esta prueba, con ' + FEATURE_LABELS[k] + ' \u201c' + feats[k] + '\u201d, sueles pensar en ' + opt,
            weight: matchAnd
          });
        }
      }
    }

    if (hist.length >= 5 && same.length < 3) {
      const bin = clamp(Math.round(relativePos(opt, challenge.options) * 4), 0, 4);
      for (const k of featKeys.slice(0, 8)) {
        const withF = hist.filter((h) => discretize(h.context)[k] === feats[k]);
        if (withF.length < 2) continue;
        const match = withF.filter((h) => {
          const b = clamp(Math.round(relativePos(h.answer, h.options) * 4), 0, 4);
          return b === bin;
        }).length;
        const p = (match + 0.4) / (withF.length + 2);
        logp += 0.35 * Math.log(p / 0.2 + 1e-6);
        if (match >= 3 && p > 0.4) {
          reasons.push({
            text: 'Con ' + FEATURE_LABELS[k] + ' \u201c' + feats[k] + '\u201d sueles ir a esta zona de la lista',
            weight: p
          });
        }
      }
    }

    const kv = knnVotes.get(opt) || 0;
    if (kv > 0) {
      const sum = [...knnVotes.values()].reduce((a, b) => a + b, 0) || 1;
      const p = kv / sum;
      logp += 0.9 * Math.log(p * options.length + 1e-6);
      if (p > 0.35 && knn.length >= 3) {
        reasons.push({ text: 'Contextos parecidos al de ahora apuntan a este n\u00famero', weight: p });
      }
    }

    reasons.sort((a, b) => b.weight - a.weight);
    return { opt, idx, logp, reasons: reasons.slice(0, 4) };
  });

  const noise = Math.max(0.03, 0.18 / Math.sqrt(hist.length + 1));
  for (const s of scored) s.logp += (Math.random() - 0.5) * 2 * noise;
  scored.sort((a, b) => b.logp - a.logp);

  if (hist.length < 2) {
    for (const s of scored) {
      if (!s.reasons.length) {
        s.reasons.push({ text: 'A\u00fan te estoy conociendo: esta es una intuici\u00f3n inicial', weight: 0.1 });
      }
    }
  }
  return scored;
}

function explanationFor(scoredItem, challenge) {
  if (!scoredItem) return [];
  const rs = (scoredItem.reasons || []).map((r) => r.text);
  if (!rs.length) rs.push('Voy por probabilidad, afinando con lo que ya he visto de ti.');
  return rs;
}

function computeStats(store) {
  const h = store.history;
  const n = h.length;
  const firstHits = h.filter((x) => x.attempts === 1).length;
  const firstRate = n ? firstHits / n : 0;
  const chance = n ? h.reduce((s, x) => s + 1 / Math.max(x.options.length, 1), 0) / n : 0;
  const avgAttempts = n ? h.reduce((s, x) => s + x.attempts, 0) / n : 0;
  const expectedRandom = n ? h.reduce((s, x) => s + (x.options.length + 1) / 2, 0) / n : 0;
  const advances = h.filter((x) => x.outcome === 'advance').length;
  const repeats = h.filter((x) => x.outcome === 'repeat').length;
  const backs = h.filter((x) => x.outcome === 'back').length;
  const fav = new Map();
  for (const x of h) fav.set(x.answer, (fav.get(x.answer) || 0) + 1);
  const topFav = [...fav.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  const rolling = [];
  const w = 5;
  for (let i = 0; i < n; i++) {
    const from = Math.max(0, i - w + 1);
    const slice = h.slice(from, i + 1);
    rolling.push(slice.filter((x) => x.attempts === 1).length / slice.length);
  }
  const influence = featureInfluence(h);
  return {
    n, firstHits, firstRate, chance, avgAttempts, expectedRandom,
    advances, repeats, backs, topFav, rolling, influence
  };
}
let store = null;
let state = {
  screen: 'home',
  context: null,
  challenge: null,
  ladderLen: 0,
  ranking: [],
  guessIndex: 0,
  guesses: [],
  thinkStarted: 0,
  collecting: false,
  deferredPrompt: null
};

function root() { return document.getElementById('app'); }

function toast(msg) {
  let el = document.querySelector('.toast');
  if (!el) {
    el = document.createElement('div');
    el.className = 'toast';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2600);
}

function phaseBar(store, challenge, extra) {
  const th = attemptThreshold(challenge.options.length);
  const totalShow = Math.min(store.phase + 6, Math.max(store.phase + 3, 12));
  let dots = '';
  for (let i = 0; i < totalShow; i++) {
    const cls = i < store.phase ? 'done' : (i === store.phase ? 'now' : '');
    dots += '<div class="phase-dot ' + cls + '"></div>';
  }
  const rule = extra || (
    'A la primera \u2192 subes de fase. Si acierto entre 2 y ' + th +
    ' intento' + (th === 1 ? '' : 's') + ' \u2192 repetimos. Si tardo m\u00e1s de ' + th + ' \u2192 bajamos.'
  );
  return '<div class="phase-bar">' +
    '<div class="phase-meta">' +
      '<span class="phase-n">Fase ' + (store.phase + 1) + '</span>' +
      '<span class="phase-name">' + esc(challenge.shortName) + '</span>' +
    '</div>' +
    '<div class="phase-track">' + dots + '</div>' +
    '<p class="phase-rule">' + rule + '</p>' +
  '</div>';
}

function starsHtml() {
  const pts = [[2, 8, 0], [92, 6, 0.6], [86, 78, 1.1], [8, 82, 0.3], [48, -4, 1.6]];
  return '<div class="orb-stars">' + pts.map((p, i) =>
    '<span class="star" style="left:' + p[0] + '%;top:' + p[1] + '%;animation-delay:' + p[2] + 's">' +
    (i % 2 ? '\u2726' : '\u2605') + '</span>'
  ).join('') + '</div>';
}


const SHARE_URL = 'https://lerelerele.github.io/adivina-numero/';
const SHARE_TITLE = 'Or\u00e1culo \u2014 Adivino tu n\u00famero';
const SHARE_TEXT_DEFAULT = 'Adivino el n\u00famero que est\u00e1s pensando seg\u00fan tu entorno, y aprendo tu patr\u00f3n. \u00bfTe atreves?';

function shareApp(custom) {
  const title = (custom && custom.title) || SHARE_TITLE;
  const text = (custom && custom.text) || SHARE_TEXT_DEFAULT;
  const url = SHARE_URL;
  const go = async () => {
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: title, text: text, url: url });
        return;
      } catch (e) {
        if (e && e.name === 'AbortError') return;
      }
    }
    await fallbackShare(text, url);
  };
  go();
}

async function fallbackShare(text, url) {
  let copied = false;
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(url);
      copied = true;
    }
  } catch (_) {}
  toast(copied ? 'Enlace copiado al portapapeles' : 'Copia el enlace para compartirlo');
  showShareSheet(text, url, copied);
}

function showShareSheet(text, url, copied) {
  const prev = document.querySelector('.overlay.share-sheet');
  if (prev) prev.remove();
  const wa = 'https://wa.me/?text=' + encodeURIComponent(text + ' ' + url);
  const ov = $('<div class="overlay share-sheet"><div class="sheet">' +
    '<h2>Compartir</h2>' +
    '<p>' + (copied ? 'He copiado el enlace. ' : '') +
      'M\u00e1ndaselo a quien quieras, o \u00e1brelo en WhatsApp.</p>' +
    '<p class="share-url">' + esc(url) + '</p>' +
    '<div class="stack-tight">' +
      '<a class="btn btn-yes" href="' + esc(wa) + '" target="_blank" rel="noopener">Abrir WhatsApp</a>' +
      '<button class="btn btn-ghost" id="shareClose" type="button">Cerrar</button>' +
    '</div></div></div>');
  document.body.appendChild(ov);
  ov.querySelector('#shareClose').onclick = () => ov.remove();
  ov.addEventListener('click', (e) => { if (e.target === ov) ov.remove(); });
}

function resultShareText(entry) {
  if (entry && entry.attempts === 1) {
    return '\u00a1El Or\u00e1culo me adivin\u00f3 el n\u00famero a la primera! \u00bfTe atreves?';
  }
  if (entry && entry.attempts) {
    return 'El Or\u00e1culo adivin\u00f3 el n\u00famero en el que pensaba. \u00bfTe atreves a probar?';
  }
  return SHARE_TEXT_DEFAULT;
}

function renderHome() {
  const st = computeStats(store);
  const needIOS = typeof DeviceOrientationEvent !== 'undefined' &&
    typeof DeviceOrientationEvent.requestPermission === 'function' &&
    !store.orientationGranted;
  const install = !window.matchMedia('(display-mode: standalone)').matches && !store.installHintDismissed;

  root().innerHTML =
    '<div class="screen">' +
      '<div class="top-row">' +
        '<button class="icon-btn" data-go="signals" title="Se\u00f1ales" aria-label="Se\u00f1ales">\uD83D\uDCE1</button>' +
        '<button class="icon-btn" data-go="portrait" title="Lo que s\u00e9 de ti" aria-label="Lo que s\u00e9 de ti">\u2728</button>' +
        '<button class="icon-btn" data-go="stats" title="Estad\u00edsticas" aria-label="Estad\u00edsticas">\uD83D\uDCCA</button>' +
      '</div>' +
      '<div class="home-hero">' +
        '<p class="kicker">Lector de mentes</p>' +
        '<div class="orb-wrap">' + starsHtml() +
          '<div class="orb"><span class="orb-num" style="font-size:3.2rem">?</span></div>' +
        '</div>' +
        '<h1>Or\u00e1culo</h1>' +
        '<p class="lead">Adivinar\u00e9 el n\u00famero que est\u00e1s pensando seg\u00fan d\u00f3nde est\u00e1s, el tiempo, tu m\u00f3vil\u2026 y aprender\u00e9 tu patr\u00f3n.</p>' +
        (st.n ? '<p class="tiny">Llevas ' + st.n + ' prueba' + (st.n === 1 ? '' : 's') +
          ' \u00b7 aciertos a la primera: ' + Math.round(st.firstRate * 100) +
          '% (el azar har\u00eda ' + Math.round(st.chance * 100) + '%)</p>' : '') +
      '</div>' +
      (install ? '<div class="install-banner" id="installBox">' +
        'A\u00f1\u00e1deme a la pantalla de inicio y funcionar\u00e9 como una app, tambi\u00e9n sin conexi\u00f3n.' +
        '<div class="stack-tight" style="margin-top:8px">' +
          '<button class="btn btn-gold" id="btnInstall" type="button">A\u00f1adir a la pantalla de inicio</button>' +
          '<button class="btn btn-ghost" id="btnInstallLater" type="button" style="min-height:44px;font-size:0.9rem">Ahora no</button>' +
        '</div></div>' : '') +
      '<div class="stack">' +
        (needIOS ? '<button class="btn btn-ghost" id="btnSensors" type="button">Activar sensores de movimiento</button>' : '') +
        '<button class="btn btn-primary" id="btnStart" type="button">Empezar</button>' +
        '<button class="btn btn-portrait" id="btnPortrait" type="button">\u2728 Lo que s\u00e9 de ti</button>' +
        '<button class="btn btn-share" id="btnShare" type="button">Compartir</button>' +
        '<p class="tiny">Tus respuestas se quedan en este m\u00f3vil. Fase ' + (store.phase + 1) + '.</p>' +
        '<p class="version-label">' + APP_VERSION + '</p>' +
      '</div>' +
    '</div>';

  root().querySelector('[data-go="stats"]').onclick = () => showStats();
  root().querySelector('[data-go="signals"]').onclick = () => showSignalsInfo();
  const goP = root().querySelector('[data-go="portrait"]');
  if (goP) goP.onclick = () => showPortrait();
  const bp = document.getElementById('btnPortrait');
  if (bp) bp.onclick = () => showPortrait();
  document.getElementById('btnStart').onclick = () => startRound();
  const bshare = document.getElementById('btnShare');
  if (bshare) bshare.onclick = () => shareApp();
  const bs = document.getElementById('btnSensors');
  if (bs) {
    bs.onclick = async () => {
      const r = await requestOrientationPermission();
      store.orientationGranted = !!(r.orientation || r.motion);
      saveStore(store);
      toast(store.orientationGranted ? 'Sensores activados' : 'No se concedi\u00f3 el permiso');
      renderHome();
    };
  }
  const bi = document.getElementById('btnInstall');
  const bl = document.getElementById('btnInstallLater');
  if (bl) bl.onclick = () => {
    store.installHintDismissed = true;
    saveStore(store);
    renderHome();
  };
  if (bi) {
    bi.onclick = async () => {
      if (state.deferredPrompt) {
        state.deferredPrompt.prompt();
        try { await state.deferredPrompt.userChoice; } catch (_) {}
        state.deferredPrompt = null;
        store.installHintDismissed = true;
        saveStore(store);
        renderHome();
      } else {
        const isiOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
          (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
        toast(isiOS
          ? 'En iPhone: pulsa Compartir y luego \u201cA\u00f1adir a pantalla de inicio\u201d.'
          : 'En el men\u00fa del navegador, elige \u201cA\u00f1adir a la pantalla de inicio\u201d o \u201cInstalar\u201d.');
      }
    };
  }
}

function renderSignalList(ctx, animated) {
  return '<ul class="signal-list">' + SIGNAL_META.map((s, i) => {
    const st = ctx ? signalState(s.key, ctx) : 'wait';
    const val = ctx ? signalValueText(s.key, ctx) : 'leyendo\u2026';
    const label = st === 'ok' ? 'ok' : (st === 'wait' ? 'leyendo' : 'no');
    return '<li class="signal-item" style="animation-delay:' + (animated ? i * 0.05 : 0) + 's">' +
      '<div class="sig-icon">' + s.icon + '</div>' +
      '<div><div class="sig-name">' + esc(s.name) + '</div><div class="sig-val">' + esc(val) + '</div></div>' +
      '<span class="sig-state ' + st + '">' + label + '</span>' +
    '</li>';
  }).join('') + '</ul>';
}

function renderCollecting(ctx) {
  root().innerHTML =
    '<div class="screen">' +
      '<p class="kicker">Fase ' + (store.phase + 1) + '</p>' +
      '<h2>Leyendo el entorno\u2026</h2>' +
      '<p class="lead">Uso lo que tu m\u00f3vil me deja ver. Lo que no est\u00e9 disponible, lo salto.</p>' +
      '<div style="margin-top:16px" id="sigMount">' + renderSignalList(ctx, true) + '</div>' +
      '<div class="stack">' +
        '<button class="btn btn-ghost" id="btnSkip" type="button">Continuar con lo que hay</button>' +
      '</div>' +
    '</div>';
  document.getElementById('btnSkip').onclick = () => { state.skipCollect = true; };
}

async function startRound() {
  startSensorListenersIfPossible();
  const info = challengeAt(store);
  state.challenge = info.challenge;
  state.ladderLen = info.ladder.length;
  state.guesses = [];
  state.guessIndex = 0;
  state.ranking = [];
  state.skipCollect = false;
  state.collecting = true;
  const ctx = emptyContext();
  const now = new Date();
  ctx.weekday = now.getDay();
  ctx.weekdayName = WEEKDAYS[ctx.weekday];
  ctx.hour = now.getHours();
  ctx.minute = now.getMinutes();
  ctx.timeBand = timeBand(ctx.hour);
  ctx.available.weekday = true;
  ctx.available.time = true;
  const moon = moonPhase(now);
  ctx.moon = moon.name;
  ctx.moonIcon = moon.icon;
  ctx.available.moon = true;
  renderCollecting(ctx);

  const collected = await collectSignals(store, (c) => {
    if (state.skipCollect) return;
    const mount = document.getElementById('sigMount');
    if (mount) mount.innerHTML = renderSignalList(c, false);
  });
  state.context = collected;
  state.collecting = false;

  const mount = document.getElementById('sigMount');
  if (mount) mount.innerHTML = renderSignalList(collected, false);
  await new Promise((r) => setTimeout(r, state.skipCollect ? 0 : 700));
  renderThink();
}

function renderThink() {
  const ch = state.challenge;
  const th = attemptThreshold(ch.options.length);
  root().innerHTML =
    '<div class="screen">' +
      phaseBar(store, ch) +
      '<p class="kicker">Conc\u00e9ntrate</p>' +
      '<h2>' + esc(ch.title) + '</h2>' +
      '<p class="lead">' + esc(ch.subtitle) + '</p>' +
      renderVisual(ch) +
      '<div class="stack">' +
        '<button class="btn btn-primary" id="btnReady" type="button">Ya lo tengo</button>' +
        '<p class="tiny">Para subir de fase tengo que acertarlo a la primera. El umbral de \u201cno bajar\u201d es ' +
          th + ' intento' + (th === 1 ? '' : 's') + '.</p>' +
      '</div>' +
    '</div>';
  document.getElementById('btnReady').onclick = () => {
    state.thinkStarted = Date.now();
    state.ranking = rankCandidates(ch, state.context, store, []);
    state.guessIndex = 0;
    state.guesses = [];
    renderGuess();
    try { if (navigator.vibrate) navigator.vibrate(18); } catch (_) {}
  };
}

function currentGuess() {
  return state.ranking[state.guessIndex];
}

function renderGuess() {
  const ch = state.challenge;
  const g = currentGuess();
  if (!g) {
    state.ranking = rankCandidates(ch, state.context, store, []);
    state.guessIndex = 0;
    return renderGuess();
  }
  const n = g.opt;
  const attempt = state.guesses.length + 1;
  const th = attemptThreshold(ch.options.length);
  const why = explanationFor(g, ch);
  root().innerHTML =
    '<div class="screen">' +
      phaseBar(store, ch, 'Intento ' + attempt + ' \u00b7 no repetir\u00e9 un n\u00famero. Umbral para no bajar: ' + th + '.') +
      '<p class="guess-prompt">\u00bfEst\u00e1s pensando en\u2026</p>' +
      '<div class="orb-wrap">' + starsHtml() +
        '<div class="orb"><span class="orb-num">' + esc(String(n)) + '</span></div>' +
      '</div>' +
      renderGuessVisual(ch, n) +
      '<h2 class="guess-q">' + esc(ch.question(n)) + '</h2>' +
      '<p class="attempt-tag">Intento <b>' + attempt + '</b> de ' + ch.options.length + ' posibles</p>' +
      '<div class="why-box">' +
        '<strong>Por qu\u00e9 creo que es ' + esc(ch.label(n)) + '</strong>' +
        '<ul>' + why.map((w) => '<li>' + esc(w) + '</li>').join('') + '</ul>' +
      '</div>' +
      '<div class="btn-row">' +
        '<button class="btn btn-no" id="btnNo" type="button">No</button>' +
        '<button class="btn btn-yes" id="btnYes" type="button">S\u00ed</button>' +
      '</div>' +
    '</div>';
  document.getElementById('btnYes').onclick = () => onAnswer(true);
  document.getElementById('btnNo').onclick = () => onAnswer(false);
}
function onAnswer(yes) {
  const ch = state.challenge;
  const g = currentGuess();
  if (!g) return;
  const btnY = document.getElementById('btnYes');
  const btnN = document.getElementById('btnNo');
  if (btnY) btnY.disabled = true;
  if (btnN) btnN.disabled = true;

  if (!yes) {
    state.guesses.push(g.opt);
    try { if (navigator.vibrate) navigator.vibrate(12); } catch (_) {}
    if (state.guesses.length >= ch.options.length) {
      toast('He agotado las opciones. \u00bfSeguro? Volvamos a empezar esta ronda.');
      state.guesses = [];
      state.ranking = rankCandidates(ch, state.context, store, []);
      state.guessIndex = 0;
      renderGuess();
      return;
    }
    state.guessIndex += 1;
    while (state.guessIndex < state.ranking.length && state.guesses.includes(state.ranking[state.guessIndex].opt)) {
      state.guessIndex += 1;
    }
    if (state.guessIndex >= state.ranking.length) {
      const leftover = ch.options.filter((o) => !state.guesses.includes(o));
      state.ranking = leftover.map((opt) => ({ opt, idx: ch.options.indexOf(opt), logp: 0, reasons: [] }));
      state.guessIndex = 0;
    }
    renderGuess();
    return;
  }

  state.guesses.push(g.opt);
  const attempts = state.guesses.length;
  const answer = g.opt;
  const answerMs = Date.now() - (state.thinkStarted || Date.now());
  const outcome = phaseOutcome(attempts, ch.options.length);
  const prevPhase = store.phase;
  // On advance, allow growing past the current ladder end.
  const nextPhase = applyPhaseOutcome(
    store.phase,
    outcome,
    outcome.action === 'advance' ? store.phase + 1 : Math.max(store.phase, 0)
  );

  const entry = {
    id: uid(),
    ts: Date.now(),
    phase: prevPhase,
    nextPhase,
    challengeId: ch.id,
    challengeTitle: ch.title,
    shortName: ch.shortName,
    options: ch.options.slice(),
    answer,
    attempts,
    guesses: state.guesses.slice(),
    context: state.context,
    answerMs,
    reasons: explanationFor(g, ch),
    outcome: outcome.action,
    threshold: outcome.threshold
  };
  store.history.push(entry);
  store.lastAnswer = answer;
  store.lastGameTs = Date.now();
  store.phase = nextPhase;
  saveStore(store);

  if (outcome.action === 'advance') burstConfetti();
  try {
    if (navigator.vibrate) {
      navigator.vibrate(outcome.action === 'advance' ? [20, 40, 30] : (outcome.action === 'back' ? [40, 30, 40] : 20));
    }
  } catch (_) {}

  renderResult(entry, outcome, prevPhase, ch);
}

function nextPhaseName(phaseIdx) {
  const tmp = Object.assign({}, store, { phase: phaseIdx });
  const info = challengeAt(tmp);
  return 'Fase ' + (phaseIdx + 1) + ': ' + info.challenge.shortName;
}

function renderResult(entry, outcome, prevPhase, ch) {
  const went = outcome.action;
  let detail;
  if (went === 'advance') {
    detail = 'Siguiente: <span class="next-phase">' + esc(nextPhaseName(store.phase)) + '</span>';
  } else if (went === 'repeat') {
    detail = 'Acert\u00e9 en ' + entry.attempts + ' intento' + (entry.attempts === 1 ? '' : 's') +
      ' (el m\u00e1ximo para no bajar es ' + outcome.threshold + '), as\u00ed que ' +
      '<span class="next-phase">repetimos la fase ' + (prevPhase + 1) + '</span>.';
  } else {
    if (prevPhase === 0) {
      detail = 'Tard\u00e9 ' + entry.attempts + ' intentos (el l\u00edmite era ' + outcome.threshold +
        '). Como ya est\u00e1s en la fase 1, <span class="next-phase">repetimos la fase 1</span>.';
    } else {
      detail = 'Tard\u00e9 ' + entry.attempts + ' intentos (el l\u00edmite era ' + outcome.threshold +
        '). <span class="next-phase">' + esc(nextPhaseName(store.phase)) + '</span>';
    }
  }
  const why = (entry.reasons || []).map((w) => '<li>' + esc(w) + '</li>').join('');
  root().innerHTML =
    '<div class="screen">' +
      '<div class="result-banner ' + outcome.banner + '">' +
        '<p class="kicker">Era el ' + esc(ch.label(entry.answer)) + '</p>' +
        '<div class="big">' + esc(outcome.title) + '</div>' +
      '</div>' +
      '<div class="orb-wrap" style="margin-top:8px">' + starsHtml() +
        '<div class="orb"><span class="orb-num">' + esc(String(entry.answer)) + '</span></div>' +
      '</div>' +
      renderGuessVisual(ch, entry.answer) +
      '<p class="result-msg">' +
        'Lo adivin\u00e9 en <strong>' + entry.attempts + '</strong> intento' +
        (entry.attempts === 1 ? '' : 's') + ' de ' + ch.options.length + ' posibles.' +
        '<span class="next-phase">' + esc(outcome.message) + '</span>' +
        detail +
      '</p>' +
      '<div class="why-box" style="margin-top:16px">' +
        '<strong>Por qu\u00e9 cre\u00ed que era ' + esc(ch.label(entry.answer)) + '</strong>' +
        '<ul>' + (why || '<li>Intuici\u00f3n inicial.</li>') + '</ul>' +
      '</div>' +
      '<div class="stack">' +
        '<button class="btn btn-primary" id="btnNext" type="button">Siguiente ronda</button>' +
        '<button class="btn btn-share" id="btnShareResult" type="button">Compartir</button>' +
        '<button class="btn btn-ghost" id="btnHome" type="button">Inicio</button>' +
      '</div>' +
    '</div>';
  document.getElementById('btnNext').onclick = () => startRound();
  document.getElementById('btnHome').onclick = () => renderHome();
  const bsr = document.getElementById('btnShareResult');
  if (bsr) bsr.onclick = () => shareApp({ text: resultShareText(entry) });
}


function confPips(level) {
  const lv = level || 'baja';
  const cls = lv === 'alta' ? 'alta' : (lv === 'media' ? 'media' : (lv === 'muy baja' ? 'muy-baja' : 'baja'));
  return '<div class="conf-row"><span class="conf-pips ' + cls + '"><i></i><i></i><i></i></span>' +
    '<span class="conf-tag ' + cls + '">confianza ' + esc(lv) + '</span></div>';
}

function citeHtml(cites) {
  if (!cites || !cites.length) return '';
  return '<ul class="cite-list">' + cites.map((c) =>
    '<li>' + esc(c.full) + (c.url ? ' <a href="' + esc(c.url) + '" target="_blank" rel="noopener">' + esc(c.url) + '</a>' : '') + '</li>'
  ).join('') + '</ul>';
}

function lockedBox(count, gate, missing, kind) {
  if (!count && !gate) return '';
  const n = count || 0;
  if (!gate) return '';
  const what = kind === 'facts' ? 'datos' : (kind === 'studies' ? 'lecturas de estudios' : 'adivinaciones');
  const extra = n ? ('Hay ' + n + ' ' + what + ' m\u00e1s esperando. ') : '';
  return '<div class="locked-hint">\uD83D\uDD12 ' + extra + 'Se abre m\u00e1s a las ' + gate +
    ' partidas (te faltan ' + missing + ').</div>';
}

function showPortrait() {
  const p = analyzePortrait(store);
  const gates = [5, 20, 50];
  const segs = gates.map((g, i) => {
    const prev = i === 0 ? 0 : gates[i - 1];
    let cls = '';
    if (p.n >= g) cls = 'on';
    else if (p.n > prev) cls = 'partial';
    return '<div class="pp-seg ' + cls + '"></div>';
  }).join('');
  const gateLabels = gates.map((g) =>
    '<span class="' + (p.n >= g ? 'hit' : '') + '">' + g + '</span>'
  ).join('');

  const progress = '<div class="portrait-progress">' +
    '<div class="pp-label"><span>C\u00f3mo te voy conociendo</span><span>' + p.n +
      (p.nextGate ? ' / ' + p.nextGate : ' pruebas') + '</span></div>' +
    '<div class="pp-track">' + segs + '</div>' +
    '<div class="pp-gates"><span>0</span>' + gateLabels + '</div>' +
    (p.nextGate
      ? '<p class="tiny" style="text-align:left;margin:8px 0 0">A las 5, 20 y 50 partidas se revelan m\u00e1s capas. Te faltan ' + p.missing + ' para el siguiente umbral.</p>'
      : '<p class="tiny" style="text-align:left;margin:8px 0 0">Has abierto todas las capas. El retrato se sigue afinando con cada ronda.</p>') +
  '</div>';

  let factsHtml;
  if (p.n < 5) {
    factsHtml = '<div class="empty-portrait">Juega al menos 5 pruebas para que pueda decirte hechos con n\u00fameros. Llevas ' + p.n + '.</div>';
  } else if (!p.facts.length) {
    factsHtml = '<div class="empty-portrait">A\u00fan no tengo hechos suficientes. Sigue jugando.</div>';
  } else {
    factsHtml = p.facts.map((f) =>
      '<article class="portrait-card facts"><h3>' + esc(f.title) + '</h3><p>' + esc(f.text) + '</p></article>'
    ).join('');
  }
  factsHtml += lockedBox(p.factsLocked.length, p.nextGate, p.missing, 'facts');

  let studiesHtml;
  if (p.n < 5) {
    studiesHtml = '<div class="empty-portrait">Cuando haya unas cuantas partidas, cruzar\u00e9 tus respuestas con estudios reales (y te dir\u00e9 cu\u00e1les).</div>';
  } else if (!p.studies.length) {
    studiesHtml = '<div class="empty-portrait">Todav\u00eda no hay un patr\u00f3n bastante claro como para apoyarme en un estudio. Sigue jugando: a veces hace falta contraste.</div>';
  } else {
    studiesHtml = p.studies.map((s) =>
      '<article class="portrait-card studies">' +
        '<h3>' + esc(s.title) + '</h3>' +
        '<p>' + esc(s.text) + '</p>' +
        confPips(s.confidence) +
        (s.note ? '<p class="inspired">' + esc(s.note) + '</p>' : '') +
        '<div class="porque"><strong>Por qu\u00e9</strong>' + esc(s.porQue) + citeHtml(s.cites) + '</div>' +
      '</article>'
    ).join('');
  }
  studiesHtml += lockedBox(p.studiesLocked.length, p.nextGate, p.missing, 'studies');
  if (p.citesUsed && p.citesUsed.length) {
    studiesHtml += '<div class="fuentes"><strong>Fuentes citadas.</strong> Solo estudios (o la encuesta de LG, claramente marcada) que he podido comprobar:<br>' +
      p.citesUsed.map((c) => '\u00b7 ' + esc(c.short) + ': <a href="' + esc(c.url) + '" target="_blank" rel="noopener">' + esc(c.url) + '</a>').join('<br>') +
      '</div>';
  }

  let beliefsHtml;
  if (p.n < 5) {
    beliefsHtml = '<div class="empty-portrait">Aqu\u00ed ir\u00e1n adivinaciones atrevidas, al estilo de un hor\u00f3scopo. Se desbloquean a las 5, 20 y 50 partidas.</div>';
  } else if (!p.beliefs.length) {
    beliefsHtml = '<div class="empty-portrait">A\u00fan no me atrevo a especular. Dame unas rondas m\u00e1s.</div>';
  } else {
    beliefsHtml = p.beliefs.map((b) =>
      '<article class="portrait-card beliefs">' +
        '<h3>' + esc(b.title) + '</h3>' +
        '<p>' + esc(b.text) + '</p>' +
        (b.inspired ? '<p class="inspired">Me inspir\u00e9 en: ' + esc(b.inspired) + '</p>' : '') +
        confPips(b.confidence) +
      '</article>'
    ).join('');
  }
  beliefsHtml += lockedBox(p.beliefsLocked.length, p.nextGate, p.missing, 'beliefs');

  root().innerHTML =
    '<div class="screen">' +
      '<div class="top-row">' +
        '<button class="icon-btn" id="btnBack" aria-label="Volver">\u2190</button>' +
        '<h2 style="font-size:1.15rem">Tu retrato</h2>' +
        '<span style="width:46px"></span>' +
      '</div>' +
      '<p class="kicker">Lo que s\u00e9 \u00b7 lo que dicen los estudios \u00b7 lo que creo</p>' +
      progress +
      '<section class="sec-block facts">' +
        '<p class="sec-kicker">Primera parte</p>' +
        '<h2>Lo que s\u00e9 de ti</h2>' +
        '<p class="sec-lead">Solo hechos que se ven en tus partidas, con recuentos. Sin interpretar.</p>' +
        factsHtml +
      '</section>' +
      '<section class="sec-block studies">' +
        '<p class="sec-kicker">Segunda parte</p>' +
        '<h2>Lo que dicen los estudios</h2>' +
        '<p class="sec-lead">Inferencias apoyadas en investigaciones reales, cada una con su cita. Si un patr\u00f3n tuyo va al contrario de lo habitual, tambi\u00e9n lo digo.</p>' +
        studiesHtml +
      '</section>' +
      '<section class="sec-block beliefs">' +
        '<p class="sec-kicker">Tercera parte</p>' +
        '<h2>Lo que creo de ti</h2>' +
        '<p class="sec-lead">Especulaciones atrevidas, al estilo de un hor\u00f3scopo: car\u00e1cter, \u00e1nimo, h\u00e1bitos. Van con un indicador de confianza, pero siguen siendo un juego.</p>' +
        beliefsHtml +
      '</section>' +
      '<div class="disclaimer">Esto es un juego, no un diagn\u00f3stico. La primera parte son datos; la segunda, lecturas con estudios que he podido comprobar; la tercera es pura especulaci\u00f3n, tan libre como un hor\u00f3scopo. Nada de esto describe tu salud ni tu personalidad cl\u00ednica.</div>' +
      '<div class="stack">' +
        '<button class="btn btn-primary" id="btnPlay" type="button">Seguir jugando</button>' +
        '<button class="btn btn-share" id="btnSharePortrait" type="button">Compartir</button>' +
        '<button class="btn btn-ghost" id="btnHome" type="button">Inicio</button>' +
        '<p class="version-label">' + APP_VERSION + '</p>' +
      '</div>' +
    '</div>';
  document.getElementById('btnBack').onclick = () => renderHome();
  document.getElementById('btnHome').onclick = () => renderHome();
  document.getElementById('btnPlay').onclick = () => startRound();
  const bsp = document.getElementById('btnSharePortrait');
  if (bsp) bsp.onclick = () => shareApp({ text: 'El Or\u00e1culo est\u00e1 leyendo mi mente\u2026 \u00bfTe atreves a probar?' });
}

function showStats() {
  const st = computeStats(store);
  const vs = st.n
    ? (st.firstRate >= st.chance
      ? 'A la primera acierto un ' + Math.round(st.firstRate * 100) + '%, mejor que el ' +
        Math.round(st.chance * 100) + '% del azar.'
      : 'A la primera acierto un ' + Math.round(st.firstRate * 100) + '%. El azar har\u00eda un ' +
        Math.round(st.chance * 100) + '%; a\u00fan te estoy conociendo.')
    : 'Todav\u00eda no hay partidas. Juega unas cuantas para ver tu patr\u00f3n.';

  let chart = '';
  if (st.rolling.length) {
    const w = 320, h = 110, p = 8;
    const pts = st.rolling.map((v, i) => {
      const x = p + (i * (w - 2 * p)) / Math.max(st.rolling.length - 1, 1);
      const y = h - p - v * (h - 2 * p);
      return x.toFixed(1) + ',' + y.toFixed(1);
    }).join(' ');
    const chanceY = h - p - st.chance * (h - 2 * p);
    chart = '<svg class="chart" viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="none" aria-label="Aciertos a la primera">' +
      '<line x1="0" y1="' + chanceY + '" x2="' + w + '" y2="' + chanceY +
        '" stroke="rgba(251,191,36,0.4)" stroke-dasharray="4 4"/>' +
      '<polyline fill="none" stroke="#a78bfa" stroke-width="2.5" points="' + pts + '"/>' +
      '</svg>' +
      '<p class="tiny" style="text-align:left">L\u00ednea: acierto a la primera (ventana de 5). Punteada: azar esperado.</p>';
  }

  const infl = st.influence.length
    ? st.influence.slice(0, 6).map((f) => {
      const pct = Math.min(100, Math.round(f.gain * 100));
      return '<div class="bar-row"><span>' + esc(f.label) + '</span><div class="bar-track">' +
        '<div class="bar-fill" style="width:' + pct + '%"></div></div><span>' + pct + '</span></div>';
    }).join('')
    : '<p class="muted">Cuando haya m\u00e1s partidas, aqu\u00ed ver\u00e1s qu\u00e9 se\u00f1ales pesan m\u00e1s en tu patr\u00f3n.</p>';

  const favs = st.topFav.length
    ? st.topFav.map((pair) => '<span class="pill">' + esc(String(pair[0])) + ' \u00b7 ' + pair[1] + '</span>').join('')
    : '<span class="muted">\u2014</span>';

  const recent = store.history.slice(-8).reverse().map((h) => {
    const cls = h.outcome === 'advance' ? 'up' : (h.outcome === 'back' ? 'down' : '');
    const arrow = h.outcome === 'advance' ? '\u2191' : (h.outcome === 'back' ? '\u2193' : '\u2192');
    return '<span class="pill ' + cls + '">F' + (h.phase + 1) + ' ' + esc(h.shortName || '') +
      ' \u00b7 ' + h.attempts + ' int. ' + arrow + '</span>';
  }).join('');

  root().innerHTML =
    '<div class="screen">' +
      '<div class="top-row">' +
        '<button class="icon-btn" id="btnBack" aria-label="Volver">\u2190</button>' +
        '<h2 style="font-size:1.2rem">Estad\u00edsticas</h2>' +
        '<button class="icon-btn" id="btnSettings" aria-label="Datos">\u2699\uFE0F</button>' +
      '</div>' +
      '<p class="lead" style="margin-top:0">' + vs + '</p>' +
      '<div class="stat-grid">' +
        '<div class="stat-tile"><div class="num">' + st.n + '</div><div class="lbl">pruebas</div></div>' +
        '<div class="stat-tile"><div class="num">' + (st.n ? Math.round(st.firstRate * 100) + '%' : '\u2014') +
          '</div><div class="lbl">a la primera</div></div>' +
        '<div class="stat-tile"><div class="num">' + (st.n ? Math.round(st.chance * 100) + '%' : '\u2014') +
          '</div><div class="lbl">azar esperado</div></div>' +
        '<div class="stat-tile"><div class="num">' + (st.n ? st.avgAttempts.toFixed(1) : '\u2014') +
          '</div><div class="lbl">intentos medios (azar ' + (st.n ? st.expectedRandom.toFixed(1) : '\u2014') + ')</div></div>' +
        '<div class="stat-tile"><div class="num">' + st.advances + '</div><div class="lbl">fases subidas</div></div>' +
        '<div class="stat-tile"><div class="num">' + st.backs + '</div><div class="lbl">fases bajadas</div></div>' +
      '</div>' +
      '<h3 class="section-title">Aciertos a la primera con el tiempo</h3>' +
      (chart || '<p class="muted">Juega para ver la gr\u00e1fica.</p>') +
      '<h3 class="section-title">Se\u00f1ales que m\u00e1s influyen</h3>' + infl +
      '<h3 class="section-title">Tus n\u00fameros favoritos</h3>' +
      '<div class="pill-row">' + favs + '</div>' +
      '<h3 class="section-title">\u00daltimas rondas</h3>' +
      '<div class="pill-row">' + (recent || '<span class="muted">\u2014</span>') + '</div>' +
      '<p class="tiny" style="text-align:left;margin-top:16px">' +
        'Fase actual: ' + (store.phase + 1) +
        '. Subes solo si acierto a la primera. Si acierto despu\u00e9s pero en \u226450% de los intentos, repetimos. Si tardo m\u00e1s, bajamos.' +
      '</p>' +
      '<div class="stack" style="margin-top:12px">' +
        '<button class="btn btn-ghost" id="btnPortrait2" type="button">Lo que s\u00e9 de ti</button>' +
      '</div>' +
    '</div>';
  document.getElementById('btnBack').onclick = () => renderHome();
  document.getElementById('btnSettings').onclick = () => showSettings();
  const bp2 = document.getElementById('btnPortrait2');
  if (bp2) bp2.onclick = () => showPortrait();
}

function showSettings() {
  root().innerHTML =
    '<div class="screen">' +
      '<div class="top-row">' +
        '<button class="icon-btn" id="btnBack" aria-label="Volver">\u2190</button>' +
        '<h2 style="font-size:1.2rem">Tus datos</h2>' +
        '<span style="width:46px"></span>' +
      '</div>' +
      '<p class="lead">Todo se guarda solo en este m\u00f3vil, en el almacenamiento del navegador.</p>' +
      '<div class="card">' +
        '<p style="margin:0 0 8px"><strong>' + store.history.length + '</strong> partidas guardadas \u00b7 fase ' +
          (store.phase + 1) + '</p>' +
        '<p class="muted" style="margin:0;font-size:13px">Puedes exportar un JSON o borrar el aprendizaje y empezar de cero.</p>' +
      '</div>' +
      '<div class="stack">' +
        '<button class="btn btn-primary" id="btnExport" type="button">Exportar datos</button>' +
        '<button class="btn btn-ghost" id="btnReset" type="button">Borrar aprendizaje</button>' +
      '</div>' +
    '</div>';
  document.getElementById('btnBack').onclick = () => showStats();
  document.getElementById('btnExport').onclick = () => exportData();
  document.getElementById('btnReset').onclick = () => confirmReset();
}

function exportData() {
  const blob = new Blob([JSON.stringify(store, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'oraculo-datos-' + new Date().toISOString().slice(0, 10) + '.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast('Datos exportados');
}

function confirmReset() {
  const ov = $('<div class="overlay"><div class="sheet">' +
    '<h2>\u00bfBorrar todo?</h2>' +
    '<p>Se perder\u00e1 el historial, el aprendizaje y volver\u00e1s a la fase 1. No se puede deshacer.</p>' +
    '<div class="btn-row">' +
      '<button class="btn btn-ghost" id="cNo" type="button">Cancelar</button>' +
      '<button class="btn btn-no" id="cYes" type="button">Borrar</button>' +
    '</div></div></div>');
  document.body.appendChild(ov);
  ov.querySelector('#cNo').onclick = () => ov.remove();
  ov.querySelector('#cYes').onclick = () => {
    store = resetStore();
    ov.remove();
    toast('Aprendizaje borrado');
    renderHome();
  };
}

function showSignalsInfo() {
  const avail = describeAvailability();
  const ctx = state.context;
  const rows = SIGNAL_META.map((s) => {
    const a = avail[s.key] || { android: '\u2014', ios: '\u2014' };
    const now = ctx ? signalValueText(s.key, ctx) : 'a\u00fan no le\u00eddo en esta sesi\u00f3n';
    const st = ctx ? signalState(s.key, ctx) : 'off';
    const note = ctx && ctx.notes && (ctx.notes[s.key] || (s.key === 'humidity' ? ctx.notes.temp : null));
    return '<div class="card" style="margin-top:10px">' +
      '<div style="display:flex;justify-content:space-between;gap:8px;align-items:center">' +
        '<strong>' + s.icon + ' ' + esc(s.name) + '</strong>' +
        '<span class="sig-state ' + st + '">' + (st === 'ok' ? 'ok' : (st === 'wait' ? '\u2026' : 'no')) + '</span>' +
      '</div>' +
      '<p class="muted" style="margin:8px 0 0;font-size:13px">Ahora: ' + esc(now) + '</p>' +
      (note ? '<p class="muted" style="margin:4px 0 0;font-size:12px">' + esc(note) + '</p>' : '') +
      '<p style="margin:8px 0 0;font-size:12.5px"><b>Android:</b> ' + esc(a.android) +
        ' \u00b7 <b>iPhone:</b> ' + esc(a.ios) + '</p>' +
    '</div>';
  }).join('');

  root().innerHTML =
    '<div class="screen">' +
      '<div class="top-row">' +
        '<button class="icon-btn" id="btnBack" aria-label="Volver">\u2190</button>' +
        '<h2 style="font-size:1.2rem">Se\u00f1ales</h2>' +
        '<span style="width:46px"></span>' +
      '</div>' +
      '<p class="lead" style="margin-top:0">En cada ronda leo el entorno. Si algo falta, el juego sigue igual.</p>' +
      '<div class="card">' +
        '<p style="margin:0;font-size:13.5px;line-height:1.45">La temperatura y la humedad salen de Open-Meteo seg\u00fan tu ubicaci\u00f3n (los m\u00f3viles no tienen term\u00f3metro accesible). En iPhone, pulsa \u201cActivar sensores de movimiento\u201d en el inicio para la posici\u00f3n y la agitaci\u00f3n. La bater\u00eda suele funcionar en Chrome de Android, no en Safari.</p>' +
      '</div>' +
      rows +
      '<p class="tiny">La l\u00f3gica del juego funciona sin conexi\u00f3n; las APIs de clima y mapa no.</p>' +
    '</div>';
  document.getElementById('btnBack').onclick = () => renderHome();
}

function burstConfetti() {
  const c = document.getElementById('confetti');
  if (!c) return;
  const ctx = c.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  c.width = innerWidth * dpr;
  c.height = innerHeight * dpr;
  const colors = ['#a78bfa', '#fbbf24', '#22d3ee', '#f472b6', '#34d399', '#fff'];
  const parts = Array.from({ length: 90 }, () => ({
    x: Math.random() * c.width,
    y: -Math.random() * c.height * 0.2,
    r: 3 * dpr + Math.random() * 5 * dpr,
    vy: 2 * dpr + Math.random() * 6 * dpr,
    vx: (Math.random() - 0.5) * 4 * dpr,
    color: colors[Math.floor(Math.random() * colors.length)],
    rot: Math.random() * 6,
    vr: (Math.random() - 0.5) * 0.3
  }));
  let frames = 0;
  function tick() {
    ctx.clearRect(0, 0, c.width, c.height);
    for (const p of parts) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.08 * dpr;
      p.rot += p.vr;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.r, -p.r / 2, p.r * 2, p.r);
      ctx.restore();
    }
    frames++;
    if (frames < 90) requestAnimationFrame(tick);
    else ctx.clearRect(0, 0, c.width, c.height);
  }
  tick();
}

function registerSW() {
  if (!('serviceWorker' in navigator)) return;
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return;
    refreshing = true;
    location.reload();
  });
  navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' }).then((reg) => {
    const askSkip = () => {
      if (reg.waiting) {
        try { reg.waiting.postMessage({ type: 'SKIP_WAITING' }); } catch (_) {}
      }
    };
    askSkip();
    reg.addEventListener('updatefound', () => {
      const nw = reg.installing;
      if (!nw) return;
      nw.addEventListener('statechange', () => {
        if (nw.state === 'installed' && navigator.serviceWorker.controller) askSkip();
      });
    });
    const check = () => { reg.update().catch(() => {}); };
    check();
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') check();
    });
    window.addEventListener('focus', check);
  }).catch((e) => console.warn('SW', e));
}

function init() {
  store = loadStore();
  startSensorListenersIfPossible();
  registerSW();
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    state.deferredPrompt = e;
  });
  renderHome();
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    phaseOutcome,
    attemptThreshold,
    applyPhaseOutcome,
    uniqueYearDigits,
    rankCandidates,
    discretize,
    positionBucket,
    buildLadder,
    funChallenge,
    rangeChallenge,
    FUN_IDS,
    computeStats,
    moonPhase,
    timeBand,
    speedBand,
    sinceBand,
    shareApp,
    resultShareText,
    SHARE_URL,
    SHARE_TEXT_DEFAULT,
    SHARE_TITLE
  };
}
