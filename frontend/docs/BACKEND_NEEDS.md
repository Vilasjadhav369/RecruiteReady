# Backend capabilities required for remaining features

None of these were faked on the frontend.

| Feature | Needed | Suggested contract |
|---|---|---|
| Code execution | Sandboxed runner (container/gVisor/Judge0-style) behind `POST /api/coding/problems/:id/run` and `/submit`; enforce time/memory limits, no network | Already consumed by `codingService.js`; frontend shows `execution_unavailable` honestly |
| Daily coding challenge | `GET /api/coding/daily` | `{ problem: {_id,title,difficulty}, date, solvedToday }` |
| Announcements / placement drives | `GET /api/announcements`, `GET /api/drives?from=` | `{ items: [{_id,title,body,company?,date,type}] }` |
| Real-time notifications | SSE (`GET /api/notifications/stream`) or WebSocket; REST polling works today | event: `{ _id, title, message, type, createdAt }` |
| Study plans / daily goals persistence | `GET/PUT /api/study-plan` | `{ weekly: [{day, tasks:[{type, refId, done}]}] }` |
| Interview experiences | Reviews endpoint already exists; per-company filter + moderation fields may be needed | `GET /api/reviews?company=:id&status=approved` |
| Cross-device recently viewed | Optional `POST /api/activity/view` | `{ type, refId }` |
| Avatar upload | `POST /api/auth/profile/photo` (multipart, size/type limits, storage) | returns `{ url }` |
| httpOnly cookie auth | Set-Cookie on login, CSRF protection | replaces `localStorage` JWT |
