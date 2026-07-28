# Zalo Agent CLI

A Node.js command-line application for building Zalo automation features with a local SQLite database.

The project currently provides the infrastructure needed to:

- Start a CLI application with Commander
- Initialize a local SQLite database
- Create six core business tables
- Create an FTS5 full-text search index for messages
- Load a basic `ZaloClient`
- Check database and client integration from the command line

> This repository is currently at the infrastructure stage. The database layer and basic Zalo client structure are available, while production-ready login, synchronization, chatbot, and automation workflows may still require further implementation.

---

## Requirements

Before running the project, install:

- Node.js 20 or newer
- npm

Check your versions:

```bash
node --version
npm --version
```

The Node.js version should be `v20` or newer.

---

## Installation

Clone or download the project, then open a terminal in the project directory.

Install dependencies:

```bash
npm install
```

---

## Running the CLI

Display the available commands:

```bash
npm run cli -- --help
```

Example output:

```text
Usage: zalo-agent [options] [command]

CLI tool for Zalo automation

Options:
  -V, --version    output the version number
  -h, --help       display help for command

Commands:
  database-status  Check SQLite database
  zalo-status      Check Zalo client integration
  login            Login to Zalo
  listen           Listen for Zalo messages
  help [command]   display help for command
```

The exact command list depends on the commands currently registered in `src/index.js`.

---

## Available Commands

### Check the database

```bash
npm run cli -- database-status
```

Expected result:

```text
Database initialized: .../data/zalo.db
SQLite database is ready.
```

This command confirms that:

- The database module can be imported
- SQLite can open the database
- The database file has been created
- The schema initialization code has run

---

### Check the Zalo client

```bash
npm run cli -- zalo-status
```

Expected result before login:

```text
Zalo client loaded successfully.
Connected: false
Listening: false
```

`false` is normal before a Zalo account has been connected.

This command confirms that `src/zalo-client.js` is correctly integrated into the CLI.

---

### Start login

```bash
npm run cli -- login
```

This command should initialize the Zalo client and start the configured login flow.

The exact behavior depends on the current implementation of `ZaloClient.initialize()`.

---

### Start the message listener

```bash
npm run cli -- listen
```

This command should:

1. Initialize the Zalo client
2. Connect to the configured account
3. Start listening for incoming messages
4. Normalize received message data
5. Pass messages to the configured handler

A real login and valid Zalo API instance are required before the listener can work.

---

## Project Structure

```text
zalo_agent/
├── data/
│   └── zalo.db
├── src/
│   ├── database/
│   │   └── database.js
│   ├── index.js
│   └── zalo-client.js
├── package.json
├── package-lock.json
└── README.md
```

### `src/index.js`

The main CLI entry point.

Responsibilities:

- Create the Commander program
- Register CLI commands
- Initialize the database
- Load the Zalo client
- Handle application shutdown

Important: `const program = new Command()` must be declared before calling `program.command(...)`.

Correct order:

```js
import { Command } from "commander";

const program = new Command();

program
  .command("database-status")
  .description("Check SQLite database");
```

---

### `src/database/database.js`

Responsible for:

- Creating the `data` directory
- Opening `data/zalo.db`
- Enabling SQLite foreign keys
- Enabling WAL mode
- Creating the main tables
- Creating indexes
- Creating the FTS5 virtual table
- Creating triggers that synchronize messages with FTS5

The database file is created automatically when the application runs.

---

### `src/zalo-client.js`

Contains the basic Zalo client abstraction.

Typical responsibilities:

- Store account information
- Initialize a Zalo API connection
- Start and stop the message listener
- Normalize incoming messages
- Send text messages
- Forward messages to the database or chatbot layer
- Track connection and listener status

The module exports:

```js
export class ZaloClient {
  // ...
}

export const zaloClient = new ZaloClient();
```

You can verify the exports with:

```bash
node -e "import('./src/zalo-client.js').then(m => console.log(Object.keys(m))).catch(console.error)"
```

Expected result:

```text
[ 'ZaloClient', 'zaloClient' ]
```

---

## Database Schema

The project defines six main SQLite business tables.

### 1. `accounts`

Stores Zalo account information.

Typical fields:

- Internal database ID
- Zalo user ID
- Display name
- Session data
- Account status
- Creation and update timestamps

---

### 2. `contacts`

Stores contacts associated with a Zalo account.

Typical fields:

- Account ID
- Zalo user ID
- Display name
- Avatar URL
- Creation and update timestamps

---

### 3. `conversations`

Stores direct and group conversations.

Typical fields:

- Account ID
- Zalo conversation ID
- Conversation type
- Conversation title
- Creation and update timestamps

---

### 4. `messages`

Stores Zalo messages.

Typical fields:

- Conversation ID
- Zalo message ID
- Sender ID
- Message content
- Message type
- Sent timestamp
- Raw message data

A unique constraint should prevent the same message from being inserted more than once.

---

### 5. `attachments`

Stores files associated with messages.

Examples:

- Images
- Videos
- Documents
- Audio files
- Remote download URLs
- Local file paths

---

### 6. `sync_state`

Stores synchronization progress.

Typical fields:

- Account ID
- Conversation ID
- Last synchronized message ID
- Last synchronization time
- Synchronization status
- Error message

This table can be used to resume synchronization without processing the entire message history again.

---

## Full-Text Search with FTS5

The project also creates:

```text
messages_fts
```

`messages_fts` is an SQLite FTS5 virtual table used for fast full-text message search.

It is not one of the six business tables. It is a search index connected to the `messages` table.

FTS5 is useful for searches such as:

```sql
SELECT *
FROM messages_fts
WHERE messages_fts MATCH 'report';
```

The database may also contain internal FTS5 tables such as:

```text
messages_fts_config
messages_fts_content
messages_fts_data
messages_fts_docsize
messages_fts_idx
```

These tables are created and managed automatically by SQLite.

Do not edit them directly.

---

## Verifying the Database

First run:

```bash
npm run cli -- database-status
```

Then check whether the file exists.

### Windows PowerShell

```powershell
Test-Path .\data\zalo.db
```

Expected result:

```text
True
```

List the data directory:

```powershell
Get-ChildItem .\data\
```

---

### Linux or macOS

```bash
ls -l data/
```

---

## Checking the Database Tables

Create a temporary file named `check-database.js` in the project root:

```js
import Database from "better-sqlite3";
import fs from "node:fs";

const databasePath = "./data/zalo.db";

if (!fs.existsSync(databasePath)) {
  console.error("Database file does not exist:", databasePath);
  process.exit(1);
}

const db = new Database(databasePath, {
  readonly: true,
});

const tables = db
  .prepare(`
    SELECT name, type
    FROM sqlite_master
    WHERE type IN ('table', 'view')
      AND name NOT LIKE 'sqlite_%'
    ORDER BY name
  `)
  .all();

console.table(tables);

db.close();
```

Run it:

```bash
node check-database.js
```

The output should include the six main tables:

```text
accounts
attachments
contacts
conversations
messages
sync_state
```

It should also include:

```text
messages_fts
```

If these tables exist, the SQLite and FTS5 infrastructure has been created successfully.

---

## Current Infrastructure Status

| Component | Status |
|---|---|
| Node.js CLI | Implemented |
| Commander command routing | Implemented |
| SQLite database file | Implemented |
| Six business tables | Implemented |
| FTS5 message index | Implemented |
| FTS5 synchronization triggers | Implemented |
| Basic `ZaloClient` class | Implemented |
| Zalo client CLI integration | Implemented when `zalo-status` succeeds |
| Real Zalo authentication | Depends on current login implementation |
| Message persistence | Requires repository integration |
| Conversation synchronization | Not complete |
| Chatbot processing | Not complete |
| Production error recovery | Not complete |

---

## What “Infrastructure Setup Complete” Means

The infrastructure task can be considered complete when all of the following are true:

- `npm install` completes successfully
- `npm run cli -- --help` works
- `npm run cli -- database-status` works
- `data/zalo.db` exists
- The six business tables exist
- `messages_fts` exists
- `src/zalo-client.js` imports without errors
- `npm run cli -- zalo-status` works

Actual Zalo login, message synchronization, chatbot responses, and automation logic are separate implementation stages.

---

## Development Scripts

### Start the default chatbot command

```bash
npm start
```

This runs:

```bash
node src/index.js chatbot start
```

The `chatbot start` command must exist in `src/index.js` for this script to work.

---

### Run tests

```bash
npm test
```

---

### Run ESLint

```bash
npm run lint
```

Automatically fix supported lint errors:

```bash
npm run lint:fix
```

---

### Format the source code

```bash
npm run format
```

Check formatting without modifying files:

```bash
npm run format:check
```

---

## Environment Variables

The project includes `dotenv`, so environment variables can be stored in a local `.env` file.

Example:

```env
DATABASE_PATH=./data/zalo.db
LOG_LEVEL=info
```

Do not commit sensitive values.

Add the following to `.gitignore`:

```gitignore
node_modules/
.env

data/*.db
data/*.db-shm
data/*.db-wal

data/*credentials*
data/*session*
data/*qr*
```

---

## Security Notes

- Do not commit account cookies, sessions, tokens, QR codes, or credentials.
- Do not share the SQLite database if it contains private messages.
- Store session data securely.
- Avoid logging full credentials or sensitive message contents.
- Use only accounts that you own or have permission to manage.
- Avoid spam, bulk messaging, or behavior that may violate platform rules.
- Test authentication and automation on a non-critical account first.

---

## Common Errors

### `ReferenceError: Cannot access 'program' before initialization`

Cause:

```js
program.command("zalo-status");

const program = new Command();
```

Fix:

```js
const program = new Command();

program.command("zalo-status");
```

The Commander instance must be created before commands are registered.

---

### `ERR_MODULE_NOT_FOUND`

Check that the import path includes the `.js` extension:

```js
import { zaloClient } from "./zalo-client.js";
```

For the database:

```js
import {
  initializeDatabase,
} from "./database/database.js";
```

---

### `does not provide an export named`

Check the exports in `src/zalo-client.js`.

Expected:

```js
export class ZaloClient {
  // ...
}

export const zaloClient = new ZaloClient();
```

---

### `Zalo client is not initialized`

Call:

```js
await zaloClient.initialize();
```

before:

```js
await zaloClient.startListening(handler);
```

or:

```js
await zaloClient.sendText(...);
```

---

### Database file is missing

Run:

```bash
npm run cli -- database-status
```

The database module should create:

```text
data/zalo.db
```

automatically.

---

## Next Development Steps

Recommended next stages:

1. Implement and verify Zalo authentication
2. Save account information into `accounts`
3. Store direct and group conversations
4. Insert incoming messages into `messages`
5. Store file metadata in `attachments`
6. Update `sync_state`
7. Connect message inserts to FTS5 search
8. Add duplicate-message protection
9. Add chatbot processing
10. Add reconnection and structured error handling
11. Add unit and integration tests

---

## Package Information

```text
Name: zalo_agent
Version: 1.8.5
Runtime: Node.js 20+
Module type: ES modules
Database: SQLite through better-sqlite3
CLI framework: Commander
Zalo integration: zca-js
```

---

## Disclaimer

This project is intended for development, learning, and permitted automation use.

The repository owner and contributors are responsible for ensuring that their usage complies with applicable laws, privacy requirements, account permissions, and platform rules.
