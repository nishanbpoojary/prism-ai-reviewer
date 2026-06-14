import "server-only";

import type {
  GeneratePullRequestReviewInput,
  GitHubPullRequestFile,
} from "@/features/pull-request-review/types";

const maxBodyLength = 2000;
const maxFilesInSummary = 30;
const maxFilesWithPatches = 10;
const maxPatchSnippetLength = 1500;
const maxTotalDiffContextLength = 12000;

function trimAtBoundary(value: string, maxLength: number) {
  const trimmedValue = value.trim();

  if (trimmedValue.length <= maxLength) {
    return {
      text: trimmedValue,
      truncated: false,
    };
  }

  const maxContentLength = Math.max(0, maxLength - 3);
  const clippedValue = trimmedValue.slice(0, maxContentLength).trimEnd();
  const lineBoundary = clippedValue.lastIndexOf("\n");
  const wordBoundary = clippedValue.lastIndexOf(" ");
  const boundary = Math.max(lineBoundary, wordBoundary);
  const safeValue =
    boundary >= maxContentLength * 0.65
      ? clippedValue.slice(0, boundary)
      : clippedValue;

  return {
    text: `${safeValue.replace(/[\s,;:.-]+$/g, "")}...`,
    truncated: true,
  };
}

function redactSensitiveText(value: string) {
  return value
    .replace(
      /\b([A-Z0-9_]*(?:SECRET|TOKEN|API[_-]?KEY|ACCESS[_-]?KEY|PRIVATE[_-]?KEY|PASSWORD|CLIENT[_-]?SECRET)[A-Z0-9_]*)\s*=\s*["']?[^\s"']+/gi,
      "$1=[redacted]",
    )
    .replace(
      /\b(Bearer|Token)\s+[A-Za-z0-9._~+/=-]{20,}/gi,
      "$1 [redacted]",
    )
    .replace(/sk-[A-Za-z0-9_-]{16,}/g, "[redacted-openai-key]")
    .replace(/AIza[A-Za-z0-9_-]{20,}/g, "[redacted-google-key]")
    .replace(/gh[pousr]_[A-Za-z0-9_]{20,}/g, "[redacted-github-token]")
    .replace(
      /\b[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\b/g,
      "[redacted-jwt]",
    );
}

function createFileSummary(file: GitHubPullRequestFile) {
  return `- ${file.filename} (${file.status}, +${file.additions}, -${file.deletions}, ${file.changes} changes)`;
}

function createPatchSnippet(file: GitHubPullRequestFile) {
  if (!file.patch) {
    return [
      `### ${file.filename}`,
      `Status: ${file.status}; +${file.additions}; -${file.deletions}; ${file.changes} changes`,
      "Patch: not available from GitHub, likely binary, renamed, or too large.",
    ].join("\n");
  }

  const redactedPatch = redactSensitiveText(file.patch);
  const { text, truncated } = trimAtBoundary(
    redactedPatch,
    maxPatchSnippetLength,
  );

  return [
    `### ${file.filename}`,
    `Status: ${file.status}; +${file.additions}; -${file.deletions}; ${file.changes} changes`,
    "Patch snippet:",
    text,
    truncated
      ? `[Patch snippet truncated to ${maxPatchSnippetLength} characters.]`
      : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function createDiffContext(files: GitHubPullRequestFile[]) {
  const sections: string[] = [];
  let usedCharacters = 0;
  let wasTruncated = false;

  for (const file of files.slice(0, maxFilesWithPatches)) {
    const section = createPatchSnippet(file);
    const separator = sections.length > 0 ? "\n\n" : "";
    const nextLength = separator.length + section.length;

    if (usedCharacters + nextLength > maxTotalDiffContextLength) {
      const remainingCharacters =
        maxTotalDiffContextLength - usedCharacters - separator.length;

      if (remainingCharacters > 120) {
        const { text } = trimAtBoundary(section, remainingCharacters);
        sections.push(`${separator}${text}`);
      }

      wasTruncated = true;
      break;
    }

    sections.push(`${separator}${section}`);
    usedCharacters += nextLength;
  }

  if (files.length > maxFilesWithPatches) {
    wasTruncated = true;
    sections.push(
      `\n\n[Diff context limited to the first ${maxFilesWithPatches} changed files with patch snippets.]`,
    );
  }

  if (wasTruncated) {
    sections.push(
      `\n[Total diff context limited to about ${maxTotalDiffContextLength} characters.]`,
    );
  }

  return sections.join("");
}

export function createReviewerPrompt(input: GeneratePullRequestReviewInput) {
  const { metadata, pullRequest } = input;
  const body = metadata.body || "No pull request description provided.";
  const { text: limitedBody, truncated: bodyTruncated } = trimAtBoundary(
    body,
    maxBodyLength,
  );
  const fileSummary = metadata.files
    .slice(0, maxFilesInSummary)
    .map(createFileSummary)
    .join("\n");

  return [
    "Review context:",
    `Repository: ${pullRequest.owner}/${pullRequest.repo}`,
    `Pull request: #${pullRequest.pullNumber}`,
    `URL: ${pullRequest.url}`,
    `Title: ${metadata.title}`,
    `Author: ${metadata.author}`,
    `State: ${metadata.state}`,
    `Branches: ${metadata.sourceBranch} -> ${metadata.targetBranch}`,
    `Changed files: ${metadata.changedFiles}`,
    `Additions: ${metadata.additions}`,
    `Deletions: ${metadata.deletions}`,
    `Description: ${limitedBody}`,
    bodyTruncated
      ? `[PR description truncated to ${maxBodyLength} characters.]`
      : "",
    "",
    "Changed file summary:",
    fileSummary || input.changedFilesSummary,
    metadata.files.length > maxFilesInSummary
      ? `[File summary limited to the first ${maxFilesInSummary} files.]`
      : "",
    "",
    "Limited diff snippets:",
    createDiffContext(metadata.files) || "No patch snippets were available.",
  ]
    .filter((line) => line !== "")
    .join("\n");
}
