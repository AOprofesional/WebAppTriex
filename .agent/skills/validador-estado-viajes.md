# Skill: Validador de Estados del Viaje
Descripción: Revisa la coherencia de estados y sus disparadores.

CUANDO el usuario pida:  
"validar estados", "reglas del viaje".

## INSTRUCCIONES DE EJECUCIÓN:

1. Estados:
   - Previo
   - En curso
   - Finalizado

2. Reglas:
   - En curso inicia a las 00:00 del día de salida.
   - Finalizado al superar la fecha fin.

3. Casos borde:
   - Zona horaria
   - Viajes sin fecha fin
   - Reprogramaciones

## FORMATO:

| Regla | Riesgo | Ajuste |
| :--- | :--- | :--- |
| Cambio a En curso | Diferencia horaria | Usar TZ del viaje |
