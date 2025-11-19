# Deployment Guide

## Netlify Deployment

### Requisitos Previos

- Cuenta en Netlify
- Repositorio Git del proyecto
- Node.js 18+ instalado localmente

### Configuración Inicial

1. **Conectar Repositorio**

```bash
# Desde Netlify Dashboard
1. New site from Git
2. Seleccionar GitHub/GitLab/Bitbucket
3. Elegir repositorio gesture-uci-system
4. Configurar build settings
```

2. **Build Settings**

```
Base directory: frontend
Build command: npm run build
Publish directory: frontend/dist
```

3. **Environment Variables**

No se requieren variables de entorno para la configuración básica.

### Deploy Manual

```bash
# Instalar Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy desde directorio frontend
cd frontend
npm run build
netlify deploy --prod --dir=dist
```

### Configuración netlify.toml

El archivo `frontend/netlify.toml` ya está configurado:

```toml
[build]
  command = "npm run build"
  publish = "frontend/dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[build.environment]
  NODE_VERSION = "18"
```

### Build Optimization

#### 1. Análisis de Bundle

```bash
# Instalar analizador
npm install -D rollup-plugin-visualizer

# Modificar vite.config.ts
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    visualizer({ open: true })
  ]
});

# Ejecutar build
npm run build
```

#### 2. Code Splitting

Vite automáticamente hace code splitting. Para optimizar más:

```typescript
// Lazy loading de componentes
const GraphVisualization = lazy(() => import('./components/Analytics/GraphVisualization'));

// Usar con Suspense
<Suspense fallback={<Loading />}>
  <GraphVisualization />
</Suspense>
```

#### 3. Asset Optimization

```bash
# Comprimir imágenes
npm install -D vite-plugin-compression

# vite.config.ts
import compression from 'vite-plugin-compression';

export default defineConfig({
  plugins: [
    react(),
    compression({ algorithm: 'gzip' })
  ]
});
```

### Performance Optimization

#### Headers Configuration

Crear `frontend/public/_headers`:

```
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin

/assets/*
  Cache-Control: public, max-age=31536000, immutable

/*.wasm
  Content-Type: application/wasm
  Cache-Control: public, max-age=31536000, immutable
```

#### Redirects para SPA

Ya configurado en `netlify.toml`, pero alternativamente en `_redirects`:

```
/*    /index.html   200
```

### Custom Domain

1. **Agregar Dominio Personalizado**

```
Netlify Dashboard → Domain settings → Add custom domain
```

2. **Configurar DNS**

```
Type: A
Name: @
Value: 75.2.60.5 (IP de Netlify)

Type: CNAME
Name: www
Value: [your-site].netlify.app
```

3. **SSL/TLS**

Netlify proporciona SSL automático vía Let's Encrypt.

### CI/CD Configuration

#### GitHub Actions

Crear `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Netlify

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        working-directory: ./frontend
        run: npm ci

      - name: Build
        working-directory: ./frontend
        run: npm run build

      - name: Deploy to Netlify
        uses: netlify/actions/cli@master
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
        with:
          args: deploy --prod --dir=frontend/dist
```

### Monitoring

#### 1. Analytics

```toml
# netlify.toml
[[plugins]]
  package = "@netlify/plugin-nextjs"

[build.processing.css]
  bundle = true
  minify = true

[build.processing.js]
  bundle = true
  minify = true
```

#### 2. Error Tracking

Integrar Sentry:

```typescript
// src/main.tsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "YOUR_SENTRY_DSN",
  integrations: [new Sentry.BrowserTracing()],
  tracesSampleRate: 1.0,
});
```

### Troubleshooting

#### Build Failures

```bash
# Verificar localmente
npm run build

# Limpiar cache
rm -rf node_modules package-lock.json
npm install
npm run build

# Verificar versión de Node
node --version  # Debe ser 18+
```

#### MediaPipe Issues

```typescript
// Verificar que MediaPipe se cargue desde CDN
import { FilesetResolver } from '@mediapipe/tasks-vision';

const vision = await FilesetResolver.forVisionTasks(
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
);
```

#### Performance Issues

```bash
# Analizar bundle size
npm run build -- --mode production

# Verificar que tree-shaking funcione
# Evitar import * from 'library'
# Usar import { specific } from 'library'
```

### Rollback

```bash
# Listar deploys
netlify deploy:list

# Rollback a deploy anterior
netlify deploy:rollback [deploy-id]
```

### Environment-Specific Builds

```bash
# Development
npm run dev

# Preview (pre-production)
netlify deploy --dir=dist

# Production
netlify deploy --prod --dir=dist
```

### Best Practices

1. **Branch Deploys**: Activar en Netlify para preview de PRs
2. **Deploy Previews**: Revisar antes de merge a main
3. **Lighthouse CI**: Integrar auditorías de performance
4. **Bundle Analysis**: Revisar regularmente tamaño de bundle
5. **Dependency Updates**: Mantener dependencias actualizadas

### Security Checklist

- [ ] HTTPS habilitado
- [ ] Security headers configurados
- [ ] Dependencies sin vulnerabilidades conocidas
- [ ] Camera permissions manejados correctamente
- [ ] No credentials en código
- [ ] CSP headers configurados (opcional)

### Resources

- [Netlify Documentation](https://docs.netlify.com/)
- [Vite Production Build](https://vitejs.dev/guide/build.html)
- [React Production Checklist](https://react.dev/learn/react-compiler)
