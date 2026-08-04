// src/mcp/tools/dev-seed-message.tool.js
//
// ⚠️ TOOL TẠM THỜI - CHỈ DÙNG ĐỂ DEV/TEST TUẦN 2 ⚠️
//
// Vì Dev 4 chưa xong luồng `daemon listen` thật (dự kiến tuần 3), tool này
// giả lập việc "có 1 tin nhắn mới vừa đến" bằng cách gọi thẳng
// messageBuffer.push(...) - y hệt cách mà listener thật sau này sẽ gọi
// qua wireMessageBuffer() trong message-buffer.js.
//
// KHI TUẦN 3 XONG: xóa tool này khỏi index.js (và xóa luôn file này),
// vì lúc đó tin nhắn sẽ tự động chảy vào buffer từ Zalo thật, không cần
// giả lập bằng tay nữa.

import { z } from "zod";
import { messageBuffer } from "../message-buffer.js";

export const devSeedMessageTool = {
  name: "dev_seed_message",
  title: "[DEV] Giả lập tin nhắn đến",
  description:
    "[CHỈ DÙNG ĐỂ TEST] Giả lập một tin nhắn Zalo vừa đến, đẩy thẳng vào " +
    "MessageBuffer để test tool zalo_get_messages mà không cần kết nối Zalo thật.",
  inputSchema: {
    threadId: z.string().min(1).describe("ID cuộc trò chuyện muốn giả lập tin nhắn đến"),
    text: z.string().min(1).describe("Nội dung tin nhắn giả lập"),
    fromId: z.string().optional().default("fake_user_999").describe("ID người gửi giả lập"),
  },

  async handler({ threadId, text, fromId }) {
    const stored = messageBuffer.push(threadId, { fromId, text, type: "text" });

    return {
      content: [
        {
          type: "text",
          text: `Đã đẩy 1 tin nhắn giả vào buffer: ${JSON.stringify(stored)}`,
        },
      ],
      structuredContent: stored,
    };
  },
};
