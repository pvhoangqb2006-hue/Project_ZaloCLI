// src/mcp/thread-filter.js

const SYSTEM_MESSAGE_TYPES = new Set(["system", "notify", "revoke"]);
const STICKER_MESSAGE_TYPES = new Set(["sticker", "gif"]);

const ZERO_WIDTH_JOINER = /\u200d/gu;
const VARIATION_SELECTOR = /\ufe0f/gu;
const SKIN_TONE_MODIFIER = /[\u{1F3FB}-\u{1F3FF}]/gu;

function isEmojiOnly(text) {
  const stripped = text
    .replace(ZERO_WIDTH_JOINER, "")
    .replace(VARIATION_SELECTOR, "")
    .replace(SKIN_TONE_MODIFIER, "")
    .trim();

  if (!stripped) return false;
  return /^\p{Extended_Pictographic}+$/u.test(stripped);
}

/**
 * Phân loại 1 tin nhắn có phải nhiễu hay không (sticker, gif, system, emoji-only, rỗng).
 * @param {object} message
 * @returns {{ isNoise: boolean, reason: string|null }}
 */
export function classifyMessage(message) {
  const type = message?.type ?? "text";

  if (SYSTEM_MESSAGE_TYPES.has(type)) {
    return { isNoise: true, reason: `system_message(${type})` };
  }

  if (STICKER_MESSAGE_TYPES.has(type)) {
    return { isNoise: true, reason: `sticker_or_gif(${type})` };
  }

  if (type === "text") {
    const text = (message.text ?? "").trim();
    if (!text) return { isNoise: true, reason: "empty_text" };
    if (isEmojiOnly(text)) return { isNoise: true, reason: "emoji_only" };
  }

  return { isNoise: false, reason: null };
}

export function isNoiseMessage(message) {
  return classifyMessage(message).isNoise;
}
