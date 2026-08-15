
import { classifyMessage } from "./thread-filter.js";

export class MessageBuffer {
  constructor({ maxMessagesPerThread = 500 } = {}) {
    this._threads = new Map();
    this._seq = 0;
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
    const nextCursor = page.length > 0 ? String(page[page.length - 1].seq) : cursor ?? null;

    return {
      messages: page,
      nextCursor,
      hasMore: unread.length > page.length,
    };
  }

  size() {
    let total = 0;
    for (const list of this._threads.values()) total += list.length;
    return total;
  }
}

export const messageBuffer = new MessageBuffer();

/**
 * Cổng vào duy nhất cho mọi tin nhắn - áp dụng ThreadFilter trước khi lưu.
 * @returns {{ stored: boolean, reason: string|null, message: object|null }}
 */
export function ingestMessage(threadId, rawMessage, { buffer = messageBuffer } = {}) {
  const { isNoise, reason } = classifyMessage(rawMessage);

  if (isNoise) {
    return { stored: false, reason, message: null };
  }

  const stored = buffer.push(threadId, rawMessage);
  return { stored: true, reason: null, message: stored };
}

/**
 * Nối MessageBuffer với nguồn phát sự kiện "message" thật (Zalo listener).
 */
export function wireMessageBuffer(zaloEventEmitter, buffer = messageBuffer) {
  zaloEventEmitter.on("message", (msg) => {
    const { threadId, ...rest } = msg;
    ingestMessage(threadId, rest, { buffer });
  });
}
