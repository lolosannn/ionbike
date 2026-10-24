# Guion de locución — "Cómo elegir el talle de tu bici"

Video de 1:36 (96 s). Cada bloque arranca en el tiempo indicado y tiene que entrar en su duración:
las animaciones están sincronizadas con estas frases.

**Para ElevenLabs**
- Voz: masculina o femenina, cercana y con energía, acento rioplatense (español de Argentina).
- Velocidad normal (1.0). Si un bloque queda largo, subila a 1.05–1.1 antes de recortar texto.
- Los números y siglas ya están escritos como se dicen ("eme", "trescientos veintiocho"), así no los lee raro.
- Generá **un audio por bloque** (es más fácil acomodarlos) o todo junto dejando las pausas marcadas con `<break time="…" />`.

---

### 1 · Intro — 0:00 (6 s)
¿No sabés qué talle de bici elegir? Tranqui: en un par de minutos lo resolvés.

### 2 · Qué necesitás — 0:06 (8,5 s)
Antes de empezar, vas a necesitar: una cinta métrica… un libro… y una pared lisa con un lápiz. Ah, y medite descalzo.

### 3 · Paso 1, altura — 0:14,5 (15 s)
Paso uno: medí tu altura. Parate descalzo, de espaldas a la pared, con los talones, la espalda y la cabeza bien apoyados. Apoyá un libro arriba de la cabeza, marcá la pared… y medí desde el piso hasta la marca.

### 4 · Paso 2, entrepierna — 0:29,5 (15 s)
Paso dos: medí tu entrepierna. Con los pies separados unos quince centímetros, subí el libro entre las piernas, firme, como si fuera el asiento. Marcá el borde de arriba en la pared… y medí desde el piso.

### 5 · Paso 3, tipo de bici — 0:44,5 (9,5 s)
Paso tres: elegí el tipo de bici. Las mountain bike se miden en pulgadas; las de ruta y gravel, en centímetros; y las infantiles, por rodado.

### 6 · Paso 4, tabla — 0:54 (12 s)
Paso cuatro: buscá tu talle. Por ejemplo: si medís un metro setenta y cinco y querés una mountain bike… tu talle es eme: un cuadro de diecisiete a dieciocho pulgadas.

### 7 · Comprobalo — 1:06 (11 s)
Y para confirmar, parate sobre la bici. Con los pies en el piso, entre el caño superior y tu entrepierna tiene que quedar un espacio de cinco a diez centímetros.

### 8 · Entre dos talles — 1:17 (10 s)
¿Quedaste entre dos talles? El más chico es más ágil; el más grande, más estable. Cada marca tiene su medida: consultanos por el modelo que te gusta.

### 9 · Cierre — 1:27 (9 s)
¿Te quedó alguna duda? Escribinos por WhatsApp o vení a probarla al local, en Avenida Fair trescientos veintiocho, Monte Grande. ¡Te esperamos en Ion Bike Store!

---

## Cómo sumar la voz al video

1. Exportá la locución completa (un solo archivo, con los bloques en sus tiempos) como `video/guia-de-talles/voz.mp3`.
   Si generaste un audio por bloque, juntalos en cualquier editor respetando los tiempos de arriba.
2. Corré `node video/guia-de-talles/render.mjs`: si encuentra `voz.mp3` (o `voz.wav`) la mete en el video.
3. Si una frase no entra, se puede estirar la escena: las duraciones están en `scenes` dentro de `index.html`.
