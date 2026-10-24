# Guion de locución — "Cómo elegir el talle de tu bici"

Video de 1:35. La locución grabada está en `voz.mp3` (ElevenLabs, voz "Juanma – Deep Cinematic Argentina")
y las animaciones están sincronizadas con ella. Los tiempos de cada bloque son los de esa grabación.

**Para ElevenLabs**
- Voz: masculina o femenina, cercana y con energía, acento rioplatense (español de Argentina).
- Velocidad normal (1.0). Si un bloque queda largo, subila a 1.05–1.1 antes de recortar texto.
- Los números y siglas ya están escritos como se dicen ("eme", "trescientos veintiocho"), así no los lee raro.
- Generá **un audio por bloque** (es más fácil acomodarlos) o todo junto dejando las pausas marcadas con `<break time="…" />`.

---

### 1 · Intro — 0:00
¿No sabés qué talle de bici elegir? Tranqui: en un par de minutos lo resolvés.

### 2 · Qué necesitás — 0:05
Antes de empezar, vas a necesitar: una cinta métrica… un libro… y una pared lisa con un lápiz. Ah, y medite descalzo.

### 3 · Paso 1, altura — 0:14
Paso uno: medí tu altura. Parate descalzo, de espaldas a la pared, con los talones, la espalda y la cabeza bien apoyados. Apoyá un libro arriba de la cabeza, marcá la pared… y medí desde el piso hasta la marca.

### 4 · Paso 2, entrepierna — 0:29
Paso dos: medí tu entrepierna. Con los pies separados unos quince centímetros, subí el libro entre las piernas, firme, como si fuera el asiento. Marcá el borde de arriba en la pared… y medí desde el piso.

### 5 · Paso 3, tipo de bici — 0:43
Paso tres: elegí el tipo de bici. Las mountain bike se miden en pulgadas; las de ruta y gravel, en centímetros; y las infantiles, por rodado.

### 6 · Paso 4, tabla — 0:53
Paso cuatro: buscá tu talle. Por ejemplo: si medís un metro setenta y cinco y querés una mountain bike… tu talle es eme: un cuadro de diecisiete a dieciocho pulgadas.

### 7 · Comprobalo — 1:04
Y para confirmar, parate sobre la bici. Con los pies en el piso, entre el caño superior y tu entrepierna tiene que quedar un espacio de cinco a diez centímetros.

### 8 · Entre dos talles — 1:14
¿Quedaste entre dos talles? El más chico es más ágil; el más grande, más estable. Cada marca tiene su medida: consultanos por el modelo que te gusta.

### 9 · Cierre — 1:23
¿Te quedó alguna duda? Escribinos por WhatsApp o vení a probarla al local, en Avenida Fair trescientos veintiocho, Monte Grande. ¡Te esperamos en Ion Bike Store!

---

## Cómo sumar la voz al video

1. La locución va en `video/guia-de-talles/voz.mp3` (un solo archivo, arrancando en 0:00).
2. Corré `node video/guia-de-talles/render.mjs`: si encuentra `voz.mp3` (o `voz.wav`) la mete en el video.
3. Si se graba una locución nueva con otros tiempos, hay que reajustar las duraciones de `scenes` y las marcas
   de cada escena en `index.html` para que cada escena arranque cuando empieza su bloque.
