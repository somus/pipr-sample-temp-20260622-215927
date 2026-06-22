import { definePipr, type DiffManifest, type ReviewFinding } from "@pipr/sdk";

type CommentableRange = {
  id: string;
  path: string;
  side: "RIGHT" | "LEFT";
  startLine: number;
  endLine: number;
};

type RangeTarget = {
  file: DiffManifest["files"][number];
  range: CommentableRange;
};

function firstRightRange(manifest: DiffManifest): RangeTarget | undefined {
  for (const file of manifest.files) {
    for (const range of (file.commentableRanges ?? []) as CommentableRange[]) {
      if (range.side === "RIGHT") {
        return { file, range };
      }
    }
  }
}

export default definePipr((pipr) => {
  const model = pipr.model("deepseek/deepseek-v4-pro", {
    name: "deepseek",
    apiKey: pipr.secret("DEEPSEEK_API_KEY"),
    options: { thinking: "high" },
  });

  const reviewer = pipr.agent({
    name: "deepseek-smoke-reviewer",
    model,
    instructions: [
      "Run a concise smoke review for this pull request.",
      "Return one short summary and no inline findings unless there is a clear correctness issue.",
      "The task adds one deterministic inline finding separately to validate GitHub inline publishing.",
    ].join("\n"),
    output: pipr.schemas.review,
    retry: { invalidOutput: 1, transientFailure: 1 },
    prompt: (input: { manifest: DiffManifest }) => pipr.prompt`
Review this TypeScript sample pull request.
${pipr.compactManifest(input.manifest)}
`,
  });

  const smoke = pipr.task("deepseek-smoke", async (ctx) => {
    const manifest = await ctx.change.diffManifest({ compressed: true });
    const fullManifest = await ctx.change.diffManifest({ includePreviews: true });
    const result = await ctx.pi.run(reviewer, { manifest });
    const target = firstRightRange(fullManifest);

    ctx.output.summary(result.summary, {
      key: "deepseek-summary",
      merge: "replace",
      priority: 10,
    });

    ctx.output.section(
      "smoke-details",
      [
        "agent: deepseek-smoke-reviewer",
        "model: deepseek/deepseek-v4-pro",
        `run id: ${ctx.run.id}`,
        `changed files: ${fullManifest.files.length}`,
        `head sha: ${fullManifest.headSha}`,
        `inline target: ${target ? target.file.path : "none"}`,
      ],
      {
        title: "Smoke Details",
        order: 20,
        merge: "replace",
        render: (items) => items.map((item) => `- ${item}`).join("\n"),
      },
    );

    ctx.output.metadata({
      smoke: true,
      aiAgent: "deepseek-smoke-reviewer",
      model: "deepseek/deepseek-v4-pro",
      changedFiles: fullManifest.files.length,
      inlineTarget: target?.file.path ?? null,
    });

    if (!target) {
      ctx.output.findings(result.inlineFindings);
      return;
    }

    const finding: ReviewFinding = {
      body: "DeepSeek smoke test reached inline publishing. This deterministic finding validates the GitHub review comment path.",
      path: target.file.path,
      rangeId: target.range.id,
      side: target.range.side,
      startLine: target.range.startLine,
      endLine: target.range.startLine,
      data: { category: "deepseek-smoke-test" },
    };
    ctx.output.findings([...result.inlineFindings, finding]);
  });

  pipr.on.changeRequest(["opened", "updated", "reopened", "ready"], smoke);
  pipr.command("@pipr smoke", { permission: "write", description: "Run pipr DeepSeek smoke test." }, smoke);
  pipr.local("smoke", smoke);
});
