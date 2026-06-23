import { definePipr } from "@pipr/sdk";

export default definePipr((pipr) => {
  const model = pipr.model("deepseek/deepseek-v4-pro", {
    name: "deepseek",
    apiKey: pipr.secret("DEEPSEEK_API_KEY"),
    options: { thinking: "high" },
  });

  const reviewer = pipr.reviewer({
    name: "reviewer",
    model,
    instructions: [
      "Review the pull request diff for correctness, maintainability, and test coverage.",
      "Return concise, actionable findings that target valid diff ranges.",
    ].join("\n"),
  });

  pipr.review({
    reviewer,
    entrypoints: {
      changeRequest: ["opened", "updated", "reopened", "ready"],
      command: { pattern: "@pipr review", permission: "write" },
      local: "review",
    },
    inlineComments: { max: 5 },
    timeout: "5m",
  });
});
