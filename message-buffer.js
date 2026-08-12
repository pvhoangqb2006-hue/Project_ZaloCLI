export class MessageBuffer {
  constructor({ maxMessagesPerThread = 500 } = {}) {
    // threadId -> mảng tin nhắn đã lưu, sắp theo thứ tự đến
    this._threads = new Map();
    // seq toàn cục, tăng dần mỗi khi có 1 tin nhắn mới ở BẤT KỲ thread nào
    this._seq = 0;
    // giới hạn số tin nhắn giữ lại mỗi thread, tránh tràn RAM nếu chạy lâu ngày
    this._maxMessagesPerThread = maxMessagesPerThread;
  }

  /**
   * Thêm 1 tin nhắn mới vào buffer.
   * Đây là hàm mà nguồn phát tin nhắn (Zalo listener thật ở tuần 3,
   * hoặc tool giả lập ở tuần 2) sẽ gọi.
   *
   * @param {string} threadId - id của cuộc trò chuyện
   * @param {object} message - nội dung tin nhắn thô, ví dụ { fromId, text, type }
   * @returns {object} tin nhắn đã lưu, kèm seq + threadId + receivedAt
   */
  push(threadId, message) {
    if (!threadId) throw new Error("MessageBuffer.push: thiếu threadId");

    this._seq += 1;
    const stored = {
      ...message,
      threadId,
      seq: this._seq,
      receivedAt: new Date().toISOString(),
    };

    if (!this._threads.has(threadId)) {
      this._threads.set(threadId, []);
    }
    const list = this._threads.get(threadId);
    list.push(stored);

    // Cắt bớt tin cũ nếu vượt giới hạn, chỉ giữ N tin gần nhất
    if (list.length > this._maxMessagesPerThread) {
      list.splice(0, list.length - this._maxMessagesPerThread);
    }

    return stored;
  }

  /**
   * Đọc tin nhắn của 1 thread, có phân trang bằng cursor.
   *
   * @param {object} params
   * @param {string} params.threadId
   * @param {number} [params.limit=20]
   * @param {string} [params.cursor] - seq của tin nhắn cuối cùng đã đọc lần trước
   * @returns {{ messages: object[], nextCursor: string|null, hasMore: boolean }}
   */
  read({ threadId, limit = 20, cursor }) {
    const list = this._threads.get(threadId) || [];
    const afterSeq = cursor ? Number(cursor) : 0;

    const unread = list.filter((m) => m.seq > afterSeq);
    const page = unread.slice(0, limit);

    const nextCursor =
      page.length > 0 ? String(page[page.length - 1].seq) : cursor ?? null;

    return {
      messages: page,
      nextCursor,
      hasMore: unread.length > page.length,
    };
  }

  /** Tổng số tin nhắn đang giữ trong RAM (hữu ích để debug/log). */
  size() {
    let total = 0;
    for (const list of this._threads.values()) total += list.length;
    return total;
  }
}

// -----------------------------------------------------------------------
// SINGLETON: toàn bộ MCP server dùng chung 1 instance duy nhất của
// MessageBuffer. Mọi tool (get_messages, dev-seed...) và sau này là
// listener thật của Dev 4 đều import CHÍNH instance này, để đảm bảo
// dữ liệu nhất quán trong suốt vòng đời của tiến trình server.
// -----------------------------------------------------------------------
export const messageBuffer = new MessageBuffer();

/**
 * ĐIỂM NỐI cho tuần 3: khi Dev 4 hoàn thành luồng `daemon listen`
 * (thường là 1 EventEmitter phát sự kiện "message" mỗi khi Zalo có
 * tin nhắn mới), chỉ cần gọi:
 *
 *   import { wireMessageBuffer, messageBuffer } from "./message-buffer.js";
 *   wireMessageBuffer(zaloListenerEmitter, messageBuffer);
 *
 * và MessageBuffer sẽ tự động nhận tin thật, không cần sửa gì trong
 * message-buffer.js hay các tool đang dùng nó.
 *
 * @param {import("events").EventEmitter} zaloEventEmitter - emitter phát event "message"
 * @param {MessageBuffer} buffer - instance MessageBuffer muốn nối vào (mặc định dùng singleton)
 */
export function wireMessageBuffer(zaloEventEmitter, buffer = messageBuffer) {
  zaloEventEmitter.on("message", (msg) => {
    // Kỳ vọng msg thật từ Dev 4 có dạng tối thiểu { threadId, ...nộidung }.
    // Nếu format thực tế khác, chỉ cần sửa DUY NHẤT dòng map bên dưới,
    // không cần đụng vào logic MessageBuffer hay các tool MCP.
    const { threadId, ...rest } = msg;
    buffer.push(threadId, rest);
  });
}
