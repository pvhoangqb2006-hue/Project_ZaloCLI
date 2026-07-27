#!/usr/bin/env node
// src/mcp/index.js
//
// Tuần 1 - Nhiệm vụ Dev 3: "Khởi tạo khung src/mcp/"
//
// Đây là điểm khởi động của MCP server. Ở giai đoạn này ta chỉ chạy
// qua transport "stdio" (giao tiếp qua stdin/stdout) - đơn giản, đủ để
// test với MCP Inspector hoặc Claude Desktop trước.
// Transport HTTP (cho việc host trên VPS) sẽ thêm ở Tuần 4.

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { getMessagesTool } from "./tools/get-messages.tool.js";
import { sendMessageTool } from "./tools/send-message.tool.js";

function createServer() {
  const server = new McpServer({
    name: "zalo-agent-mcp",
    version: "0.1.0",
  });

  // Đăng ký từng tool: mỗi tool là 1 object { name, title, description,
  // inputSchema, handler } định nghĩa ở src/mcp/tools/*.js
  for (const tool of [getMessagesTool, sendMessageTool]) {
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

  // Không dùng console.log ở đây! stdout dành riêng cho giao thức MCP.
  // Mọi log debug phải ra console.error (stderr) - giống ghi chú trong
  // report: "suppress log nội bộ để giữ stdout sạch cho piping/MCP".
  console.error("[zalo-mcp] Server đã sẵn sàng, đang lắng nghe qua stdio...");
}

main().catch((err) => {
  console.error("[zalo-mcp] Lỗi khởi động server:", err);
  process.exit(1);
});
