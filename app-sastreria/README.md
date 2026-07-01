# Sastrería Andrés Chimunja — Frontend

Angular 18 (standalone components + Angular Material).

## Requisitos

- Node.js 18+
- Angular CLI (`npm i -g @angular/cli`)

## Desarrollo local

```bash
npm install
npm start   # ng serve → http://localhost:4200, usa src/environments/environment.ts (apiUrl: localhost:3000)
```

## Variables de entorno (Angular environments)

| Archivo | Uso | apiUrl |
|---|---|---|
| `src/environments/environment.ts` | Desarrollo (`ng serve`, `ng build` sin flag) | `http://localhost:3000` |
| `src/environments/environment.prod.ts` | Producción (`ng build --configuration production`) | Debe apuntar al dominio/IP real del backend en el VPS |

Antes de desplegar, reemplazar `apiUrl` en `environment.prod.ts` con la URL real del backend (ej. `https://api.sastreriaandreschimunja.com` o `http://IP_DEL_VPS:3000`).

## Build de producción

```bash
ng build --configuration production
```

Genera los archivos estáticos en `dist/app-sastreria/browser/`.

## Despliegue en VPS (servido con Nginx)

1. Compilar: `ng build --configuration production`.
2. Copiar el contenido de `dist/app-sastreria/browser/` al servidor (ej. `/var/www/sastreria-frontend`).
3. Configurar Nginx para servir la SPA (todas las rutas no encontradas deben caer en `index.html`, ya que el ruteo lo maneja Angular):

   ```nginx
   server {
       listen 80;
       server_name sastreriaandreschimunja.com;

       root /var/www/sastreria-frontend;
       index index.html;

       location / {
           try_files $uri $uri/ /index.html;
       }
   }
   ```

4. Recargar Nginx: `sudo systemctl reload nginx`.

### Actualizar el frontend tras un cambio de código

```bash
git pull
npm install
ng build --configuration production
# copiar dist/app-sastreria/browser/ al servidor y recargar Nginx
```

## Scripts

| Script | Uso |
|---|---|
| `npm start` | Servidor de desarrollo (`ng serve`). |
| `npm run build` | Build (usa configuración `production` por defecto). |
| `npm run watch` | Build en modo desarrollo con recompilación automática. |
| `npm test` | Corre las pruebas unitarias (Karma/Jasmine). |
