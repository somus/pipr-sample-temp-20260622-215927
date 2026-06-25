import { definePipr } from "@pipr/sdk";

export default definePipr((pipr) => {
  const model = pipr.model({
    provider: "deepseek",
    model: "deepseek-v4-pro",
    apiKey: pipr.secret({ name: "DEEPSEEK_API_KEY" }),
    options: { thinking: "high" },
  });

  const askAgent = pipr.agent({
    name: "ask",
    model,
    instructions: [
      "Answer questions about this pull request using the Diff Manifest, prior review context, and read-only repository tools.",
      "Be concise. Do not invent facts not supported by the repository or diff.",
    ].join("\n"),
    output: pipr.schemas.summary,
    tools: pipr.tools.readOnly,
    prompt: (input: { question: string; manifest: unknown; prior: unknown }) => pipr.prompt`
      Question:
      ${input.question}

      ${pipr.section("Diff Manifest", input.manifest)}

      ${pipr.section("Prior Review", input.prior)}
    `,
  });

  const ask = pipr.task<{ question: string }>({
    name: "ask",
    async run(ctx, input) {
      if (!ctx.command) {
        throw new Error("ask task must be run from an @pipr command");
      }
      const manifest = await ctx.change.diffManifest({ compressed: true });
      const prior = await ctx.review.prior();
      const answer = await ctx.pi.run(askAgent, {
        question: input.question,
        manifest,
        prior,
      });
      await ctx.command.reply(answer.body);
    },
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

  pipr.command({
    pattern: "@pipr ask <question...>",
    permission: "read",
    description: "Ask a question about this pull request.",
    task: ask,
  });
});
