# Xanadu — correcciones v3 + propuestas estéticas

## Correcciones aplicadas

### 1. Mobile: navegación duplicada
Se eliminó la duplicación funcional de navegación en mobile.

Antes convivían:
- tabs superiores
- barra inferior
- filtros móviles demasiado presentes

Ahora en mobile queda:
- buscador arriba
- filtros en desplegable
- navegación principal abajo

Esto ordena la pantalla y la centra mejor.

### 2. Mobile: descentrado general
Se rehízo el layout mobile para que:
- use todo el ancho real disponible
- no arrastre paddings de desktop
- no quede “metido” dentro de una caja grande pensada para escritorio
- respete mejor el safe area inferior

### 3. Cards mobile
Las cards en mobile pasan a una composición más compacta:
- portada a la izquierda
- información a la derecha
- tipografía más protagonista
- menos aire muerto

Esto acerca más el resultado al mockup móvil.

### 4. Modal de agregar / editar
Se rehizo como sheet inferior en mobile:
- mejor scroll
- header sticky
- footer sticky con Guardar / Eliminar
- campos apilados en una sola columna

### 5. Imagen: cámara + archivo
Se mantuvieron dos caminos separados:
- Sacar foto
- Elegir archivo

### 6. Fallo al guardar con imagen
Se redujo más agresivamente la imagen antes de guardar:
- long edge más chico
- JPEG más comprimido
- reducción adicional si el dataURL sigue pesado

Esto baja mucho la probabilidad de fallo en localStorage.

### 7. Historial de préstamo
Se corrigió un bug que duplicaba entradas en `loanHistory`.

### 8. Estado vacío
Se mejoró el texto del vacío para que no parezca app rota.

---

## Propuestas estéticas posibles

Estas no son obligatorias. Son el siguiente camino visual recomendable.

### A. Desktop
Desktop ya insinúa algo mejor. El siguiente paso sería profundizarlo con:

#### A1. Portadas con más presencia
- aumentar contraste entre portada y fondo
- dar un marco muy leve tipo cartulina o lomo
- hacer que la cubierta pese más visualmente

#### A2. Jerarquía editorial más fuerte
- título más grande y más oscuro
- subtítulo más tenue
- metadatos más pequeños y serenos

#### A3. Sidebar más “biblioteca”
- bajar el aire de panel técnico
- hacer que parezca una columna de catálogo, no un dashboard
- menos caja, más integración con el soporte de papel

#### A4. Fondo con materialidad más rica
- textura más fina, menos digital
- pequeñas variaciones de tono en papel
- bordes con un leve desgaste o sombreado interior

#### A5. Botón agregar con mejor integración
- menos botón “app genérica”
- más pieza física / ficha / botón de madera o bronce suave

### B. Mobile
Mobile está bastante más verde que desktop. El camino sugerido sería:

#### B1. Header móvil más compacto y noble
- logo/título con más peso
- icono de settings más discreto
- mejor respiración vertical

#### B2. Cards mobile casi como fichas apiladas
- menos aspecto de mini-dashboard
- más objeto editorial / ficha de archivo
- acciones más resumidas

#### B3. Barra inferior más refinada
- iconografía menos ruidosa
- etiquetas más cortas
- activo más elegante

#### B4. Modal más cercano a “cuaderno de ingreso”
- preview más cuidada
- campos con mejor ritmo vertical
- acciones finales más claras

#### B5. Reducir ruido de chips
- en mobile hoy siguen compitiendo bastante
- podrían verse más como filtros discretos, no como controles protagonistas

---

## Recomendación de camino

### Paso 1
Consolidar esta v3 funcional y mobile.

### Paso 2
Hacer una v4 solo visual:
- sin tocar lógica
- solo `theme.css`
- objetivo: unificar desktop y mobile bajo un mismo lenguaje material

### Paso 3
Después recién entrar en refinamiento de:
- tipografía
- portadas
- chips
- barra inferior
- vacío inicial

---

## Archivo tocados en esta v3
- `index.html`
- `app.js`
- `theme.css`

No se modificó la lógica general de persistencia fuera de lo necesario para corregir:
- guardado con imagen
- duplicación de historial
- comportamiento de modal
- organización visual mobile
