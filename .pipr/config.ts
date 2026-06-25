import { definePipr } from "@pipr/sdk";

export default definePipr((pipr) => {
  const model = pipr.model({
    provider: "deepseek",
    model: "deepseek-v4-pro",
    apiKey: pipr.secret({ name: "DEEPSEEK_API_KEY" }),
    options: { thinking: "high" },
  });

  pipr.review({
    id: "review",
    model,
    instructions: [
      "Review the pull request diff for correctness, maintainability, and test coverage.",
      "Return concise, actionable findings that target valid diff ranges.",
      "When a finding has a clear replacement for the selected range, include suggestedFix as exact replacement code with no Markdown fences or prose.",
    ].join("\n"),
    entrypoints: {
      changeRequest: ["opened", "updated", "reopened", "ready"],
      command: { pattern: "@pipr review", permission: "write" },
      local: "review",
    },
    inlineComments: { max: 5 },
    timeout: "5m",
  });
});
