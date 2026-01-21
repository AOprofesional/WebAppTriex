# Skill: Colector de Logs & Debug (TRIEX)
Descripción: Implementa un sistema de logging persistente para capturar errores (frontend + backend) y guardarlos en la carpeta `log-debug/` del proyecto, con formato consistente, rotación básica y sanitización de datos sensibles.

CUANDO el usuario pida:
"guardar logs", "capturar consola", "debug", "errores de consola", "registrar errores", "log-debug", "auditar errores", "troubleshooting".

## OBJETIVO
1) Que todo error relevante quede persistido (no solo en consola).  
2) Que el equipo pueda revisar archivos en `log-debug/` por fecha/entorno.  
3) Evitar exponer datos personales (DNI, email, teléfono, tokens).

---

## INSTRUCCIONES DE EJECUCIÓN

### 0) Regla de oro (alcance real)
- **Antigravity no “auto-guarda” la consola del navegador al repo** sin código adicional.
- Este skill debe:
  - Crear `log-debug/` (si no existe).
  - Implementar logging en backend (archivo).
  - Capturar errores frontend y enviarlos al backend.
  - (Opcional) capturar `console.error` y `console.warn` y enviarlos.

---

## 1) Crear carpeta y estándar de formato
- Crear carpeta: `log-debug/`
- Formato recomendado JSONL (una línea JSON por evento), ejemplo:
  - `log-debug/app-error-YYYY-MM-DD.jsonl`
  - `log-debug/app-info-YYYY-MM-DD.jsonl`

Cada evento debe incluir:
- `timestamp` ISO
- `env` (dev/staging/prod)
- `scope` (frontend|backend)
- `level` (info|warn|error)
- `message`
- `context` (objeto)
- `requestId` (si aplica)
- `userId` (si existe) pero **nunca** DNI/email/teléfono completos

---

## 2) Backend: escribir logs a archivo en `log-debug/`
- Si hay Node/Express:
  1) Agregar middleware de `requestId`
  2) Agregar logger (p.ej. `pino` o logger propio)
  3) Output a archivo en `log-debug/` con append
  4) Manejar errores globales (error middleware + `process.on('unhandledRejection')`)

- Si hay otro runtime, aplicar equivalente (append file + rotación simple diaria).

**Requisitos mínimos**
- Un endpoint `POST /api/log` que reciba eventos del frontend (solo `warn`/`error` por defecto).
- Sanitizar campos sensibles antes de persistir.

---

## 3) Frontend: capturar errores de consola y globales
Implementar:
- `window.onerror`
- `window.onunhandledrejection`
- Error Boundary (si es React)
- Interceptor opcional de `console.error` y `console.warn`:
  - Mantener el comportamiento original (seguir mostrando en consola)
  - Enviar una copia al backend con `fetch('/api/log')`

**Reglas**
- No spamear: usar debounce / rate limit (ej. máx 10 eventos por minuto por sesión)
- Adjuntar info útil:
  - ruta/pantalla
  - userAgent
  - versión/app build id
  - stack trace si existe

---

## 4) Sanitización (obligatoria)
Antes de guardar/enviar:
- Enmascarar o eliminar:
  - emails
  - teléfonos
  - DNI/Pasaporte
  - tokens / Authorization headers
- Si se detectan campos como `password`, `token`, `authorization` → eliminar.

---

## 5) QA (verificación)
- Forzar un error controlado en frontend y verificar que:
  - se ve en consola
  - llega a `/api/log`
  - se escribe en `log-debug/app-error-YYYY-MM-DD.jsonl`
- Forzar un error en backend y verificar escritura.
- Confirmar que no se guardan datos sensibles.

---

## FORMATO DE RESPUESTA

Entregar siempre:
1) **Checklist** de lo implementado
2) **Archivos creados/modificados** (rutas)
3) **Snippets** de código clave (frontend y backend)
4) **Cómo probarlo** (pasos concretos)
5) Tabla de “Riesgos y mejoras”

### Ejemplo de tabla de resultados
| Área | Hallazgo | Solución aplicada |
| :--- | :--- | :--- |
| Frontend | Errores solo en consola | Captura global + envío a `/api/log` |
| Backend | Sin persistencia | Append JSONL diario en `log-debug/` |

Si ya existe todo y está correcto:
✅ Logging persistente activo: frontend + backend guardando en `log-debug/` con sanitización.
