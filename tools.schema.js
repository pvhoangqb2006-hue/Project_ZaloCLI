
import { z } from "zod";


export const getMessagesInputSchema = {
  threadId: z
    .string()
    .min(1, "threadId không được để trống")
    .describe("ID của cuộc trò chuyện (userId hoặc groupId) cần lấy tin nhắn"),

  limit: z
    .number()
    .int()
    .min(1)
    .max(100)
    .default(20)
    .describe("Số lượng tin nhắn tối đa muốn lấy trong 1 lần gọi (1-100)"),

  cursor: z
    .string()
    .optional()
    .describe(
      "Con trỏ phân trang lấy từ kết quả (nextCursor) của lần gọi trước. " +
        "Bỏ trống nếu đây là lần gọi đầu tiên."
    ),
};


export const sendMessageInputSchema = {
  threadId: z
    .string()
    .min(1, "threadId không được để trống")
    .describe("ID của người nhận (userId) hoặc nhóm (groupId)"),

  text: z
    .string()
    .min(1, "Nội dung tin nhắn không được để trống")
    .max(5000, "Nội dung tin nhắn quá dài")
    .describe("Nội dung văn bản của tin nhắn cần gửi"),

  isGroup: z
    .boolean()
    .default(false)
    .describe("true nếu threadId là ID nhóm, false nếu là ID cá nhân"),
};
