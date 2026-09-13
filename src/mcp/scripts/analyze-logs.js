#!/usr/bin/env node
// scripts/analyze-logs.js
import { readFileSync, existsSync } from "node:fs";
import { LOG_FILE_PATH } from "../src/mcp/interaction-logger.js";

if (!existsSync(LOG_FILE_PATH)) {
  console.log(`Chưa có log nào để phân tích tại: ${LOG_FILE_PATH}`);
  console.log("Hãy chạy server và gọi vài tool trước, rồi chạy lại script này.");
  process.exit(0);
}

const lines = readFileSync(LOG_FILE_PATH, "utf-8").trim().split("\n").filter(Boolean);
const entries = lines.map((line) => JSON.parse(line));

const toolCalls = entries.filter((e) => e.type === "tool_call");
const ingests = entries.filter((e) => e.type === "ingest");

console.log(`Tổng số dòng log: ${entries.length}`);
console.log(`Khoảng thời gian: ${entries[0]?.ts ?? "-"} → ${entries[entries.length - 1]?.ts ?? "-"}\n`);

console.log(`=== Tương tác AI <-> MCP tools (${toolCalls.length} lần gọi) ===`);
const byTool = {};
for (const c of toolCalls) {
  byTool[c.tool] ??= { count: 0, totalDuration: 0 };
  byTool[c.tool].count += 1;
  byTool[c.tool].totalDuration += c.durationMs;
}
for (const [tool, stat] of Object.entries(byTool)) {
  console.log(`  ${tool}: ${stat.count} lần, trung bình ${(stat.totalDuration / stat.count).toFixed(1)}ms`);
}

console.log(`\n=== ThreadFilter (${ingests.length} tin nhắn đi qua) ===`);
const stored = ingests.filter((i) => i.stored).length;
const filtered = ingests.length - stored;
const filterRate = ingests.length ? ((filtered / ingests.length) * 100).toFixed(1) : "0";
console.log(`  Được lưu: ${stored}`);
console.log(`  Bị lọc: ${filtered} (${filterRate}%)`);

const reasonCounts = {};
for (const i of ingests) {
  if (!i.stored) reasonCounts[i.reason] = (reasonCounts[i.reason] ?? 0) + 1;
}
if (Object.keys(reasonCounts).length > 0) {
  console.log("  Lý do bị lọc:");
  for (const [reason, count] of Object.entries(reasonCounts)) {
    console.log(`    - ${reason}: ${count}`);
  }
}
