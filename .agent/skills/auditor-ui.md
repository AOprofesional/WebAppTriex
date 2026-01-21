# Skill: Auditor de Diseño UI/UX
Descripción: Actúa como un experto en diseño de interfaces y accesibilidad para revisar el código actual.

CUANDO el usuario pida: "revisar diseño", "auditar pantalla", "check visual" o "verificar UI".

## INSTRUCCIONES DE EJECUCIÓN:

1. **Análisis de Accesibilidad (WCAG)**:
   - Analiza los colores hexadecimales o clases de estilo en el archivo abierto.
   - Verifica si el contraste entre texto y fondo cumple con el estándar WCAG AA.
   - Si el contraste es bajo, sugiere un código de color alternativo que sí cumpla.

2. **Usabilidad Móvil (Touch Targets)**:
   - Revisa botones y elementos interactivos (`<button>`, `<a>`, `Inputs`).
   - Verifica si tienen un tamaño o "padding" suficiente para ser tocados con el dedo (mínimo recomendado: 44x44px).
   - Si son muy pequeños, sugiere aumentar el padding.

3. **Consistencia Visual**:
   - Revisa si hay estilos "hardcoded" (estilos en línea) que deberían estar en un archivo CSS o usar clases estándar.

## FORMATO DE RESPUESTA:

Si encuentras errores, genera una tabla con este formato:

| Elemento | Problema Detectado | Sugerencia de Código |
| :--- | :--- | :--- |
| Botón "Login" | Muy pequeño (30px) | Agregar `p-4` o `height: 48px` |
| Texto H1 | Contraste bajo con fondo | Cambiar color a `#333333` |

Si todo está perfecto, responde con: "✅ El diseño cumple con los estándares de accesibilidad y móvil."