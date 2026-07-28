/**
 * TEMPLATE — copy this file when starting a new command group
 * (e.g. friend.js, group.js, conv.js). Not registered anywhere itself.
 *
 * Pattern:
 *   1. One `program.command("<group>")` as the parent.
 *   2. Subcommands hang off it with `.command("<name> <args>")`.
 *   3. Every `.action()` is wrapped in try/catch and routes its result
 *      through output() so --json works automatically.
 */

import { output, success, error } from "../utils/output.js";

export function registerTemplateCommands(program) {
    const group = program.command("template").description("Template command group — remove me");

    group
        .command("example <arg>")
        .description("Example subcommand")
        .action(async (arg) => {
            try {
                const result = { arg, ok: true };
                output(result, program.opts().json, () => success(`Handled ${arg}`));
            } catch (e) {
                error(`Example failed: ${e.message}`);
            }
        });
}
