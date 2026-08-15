
import { z } from "zod";
import { ingestMessage } from "../message-buffer.js";

export const devSeedMessageTool = {
  name: "dev_seed_message",
  title: "[DEV] Giả lập tin nhắn đến",
  description:
    "[CHỈ DÙNG ĐỂ TEST] Giả lập một tin nhắn Zalo vừa đến, đẩy qua ingestMessage() " +
    "để test cả việc lưu tin lẫn việc lọc nhiễu.",
  inputSchema: {
    threadId: z.string().min(1).describe("ID cuộc trò chuyện muốn giả lập tin nhắn đến"),
    text: z.string().optional().default("").describe("Nội dung tin nhắn giả lập"),
    type: z
      .enum(["text", "sticker", "gif", "system", "notify", "revoke"])
      .optional()
      .default("text")
      .describe("Loại tin nhắn giả lập"),
    fromId: z.string().optional().default("fake_user_999").describe("ID người gửi giả lập"),
  },

  async handler({ threadId, text, type, fromId }) {
    const result = ingestMessage(threadId, { fromId, text, type });

    const summary = result.stored
      ? `Đã lưu tin nhắn vào buffer (seq=${result.message.seq}).`
      : `Tin nhắn bị lọc bỏ. Lý do: ${result.reason}`;

    return {
      content: [{ type: "text", text: summary }],
      structuredContent: result,
    };
  },
};
