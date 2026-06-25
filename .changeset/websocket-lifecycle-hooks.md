---
"rserve-ts": patch
---

fix: improve WebSocket lifecycle handling with `on_socket` and error callbacks

Add an optional `on_socket` hook so callers can attach listeners to the underlying WebSocket. Guard `onclose` when the connection has not yet been established, and route WebSocket `onerror` through `on_close` with code 1006 so failed connections are detected reliably.
