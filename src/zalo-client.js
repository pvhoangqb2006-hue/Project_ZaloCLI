// src/zalo-client.js

import { ThreadType, Zalo } from "zca-js";

export class ZaloClient {
  constructor({
    accountId = null,
    database = null,
    logger = console,
  } = {}) {
    this.accountId = accountId;
    this.database = database;
    this.logger = logger;

    this.zalo = new Zalo();
    this.api = null;
    this.listener = null;
    this.messageHandler = null;
    this.connected = false;
    this.listening = false;
  }

  /**
   * Login to Zalo using a QR code.
   *
   * @returns {Promise<object>} zca-js API instance
   */
  async initialize() {
    if (this.connected && this.api) {
      return this.api;
    }

    try {
      this.logger.log("Generating Zalo login QR code...");
      this.logger.log(
        "Scan the QR code using the Zalo mobile application.",
      );

      this.api = await this.zalo.loginQR();

      if (!this.api) {
        throw new Error("zca-js did not return an API instance");
      }

      this.connected = true;

      this.logger.log(
        `Zalo account ${this.accountId ?? "default"} initialized`,
      );

      return this.api;
    } catch (error) {
      this.api = null;
      this.connected = false;

      throw new Error(
        `Unable to initialize Zalo client: ${error.message}`,
        {
          cause: error,
        },
      );
    }
  }

  /**
   * Alias for initialize().
   */
  async login() {
    return this.initialize();
  }

  /**
   * Start listening for incoming Zalo messages.
   *
   * @param {(message: object) => Promise<void> | void} onMessage
   */
  async startListening(onMessage = async () => {}) {
    this.ensureConnected();

    if (typeof onMessage !== "function") {
      throw new TypeError("onMessage must be a function");
    }

    if (this.listening) {
      throw new Error("Zalo message listener is already running");
    }

    if (!this.api.listener) {
      throw new Error(
        "The initialized Zalo API does not contain a listener",
      );
    }

    this.listener = this.api.listener;

    this.messageHandler = async (message) => {
      try {
        const normalizedMessage =
          this.normalizeMessage(message);

        // Ignore messages sent by the currently logged-in account.
        if (normalizedMessage.isSelf) {
          return;
        }

        await this.saveMessage(normalizedMessage);
        await onMessage(normalizedMessage);
      } catch (error) {
        this.logger.error(
          "Failed to process incoming Zalo message:",
          error,
        );
      }
    };

    this.listener.on("message", this.messageHandler);
    this.listener.start();

    this.listening = true;

    this.logger.log("Zalo message listener started");
  }

  /**
   * Convert a raw zca-js message into a stable internal structure.
   */
  normalizeMessage(message) {
    const data = message?.data ?? {};

    const rawTimestamp =
      data.ts ??
      data.timestamp ??
      message?.timestamp ??
      Date.now();

    const timestamp = this.normalizeTimestamp(rawTimestamp);

    const content =
      typeof data.content === "string"
        ? data.content
        : "";

    const threadType =
      message?.type === ThreadType.Group
        ? "group"
        : "user";

    return {
      messageId:
        data.msgId ??
        data.messageId ??
        message?.msgId ??
        null,

      senderId:
        data.uidFrom ??
        data.senderId ??
        data.userId ??
        null,

      threadId:
        message?.threadId ??
        data.threadId ??
        null,

      threadType,
      rawThreadType: message?.type ?? null,

      content,

      messageType:
        data.msgType ??
        data.type ??
        "unknown",

      timestamp,
      isSelf: Boolean(message?.isSelf),

      rawData: message,
    };
  }

  /**
   * Convert seconds or milliseconds to ISO format.
   */
  normalizeTimestamp(rawTimestamp) {
    const numericTimestamp = Number(rawTimestamp);

    if (!Number.isFinite(numericTimestamp)) {
      return new Date().toISOString();
    }

    // Values below 1e12 are probably Unix seconds.
    const milliseconds =
      numericTimestamp < 1_000_000_000_000
        ? numericTimestamp * 1000
        : numericTimestamp;

    const date = new Date(milliseconds);

    if (Number.isNaN(date.getTime())) {
      return new Date().toISOString();
    }

    return date.toISOString();
  }

  /**
   * Save an incoming message through an optional database repository.
   *
   * Expected repository interface:
   *
   * database.saveMessage(normalizedMessage)
   */
  async saveMessage(message) {
    if (!this.database) {
      return null;
    }

    if (typeof this.database.saveMessage === "function") {
      return this.database.saveMessage(message);
    }

    this.logger.warn(
      "Database was provided, but database.saveMessage() is not defined",
    );

    return null;
  }

  /**
   * Send a text message to a user or group.
   *
   * @param {string} threadId
   * @param {string} content
   * @param {number} threadType ThreadType.User or ThreadType.Group
   */
  async sendText(
    threadId,
    content,
    threadType = ThreadType.User,
  ) {
    this.ensureConnected();

    if (!threadId) {
      throw new Error("threadId is required");
    }

    if (typeof content !== "string" || !content.trim()) {
      throw new Error(
        "Message content must be a non-empty string",
      );
    }

    if (
      threadType !== ThreadType.User &&
      threadType !== ThreadType.Group
    ) {
      throw new Error(
        "threadType must be ThreadType.User or ThreadType.Group",
      );
    }

    try {
      return await this.api.sendMessage(
        {
          msg: content.trim(),
        },
        threadId,
        threadType,
      );
    } catch (error) {
      throw new Error(
        `Unable to send Zalo message: ${error.message}`,
        {
          cause: error,
        },
      );
    }
  }

  async sendTextToUser(userId, content) {
    return this.sendText(
      userId,
      content,
      ThreadType.User,
    );
  }

  async sendTextToGroup(groupId, content) {
    return this.sendText(
      groupId,
      content,
      ThreadType.Group,
    );
  }

  getApi() {
    this.ensureConnected();
    return this.api;
  }

  isConnected() {
    return this.connected;
  }

  isListening() {
    return this.listening;
  }

  ensureConnected() {
    if (!this.connected || !this.api) {
      throw new Error(
        "Zalo client is not initialized. Call initialize() first.",
      );
    }
  }

  /**
   * Stop the listener and clear the client state.
   */
  async stop() {
    if (this.listener) {
      try {
        if (
          this.messageHandler &&
          typeof this.listener.off === "function"
        ) {
          this.listener.off(
            "message",
            this.messageHandler,
          );
        }

        if (typeof this.listener.stop === "function") {
          await Promise.resolve(this.listener.stop());
        }
      } catch (error) {
        this.logger.error(
          "Failed to stop Zalo listener:",
          error,
        );
      }
    }

    this.listener = null;
    this.messageHandler = null;
    this.api = null;
    this.connected = false;
    this.listening = false;

    this.logger.log("Zalo client stopped");
  }
}

/**
 * Default singleton for a single-account application.
 */
export const zaloClient = new ZaloClient();