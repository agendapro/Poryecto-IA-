# 🚀 Guía de Deploy a Vercel - RecruitPro

## 📋 Índice
1. [Preparativos Pre-Deploy](#preparativos-pre-deploy)
2. [Configuración de Supabase](#configuración-de-supabase)
3. [Variables de Entorno](#variables-de-entorno)
4. [Deploy en Vercel](#deploy-en-vercel)
5. [Configuración Post-Deploy](#configuración-post-deploy)
6. [Testing y Verificación](#testing-y-verificación)
7. [Troubleshooting](#troubleshooting)

---

## 🛠️ Preparativos Pre-Deploy

### 1. Verificar el Proyecto Localmente
```bash
# Instalar dependencias
npm install

# Verificar que el build funciona
npm run build

# Probar localmente
npm run dev
```

### 2. Limpiar el Código
- [ ] Eliminar `console.log()` innecesarios
- [ ] Verificar que no hay variables hardcodeadas
- [ ] Confirmar que todas las dependencias están en `package.json`

### 3. Verificar Archivos Esenciales
- [ ] `next.config.mjs` configurado correctamente
- [ ] `package.json` con scripts necesarios
- [ ] `.gitignore` incluye `.env.local`

---

## 🗄️ Configuración de Supabase

### 1. Crear Proyecto de Producción en Supabase

1. Ve a [supabase.com](https://supabase.com)
2. Crear nuevo proyecto (diferente al de desarrollo)
3. Elegir región cercana a tu audiencia
4. Esperar a que se complete la configuración

### 2. Configurar la Base de Datos

#### Opción A: Migrar desde Desarrollo
```bash
# Exportar schema de desarrollo
supabase db dump --data-only > production-data.sql

# Aplicar en producción (configurar primero las credenciales)
supabase db reset --linked
```

#### Opción B: Ejecutar Migraciones Manualmente
En el SQL Editor de Supabase (proyecto de producción):

1. Ejecutar migraciones en orden:
   ```sql
   -- 1. Ejecutar: supabase/migrations/00_initial_schema.sql
   -- 2. Ejecutar: supabase/migrations/01_grant_admin_permissions.sql
   -- 3. Ejecutar: supabase/migrations/02_create_storage_bucket.sql
   -- 4. Ejecutar: supabase/migrations/03_create_notifications_system.sql
   -- 5. Ejecutar: supabase/migrations/04_add_email_notifications.sql
   -- 6. Ejecutar: supabase/migrations/05_add_hired_stage_to_all_processes.sql
   -- 7. Ejecutar: supabase/migrations/06_add_delete_policies.sql
   -- 8. Ejecutar: supabase/migrations/07_fix_user_management_function.sql
   ```

### 3. Configurar Storage
En Supabase Dashboard > Storage:
- Verificar que el bucket `cvs` existe
- Confirmar políticas de acceso

### 4. Configurar Authentication
En Supabase Dashboard > Authentication:
- Configurar providers (email/password)
- Ajustar URLs de redirect para producción

---

## 🔐 Variables de Entorno

### 1. Obtener Credenciales de Producción
En Supabase Dashboard > Settings > API:
- `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
- `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 2. Configurar Variables en Vercel
Durante el deploy o en Vercel Dashboard > Project > Settings > Environment Variables:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

⚠️ **Importante**: No incluir variables de development

---

## 🌐 Deploy en Vercel

### Método 1: Deploy desde GitHub (Recomendado)

#### 1. Subir Código a GitHub
```bash
# Si no tienes repo
git init
git add .
git commit -m "Initial commit for production"
git branch -M main
git remote add origin https://github.com/tu-usuario/recruitment-platform.git
git push -u origin main

# Si ya tienes repo
git add .
git commit -m "Ready for production deploy"
git push origin main
```

#### 2. Conectar con Vercel
1. Ve a [vercel.com](https://vercel.com)
2. Sign up/Login con GitHub
3. Click "New Project"
4. Importar tu repositorio
5. Configurar:
   - **Framework Preset**: Next.js
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)
   - **Install Command**: `npm install` (default)

#### 3. Configurar Variables de Entorno
En el paso de configuración del proyecto:
- Agregar `NEXT_PUBLIC_SUPABASE_URL`
- Agregar `NEXT_PUBLIC_SUPABASE_ANON_KEY`

#### 4. Deploy
- Click "Deploy"
- Esperar a que termine (2-5 minutos)

### Método 2: Deploy con Vercel CLI

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Seguir prompts:
# - Set up and deploy? Y
# - Which scope? (tu cuenta)
# - Link to existing project? N
# - Project name: recruitment-platform
# - Directory: ./
# - Want to override settings? N

# Para deploy de producción
vercel --prod
```

---

## ⚙️ Configuración Post-Deploy

### 1. Configurar Dominio Personalizado (Opcional)
En Vercel Dashboard > Project > Settings > Domains:
- Agregar dominio personalizado
- Configurar DNS según instrucciones

### 2. Configurar Redirects en Supabase
En Supabase Dashboard > Authentication > URL Configuration:
- **Site URL**: `https://tu-app.vercel.app`
- **Redirect URLs**: 
  - `https://tu-app.vercel.app/**`
  - `https://tu-app.vercel.app/auth/callback`

### 3. Crear Usuario Administrador
1. Acceder a la app en producción
2. Registrar primer usuario
3. En Supabase Dashboard > Authentication > Users:
   - Encontrar el usuario
   - En Database > public > profiles:
   - Cambiar `role` a `'Administrador'`

---

## 🧪 Testing y Verificación

### Lista de Verificación Post-Deploy

#### Funcionalidades Básicas
- [ ] Login/Logout funciona
- [ ] Dashboard carga correctamente
- [ ] Crear proceso funciona
- [ ] Agregar candidatos funciona
- [ ] Drag & drop de etapas funciona
- [ ] Subida de CV funciona
- [ ] Notificaciones funcionan

#### Funcionalidades Avanzadas
- [ ] "Candidatos cerca de ti" funciona
- [ ] Navegación contextual funciona
- [ ] Menú desplegable de candidatos funciona
- [ ] Filtros del dashboard funcionan
- [ ] Real-time updates funcionan

#### Performance
- [ ] Página carga en <3 segundos
- [ ] Imágenes cargan correctamente
- [ ] No hay errores en consola
- [ ] Mobile responsive funciona

---

## 🚨 Troubleshooting

### Errores Comunes

#### 1. "Module not found" durante build
```bash
# Verificar que todas las dependencias estén instaladas
npm install

# Verificar package.json
npm run build
```

#### 2. Supabase connection errors
- Verificar variables de entorno en Vercel
- Confirmar que URLs no tengan espacios
- Verificar que proyecto de Supabase esté activo

#### 3. "Hydration failed" errors
- Verificar que no hay diferencias entre server y client
- Revisar componentes con `useEffect` o `useState`

#### 4. Authentication redirect loops
- Verificar URLs en Supabase Auth settings
- Confirmar middleware.ts configuración

#### 5. Upload/Storage errors
- Verificar políticas RLS en Supabase Storage
- Confirmar que bucket `cvs` existe
- Verificar permisos de escritura

### Logs y Debugging

#### Ver logs en Vercel:
1. Vercel Dashboard > Project > Functions
2. Hacer click en cualquier función
3. Ver logs en tiempo real

#### Ver logs en Supabase:
1. Supabase Dashboard > Logs
2. Filtrar por tipo de error

---

## 📞 Recursos Adicionales

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Supabase Docs](https://supabase.com/docs)

---

## ✅ Checklist Final

- [ ] Proyecto funciona localmente
- [ ] Código subido a GitHub
- [ ] Supabase producción configurado
- [ ] Variables de entorno configuradas
- [ ] Deploy exitoso en Vercel
- [ ] Todas las funcionalidades verificadas
- [ ] Usuario administrador creado
- [ ] Performance aceptable

---

**¡Tu RecruitPro está listo para producción! 🎉**

*Última actualización: Enero 2025*
