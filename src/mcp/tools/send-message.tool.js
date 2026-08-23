// src/mcp/tools/send-message.tool.js
//
// Định nghĩa tool "zalo_send_message" để đăng ký vào MCP server.
// Tuần 1: chỉ log lại + trả về kết quả giả (stub).
// Tuần 2: nối thật với api.sendMessage() từ zalo-client.js (Dev 1).

import { sendMessageInputSchema } from "../schemas/tools.schema.js";

export const sendMessageTool = {
  name: "zalo_send_message",
  title: "Gửi tin nhắn Zalo",
  description:
    "Gửi một tin nhắn văn bản tới một người hoặc một nhóm trên Zalo.",
  inputSchema: sendMessageInputSchema,

  async handler({ threadId, text, isGroup }) {
    // TODO (Tuần 2): thay đoạn này bằng
    //   await zaloClient.getApi().sendMessage(text, threadId, isGroup ? ThreadType.Group : ThreadType.User);
    const stubResult = {
      sent: true,
      threadId,
      isGroup,
      preview: text.length > 50 ? text.slice(0, 50) + "..." : text,
      note: "STUB Tuần 1: chưa nối zalo-client thật, tin nhắn KHÔNG thực sự được gửi.",
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
