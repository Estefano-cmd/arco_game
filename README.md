# El jardín de Cupido 💜

Juego de tiro con arco de fantasía, tres niveles, física de proyectiles, objetivos móviles, partículas, efectos de sonido y recompensa imprimible.

## Ejecución en NestJS

Requiere Node.js 20+.

```bash
npm install
npm run start:dev
```

Abre http://localhost:3000. El backend NestJS sirve los archivos estáticos de `dist/` y expone `GET /api/levels`.

## Controles

- Mantén pulsado el botón izquierdo o un dedo para tensar el arco; arrastra para apuntar y suelta para disparar.
- La trayectoria tiene gravedad. Las flechas son infinitas, pero cada nivel tiene un límite de tiempo.
- Consigue 3, 4 y 5 aciertos respectivamente antes de que termine el reloj.
- El ticket final se puede imprimir o guardar como PDF desde el navegador.

La versión publicada del juego utiliza los mismos archivos del frontend como sitio estático; para ejecutar su API propia se incluye el backend NestJS.
