# Control de Tráfico — Proyecto 1

Proyecto para la clase de **Taller de Computación**. La idea es crear una aplicación interactiva tipo juego en la que el jugador controla los semáforos de una intersección durante la hora pico.

## Objetivo del juego

El jugador debe controlar los semáforos para permitir que los vehículos atraviesen la intersección sin generar demasiada congestión.

- El juego tendrá **2 niveles**.
- Los vehículos llegarán desde diferentes direcciones.
- El jugador podrá cambiar los semáforos.
- Los vehículos se detendrán cuando tengan luz roja y avanzarán cuando tengan luz verde.
- La congestión aumentará cuando se acumulen vehículos.
- Si la congestión llega al **100 %**, el jugador pierde.
- Si mantiene el tráfico bajo control durante el tiempo establecido, completa el nivel.

## Desarrollo por etapas

### Etapa 1 — Planificación y diseño

Definir el funcionamiento general antes de programar.

- Objetivo: controlar el tráfico durante hora pico.
- Definir los 2 niveles.
- Condición de victoria: sobrevivir cierto tiempo sin alcanzar el máximo de congestión.
- Condición de derrota: congestión al 100 %.
- Control principal: cambiar los semáforos.
- Diseñar calles, carros, semáforos y panel de información.

**Resultado:** diseño completo del juego.

### Etapa 2 — Interfaz básica

Construir la pantalla principal del juego.

La interfaz mostrará:

- Intersección.
- Calles.
- Semáforos.
- Tiempo restante.
- Nivel actual.
- Medidor de congestión.
- Botón para cambiar los semáforos.

En esta etapa todavía no habrá vehículos en movimiento.

**Resultado:** primera versión visual del juego.

### Etapa 3 — Sistema de semáforos

Implementar el funcionamiento de los semáforos.

**Estado A**
- Verde para la calle horizontal.
- Rojo para la calle vertical.

**Estado B**
- Rojo para la calle horizontal.
- Verde para la calle vertical.

Las dos direcciones nunca podrán estar en verde al mismo tiempo.

**Resultado:** primera interacción jugable.

### Etapa 4 — Sistema de vehículos

Agregar vehículos que aparezcan automáticamente.

Los vehículos deberán:

- Aparecer desde diferentes direcciones.
- Avanzar hacia la intersección.
- Detenerse cuando el semáforo esté en rojo.
- Continuar cuando cambie a verde.
- Desaparecer después de cruzar la intersección.

**Resultado:** primera demo funcional del juego.

## Demo inicial

La primera versión que se buscará tener funcionando incluirá las **Etapas 1 a 4**. En este punto ya será posible ver los vehículos llegar a la intersección, detenerse y reaccionar a los semáforos controlados por el jugador.

### Etapa 5 — Congestión y puntuación

Agregar consecuencias a las decisiones del jugador.

- Los vehículos esperando aumentarán el nivel de congestión.
- Cada vehículo que consiga cruzar dará puntos.
- Ejemplo: **+10 puntos por vehículo**.
- Si la congestión llega al **100 %**, aparecerá **GAME OVER**.

**Resultado:** el juego tendrá un objetivo, puntuación y condición de derrota.

### Etapa 6 — Los 2 niveles

#### Nivel 1 — Tráfico normal

- Pocos vehículos.
- Los vehículos aparecen lentamente.
- Duración aproximada: **45 segundos**.
- Sirve para aprender las mecánicas.

#### Nivel 2 — Hora pico

- Mayor cantidad de vehículos.
- Los vehículos aparecen con mayor frecuencia.
- Duración aproximada: **60 segundos**.
- Mayor dificultad para controlar la congestión.

Al completar un nivel se mostrará información como:

- Puntuación obtenida.
- Congestión máxima alcanzada.
- Botón para continuar al siguiente nivel.

**Resultado:** juego completo con progresión.

### Etapa 7 — Pulido final

Agregar detalles para que el proyecto tenga una presentación final más completa.

- Menú inicial.
- Botón **Jugar**.
- Selector o indicador de nivel.
- Mejores gráficos para calles, carros y semáforos.
- Animaciones.
- Sonidos opcionales.
- Pantalla de victoria.
- Pantalla de derrota.
- Botón **Reintentar**.
- Instrucciones breves de cómo jugar.

## Flujo final

```text
Menú → Nivel 1 → Victoria → Nivel 2 → Resultado final
```

## Orden de desarrollo

La prioridad será desarrollar primero hasta la **Etapa 4** para obtener una demo funcional lo antes posible. Después se agregarán el sistema de congestión, la puntuación, los niveles y finalmente los detalles visuales.


---

## Estado actual del proyecto

✅ **Etapa 1:** planificación y diseño  
✅ **Etapa 2:** interfaz básica  
✅ **Etapa 3:** sistema de semáforos  
✅ **Etapa 4:** vehículos y movimiento  
✅ **Etapa 5:** congestión y puntuación  
✅ **Etapa 6:** dos niveles y cronómetro  
✅ **Etapa 7:** menú, instrucciones, pantallas de resultado, animaciones y pulido final

El juego ya cuenta con una versión funcional completa.

## Archivos principales

- `index.html`: estructura de las pantallas y de la intersección.
- `style.css`: diseño visual, calles, carros, semáforos, interfaz y animaciones.
- `script.js`: lógica de semáforos, vehículos, congestión, puntuación, niveles y temporizador.

## Controles

- **Botón CAMBIAR SEMÁFOROS:** alterna entre la vía horizontal y vertical.
- **Barra espaciadora:** hace el mismo cambio desde el teclado.
- **Menú:** permite abandonar la partida y volver a la pantalla principal.

## Cómo probarlo

La aplicación no necesita instalar librerías ni dependencias. Puede abrirse directamente con `index.html` o publicarse mediante **GitHub Pages** desde la rama `main`.
