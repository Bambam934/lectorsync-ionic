# LectorSync con Docker

Esta guía permite que **cualquier integrante del equipo levante el proyecto sin instalar Node, npm ni Ionic CLI** en su máquina. Solo necesitan Docker Desktop.

## Requisitos

- Docker Desktop (Windows, macOS o Linux): https://www.docker.com/products/docker-desktop/
- Git

## Primer arranque

```bash
git clone <url-del-repositorio>
cd lectorsync-ionic
docker compose up --build
```

La primera vez tarda 3-5 min mientras descarga la imagen base de Node y compila el contenedor. Después abre la app en:

> http://localhost:8100

## Arranques siguientes

```bash
docker compose up
```

(Sin `--build`, levanta en segundos.)

## Detener

```bash
docker compose down
```

## Hot reload

El código fuente está montado como volumen, así que cualquier cambio en `src/` se refleja en vivo sin reconstruir la imagen. El polling para detección de cambios ya está habilitado para que funcione en Windows y macOS.

## Cuándo hay que reconstruir (`--build`)

Solo necesitas `docker compose up --build` si:

- Cambia `package.json` (alguien instaló una dependencia)
- Cambia `Dockerfile.dev`
- Cambia `angular.json` (afecta configuración de assets)

## Instalar una dependencia nueva

Hay dos opciones:

**A) Desde el host (recomendado si tienes Node localmente):**

```bash
npm install <paquete>
docker compose up --build
```

**B) Desde dentro del contenedor (no requiere Node local):**

```bash
docker compose exec lectorsync npm install <paquete>
```

En ambos casos, **commitea `package.json` y `package-lock.json`** para que el resto del equipo reciba el cambio.

## Flujo de trabajo en equipo

1. `git pull` antes de empezar
2. Si `package.json` cambió → `docker compose up --build`
3. Si no → `docker compose up`
4. Trabajar normalmente, ver cambios en `http://localhost:8100`
5. `git commit` y `git push` al terminar

## Solución de problemas

**El puerto 8100 está ocupado:**
Edita `docker-compose.yml` y cambia `"8100:8100"` por `"8101:8100"`, accede en `http://localhost:8101`.

**Los cambios no se reflejan en el navegador:**
Verifica que `CHOKIDAR_USEPOLLING=true` esté en el `docker-compose.yml`. Si sigue fallando, prueba `docker compose restart`.

**El contenedor no encuentra `node_modules`:**
Reconstruye limpio: `docker compose down -v && docker compose up --build`.

**Quiero entrar a la shell del contenedor:**

```bash
docker compose exec lectorsync sh
```
