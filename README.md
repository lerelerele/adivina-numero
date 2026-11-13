# Oráculo — Adivino tu número

App web instalable (PWA) que intenta adivinar el número en el que estás pensando, usando señales del entorno (ubicación, hora, clima, batería, posición del móvil…) y aprendiendo de tus respuestas.

Interfaz en español. Todo el historial se guarda en el propio móvil (`localStorage`). No hay cuenta ni servidor propio.

## Cómo jugar

1. Abre la página en el móvil (hace falta **HTTPS** para los sensores) y, si quieres, añádela a la pantalla de inicio.
2. En iPhone, pulsa **Activar sensores de movimiento** para la orientación y la agitación.
3. Piensa en un número. El oráculo propone uno; tú dices **Sí** o **No**. Sigue hasta acertar, sin repetir.
4. **Fases:**
   - Solo sube de fase si acierta **a la primera**.
   - Si acierta después, pero en como máximo la mitad de los intentos posibles (`ceil(opciones/2)`), **repite la misma fase**.
   - Si tarda más, **baja a la fase anterior** (nunca por debajo de la 1).

La escalera empieza por del 1 al 2, del 1 al 3 y del 1 al 4, y luego alterna pruebas divertidas (dígitos del año, primos, osos, dados, meses…) con rangos que van creciendo.

## Señales

En cada ronda se muestran las que están disponibles. Si alguna falta, el juego sigue.

| Señal | Android | iPhone |
|---|---|---|
| Ubicación, ciudad, país | Sí, con permiso | Sí, con permiso |
| Lugar cercano (hospital, escuela, parque…) | Sí, vía Overpass | Sí, vía Overpass |
| Día, hora, fase lunar, tema claro/oscuro | Sí | Sí |
| Temperatura y humedad | Open-Meteo (no hay sensor de temperatura en el teléfono) | Igual |
| Batería y carga | Sí, en Chrome | No (Safari no lo expone) |
| Posición (plano, vertical, horizontal…) | Sí | Sí, con el botón de permiso |
| Velocidad (GPS) | Sí, si hay ubicación | Sí, si hay ubicación |
| Movimiento / agitación | Sí | Sí, con el botón de permiso |
| Tipo de red | Sí, en Chrome | Normalmente no |
| Luz ambiental | Casi nunca (API experimental) | No |

## Aprendizaje

Un modelo ligero (priors de posición y números favoritos, Naive Bayes sobre el contexto y un k-NN ponderado) ordena las opciones. Verás una explicación *Por qué creo que es X* y una pantalla de estadísticas (acierto a la primera frente al azar, señales que más influyen). Puedes exportar o borrar los datos.

Funciona sin conexión para la lógica del juego (service worker). El clima y el mapa necesitan red.

## Desarrollo

Sitio estático: `index.html`, `styles.css`, `app.js`. Sin paso de compilación.

```bash
node --check app.js
node test-model.js
```
