import type {
  GitHubPullRequestFile,
  GitHubPullRequestMetadata,
  GitHubPullRequestRef,
} from "@/features/pull-request-review/types";

type JsonObject = Record<string, unknown>;

const githubApiBaseUrl = "https://api.github.com";
const githubApiVersion = "2022-11-28";
const filesPerPage = 100;
const maxFilePages = 30;

export class GitHubPullRequestFetchError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "GitHubPullRequestFetchError";
    this.status = status;
  }
}

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(source: JsonObject, key: string) {
  const value = source[key];
  return typeof value === "string" ? value : null;
}

function readNullableString(source: JsonObject, key: string) {
  const value = source[key];
  return typeof value === "string" || value === null ? value : null;
}

function readNumber(source: JsonObject, key: string) {
  const value = source[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function readObject(source: JsonObject, key: string) {
  const value = source[key];
  return isJsonObject(value) ? value : null;
}

function createGitHubHeaders() {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "PRism-AI",
    "X-GitHub-Api-Version": githubApiVersion,
  };
  const token = process.env.GITHUB_TOKEN?.trim();

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

function createGitHubApiUrl(path: string) {
  return `${githubApiBaseUrl}${path}`;
}

async function readGitHubJson(url: string) {
  let response: Response;

  try {
    response = await fetch(url, {
      cache: "no-store",
      headers: createGitHubHeaders(),
    });
  } catch {
    throw new GitHubPullRequestFetchError(
      502,
      "Could not reach GitHub right now. Please try again.",
    );
  }

  if (!response.ok) {
    throw createGitHubResponseError(response);
  }

  return response.json() as Promise<unknown>;
}

function createGitHubResponseError(response: Response) {
  if (response.status === 404) {
    return new GitHubPullRequestFetchError(
      404,
      "GitHub pull request not found. Check that the repository and PR number exist and are public.",
    );
  }

  if (
    response.status === 429 ||
    (response.status === 403 && response.headers.get("x-ratelimit-remaining") === "0")
  ) {
    return new GitHubPullRequestFetchError(
      429,
      "GitHub rate limit reached. Try again later or add a GITHUB_TOKEN on the server.",
    );
  }

  if (response.status === 401) {
    return new GitHubPullRequestFetchError(
      502,
      "GitHub authentication failed on the server. Check the configured token.",
    );
  }

  if (response.status === 403) {
    return new GitHubPullRequestFetchError(
      403,
      "GitHub refused the request. If this is a private repository, add a valid GITHUB_TOKEN on the server.",
    );
  }

  return new GitHubPullRequestFetchError(
    502,
    "GitHub could not return pull request metadata right now. Please try again.",
  );
}

function parsePullRequestMetadata(value: unknown): Omit<
  GitHubPullRequestMetadata,
  "files"
> {
  if (!isJsonObject(value)) {
    throw new GitHubPullRequestFetchError(
      502,
      "GitHub returned an unexpected pull request response.",
    );
  }

  const user = readObject(value, "user");
  const head = readObject(value, "head");
  const base = readObject(value, "base");
  const title = readString(value, "title");
  const body = readNullableString(value, "body");
  const author = user ? readString(user, "login") : null;
  const sourceBranch = head ? readString(head, "ref") : null;
  const targetBranch = base ? readString(base, "ref") : null;
  const state = readString(value, "state");
  const createdAt = readString(value, "created_at");
  const updatedAt = readString(value, "updated_at");
  const changedFiles = readNumber(value, "changed_files");
  const additions = readNumber(value, "additions");
  const deletions = readNumber(value, "deletions");

  if (
    !title ||
    !author ||
    !sourceBranch ||
    !targetBranch ||
    !state ||
    !createdAt ||
    !updatedAt ||
    changedFiles === null ||
    additions === null ||
    deletions === null
  ) {
    throw new GitHubPullRequestFetchError(
      502,
      "GitHub returned an incomplete pull request response.",
    );
  }

  return {
    title,
    body: body ?? "",
    author,
    sourceBranch,
    targetBranch,
    state,
    createdAt,
    updatedAt,
    changedFiles,
    additions,
    deletions,
  };
}

function parsePullRequestFiles(value: unknown): GitHubPullRequestFile[] {
  if (!Array.isArray(value)) {
    throw new GitHubPullRequestFetchError(
      502,
      "GitHub returned an unexpected changed files response.",
    );
  }

  return value.map((file) => {
    if (!isJsonObject(file)) {
      throw new GitHubPullRequestFetchError(
        502,
        "GitHub returned an incomplete changed files response.",
      );
    }

    const filename = readString(file, "filename");
    const status = readString(file, "status");
    const additions = readNumber(file, "additions");
    const deletions = readNumber(file, "deletions");
    const changes = readNumber(file, "changes");

    if (
      !filename ||
      !status ||
      additions === null ||
      deletions === null ||
      changes === null
    ) {
      throw new GitHubPullRequestFetchError(
        502,
        "GitHub returned an incomplete changed files response.",
      );
    }

    return {
      filename,
      status,
      additions,
      deletions,
      changes,
    };
  });
}

async function fetchChangedFiles(
  pullRequest: GitHubPullRequestRef,
  changedFiles: number,
) {
  if (changedFiles === 0) {
    return [];
  }

  const files: GitHubPullRequestFile[] = [];
  const pageCount = Math.min(
    Math.max(1, Math.ceil(changedFiles / filesPerPage)),
    maxFilePages,
  );

  for (let page = 1; page <= pageCount; page += 1) {
    const url = createGitHubApiUrl(
      `/repos/${encodeURIComponent(pullRequest.owner)}/${encodeURIComponent(
        pullRequest.repo,
      )}/pulls/${pullRequest.pullNumber}/files?per_page=${filesPerPage}&page=${page}`,
    );
    const data = await readGitHubJson(url);
    const pageFiles = parsePullRequestFiles(data);

    files.push(...pageFiles);

    if (pageFiles.length < filesPerPage) {
      break;
    }
  }

  return files;
}

export async function fetchGitHubPullRequestMetadata(
  pullRequest: GitHubPullRequestRef,
): Promise<GitHubPullRequestMetadata> {
  const pullRequestUrl = createGitHubApiUrl(
    `/repos/${encodeURIComponent(pullRequest.owner)}/${encodeURIComponent(
      pullRequest.repo,
    )}/pulls/${pullRequest.pullNumber}`,
  );
  const pullRequestData = await readGitHubJson(pullRequestUrl);
  const metadata = parsePullRequestMetadata(pullRequestData);
  const files = await fetchChangedFiles(pullRequest, metadata.changedFiles);

  return {
    ...metadata,
    files,
  };
}
