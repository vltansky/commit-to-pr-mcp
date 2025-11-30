# commit-to-pr-mcp

An MCP (Model Context Protocol) server that enables AI agents to extract PR details from git commit hashes using the GitHub CLI.

## Features

- **Commit to PR Resolution**: Automatically extracts PR numbers from commit hashes, merge commits, and squash commits
- **Auto-Detection**: Automatically detects GitHub repository from git working directory
- **Comprehensive PR Data**: Retrieves full PR details including title, description, author, status, labels, and reviews
- **Flexible Input**: Accepts commit hashes (full or short), branch names, or direct PR numbers
- **Type-Safe**: Built with TypeScript and Zod for runtime validation

## Prerequisites

- **Node.js** >= 18.0.0
- **[GitHub CLI](https://cli.github.com/)** installed and authenticated (`gh auth login`)
- An MCP-compatible client (Cursor, Claude Desktop, VS Code, etc.)

## Installation

### Getting Started

First, install the commit-to-pr-mcp server with your client.

**Standard config** works in most tools:

```json
{
  "mcpServers": {
    "commit-to-pr": {
      "command": "npx",
      "args": [
        "commit-to-pr-mcp@latest"
      ]
    }
  }
}
```

<details>
<summary>Claude Code</summary>

Use the Claude Code CLI to add the server:

```bash
claude mcp add commit-to-pr npx commit-to-pr-mcp@latest
```

</details>

<details>
<summary>Claude Desktop</summary>

Add to your Claude Desktop configuration (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "commit-to-pr": {
      "command": "npx",
      "args": ["commit-to-pr-mcp@latest"]
    }
  }
}
```

</details>

<details>
<summary>Cursor</summary>

#### Click the button to install:

[![Install in Cursor](https://cursor.com/deeplink/mcp-install-dark.svg)](https://cursor.com/en-US/install-mcp?name=commit-to-pr&config=eyJjb21tYW5kIjoibnB4IiwiYXJncyI6WyJjb21taXQtdG8tcHItbWNwQGxhdGVzdCJdfQ==)

#### Or install manually:

Go to `Cursor Settings` → `MCP` → `Add new MCP Server`. Name to your liking, use `command` type with the command `npx commit-to-pr-mcp@latest`. You can also verify config or add command arguments via clicking `Edit`.

#### Project-Specific Configuration

Create `.cursor/mcp.json` in your project root:

```json
{
  "mcpServers": {
    "commit-to-pr": {
      "command": "npx",
      "args": ["commit-to-pr-mcp@latest"]
    }
  }
}
```

</details>

<details>
<summary>VS Code</summary>

Follow the [MCP install guide](https://code.visualstudio.com/docs/copilot/chat/mcp-servers#_add-an-mcp-server), use the standard config above.

Alternatively, install using the VS Code CLI:

```bash
code --add-mcp '{"name":"commit-to-pr","command":"npx","args":["commit-to-pr-mcp@latest"]}'
```

</details>

<details>
<summary>Cline</summary>

Add via the Cline VS Code extension settings or by updating your `cline_mcp_settings.json` file:

```json
{
  "mcpServers": {
    "commit-to-pr": {
      "command": "npx",
      "args": [
        "commit-to-pr-mcp@latest"
      ]
    }
  }
}
```

</details>

<details>
<summary>Zed</summary>

Follow the [MCP Servers documentation](https://zed.dev/docs/assistant/model-context-protocol). Use the standard config above.

</details>

---

### Local Development

For local development and testing:

```json
{
  "mcpServers": {
    "commit-to-pr": {
      "command": "node",
      "args": ["/absolute/path/to/commit-to-pr-mcp/dist/index.js"],
      "env": {
        "LOG_LEVEL": "debug"
      }
    }
  }
}
```

---

### Verify Installation

After installation, verify commit-to-pr-mcp is working:

1. **Restart your MCP client** completely
2. **Check connection status**:
   - **Cursor**: Look for green dot in Settings → Tools & Integrations → MCP Tools
   - **Claude Desktop**: Check for "commit_to_pr" in available tools
   - **VS Code**: Verify in GitHub Copilot settings
3. **Test with a simple query**:
   ```
   Get PR details for commit abc123
   ```

If you see the AI agent use the `get_pr` tool and return PR information, you're all set! 🎉

## Usage

The server provides a single tool: `get_pr`

### Basic Example: Get PR from Commit Hash

```typescript
{
  "commit": "abc123def456",
  "repo": "owner/repo"  // Optional: auto-detected from git working directory
}
```

### Example: Get PR from Branch Name

```typescript
{
  "commit": "feature/new-feature",
  "cwd": "/path/to/repo"  // Optional: specify working directory for auto-detection
}
```

### Example: Get PR by Number Directly

```typescript
{
  "pr_number": 42,
  "repo": "owner/repo"  // Optional: auto-detected from git working directory
}
```

### Example: Auto-Detect Repository

When working in a git repository, you can omit the `repo` parameter:

```typescript
{
  "commit": "abc123"
  // Repository is automatically detected from git remote
}
```

## Tool Parameters

### `get_pr`

Get PR details by commit hash or PR number. Extracts PR number from git commits (merge commits, squash commits) and returns full PR details.

**Parameters:**

- `commit` (optional): Git commit hash (full or short), branch name, or any git reference. Use this OR `pr_number`.
- `pr_number` (optional): PR number to look up directly. Use this OR `commit`.
- `repo` (optional): GitHub repository in `owner/repo` format. If not provided, auto-detects from `cwd` or current working directory.
- `cwd` (optional): Working directory path to auto-detect the GitHub repository from git remote.

**Note:** Either `commit` or `pr_number` must be provided.

## Response Format

The tool returns a structured response:

```json
{
  "number": 42,
  "title": "Add new feature",
  "body": "This PR adds a new feature...",
  "state": "MERGED",
  "url": "https://github.com/owner/repo/pull/42",
  "author": "username",
  "createdAt": "2025-01-15T10:30:00Z",
  "mergedAt": "2025-01-16T14:20:00Z",
  "baseRef": "main",
  "headRef": "feature/new-feature",
  "labels": ["enhancement", "ready-for-review"],
  "reviews": [
    {
      "author": "reviewer1",
      "state": "APPROVED",
      "submittedAt": "2025-01-16T12:00:00Z"
    },
    {
      "author": "reviewer2",
      "state": "CHANGES_REQUESTED",
      "submittedAt": "2025-01-16T13:00:00Z"
    }
  ]
}
```

### Response Fields

- `number`: PR number
- `title`: PR title
- `body`: PR description/body text
- `state`: PR state (`OPEN`, `CLOSED`, `MERGED`)
- `url`: GitHub URL to the PR
- `author`: PR author username
- `createdAt`: Creation timestamp (ISO 8601)
- `mergedAt`: Merge timestamp (ISO 8601), `null` if not merged
- `baseRef`: Target branch name
- `headRef`: Source branch name
- `labels`: Array of label names
- `reviews`: Array of review objects with `author`, `state`, and `submittedAt`

## How It Works

The server uses the GitHub CLI (`gh`) to:

1. **Extract PR number from commits**:
   - Searches PRs containing the commit hash
   - Parses merge commit messages (`Merge pull request #123`)
   - Parses squash commit messages (`(#123)`)

2. **Retrieve PR details**:
   - Fetches comprehensive PR information via `gh pr view`
   - Includes reviews, labels, and metadata

3. **Auto-detect repository**:
   - Reads `git remote get-url origin` from the working directory
   - Extracts `owner/repo` format from the remote URL

## Development

### Setup

```bash
npm install
npm run build
```

### Testing

For local testing:

1. Build the project:
   ```bash
   npm run build
   ```

2. Configure your MCP client to use the local build (see Local Development section above)

3. Test with an MCP Inspector or client

### Development Scripts

- `npm run build`: Compile TypeScript to JavaScript
- `npm run start`: Run the compiled server
- `npm run dev`: Run the server in development mode with `tsx`

## Architecture

```
src/
└── index.ts              # Main server implementation
    ├── Tool handlers     # get_pr tool logic
    ├── Git utilities     # Repository detection
    └── GitHub CLI        # PR extraction and details
```

## License

ISC

## Contributing

Contributions welcome! Please read the contributing guidelines and submit a PR.

## Related Projects

- [MCP Specification](https://modelcontextprotocol.io)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [GitHub CLI](https://cli.github.com/)
