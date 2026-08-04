#!/usr/bin/env node
// src/mcp/index.js
//
// Tuần 2: thêm tool dev_seed_message (tạm thời) để test MessageBuffer.

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { getMessagesTool } from "./tools/get-messages.tool.js";
import { sendMessageTool } from "./tools/send-message.tool.js";
import { devSeedMessageTool } from "./tools/dev-seed-message.tool.js";

function createServer() {
  const server = new McpServer({
    name: "zalo-agent-mcp",
    version: "0.2.0",
  });

  // TODO (sau tuần 3): bỏ devSeedMessageTool khỏi danh sách này khi
  // luồng daemon listen thật của Dev 4 đã nối qua wireMessageBuffer().
  for (const tool of [getMessagesTool, sendMessageTool, devSeedMessageTool]) {
    server.registerTool(
      tool.name,
      {
        title: tool.title,
        description: tool.description,
        inputSchema: tool.inputSchema,
      },
      tool.handler
    );
  }

  return server;
}

async function main() {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error("[zalo-mcp] Server đã sẵn sàng, đang lắng nghe qua stdio...");
}

main().catch((err) => {
  console.error("[zalo-mcp] Lỗi khởi động server:", err);
  process.exit(1);
});
