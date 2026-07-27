// src/mcp/tools/get-messages.tool.js
//
// Định nghĩa tool "zalo_get_messages" để đăng ký vào MCP server.
// Tuần 1: chỉ trả về dữ liệu giả (stub) để test được luồng đăng ký tool.
// Tuần 2-3: nối thật với MessageBuffer (RAM) + ThreadFilter.

import { getMessagesInputSchema } from "../schemas/tools.schema.js";

export const getMessagesTool = {
  name: "zalo_get_messages",
  title: "Lấy tin nhắn Zalo",
  description:
    "Lấy các tin nhắn mới nhất từ một cuộc trò chuyện Zalo (cá nhân hoặc nhóm). " +
    "Dùng cursor để lấy tiếp các tin nhắn sau lần gọi trước, tránh bị trùng.",
  inputSchema: getMessagesInputSchema,

  // handler nhận input ĐÃ ĐƯỢC Zod validate sẵn bởi McpServer.
  async handler({ threadId, limit, cursor }) {
    // TODO (Tuần 2-3): thay đoạn này bằng
    //   const { messages, nextCursor } = messageBuffer.read({ threadId, limit, cursor });
    const stubResult = {
      threadId,
      messages: [],
      nextCursor: null,
      note:
        "STUB Tuần 1: chưa nối MessageBuffer thật. " +
        `(limit=${limit}, cursor=${cursor ?? "none"})`,
    };

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(stubResult, null, 2),
        },
      ],
      structuredContent: stubResult,
    };
  },
};
