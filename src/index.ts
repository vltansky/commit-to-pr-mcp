#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  CallToolResult,
} from "@modelcontextprotocol/sdk/types.js";
import { execSync } from "child_process";

type PRDetails = {
  number: number;
  title: string;
  body: string;
  state: string;
  url: string;
  author: string;
  createdAt: string;
  mergedAt: string | null;
  baseRef: string;
  headRef: string;
  labels: string[];
  reviews: Review[];
};

type Review = {
  author: string;
  state: string;
  submittedAt: string;
};


const server = new Server(
  { name: "commit-to-pr-mcp", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

function execCommand(command: string, cwd?: string): string {
  return execSync(command, { encoding: "utf-8", cwd }).trim();
}

function isInGitRepo(cwd?: string): boolean {
  try {
    execSync("git rev-parse --git-dir", {
      encoding: "utf-8",
      stdio: "pipe",
      cwd,
    });
    return true;
  } catch {
    return false;
  }
}

function getRepoFromGit(cwd?: string): string | null {
  try {
    const remoteUrl = execSync("git remote get-url origin", {
      encoding: "utf-8",
      stdio: "pipe",
      cwd,
    }).trim();
    const match = remoteUrl.match(/github\.com[:/](.+?)(\.git)?$/);
    return match ? match[1].replace(/\.git$/, "") : null;
  } catch {
    return null;
  }
}

function resolveRepo(providedRepo?: string, cwd?: string): string {
  if (providedRepo) {
    return providedRepo;
  }

  if (isInGitRepo(cwd)) {
    const gitRepo = getRepoFromGit(cwd);
    if (gitRepo) {
      return gitRepo;
    }
  }

  throw new Error(
    "No repository specified and not in a git repository. Please provide the 'repo' parameter in owner/repo format, or the 'cwd' parameter pointing to a git repository."
  );
}

function getPRNumberFromCommit(
  commitRef: string,
  repo: string
): number | null {
  const prListCmd = `gh pr list --search "${commitRef}" --state all --json number --repo ${repo}`;
  const prListResult = execCommand(prListCmd);
  const prList = JSON.parse(prListResult);

  if (prList.length > 0) {
    return prList[0].number;
  }

  const commitMsgCmd = `gh api repos/${repo}/commits/${commitRef} --jq '.commit.message'`;

  try {
    const commitMessage = execCommand(commitMsgCmd);

    const prMergeMatch = commitMessage.match(/Merge pull request #(\d+)/);
    if (prMergeMatch) {
      return parseInt(prMergeMatch[1], 10);
    }

    const squashMergeMatch = commitMessage.match(/\(#(\d+)\)$/m);
    if (squashMergeMatch) {
      return parseInt(squashMergeMatch[1], 10);
    }
  } catch {
    return null;
  }

  return null;
}

function getPRDetails(prNumber: number, repo: string): PRDetails {
  const prCmd = `gh pr view ${prNumber} --repo ${repo} --json number,title,body,state,url,author,createdAt,mergedAt,baseRefName,headRefName,labels,reviews`;
  const prResult = execCommand(prCmd);
  const pr = JSON.parse(prResult);

  return {
    number: pr.number,
    title: pr.title,
    body: pr.body || "",
    state: pr.state,
    url: pr.url,
    author: pr.author?.login || "unknown",
    createdAt: pr.createdAt,
    mergedAt: pr.mergedAt,
    baseRef: pr.baseRefName,
    headRef: pr.headRefName,
    labels: pr.labels?.map((l: { name: string }) => l.name) || [],
    reviews:
      pr.reviews?.map(
        (r: { author: { login: string }; state: string; submittedAt: string }) => ({
          author: r.author?.login || "unknown",
          state: r.state,
          submittedAt: r.submittedAt,
        })
      ) || [],
  };
}

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "get_pr",
        description:
          "Get PR details by commit hash or PR number. Extracts PR number from git commits (merge commits, squash commits) and returns full PR details including title, description, author, status, and reviews. Auto-detects repository from working directory.",
        inputSchema: {
          type: "object",
          properties: {
            commit: {
              type: "string",
              description:
                "Git commit hash (full or short), branch name, or any git reference. Use this OR pr_number.",
            },
            pr_number: {
              type: "number",
              description: "PR number to look up directly. Use this OR commit.",
            },
            repo: {
              type: "string",
              description:
                "GitHub repository in owner/repo format. If not provided, auto-detects from cwd.",
            },
            cwd: {
              type: "string",
              description:
                "Working directory path to auto-detect the GitHub repository from git remote.",
            },
          },
        },
      },
    ],
  };
});

server.setRequestHandler(
  CallToolRequestSchema,
  async (request): Promise<CallToolResult> => {
    const { name, arguments: args } = request.params;

    try {
      if (name === "get_pr") {
        const { commit, pr_number, repo: providedRepo, cwd } = args as {
          commit?: string;
          pr_number?: number;
          repo?: string;
          cwd?: string;
        };

        if (!commit && !pr_number) {
          return {
            content: [
              {
                type: "text",
                text: "Either 'commit' or 'pr_number' must be provided.",
              },
            ],
            isError: true,
          };
        }

        const repo = resolveRepo(providedRepo, cwd);

        let resolvedPrNumber: number | null = pr_number ?? null;

        if (!resolvedPrNumber && commit) {
          resolvedPrNumber = getPRNumberFromCommit(commit, repo);

          if (!resolvedPrNumber) {
            return {
              content: [
                {
                  type: "text",
                  text: `No PR found for commit: ${commit} in ${repo}. This commit may not be associated with any pull request.`,
                },
              ],
              isError: true,
            };
          }
        }

        const prDetails = getPRDetails(resolvedPrNumber!, repo);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(prDetails, null, 2),
            },
          ],
        };
      }

      throw new Error(`Unknown tool: ${name}`);
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("commit-to-pr-mcp server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
