import "server-only";

function readOptionalEnv(name: string) {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

export function getOpenAiApiKey() {
  return readOptionalEnv("OPENAI_API_KEY");
}

export function getGitHubToken() {
  return readOptionalEnv("GITHUB_TOKEN");
}

export function getGeminiApiKey() {
  return readOptionalEnv("GEMINI_API_KEY");
}
