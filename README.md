# NRD Gestión Operativa

Sistema de gestión operativa de panadería - PWA

## Descripción

Sistema completo para documentar, controlar y optimizar los procesos internos de una panadería. Permite a socios/dueños y empleados gestionar áreas operativas, procesos, tareas, roles, empleados, ejecuciones e incidencias.

## Características Principales

### 1. Organización del Negocio
- Visualización de áreas operativas
- Visualización de procesos por área
- Visualización de tareas por proceso
- Comprensión de distribución de responsabilidades

### 2. Gestión de Procesos
- Crear, editar y visualizar procesos
- Asociar procesos a áreas
- Definir objetivos de procesos
- Visualización de flujo de procesos con tareas

### 3. Gestión de Tareas
- Crear, editar y visualizar tareas
- Tipos de tareas: con rol, sin rol, voluntaria, no remunerada, canje
- Asignación de roles responsables
- Frecuencia y tiempo estimado
- Pasos de ejecución, criterios de éxito y errores comunes

### 4. Gestión de Roles y Empleados
- Crear y gestionar roles organizacionales
- Registrar empleados con asignación de roles
- Visualización de carga de trabajo por rol y empleado

### 5. Registro de Ejecuciones
- Registrar fecha y hora de ejecución
- Registrar empleado ejecutante
- Resultados: OK / OBSERVADO / ERROR
- Observaciones y modalidad de pago

### 6. Gestión de Incidencias
- Incidencias asociadas a tareas
- Impacto sobre roles y empleados
- Estados: pendiente / corregida

### 8. Análisis y Mejora
- Carga de trabajo por empleado
- Carga de trabajo por rol
- Carga de trabajo por área
- Identificación de sobrecarga y cuellos de botella

### 9. Onboarding y Transparencia
- Consulta de tareas formales e informales
- Guía operativa permanente
- Criterios de control y ejecución

## Tecnologías

- HTML, CSS, JavaScript (Vanilla)
- Tailwind CSS
- Firebase Realtime Database
- Firebase Authentication
- Service Worker (PWA)
- jsPDF (para reportes)

## Estructura del Proyecto

```
├── index.html              # Página principal
├── app.js                  # Controlador principal y navegación
├── auth.js                 # Autenticación
├── db.js                   # Funciones de base de datos
├── modal.js               # Sistema de modales y alertas
├── areas.js                # Gestión de áreas
├── processes.js            # Gestión de procesos
├── tasks.js                # Gestión de tareas
├── roles.js                # Gestión de roles
├── employees.js            # Gestión de empleados
├── task-executions.js      # Registro de ejecuciones
├── incidents.js            # Gestión de incidencias
├── analytics.js            # Análisis de carga de trabajo
├── firebase.js             # Configuración de Firebase
├── manifest.json           # Configuración PWA
└── service-worker.js       # Service Worker para PWA
```

## Instalación y Uso

1. Clonar el repositorio:
```bash
git clone https://github.com/yosbany/nrd-gestion-operativa.git
cd nrd-gestion-operativa
```

2. Configurar Firebase:
   - Editar `firebase.js` con tus credenciales de Firebase
   - Configurar Firebase Realtime Database
   - Configurar Firebase Authentication

3. Abrir en navegador:
   - Simplemente abre `index.html` en tu navegador
   - O despliega en un servidor web

## Generar Iconos

Ver `GENERAR-ICONOS.md` para instrucciones detalladas.

Método rápido:
```bash
# Abre generate-icons.html en el navegador
# O ejecuta:
node generate-new-icons.js
```

## Despliegue en GitHub Pages

1. El código ya está en el repositorio
2. Ve a Settings > Pages en GitHub
3. Selecciona la rama `main` como fuente
4. La aplicación estará disponible en: `https://yosbany.github.io/nrd-gestion-operativa/`

## Interfaz

### Sistema de Colores en Formularios

Los formularios y vistas de detalle utilizan un sistema de colores coordinado para indicar la acción actual:

#### Cabezales de Formularios

- **Verde** (`bg-green-600`): Formularios de **Nuevo** registro
- **Azul** (`bg-blue-600`): Formularios de **Edición** de registros existentes
- **Gris** (`bg-gray-600`): Vistas de **Detalle** (solo lectura)

#### Botones Principales

Los botones principales (Guardar) tienen el mismo color que el cabezal del formulario para mantener consistencia visual:

- **Verde** (`bg-green-600`): Botón "Guardar" en formularios de **Nuevo** registro
- **Azul** (`bg-blue-600`): Botón "Guardar" en formularios de **Edición**
- **Gris** (`bg-gray-600`): Botón "Cerrar" en vistas de **Detalle**

#### Descripciones en Formularios

Cada formulario incluye una breve descripción en el cabezal que explica el propósito de la acción actual (nuevo, edición o visualización).

Este sistema proporciona retroalimentación visual inmediata y consistente sobre el contexto de la acción que el usuario está realizando.

## Funcionalidades Técnicas

- ✅ PWA instalable
- ✅ Funciona offline
- ✅ Responsive design (móvil y desktop)
- ✅ Cache busting automático
- ✅ Actualización automática de versiones
- ✅ Service Worker para caché

## Licencia

Este proyecto es privado y de uso interno.

