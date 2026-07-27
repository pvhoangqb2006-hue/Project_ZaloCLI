// src/mcp/schemas/tools.schema.js
//
// Tuần 1 - Nhiệm vụ Dev 3 (AI & MCP Server):
// "Định nghĩa schema (Zod) cho tool get/send message"
//
// File này chỉ định nghĩa HÌNH DẠNG dữ liệu (input) mà mỗi tool MCP
// chấp nhận. Chưa xử lý logic thật (đó là việc của Tuần 2 trở đi,
// khi nối với MessageBuffer thật của Dev 1/Dev 3).
//
// Vì sao cần Zod ở đây?
// AI Agent gọi tool bằng cách "đoán" tham số dựa trên mô tả (description).
// Zod đứng ra kiểm tra input TRƯỚC khi chạy logic thật, để nếu AI gửi
// sai định dạng (vd. gửi số thay vì chuỗi, thiếu field bắt buộc...)
// thì server trả lỗi rõ ràng ngay, thay vì crash ở tầng dưới.

import { z } from "zod";

/**
 * Input cho tool "zalo_get_messages".
 * Dùng để AI Agent lấy các tin nhắn mới từ một cuộc trò chuyện,
 * đọc theo kiểu phân trang (cursor) từ MessageBuffer (RAM).
 */
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

/**
 * Input cho tool "zalo_send_message".
 * Dùng để AI Agent gửi một tin nhắn văn bản tới 1 người hoặc 1 nhóm.
 */
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
