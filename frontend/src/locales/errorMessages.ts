// Module: learner-facing error copy, keyed by machine code
// Purpose: Give every failure a sentence the learner can read in her own language.
// Author: Kevin "Lirioth" Cusnir
// Date: 2026-08-16 | TZ: Asia/Jerusalem
//
// Why this file exists.
//
// Every error the app could show the learner arrived in English. `api.ts` threw
// `ApiError` with English strings, the backend's `error_response` carries English
// prose, and forty-five call sites rendered whichever of those they were handed
// through a ternary that asked whether the caught value was an Error and, if it
// was, showed its `.message`. The translated branch was unreachable: an
// `ApiError` *is* an `Error`. Forty-one of the forty-five did not even name a
// translated fallback — they fell back to stringifying the exception. So in a
// trilingual app whose target learner reads Spanish and is learning Hebrew,
// every single failure spoke English.
//
// The fix leans on something the system already had: the backend stamps a stable
// machine code on every error (`error_response(request, status, code, message)`),
// and the frontend's `ApiError` carries it through as `.code`. That code, not the
// prose, is what gets translated here — the same shape `codeLabels` already uses
// for dynamic metadata.
//
// The English prose on the thrown error is not deleted: it stays on the object
// for logs and for a developer reading a stack trace. It just never reaches the
// screen any more.
//
// Register matches the rest of the catalogues: Spanish addresses the learner as
// "tú", Hebrew uses the impersonal `יש ל…` construction the interface already
// uses in `networkOfflineDetail`.

import type { Locale } from '../types';

/**
 * `fallback` is required, not optional: an unknown code must still produce a
 * sentence, and a missing entry is the one outcome that would put the learner
 * back in front of raw English.
 */
export const errorMessages: Record<Locale, Record<string, string>> = {
  en: {
    fallback: 'Something did not work. Try again in a moment.',
    request_failed: 'The request did not go through. Try again.',
    timeout: 'The request took too long. Try again in a moment.',
    network_required: 'You need a connection to save this. Reconnect and try again.',
    database_unavailable: 'The server is not answering right now. Your progress is safe — try again in a moment.',
    authentication_required: 'You need to sign in to carry on.',
    demo_read_only: 'This is the demonstration, so nothing you change is kept. Sign in to save your own progress.',
    csrf_validation_failed: 'Your session expired for safety. Reload the page and sign in again.',
    write_rate_limit_exceeded: 'That was a lot of changes very quickly. Wait a moment and try again.',
    not_found: 'That is not here any more.',
    invalid_request: 'Something in what was sent was not right. Try again.',
    validation_error: 'Something in the form is missing or is not quite right.',
    learning_core_conflict: 'This lesson moved on while you were away. Reload to catch up.',
    practice_conflict: 'This practice moved on while you were away. Reload to catch up.',
    alphabet_conflict: 'This letter exercise moved on while you were away. Reload to catch up.',
    cloud_snapshot_limit_exceeded: 'There is no room for another copy in the cloud. Delete an older one first.',
    request_body_too_large: 'That is too big to send. Try something shorter.',
    auth_not_configured: 'Signing in is not set up on this server.',
    auth_request_forbidden: 'That sign-in request was blocked for safety.',
    authentication_busy: 'Signing in is busy right now. Wait a moment and try again.',
    authentication_failed: 'Signing in did not work. Try again.',
    cloud_feature_not_allowed: 'This feature is switched off on this installation.',
    cloud_consent_required: 'You need to give permission for this first, in Settings.',
    connector_error: 'The outside service did not answer. The app keeps working without it.',
    audio_provider_capacity: 'The speech service is very busy right now. Try again in a moment.',
    internal_error: 'Something broke on the server. It is not your fault — try again.',
  },
  es: {
    fallback: 'Algo no funcionó. Inténtalo otra vez en un momento.',
    request_failed: 'La petición no salió. Inténtalo otra vez.',
    timeout: 'La petición tardó demasiado. Inténtalo otra vez en un momento.',
    network_required: 'Necesitas conexión para guardar esto. Vuelve a conectarte e inténtalo otra vez.',
    database_unavailable: 'El servidor no responde ahora mismo. Tu progreso está a salvo: inténtalo en un momento.',
    authentication_required: 'Tienes que iniciar sesión para seguir.',
    demo_read_only: 'Esto es la demostración, así que no se guarda nada de lo que cambies. Inicia sesión para conservar tu progreso.',
    csrf_validation_failed: 'Tu sesión caducó por seguridad. Recarga la página y vuelve a entrar.',
    write_rate_limit_exceeded: 'Fueron muchos cambios muy seguidos. Espera un momento e inténtalo otra vez.',
    not_found: 'Eso ya no está aquí.',
    invalid_request: 'Algo de lo que se envió no era correcto. Inténtalo otra vez.',
    validation_error: 'Falta algo en el formulario, o hay algo que no encaja.',
    learning_core_conflict: 'Esta lección avanzó mientras no estabas. Recarga para ponerte al día.',
    practice_conflict: 'Esta práctica avanzó mientras no estabas. Recarga para ponerte al día.',
    alphabet_conflict: 'Este ejercicio de letras avanzó mientras no estabas. Recarga para ponerte al día.',
    cloud_snapshot_limit_exceeded: 'No cabe otra copia en la nube. Borra una más antigua primero.',
    request_body_too_large: 'Eso es demasiado grande para enviar. Prueba con algo más corto.',
    auth_not_configured: 'El inicio de sesión no está configurado en este servidor.',
    auth_request_forbidden: 'Esa petición de inicio de sesión se bloqueó por seguridad.',
    authentication_busy: 'El inicio de sesión está ocupado ahora mismo. Espera un momento e inténtalo otra vez.',
    authentication_failed: 'El inicio de sesión no funcionó. Inténtalo otra vez.',
    cloud_feature_not_allowed: 'Esta función está desactivada en esta instalación.',
    cloud_consent_required: 'Primero tienes que dar permiso para esto, en Ajustes.',
    connector_error: 'El servicio externo no respondió. La app sigue funcionando sin él.',
    audio_provider_capacity: 'El servicio de voz está saturado ahora mismo. Inténtalo en un momento.',
    internal_error: 'Algo se rompió en el servidor. No es culpa tuya: inténtalo otra vez.',
  },
  he: {
    fallback: 'משהו לא עבד. יש לנסות שוב בעוד רגע.',
    request_failed: 'הבקשה לא עברה. יש לנסות שוב.',
    timeout: 'הבקשה לקחה יותר מדי זמן. יש לנסות שוב בעוד רגע.',
    network_required: 'נדרש חיבור לאינטרנט כדי לשמור. יש להתחבר מחדש ולנסות שוב.',
    database_unavailable: 'השרת אינו מגיב כרגע. ההתקדמות שמורה — יש לנסות שוב בעוד רגע.',
    authentication_required: 'יש להתחבר כדי להמשיך.',
    demo_read_only: 'זו ההדגמה, ולכן שינויים אינם נשמרים. יש להתחבר כדי לשמור את ההתקדמות.',
    csrf_validation_failed: 'ההתחברות פגה מטעמי אבטחה. יש לרענן את הדף ולהתחבר מחדש.',
    write_rate_limit_exceeded: 'היו הרבה שינויים בזמן קצר. יש להמתין רגע ולנסות שוב.',
    not_found: 'זה כבר אינו נמצא כאן.',
    invalid_request: 'משהו במה שנשלח לא היה תקין. יש לנסות שוב.',
    validation_error: 'חסר משהו בטופס, או שיש בו פרט שאינו מתאים.',
    learning_core_conflict: 'השיעור התקדם בינתיים. יש לרענן כדי להתעדכן.',
    practice_conflict: 'התרגול התקדם בינתיים. יש לרענן כדי להתעדכן.',
    alphabet_conflict: 'תרגיל האותיות התקדם בינתיים. יש לרענן כדי להתעדכן.',
    cloud_snapshot_limit_exceeded: 'אין מקום לעותק נוסף בענן. יש למחוק עותק ישן קודם.',
    request_body_too_large: 'זה גדול מדי לשליחה. כדאי לנסות משהו קצר יותר.',
    auth_not_configured: 'ההתחברות אינה מוגדרת בשרת הזה.',
    auth_request_forbidden: 'בקשת ההתחברות נחסמה מטעמי אבטחה.',
    authentication_busy: 'ההתחברות עמוסה כרגע. יש להמתין רגע ולנסות שוב.',
    authentication_failed: 'ההתחברות לא הצליחה. יש לנסות שוב.',
    cloud_feature_not_allowed: 'התכונה הזו כבויה בהתקנה הזו.',
    cloud_consent_required: 'יש לאשר זאת קודם, בהגדרות.',
    connector_error: 'השירות החיצוני לא הגיב. האפליקציה ממשיכה לעבוד בלעדיו.',
    audio_provider_capacity: 'שירות הדיבור עמוס כרגע. יש לנסות שוב בעוד רגע.',
    internal_error: 'משהו נשבר בשרת. זו אינה אשמתך — יש לנסות שוב.',
  },
};

/**
 * The code carried by a thrown value, if it carries one.
 *
 * Duck-typed rather than `instanceof ApiError` on purpose: this file is imported
 * by the i18n provider, and reaching into `api.ts` for the class would tie the
 * interface-copy layer to the transport layer for no gain. Anything with a
 * string `code` is treated as speaking the same protocol.
 */
function codeOf(reason: unknown): string {
  if (typeof reason !== 'object' || reason === null || !('code' in reason)) return '';
  const code = (reason as { code: unknown }).code;
  return typeof code === 'string' ? code : '';
}

/**
 * Turn anything thrown into a sentence in the learner's language.
 *
 * A bare `TypeError` is how `fetch` reports that the network went away, so it is
 * mapped to the connection message rather than to the generic one — that is the
 * single most likely failure in a flat with unreliable wifi.
 */
export function describeError(reason: unknown, locale: Locale): string {
  const table = errorMessages[locale];
  const code = codeOf(reason);
  if (code && table[code]) return table[code];
  if (reason instanceof TypeError) return table.network_required!;
  return table.fallback!;
}
