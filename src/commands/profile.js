/**
 * Profile commands — view and update the logged-in account's profile.
 *
 * WEEK 1: stubbed, same pattern as msg.js. WEEK 2: wire to real API.
 */

import { output, success, error } from "../utils/output.js";

export function registerProfileCommands(program) {
    const profile = program.command("profile").description("View and update profile info");

    profile
        .command("get")
        .description("Show the current account's profile (stub)")
        .action(async () => {
            try {
                // --- STUB: replace with `await getApi().getProfile()` in Week 2 ---
                const result = { name: "(stub)", status: "not connected yet" };
                output(result, program.opts().json, () => success("Profile fetched (stub)"));
            } catch (e) {
                error(`Get profile failed: ${e.message}`);
            }
        });

    profile
        .command("update <json>")
        .description('Update profile fields (stub). JSON payload, e.g. \'{"name":"..."}\'')
        .action(async (json) => {
            try {
                const payload = JSON.parse(json);
                // --- STUB: replace with `await getApi().updateProfile(payload)` in Week 2 ---
                output(payload, program.opts().json, () => success("Profile updated (stub)"));
            } catch (e) {
                if (e instanceof SyntaxError) {
                    error(`Invalid JSON: ${e.message}`);
                } else {
                    error(`Update profile failed: ${e.message}`);
                }
            }
        });
}
