// src/mcp/interaction-logger.js
import { appendFileSync, mkdirSync } from "node:fs";
import path from "node:path";

const LOG_DIR = path.resolve(process.cwd(), "logs");
export const LOG_FILE_PATH = path.join(LOG_DIR, "interaction.log");

export function logInteraction(entry) {
  mkdirSync(LOG_DIR, { recursive: true });
  const line = JSON.stringify({ ts: new Date().toISOString(), ...entry }) + "\n";
  appendFileSync(LOG_FILE_PATH, line);
}

/**
 * Bọc 1 tool để tự động ghi log mỗi lần AI Agent gọi: tên tool, input, thời gian xử lý.
 */
export function withInteractionLog(tool) {
  return {
    ...tool,
    async handler(args) {
      const start = Date.now();
      const result = await tool.handler(args);
      logInteraction({
        type: "tool_call",
        tool: tool.name,
        input: args,
        durationMs: Date.now() - start,
      });
      return result;
    },
  };
}
