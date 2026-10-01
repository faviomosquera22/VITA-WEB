# Web clínica para la feria — 30 septiembre 2026

## Accesos

La portada permite elegir profesional o institución. El acceso del paciente se mantiene en la app; `/triage` redirige al portal profesional. El inicio profesional usa el perfil autenticado y los casos persistentes del centro. Los módulos clínicos anteriores se conservan y se identifican como demostración: sus historias, medicamentos y demás registros no deben confundirse con información sincronizada.

La institución usa un monitor de solo lectura: emergencias (rojo/naranja activos), nuevos (pendientes), atención general, hospitalización y finalizados hoy, según hora de Ecuador. Las emergencias se superponen con el estado de atención. Los números del monitor incluyen todos los casos del centro; cada bloque muestra hasta cinco códigos. El inicio profesional muestra los últimos 200 registros.

El monitor consulta cada 10 segundos, evita solicitudes superpuestas, marca desconexión/datos antiguos, permite elegir cuadrantes y pantalla completa. La respuesta no contiene nombres, edades, motivos ni texto libre de habitaciones.

## Cuenta de demostración

El script `scripts/provision-fair-demo.mjs` crea una institución aislada `VITA-FERIA-2026`, un profesional Fabio Mosquera y una cuenta de pantalla. El secreto se proporciona con `DEMO_PASSWORD`, nunca mediante código publicado. Las direcciones `.test` son identificadores de acceso, no buzones de correo. Las cuentas se pueden usar contra el mismo servicio configurado en la app iOS.

## Prueba desde el teléfono

1. Abrir el portal remoto de la app e iniciar sesión profesional con la cuenta de Fabio.
2. Verificar que el servidor es `https://website-gilt-seven-66.vercel.app` y que el centro es la demostración de la feria.
3. Enviar un caso ficticio. En la web profesional, pulsar **Actualizar**.
4. Abrir la cuenta institucional en otro navegador o ventana privada (cada navegador comparte una sesión).
5. Gestionar el caso desde el inicio profesional y asignar **En atención → Hospitalización**. En unos 10 segundos debe cambiar el monitor.

Las pruebas automatizadas utilizan el contrato iOS (`client: ios`, sesión bearer, `/api/cases`); no sustituyen la prueba en el teléfono físico ni validan una versión antigua ya instalada.

## Persistencia y compatibilidad

Hospitalización se guarda en `triage_cases.result_payload.careArea`; los estados existentes permanecen compatibles con iOS. Los cambios se limitan a la institución del profesional y exigen `updatedAt` para rechazar ediciones sobre datos antiguos. La creación usa claves idempotentes para evitar duplicados al reintentar. Cada cambio registra auditoría.

## Validación

- `node --experimental-strip-types --test tests/case-flow.test.ts`
- `node --env-file=.env.demo.local scripts/test-clinical-flow.mjs`
- `TEST_BASE_URL=https://website-gilt-seven-66.vercel.app node --env-file=.env.demo.local scripts/test-clinical-flow.mjs`
- `npm run build -- --webpack`
- ESLint sobre los archivos modificados.

La prueba de integración deja cinco ejemplos explícitamente ficticios en la institución de demostración. Comprueba login móvil, roles, persistencia, idempotencia, cambios de estado, conflictos de edición, anonimización y revocación de sesiones.

## Migración pendiente de acceso administrativo

La web restringe la sesión institucional a `/api/institution/monitor`, sesión y cierre. La migración `202609300001_institution_projection_only.sql` añade la misma restricción en PostgreSQL para bloquear el acceso directo a tablas con un JWT de Supabase. No se pudo aplicar por CLI porque no hay `SUPABASE_ACCESS_TOKEN` ni sesión administrativa disponible. Debe aplicarse antes de utilizar cuentas institucionales con datos reales. El entorno creado en esta entrega solo contiene datos ficticios.
