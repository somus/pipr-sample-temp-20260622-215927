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

function firstCommentableRange(manifest: DiffManifest): RangeTarget | undefined {
  for (const file of manifest.files) {
    for (const range of (file.commentableRanges ?? []) as CommentableRange[]) {
      if (range.side === "RIGHT") {
        return { file, range };
      }
    }
  }
}

export default definePipr((pipr) => {
  pipr.model("deepseek/deepseek-v4-pro", {
    name: "deepseek",
    apiKey: pipr.secret("DEEPSEEK_API_KEY"),
    options: { thinking: "high" },
  });

  const smoke = pipr.task("publish-smoke", async (ctx) => {
    const manifest = await ctx.change.diffManifest({ includePreviews: true });
    const target = firstCommentableRange(manifest);

    ctx.output.summary(
      {
        title: "pipr smoke review",
        body: `Static publishing task ran for ${ctx.repository.name}#${ctx.change.number ?? "local"}.`,
      },
      { key: "smoke-summary", merge: "replace", priority: 10 },
    );

    ctx.output.section(
      "smoke-details",
      [
        `run id: ${ctx.run.id}`,
        `changed files: ${manifest.files.length}`,
        `head sha: ${manifest.headSha}`,
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
      changedFiles: manifest.files.length,
      inlineTarget: target?.file.path ?? null,
    });

    if (!target) {
      return;
    }

    const finding: ReviewFinding = {
      body: "Static inline smoke finding from pipr. This validates inline review comment publishing.",
      path: target.file.path,
      rangeId: target.range.id,
      side: target.range.side,
      startLine: target.range.startLine,
      endLine: target.range.startLine,
      data: { category: "smoke-test" },
    };
    ctx.output.findings([finding]);
  });

  pipr.on.changeRequest(["opened", "updated", "reopened", "ready"], smoke);
  pipr.command("@pipr smoke", { permission: "write", description: "Run pipr smoke test." }, smoke);
  pipr.local("smoke", smoke);
});
