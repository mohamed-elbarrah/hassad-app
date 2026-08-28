# Currency API contract

Currency management is Admin-owned:

- `GET /admin/settings/currencies`
- `GET /admin/settings/currencies/:id`
- `POST /admin/settings/currencies`
- `PATCH /admin/settings/currencies/:id`
- `DELETE /admin/settings/currencies/:id`
- `POST /admin/settings/currencies/upload-svg`

These endpoints require the authenticated Admin settings permission (`admin.settings`). Responses use the global `{ success: true, data, meta? }` / `{ success: false, error: { code, details } }` contract. Exchange rates must be positive and `symbolType` must be one of `TEXT`, `SVG_URL`, `SVG_UPLOAD`, or `SVG_INLINE`.

`svgKey` is always the durable source: an external URL, inline SVG markup, or (for `SVG_UPLOAD`) the private storage reference. `svgUrl` is presentation-only and is freshly generated for uploaded assets. The API never writes a presigned URL to `svgKey` or the upload `reference`; the public default endpoint omits private storage references while retaining `svgUrl`.

The upload response data is `{ url, reference, isCleaned }`: `reference` is the durable value used in a later `SVG_UPLOAD` create/update, while `url` is short-lived preview data. All controller returns are wrapped by the global response interceptor, so the wire response is `{ success: true, data: ... }`; errors are `{ success: false, error: { code, details } }`.

The legacy `GET /currency-settings/default` endpoint remains read-only for existing non-admin consumers. Frontend management consumers should migrate from `/currency-settings` to the Admin routes; the default consumer may continue using the compatibility endpoint until it can migrate.
