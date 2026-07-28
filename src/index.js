#!/usr/bin/env node

import { Command } from "commander";
import {
  initializeDatabase,
  closeDatabase,
} from "./database/database.js";
import { zaloClient } from "./zalo-client.js";

const program = new Command();

initializeDatabase();

program
  .name("zalo-agent")
  .description("CLI tool for Zalo automation")
  .version("1.8.5");

program
  .command("database-status")
  .description("Check SQLite database")
  .action(() => {
    console.log("SQLite database is ready.");
  });

program
  .command("zalo-status")
  .description("Check Zalo client integration")
  .action(() => {
    console.log("Zalo client loaded successfully.");
    console.log("Connected:", zaloClient.isConnected());
    console.log("Listening:", zaloClient.isListening());
  });

program
  .command("login")
  .description("Login to Zalo using QR code")
  .action(async () => {
    try {
      await zaloClient.initialize();

      console.log("Zalo login successful.");
      console.log("Connected:", zaloClient.isConnected());
    } catch (error) {
      console.error("Zalo login failed:", error.message);
      process.exitCode = 1;
    }
  });

program
  .command("listen")
  .description("Login and listen for Zalo messages")
  .action(async () => {
    try {
      await zaloClient.initialize();

      await zaloClient.startListening(async (message) => {
        console.log("Incoming Zalo message:");
        console.dir(message, {
          depth: 4,
        });
      });

      console.log("Listening for Zalo messages...");
    } catch (error) {
      console.error(
        "Unable to start Zalo listener:",
        error.message,
      );

      process.exitCode = 1;
    }
  });

async function shutdown() {
  try {
    await zaloClient.stop();
    closeDatabase();
  } catch (error) {
    console.error("Shutdown error:", error.message);
  } finally {
    process.exit(0);
  }
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

await program.parseAsync(process.argv);