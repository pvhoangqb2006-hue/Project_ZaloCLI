import { getMessagesInputSchema } from "../schemas/tools.schema.js";
import { messageBuffer } from "../message-buffer.js";

export const getMessagesTool = {
  name: "zalo_get_messages",
  title: "Lấy tin nhắn Zalo",
  description:
    "Lấy các tin nhắn mới nhất từ một cuộc trò chuyện Zalo (cá nhân hoặc nhóm). " +
    "Dùng cursor để lấy tiếp các tin nhắn sau lần gọi trước, tránh bị trùng.",
  inputSchema: getMessagesInputSchema,

  async handler({ threadId, limit, cursor }) {
    const result = messageBuffer.read({ threadId, limit, cursor });

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
      structuredContent: result,
    };
  },
};
