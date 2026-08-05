# API Contract Proposal — Command/API ↔ Core (Dev 2 ↔ Dev 1)

**Purpose:** so Dev 2 can build `msg`/`profile` commands this week without
waiting on Dev 1's real Zalo integration, and so Dev 1 knows exactly what
shape to deliver. `src/core/zalo-client.js` currently contains a mock
matching this contract — Dev 1's real file replaces it at the same path,
same function names, same return shapes. Nothing in `src/commands/` should
need to change when that swap happens.

## Functions

### `autoLogin(): Promise<void>`
Ensures a valid session exists. Real version: QR login flow, session
persisted via `credentials.js`. Should be safe to call on every command
invocation — a no-op if already logged in.

### `getOwnId(): string | null`
The logged-in account's ID, or `null` if not logged in.

### `clearSession(): void`
Wipes the stored session — used for fatal auth errors / forcing re-login.

### `getApi(): object`
Returns an object with the methods below.

#### `api.sendMessage(threadId: string, text: string): Promise<{ success: boolean, messageId: string }>`
Sends a text message. Throws on failure (network error, invalid thread, etc.) — commands catch and report via `error()`.

#### `api.getProfile(): Promise<{ id: string, name: string, avatar: string | null }>`
Returns the logged-in account's profile.

#### `api.updateProfile(fields: object): Promise<{ success: boolean, updated: object }>`
Updates the given fields; returns what was actually applied.

## Not yet covered (flag for later weeks)
- Reading message history / listing messages — depends on Dev 1's DB layer (`msg list` stays stubbed until this exists, likely Week 3 alongside `sync`).
- Error types — right now commands just catch `Error` generically. Worth agreeing whether Dev 1 will throw distinct error types/codes (e.g. `AUTH_EXPIRED` vs `NETWORK_ERROR`) so commands can react differently, or whether that's over-engineering for now.

## Discussion points for Thursday sync
- Does this match what Dev 1 is already planning, or does `zca-js` push the real shape in a different direction?
- Confirm `autoLogin()` behavior when there's no saved session at all (does it trigger an interactive QR prompt, or throw and expect the user to run a separate `login` command first?).

---

## Addendum — findings after reviewing Dev 1's actual `zalo-client.js` (Week 1)

Dev 1's real file was checked against this contract, statically imported against
the real `zca-js` v2.1.2 package (no syntax errors, imports/API calls match
`zca-js`'s documented usage — `new Zalo()`, `zalo.loginQR()`,
`api.listener.on("message", ...)`, `api.sendMessage({ msg }, threadId, threadType)`,
`ThreadType.User`/`ThreadType.Group` are all correct), and exercised end-to-end
through the command layer. **Correctness of what's there is solid.** But the
shape doesn't match this contract as originally written:

| This contract proposed | Dev 1 actually built |
|---|---|
| Standalone functions: `autoLogin()`, `getApi()`, `getOwnId()`, `clearSession()` | A `ZaloClient` **class** + a `zaloClient` singleton, with instance methods: `initialize()`/`login()`, `sendText()`/`sendTextToUser()`/`sendTextToGroup()`, `getApi()` (returns the **raw** zca-js api), `isConnected()`, `stop()` |
| `sendMessage(threadId, text)` — no way to say user vs. group | `sendText(threadId, content, threadType)` — **correctly requires** `ThreadType.User`/`ThreadType.Group`, because Zalo actually needs that distinction. **This contract was underspecified — the fix belongs in the contract, not a workaround.** |
| `getOwnId()` | Not implemented. (The real zca-js `api` *does* expose `api.getOwnId()` once logged in — trivial to add: `getOwnId() { return this.api?.getOwnId() ?? null; }`) |
| `clearSession()` | Not implemented. `stop()` exists but only resets in-memory state — no persisted-credentials logic exists in this file at all yet. |
| `getProfile()` / `updateProfile()` | Not implemented at all — no profile-related methods in the file. |

**A temporary bridge exists at `src/core/zalo-client-facade.js`** so `msg.js`/`profile.js` don't have to change again mid-week. It:
- wraps `zaloClient.initialize()` as `autoLogin()`
- adds `getOwnId()` by reaching into the raw api (flagged as something Dev 1 should own directly instead)
- maps `clearSession()` → `stop()` (flagged as incomplete — no credential wipe)
- wraps `sendText()`/`sendTextToUser()`/`sendTextToGroup()` into a single `sendMessage(threadId, text, threadType)`
- makes `getProfile()`/`updateProfile()` throw clear "not implemented yet" errors instead of silently returning nothing

This was tested against the **real** `zalo-client.js` (not the mock): a real `msg send` call correctly attempts a real Zalo login, fails cleanly with `Unable to initialize Zalo client: Cannot get API login version` (expected — this environment has no path to Zalo's servers), and the error surfaces through `error()` with no crash and exit code 0. So the error-handling chain across both devs' code is confirmed sound; what's left is a real login test on a machine with real network access.

**Proposal for Thursday:** either (a) Dev 1 adds `getOwnId()`, `clearSession()`, `getProfile()`, `updateProfile()` directly to `zalo-client.js` and the facade gets deleted, or (b) the facade stays as the permanent seam between the two layers. Also: **revise `sendMessage`'s signature in this contract to take a `threadType`** — that gap was ours, not Dev 1's.
