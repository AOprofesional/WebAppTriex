# ✈️ Triex Travel WebApp

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0--producción-orange?style=for-the-badge)
![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript_5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite_6-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Playwright](https://img.shields.io/badge/Playwright_E2E-2EAD33?style=for-the-badge&logo=playwright&logoColor=white)

<p align="center">
  <b>Plataforma integral de gestión de viajes grupales, vouchers digitales, fidelización y atención a pasajeros para Triex Travel.</b>
</p>

</div>

---

## 📋 Tabla de Contenidos

- [Descripción General](#-descripción-general)
- [Características Principales](#-características-principales)
  - [Portal del Pasajero](#-portal-del-pasajero)
  - [Panel de Administración y Operadores](#-panel-de-administración-y-operadores)
  - [Orange Pass (Programa de Fidelización)](#-orange-pass-programa-de-fidelización)
  - [Gestión de Acompañantes y Documentación](#-gestión-de-acompañantes-y-documentación)
- [Stack Tecnológico](#-stack-tecnológico)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Instalación y Configuración](#-instalación-y-configuración)
  - [Requisitos Previos](#requisitos-previos)
  - [Pasos de Instalación](#pasos-de-instalación)
  - [Variables de Entorno](#variables-de-entorno)
- [Scripts Disponibles](#-scripts-disponibles)
- [Suite de Pruebas (E2E y Unitarias)](#-suite-de-pruebas-e2e-y-unitarias)
- [Despliegue con Docker](#-despliegue-con-docker)
- [Roles y Permisos](#-roles-y-permisos)

---

## 🌟 Descripción General

**Triex Travel WebApp** es una solución web moderna diseñada para centralizar la experiencia de los pasajeros y optimizar las operaciones de la agencia. Permite a los clientes acceder a sus itinerarios, vouchers digitales y beneficios de fidelización en tiempo real, mientras que brinda al equipo administrativo y operativo herramientas completas para la gestión de viajes, carga de pasajeros, control documental y analítica de encuestas.

---

## ✨ Características Principales

### 👤 Portal del Pasajero
- **Acceso Unificado**: Inicio de sesión seguro con correo electrónico o DNI/código de reserva.
- **Vouchers Digitales**: Visualización y descarga de vouchers de transporte, hotel, excursiones y asistencia al viajero.
- **Itinerario Interactivo**: Cronograma detallado del viaje día por día con puntos de encuentro y recomendaciones.
- **Encuestas de Satisfacción**: Formulario post-viaje integrado con calificación y comentarios.
- **Soporte Directo**: Contacto rápido vía WhatsApp con coordinadores y canales oficiales.

### 🛡️ Panel de Administración y Operadores
- **Dashboard Operativo**: Métricas en tiempo real de viajes activos, pasajeros confirmados y solicitudes pendientes.
- **Gestión de Viajes (CRUD)**: Creación y edición de paquetes, fechas de salida, cupos, itinerarios y coordinadores asignados.
- **Gestión de Pasajeros**: Base de datos de clientes con historial de viajes, documentación cargada y estado de pago.
- **Equipo de Ventas**: Asignación y métricas de vendedores y comisiones.
- **Preferencias del Sistema**: Modo oscuro, notificaciones y personalización de perfil de usuario.

### 🟧 Orange Pass (Programa de Fidelización)
- **Sistema de Puntos**: Acumulación automática de puntos por viajes realizados y referidos exitosos.
- **Catálogo de Recompensas**: Canje de puntos por descuentos, merchandising y experiencias exclusivas.
- **Aprobación de Canjes**: Panel administrativo para revisar, aprobar o rechazar solicitudes con actualización de saldo en tiempo real mediante RPCs en base de datos.

### 👥 Gestión de Acompañantes y Documentación
- **Vinculación de Grupos**: Registro de acompañantes por pasajero principal con validación de documentos únicos.
- **Control Documental**: Carga de pasaportes, DNI, seguros médicos y fichas de salud con políticas de seguridad RLS.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnologías |
|---|---|
| **Frontend** | React 19, TypeScript, React Router v7, Tailwind CSS, Material Symbols |
| **Backend & Base de Datos** | Supabase (PostgreSQL), Funciones RPC, Row Level Security (RLS) |
| **Almacenamiento** | Supabase Storage / MinIO |
| **Pruebas Automatizadas** | Playwright (E2E), Vitest (Unitarias), Testing Library |
| **Herramientas de Build** | Vite 6, PostCSS, Autoprefixer |
| **Contenedores** | Docker, Nginx Alpine |

---

## 📁 Estructura del Proyecto

```plaintext
WebAppTriex/
├── components/          # Componentes reutilizables (Navbar, Sidebar, Modales, etc.)
├── contexts/            # Contextos de React (Auth, Tema, Notificaciones)
├── hooks/               # Custom Hooks (useSettings, useTrips, usePassengers)
├── screens/             # Pantallas principales
│   ├── admin/           # Dashboard, Gestión de Viajes, Pasajeros, Orange Pass, Settings
│   └── passenger/       # Portal del Pasajero, Itinerarios, Vouchers, Puntos, Encuestas
├── lib/                 # Clientes y configuraciones (Supabase client)
├── supabase/            # Migraciones SQL, esquemas, triggers y funciones RPC
├── tests/               # Suite completa de pruebas E2E con Playwright
├── scripts/             # Scripts utilitarios y generador de reporte PDF de pruebas
├── public/              # Recursos estáticos (logos, íconos, banners)
├── types/               # Definiciones de tipos TypeScript
└── utils/               # Funciones de ayuda y formateadores
```

---

## 🚀 Instalación y Configuración

### Requisitos Previos
- **Node.js** >= 18.x
- **npm** >= 9.x
- Cuenta en **Supabase** (o instancia local)

### Pasos de Instalación

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/AOprofesional/WebAppTriex.git
   cd WebAppTriex
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno:**
   Crea un archivo `.env.local` tomando como base `.env.example`:
   ```bash
   cp .env.example .env.local
   ```

4. **Iniciar el servidor de desarrollo:**
   ```bash
   npm run dev
   ```
   La aplicación estará disponible en `http://localhost:5173`.

---

## ⚙️ Variables de Entorno

Configura las siguientes variables en tu archivo `.env.local`:

```env
# Supabase
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-clave-anon-publica

# Canales de Contacto y Notificaciones
VITE_SUPPORT_WHATSAPP=549XXXXXXXXXX
VITE_ADMIN_WHATSAPP=549XXXXXXXXXX
VITE_SUPPORT_EMAIL=soporte@triextravel.com
VITE_ADMIN_SUPPORT_EMAIL=admin@triextravel.com
```

---

## 📜 Scripts Disponibles

| Comando | Descripción |
|---|---|
| `npm run dev` | Inicia el entorno local de desarrollo con Vite. |
| `npm run build` | Compila la aplicación optimizada para producción. |
| `npm run preview` | Previsualiza el bundle generado de producción. |
| `npm run test` | Ejecuta las pruebas unitarias con Vitest. |
| `npm run test:e2e` | Ejecuta todas las pruebas E2E con Playwright en modo headless. |
| `npm run test:e2e:ui` | Abre la interfaz visual interactiva de Playwright. |
| `npm run test:e2e:pdf` | Ejecuta las pruebas y genera automáticamente el reporte oficial en PDF. |
| `npm run test:e2e:report`| Abre el reporte HTML interactivo de Playwright. |

---

## 🧪 Suite de Pruebas (E2E y Unitarias)

El proyecto cuenta con una cobertura integral de pruebas de extremo a extremo (E2E) que garantizan la estabilidad de los flujos críticos:

- `auth.spec.ts`: Autenticación, login con email, DNI y recuperación de contraseña.
- `passenger.spec.ts`: Navegación, visualización de vouchers y consulta de itinerarios.
- `operator.spec.ts` & `admin.spec.ts`: Control de acceso y permisos según roles.
- `passengers-crud.spec.ts` & `trips-crud.spec.ts`: Altas, bajas, modificaciones y filtros.
- `orange-pass.spec.ts`: Asignación de puntos, flujo de referidos y canje de premios.
- `surveys.spec.ts`: Envío y recopilación de encuestas post-viaje.

Para ejecutar la suite y generar el reporte formal:
```bash
npm run test:e2e:pdf
```
El reporte se guardará como `Reporte_Pruebas_E2E_Triex.pdf`.

---

## 🐳 Despliegue con Docker

El proyecto incluye un `Dockerfile` y configuración optimizada de `nginx` para producción:

```bash
# Construir la imagen
docker build -t triex-webapp:latest .

# Ejecutar el contenedor
docker run -d -p 80:80 --name triex-app triex-webapp:latest
```

---

## 🔐 Roles y Permisos

- **👑 Administrador (`admin`)**: Acceso total al sistema, configuración general, equipo de ventas, edición de roles y exportación de datos.
- **🧭 Operador (`operator`)**: Gestión operativa de viajes, asignación de pasajeros, control de vouchers y asistencia en ruta.
- **🧳 Pasajero (`passenger`)**: Acceso exclusivo a su viaje asignado, descarga de vouchers personales, itinerario, encuestas y balance de Orange Pass.

---

<div align="center">

**Desarrollado con ❤️ para Triex Travel**  
*© 2026 Triex Travel. Todos los derechos reservados.*

</div>
