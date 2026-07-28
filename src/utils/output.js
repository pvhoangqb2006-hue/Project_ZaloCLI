/**
 * Output formatting utilities — dual mode: colored human-readable text,
 * or machine-readable JSON (for scripts / CI / future MCP piping).
 *
 * Week 1 goal: prove this switching mechanism works. Every command module
 * (msg.js, profile.js, ...) should route its output through here instead
 * of calling console.log directly, so the whole CLI gets --json support
 * "for free" without touching each command's logic.
 */

import chalk from "chalk";

/**
 * Emit `data` either as JSON or via a human-readable formatter.
 *
 * @param {*} data - the raw result (object, array, string, etc.)
 * @param {boolean} jsonMode - true if --json flag was passed
 * @param {(data: any) => void} [humanFormatter] - optional custom text renderer.
 *   If omitted, falls back to pretty-printed JSON even in human mode
 *   (useful as a placeholder before a command has a real formatter yet).
 */
export function output(data, jsonMode, humanFormatter) {
    if (jsonMode) {
        console.log(JSON.stringify(data, null, 2));
    } else if (humanFormatter) {
        humanFormatter(data);
    } else {
        console.log(JSON.stringify(data, null, 2));
    }
}

export const success = (msg) => console.log(chalk.green("  ✓ " + msg));
export const error = (msg) => console.log(chalk.red("  ✗ " + msg));
export const info = (msg) => console.log(chalk.cyan("  ● " + msg));
export const warning = (msg) => console.log(chalk.yellow("  ⚠ " + msg));
