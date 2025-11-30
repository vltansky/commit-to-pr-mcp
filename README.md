# commit-to-pr-mcp

An MCP server that extracts PR details from git commit hashes using the GitHub CLI (`gh`).

## Prerequisites

- [GitHub CLI](https://cli.github.com/) installed and authenticated (`gh auth login`)
- Node.js 18+

## Installation

```bash
npm install
npm run build
```

## Usage

### Claude Desktop Configuration

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "commit-to-pr": {
      "command": "node",
      "args": ["/path/to/commit-to-pr-mcp/dist/index.js"]
    }
  }
}
```

## Tools

### `get_pr_from_commit`

Extract PR number from a git commit and retrieve full PR details.

**Parameters:**
- `commit` (required): Git commit hash (full or short), branch name, or any git reference
- `repo` (optional): GitHub repository in `owner/repo` format

**Example:**
```
Get PR details for commit abc123
```

### `get_pr_details`

Get detailed information about a specific PR by its number.

**Parameters:**
- `pr_number` (required): The PR number to look up
- `repo` (optional): GitHub repository in `owner/repo` format

## Response

Returns PR details including:
- `number`: PR number
- `title`: PR title
- `body`: PR description
- `state`: PR state (OPEN, CLOSED, MERGED)
- `url`: GitHub URL
- `author`: PR author username
- `createdAt`: Creation timestamp
- `mergedAt`: Merge timestamp (if merged)
- `baseRef`: Target branch
- `headRef`: Source branch
- `labels`: Array of label names
