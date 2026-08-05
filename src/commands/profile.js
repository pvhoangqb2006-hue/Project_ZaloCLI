/**
 * Profile commands — view and update the logged-in account's profile.
 *
 * WEEK 2: both subcommands now make real (one-shot) calls through
 * core/zalo-client.js — currently the mock, swapped for Dev 1's real
 * version once it lands.
 */

import { getApi, autoLogin } from "../core/zalo-client-facade.js";
import { output, success, error } from "../utils/output.js";

export function registerProfileCommands(program) {
    const profile = program.command("profile").description("View and update profile info");

    profile
        .command("get")
        .description("Show the current account's profile")
        .action(async () => {
            try {
                await autoLogin();
                const api = getApi();
                const result = await api.getProfile();
                output(result, program.opts().json, () =>
                    success(`Profile: ${result.name} (${result.id})`)
                );
            } catch (e) {
                error(`Get profile failed: ${e.message}`);
            }
        });

    profile
        .command("update <json>")
        .description('Update profile fields. JSON payload, e.g. \'{"name":"..."}\'')
        .action(async (json) => {
            try {
                const payload = JSON.parse(json);
                await autoLogin();
                const api = getApi();
                const result = await api.updateProfile(payload);
                output(result, program.opts().json, () => success("Profile updated"));
            } catch (e) {
                if (e instanceof SyntaxError) {
                    error(`Invalid JSON: ${e.message}`);
                } else {
                    error(`Update profile failed: ${e.message}`);
                }
            }
        });
}
