/**
 * Message commands — send and list messages.
 *
 * WEEK 2: `send` now makes a real (one-shot) call through core/zalo-client.js
 * — currently the mock, swapped for Dev 1's real version once it lands.
 * `list` stays stubbed since it depends on Dev 1's DB read functions,
 * expected later once sync/storage work is in place.
 */

import { getApi, autoLogin } from "../core/zalo-client-facade.js";
import { output, success, error } from "../utils/output.js";

export function registerMsgCommands(program) {
    const msg = program.command("msg").description("Send and manage messages");

    msg.command("send <threadId> <text>")
        .description("Send a text message to a thread")
        .option("-g, --group", "Send to a group thread instead of a direct user")
        .action(async (threadId, text, opts) => {
            try {
                await autoLogin();
                const api = getApi();
                const threadType = opts.group ? "group" : "user";
                const result = await api.sendMessage(threadId, text, threadType);
                output(result, program.opts().json, () =>
                    success(`Sent to ${threadId} (id: ${result.messageId})`)
                );
            } catch (e) {
                error(`Send message failed: ${e.message}`);
            }
        });

    msg.command("list")
        .description("List recent messages (stub — needs Dev 1's DB read functions)")
        .option("-n, --limit <n>", "Number of messages to show", "10")
        .action(async (opts) => {
            try {
                // --- STILL STUB: replace once Dev 1 exposes e.g. getMessages(threadId, limit) ---
                const result = { messages: [], limit: Number(opts.limit) };
                output(result, program.opts().json, () =>
                    success(`No messages yet (stub) — limit=${opts.limit}`)
                );
            } catch (e) {
                error(`List messages failed: ${e.message}`);
            }
        });
}
