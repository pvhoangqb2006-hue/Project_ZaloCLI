/**
 * src/core/zalo-client-facade.js
 *
 * PROPOSAL — bridges Dev 1's real ZaloClient class/singleton
 * (zalo-client-real.js) to the small functional interface the command
 * layer already depends on (autoLogin / getApi / getOwnId / clearSession,
 * from API-CONTRACT.md v1). Bring this to the Week 2 sync as a concrete
 * patch to discuss, not a silent workaround — several methods here stand
 * in for things zalo-client.js doesn't implement yet (see comments).
 */

import { zaloClient } from "./zalo-client-real.js";

export async function autoLogin() {
    await zaloClient.initialize(); // .login() is just an alias for this
}

export function getOwnId() {
    if (!zaloClient.isConnected()) return null;
    // zalo-client.js doesn't expose this yet. The underlying zca-js `api`
    // DOES support api.getOwnId() once logged in (confirmed against
    // zca-js's own docs) — cleaner fix is for Dev 1 to add
    // `getOwnId() { return this.api?.getOwnId() ?? null; }` to the class
    // directly rather than us reaching into getApi() from out here.
    const rawApi = zaloClient.getApi();
    return typeof rawApi.getOwnId === "function" ? rawApi.getOwnId() : null;
}

export function clearSession() {
    // zalo-client.js has no clearSession(). stop() is the closest thing,
    // but it only resets in-memory state — it does NOT wipe any persisted
    // credentials file, because there's no credentials-persistence logic
    // in this file at all yet. Flag this gap at the sync.
    return zaloClient.stop();
}

export function getApi() {
    return {
        async sendMessage(threadId, text, threadType = "user") {
            const send =
                threadType === "group"
                    ? zaloClient.sendTextToGroup.bind(zaloClient)
                    : zaloClient.sendTextToUser.bind(zaloClient);

            const raw = await send(threadId, text);
            // NOTE: exact response shape from zca-js's sendMessage() isn't
            // confirmed against a real logged-in call yet — these are
            // best-guess fallback paths, same defensive style Dev 1 used
            // in normalizeMessage(). Verify and tighten once someone on
            // the team can actually log in and inspect a real response.
            const messageId = raw?.message?.msgId ?? raw?.msgId ?? raw?.data?.msgId ?? null;
            return { success: true, messageId, raw };
        },

        async getProfile() {
            // Not implemented in zalo-client.js at all yet.
            throw new Error(
                "getProfile() is not implemented in Dev 1's zalo-client.js yet — raise at Week 2 sync"
            );
        },

        async updateProfile(_fields) {
            throw new Error(
                "updateProfile() is not implemented in Dev 1's zalo-client.js yet — raise at Week 2 sync"
            );
        },
    };
}
