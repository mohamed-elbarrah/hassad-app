# Backend and Frontend Localization Contract

Status: Localization contract for API and frontend integration.

## Locale Values

The shared business contract supports these locale codes:

```ts
type SupportedLocale = "en" | "ar";
```

Locale codes are stable values. They are not display labels.

## Request Locale

Clients may send either header:

```http
x-locale: ar
Accept-Language: ar-SA, en;q=0.8
```

Resolution rules:

1. `x-locale` is the explicit client override.
2. If no `x-locale` is supplied, the API evaluates `Accept-Language` quality values.
3. Supported primary tags are normalized, so `ar-SA` becomes `ar`.
4. Unsupported, malformed, or missing preferences fall back to `en`.
5. The API does not infer locale from user-generated content.

## Response Locale

Every HTTP response sets:

```http
Content-Language: en
```

or:

```http
Content-Language: ar
```

The locale header describes backend-generated presentation only. It does not rewrite user-generated fields.

## API Envelope and Errors

The response envelope is unchanged:

```json
{
  "success": true,
  "data": {},
  "error": null
}
```

Errors remain behaviorally locale-neutral:

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "STABLE_ERROR_CODE",
    "message": "English fallback message",
    "details": null
  }
}
```

Frontend rules:

- Branch on `error.code`, never `error.message`.
- Treat `message` as English fallback/debug copy.
- Do not translate or rewrite `details` values.
- Do not expect general API data labels to be localized by the backend.

## Notifications

Backend-generated notifications use typed message keys and parameters:

```ts
createLocalizedNotification({
  messageKey: "task.assigned",
  messageParams: {
    taskTitle,
    department,
  },
});
```

Notification locale precedence:

1. Explicit locale passed to the notification call.
2. Current request locale.
3. Company language setting.
4. English fallback.

Notification rules:

- English templates are complete and authoritative fallbacks.
- Missing Arabic templates fall back to English.
- Numeric interpolation uses Latin digits without grouping separators.
- User-generated names, titles, comments, notes, reasons, and messages are preserved exactly.
- Notification event type, entity ID, entity type, recipient ID, and metadata are not localized.
- Raw notification creation is restricted to `NotificationsService`.

## Shared Package

`@hassad/shared` owns:

- Stable enum values.
- Stable business codes.
- Zod schemas and structural validation.
- Supported locale values.

The shared package does not define the frontend's translated labels. Existing Arabic/UI label exports remain compatibility surfaces until the frontend dictionary migration is approved; they are not API behavior contracts.

## Frontend Responsibilities

- Own English and Arabic UI dictionaries.
- Map stable API codes/enums to translated labels.
- Preserve user-generated content exactly.
- Send `x-locale` or `Accept-Language` on API requests.
- Unwrap the API envelope exactly once.
- Use `Content-Language` only as the backend-generated-text locale indicator.
- Support English first and Arabic when RTL/accessibility QA is complete.

## Verification Contract

Localization changes are verified with focused tests, shared build, API typecheck, and `git diff --check`. Full API e2e is not required for this localization-only phase.
