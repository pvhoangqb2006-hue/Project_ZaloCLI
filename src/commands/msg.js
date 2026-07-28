/**
 * Message commands — send and list messages.
 *
 * WEEK 1: stubbed. Actions just log what they'd do and return fake data.
 * WEEK 2: replace the STUB blocks with real calls once Dev 1 exposes
 * something like getApi() from core/zalo-client.js.
 */

import { output, success, error } from "../utils/output.js";

export function registerMsgCommands(program) {
    const msg = program.command("msg").description("Send and manage messages");

    msg.command("send <threadId> <text>")
        .description("Send a text message to a thread")
        .action(async (threadId, text) => {
            try {
                // --- STUB: replace with `await getApi().sendMessage(...)` in Week 2 ---
                const result = { threadId, text, status: "queued (stub)" };
                output(result, program.opts().json, () =>
                    success(`Would send "${text}" to ${threadId}`)
                );
            } catch (e) {
                error(`Send message failed: ${e.message}`);
            }
        });

    msg.command("list")
        .description("List recent messages (stub)")
        .option("-n, --limit <n>", "Number of messages to show", "10")
        .action(async (opts) => {
            try {
                // --- STUB: replace with a real fetch/DB read in Week 2/3 ---
                const result = { messages: [], limit: Number(opts.limit) };
                output(result, program.opts().json, () =>
                    success(`No messages yet (stub) — limit=${opts.limit}`)
                );
            } catch (e) {
                error(`List messages failed: ${e.message}`);
            }
        });
}
