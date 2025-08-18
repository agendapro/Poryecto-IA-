# Product Requirements Document (PRD)
## RecruitPro - Plataforma de Gestión de Reclutamiento

### Versión: 2.0
### Fecha: Enero 2025

---

## 1. Visión General del Producto

**RecruitPro** es una plataforma integral de gestión de procesos de reclutamiento que permite a las empresas organizar, seguir y optimizar sus procesos de contratación de manera eficiente y colaborativa.

### 1.1 Objetivos del Producto
- Centralizar la gestión de procesos de reclutamiento
- Facilitar la colaboración entre equipos de RRHH
- Proporcionar visibilidad completa del pipeline de candidatos
- Automatizar el seguimiento de interacciones y movimientos
- Mejorar la experiencia tanto para reclutadores como para candidatos

### 1.2 Usuarios Objetivo
- **Administradores**: Gestión completa del sistema y usuarios
- **Reclutadores**: Gestión diaria de procesos y candidatos
- **Managers**: Supervisión y toma de decisiones
- **Colaboradores**: Participación en procesos específicos

---

## 2. Funcionalidades Principales

### 2.1 Gestión de Procesos de Reclutamiento

#### 2.1.1 Creación de Procesos
- **Formulario de creación** con campos:
  - Título del puesto
  - Descripción detallada
  - Rango salarial (mínimo y máximo)
  - Manager asignado
  - Configuración de etapas personalizables
- **Etapas predefinidas**: Aplicación, Revisión CV, Entrevista Técnica, Entrevista Final, Oferta, Contratado
- **Estados del proceso**: Activo, Pausado, Cerrado

#### 2.1.2 Vista Kanban de Procesos
- **Pipeline visual** con columnas por etapa
- **Drag & drop** para mover candidatos entre etapas
- **Contadores** de candidatos por etapa
- **Botones de acción rápida** para agregar candidatos por etapa
- **Indicador visual de inactividad**: Muestra una insignia en la esquina superior derecha de la tarjeta si un candidato permanece más de 30 días en la misma etapa. Un tooltip detalla los días de inactividad.
- **Sección de rechazados** desplegable en la parte inferior

### 2.2 Gestión de Candidatos

#### 2.2.1 Registro de Candidatos
- **Formulario de alta** con campos:
  - Información personal (nombre, email, teléfono, ubicación)
  - Origen del candidato (LinkedIn, Indeed, Web, Referido, etc.)
  - Carga de CV (archivos PDF)
- **Asignación automática** a etapa específica desde el Kanban
- **Generación automática** de ID único

#### 2.2.2 Vista Detalle de Candidato
- **Layout organizado** en tres secciones:
  - Información Personal (columna izquierda superior)
  - Documentos (columna derecha superior)
  - Comentarios (ancho completo inferior)

#### 2.2.3 Sistema de Comentarios Estilo Basecamp
- **Comentarios conversacionales** con avatares y timestamps
- **Registro automático** de movimientos entre etapas
- **Menciones** a otros usuarios
- **Historial completo** de interacciones
- **Formulario de comentarios** integrado

#### 2.2.4 Gestión de Documentos
- **Área de drag & drop** para subir archivos
- **Visualización** de documentos con metadatos
- **Descarga** de archivos adjuntos
- **Soporte** para múltiples formatos (PDF prioritario)

### 2.3 Movimiento de Candidatos

#### 2.3.1 Botón "Mover a Siguiente Etapa"
- **Identificación automática** de la siguiente etapa
- **Actualización** del estado del candidato
- **Registro automático** en timeline de comentarios
- **Deshabilitación** cuando el proceso está completo

#### 2.3.2 Drag & Drop en Kanban
- **Arrastrar y soltar** candidatos entre columnas
- **Actualización en tiempo real** sin recargar página
- **Sincronización** con vista detalle de candidato
- **Registro automático** de movimientos en comentarios

#### 2.3.3 Rechazo de Candidatos
- **Botón "Rechazado"** en vista de candidato
- **Modal de confirmación** con campo para motivo
- **Movimiento automático** a sección de rechazados
- **Registro** en timeline con motivo del rechazo

### 2.4 Gestión de Usuarios y Roles

#### 2.4.1 Sistema de Autenticación
- **Login** con email y contraseña
- **Registro** con selección de rol
- **Sesión persistente** con datos de usuario

#### 2.4.2 Roles y Permisos
- **Administrador**: Acceso completo, gestión de usuarios
- **Reclutador**: Gestión de procesos y candidatos
- **Manager**: Supervisión de procesos asignados
- **Colaborador**: Participación limitada en procesos

#### 2.4.3 Configuración de Usuarios (Solo Administradores)
- **Página de configuraciones** dedicada
- **Formulario de creación** de usuarios
- **Gestión de usuarios existentes** (activar/desactivar/eliminar)
- **Asignación de roles** y permisos

---

## 3. Interfaz de Usuario y Experiencia

### 3.1 Diseño Visual
- **Paleta de colores**: Gradientes púrpura como color primario, fondos claros
- **Tipografía**: Inter para mejor legibilidad y apariencia moderna
- **Modo único**: Solo modo claro (modo oscuro removido por preferencia del usuario)
- **Componentes**: Cards con sombras suaves, botones redondeados

### 3.2 Navegación
- **Header simplificado**: Solo logo "RecruitPro" sin navegación adicional
- **Navegación contextual**: Botones de acción en cada vista
- **Breadcrumbs**: "Volver al proceso" en vistas de candidato

### 3.3 Interacciones
- **Efectos hover**: En tarjetas clickeables y botones
- **Transiciones suaves**: Para cambios de estado
- **Feedback visual**: Confirmaciones, estados de carga e indicadores de estado (ej. inactividad de candidato).
- **Responsive**: Adaptable a diferentes tamaños de pantalla

---

## 4. Flujos de Usuario Principales

### 4.1 Flujo de Creación de Proceso
1. Usuario hace clic en "Nuevo Proceso" desde dashboard
2. Completa formulario con información del puesto
3. Configura etapas del proceso (opcional, usa predefinidas)
4. Guarda y es redirigido al dashboard
5. Nuevo proceso aparece en lista de procesos

### 4.2 Flujo de Gestión de Candidatos
1. Usuario accede a proceso desde dashboard
2. Ve vista Kanban con etapas y candidatos
3. Puede agregar candidato desde cualquier etapa
4. Mueve candidatos entre etapas con drag & drop o botones
5. Accede a vista detalle para más información y comentarios

### 4.3 Flujo de Seguimiento de Candidato
1. Usuario accede a vista detalle de candidato
2. Ve información personal, documentos y comentarios
3. Puede agregar comentarios y subir documentos
4. Mueve candidato a siguiente etapa o lo rechaza
5. Todos los movimientos se registran automáticamente

---

## 5. Especificaciones Técnicas

### 5.1 Arquitectura
- **Frontend**: Next.js 15 con App Router
- **Styling**: Tailwind CSS v4
- **Componentes**: shadcn/ui
- **Estado**: React Context API para gestión global
- **Tipado**: TypeScript para type safety

### 5.2 Estructura de Datos

#### 5.2.1 Proceso
\`\`\`typescript
interface Process {
  id: string
  title: string
  description: string
  manager: string
  salaryRange: string
  status: 'active' | 'paused' | 'closed'
  stages: Stage[]
  createdAt: string
}
\`\`\`

#### 5.2.2 Candidato
\`\`\`typescript
interface Candidate {
  id: string
  name: string
  email: string
  phone: string
  location: string
  origen: string
  cv?: File
  processId: string
  stageId: string
  status: 'active' | 'rejected'
  rejectionReason?: string
  appliedAt: string
}
\`\`\`

#### 5.2.3 Comentario
\`\`\`typescript
interface Comment {
  id: string
  candidateId: string
  author: string
  content: string
  type: 'comment' | 'movement' | 'system'
  timestamp: string
}
\`\`\`

### 5.3 Funcionalidades del Contexto
- `addCandidate`: Agregar nuevo candidato
- `moveCandidate`: Mover candidato entre etapas
- `rejectCandidate`: Rechazar candidato con motivo
- `addComment`: Agregar comentario manual
- `getCandidatesByStage`: Obtener candidatos por etapa
- `getRejectedCandidates`: Obtener candidatos rechazados

---

## 6. Estados y Validaciones

### 6.1 Estados de Proceso
- **Activo**: Proceso en curso, acepta candidatos
- **Pausado**: Proceso temporalmente detenido
- **Cerrado**: Proceso finalizado, no acepta cambios

### 6.2 Estados de Candidato
- **Activo**: Candidato en proceso de evaluación
- **Rechazado**: Candidato descartado del proceso

### 6.3 Validaciones
- **Formularios**: Validación de campos requeridos
- **Archivos**: Solo PDF para CVs, límite de tamaño
- **Permisos**: Verificación de roles para acciones
- **Estados**: Prevención de acciones inválidas

---

## 7. Mejoras Futuras Consideradas

### 7.1 Integraciones Externas
- Integración con LinkedIn para importar perfiles
- Conexión con sistemas de email para comunicación
- APIs de calendarios para programar entrevistas

### 7.2 Funcionalidades Avanzadas
- Plantillas de procesos reutilizables
- Reportes y analytics de reclutamiento
- Notificaciones en tiempo real
- Colaboración en tiempo real

### 7.3 Optimizaciones
- Búsqueda y filtros avanzados
- Exportación de datos
- Backup y recuperación
- Optimización de rendimiento

---

## 8. Criterios de Aceptación

### 8.1 Funcionalidad
- ✅ Todos los flujos principales funcionan sin errores
- ✅ Los datos se persisten correctamente en el contexto
- ✅ Las validaciones previenen acciones inválidas
- ✅ La navegación es intuitiva y consistente

### 8.2 Usabilidad
- ✅ Interfaz responsive en diferentes dispositivos
- ✅ Tiempos de respuesta aceptables (<2 segundos)
- ✅ Feedback visual claro para todas las acciones
- ✅ Accesibilidad básica implementada

### 8.3 Diseño
- ✅ Consistencia visual en toda la aplicación
- ✅ Paleta de colores y tipografía aplicada correctamente
- ✅ Componentes reutilizables y mantenibles
- ✅ Efectos hover y transiciones implementados

---

**Documento actualizado**: Enero 2025  
**Versión**: 2.0  
**Estado**: Implementado y funcional
