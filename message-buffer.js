export class MessageBuffer {
  constructor({ maxMessagesPerThread = 500 } = {}) {
    // threadId -> mảng tin nhắn đã lưu, sắp theo thứ tự đến
    this._threads = new Map();
    // seq toàn cục, tăng dần mỗi khi có 1 tin nhắn mới ở BẤT KỲ thread nào
    this._seq = 0;
    // giới hạn số tin nhắn giữ lại mỗi thread, tránh tràn RAM nếu chạy lâu ngày
    this._maxMessagesPerThread = maxMessagesPerThread;
  }

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

export const messageBuffer = new MessageBuffer();

export function wireMessageBuffer(zaloEventEmitter, buffer = messageBuffer) {
  zaloEventEmitter.on("message", (msg) => {
    const { threadId, ...rest } = msg;
    buffer.push(threadId, rest);
  });
}
