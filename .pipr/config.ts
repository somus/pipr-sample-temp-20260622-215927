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
    ].join("\n"),
    entrypoints: {
      changeRequest: ["opened", "updated", "reopened", "ready"],
      command: { pattern: "@pipr review", permission: "write" },
      local: "review",
    },
    check: { name: "pipr / review" },
    inlineComments: { max: 5 },
    timeout: "5m",
  });

  pipr.checks({ aggregate: { name: "pipr / all" } });
});
