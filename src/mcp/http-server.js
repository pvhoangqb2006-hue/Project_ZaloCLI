#!/usr/bin/env node
// src/mcp/http-server.js
import http from "node:http";
import { randomUUID } from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

import { getMessagesTool } from "./tools/get-messages.tool.js";
import { sendMessageTool } from "./tools/send-message.tool.js";
import { devSeedMessageTool } from "./tools/dev-seed-message.tool.js";

const PORT = process.env.MCP_HTTP_PORT ? Number(process.env.MCP_HTTP_PORT) : 8787;
const AUTH_TOKEN = process.env.MCP_HTTP_TOKEN;

function createMcpServer() {
  const server = new McpServer({ name: "zalo-agent-mcp", version: "0.4.0" });

  for (const tool of [getMessagesTool, sendMessageTool, devSeedMessageTool]) {
    server.registerTool(
      tool.name,
      { title: tool.title, description: tool.description, inputSchema: tool.inputSchema },
      tool.handler
    );
  }

  return server;
}

function isAuthorized(req) {
  if (!AUTH_TOKEN) return true;
  return req.headers["authorization"] === `Bearer ${AUTH_TOKEN}`;
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => {
      if (!data) return resolve(undefined);
      try {
        resolve(JSON.parse(data));
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });
}

async function main() {
  const mcpServer = createMcpServer();
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: () => randomUUID() });
  await mcpServer.connect(transport);

  const httpServer = http.createServer(async (req, res) => {
    if (req.url !== "/mcp") {
      res.writeHead(404).end("Not Found");
      return;
    }

    if (!isAuthorized(req)) {
      res.writeHead(401, { "Content-Type": "application/json" }).end(
        JSON.stringify({ error: "Unauthorized" })
      );
      return;
    }

    try {
      const body = req.method === "POST" ? await readJsonBody(req) : undefined;
      await transport.handleRequest(req, res, body);
    } catch (err) {
      console.error("[zalo-mcp-http] Lỗi xử lý request:", err);
      if (!res.headersSent) res.writeHead(500).end("Internal Server Error");
    }
  });

  httpServer.listen(PORT, () => {
    console.error(`[zalo-mcp-http] Đang chạy tại http://localhost:${PORT}/mcp`);
    if (!AUTH_TOKEN) {
      console.error("[zalo-mcp-http] CẢNH BÁO: chưa đặt MCP_HTTP_TOKEN, mọi request đều được chấp nhận.");
    }
  });
}

main().catch((err) => {
  console.error("[zalo-mcp-http] Lỗi khởi động:", err);
  process.exit(1);
});
