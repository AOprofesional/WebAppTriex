# Web Push Notifications - Instrucciones de Configuración

## 1. Ejecutar la migración de base de datos

```sql
-- Ejecuta el archivo en Supabase SQL Editor:
supabase/migrations/20260205_push_notifications.sql
```

Esto creará:
- Tabla `push_subscriptions` para almacenar suscripciones
- Tabla `system_settings` para configuración
- Políticas RLS apropiadas

## 2. Generar VAPID Keys

Las VAPID keys son necesarias para autenticar las notificaciones push.

```bash
# Desde la raíz del proyecto:
node utils/generateVapidKeys.js
```

Copia las keys generadas y ejecútalas en Supabase SQL Editor:

```sql
UPDATE system_settings
SET value = '{"publicKey":"TU_PUBLIC_KEY","privateKey":"TU_PRIVATE_KEY"}'::jsonb
WHERE category = 'push_notifications' AND key = 'vapid_keys';
```

⚠️ **IMPORTANTE**: Guarda la private key de forma segura. Nunca la compartas públicamente.

## 3. Desplegar la Edge Function

```bash
# Desde la raíz del proyecto con Supabase CLI instalado:
supabase functions deploy send-push
```

## 4. Agregar el banner de notificaciones

Agrega el componente `NotificationPermissionBanner` donde quieras que aparezca la solicitud:

```tsx
import { NotificationPermissionBanner } from '../components/NotificationPermissionBanner';

// En tu componente:
<NotificationPermissionBanner />
```

Recomendaciones de dónde agregarlo:
- Dashboard del usuario
- Pantalla principal de pasajero
- Después del login

## 5. Probar el sistema

### Desde el código:

```typescript
import { usePushNotifications } from '../hooks/usePushNotifications';

const { subscribe, sendTestNotification } = usePushNotifications();

// Subscribirse
await subscribe();

// Enviar notificación de prueba
await sendTestNotification();
```

### Desde Supabase Functions:

```typescript
await supabase.functions.invoke('send-push', {
  body: {
    userId: 'user-uuid',
    title: 'Hola!',
    body: 'Esta es una notificación de prueba',
    url: '/admin'
  }
});
```

## 6. Integrar con eventos de la aplicación

Ejemplos de cuándo enviar notificaciones:

### Documento aprobado/rechazado:

```typescript
// En DocumentReview.tsx después de aprobar/rechazar:
await supabase.functions.invoke('send-push', {
  body: {
    userId: document.passenger_id,
    title: status === 'approved' ? 'Documento aprobado ✅' : 'Documento rechazado ❌',
    body: `Tu ${documentType} ha sido ${status === 'approved' ? 'aprobado' : 'rechazado'}`,
    url: '/my-documents'
  }
});
```

### Nuevo viaje asignado:

```typescript
await supabase.functions.invoke('send-push', {
  body: {
    userId: passengerId,
    title: 'Nuevo viaje asignado 🎉',
    body: `Has sido asignado al viaje ${tripName}`,
    url: '/my-trips'
  }
});
```

### Recordatorio de viaje:

```typescript
await supabase.functions.invoke('send-push', {
  body: {
    userIds: passengerIds, // Array de IDs
    title: `Recordatorio: ${tripName} 🛫`,
    body: `Tu viaje comienza en 3 días`,
    url: '/my-trip'
  }
});
```

## Navegadores compatibles

- ✅ Chrome/Edge (Windows, Mac, Android)
- ✅ Firefox (Windows, Mac, Android)
- ✅ Safari 16+ (Mac, iOS 16.4+)
- ✅ Opera
- ❌ iOS Safari < 16.4
- ❌ Internet Explorer

## Troubleshooting

### "VAPID keys not configured"
- Asegúrate de haber ejecutado el script de generación
- Verifica que las keys estén en `system_settings`

### "Notifications not supported"
- Verifica que el usuario esté usando HTTPS (o localhost)
- Verifica que el navegador soporte notificaciones

### Notificaciones no llegan
- Verifica que el usuario haya dado permisos
- Revisa la consola del Service Worker (DevTools > Application > Service Workers)
- Verifica que las VAPID keys sean correctas

## Próximos pasos

1. Personaliza el Service Worker según tus necesidades
2. Agrega más tipos de notificaciones
3. Implementa notificaciones programadas
4. Agrega analytics de notificaciones
