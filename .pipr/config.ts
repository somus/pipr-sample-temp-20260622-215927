import { definePipr, definePlugin, z } from "@pipr/sdk";

const ownersPlugin = definePlugin((pipr) => {
  const ownerInput = pipr.schema({
    id: "owners/input",
    schema: z.strictObject({ path: z.string() }),
  });
  const ownerOutput = pipr.schema({
    id: "owners/output",
    schema: z.strictObject({
      path: z.string(),
      owner: z.string(),
      policy: z.string(),
    }),
  });
  const catalog = [
    { prefix: "packages/runtime/", owner: "runtime", policy: "Review runtime and publication behavior strictly." },
    { prefix: "packages/cli/", owner: "cli", policy: "Review command UX and local developer workflows." },
    { prefix: "docs/", owner: "docs", policy: "Review product language and examples." },
  ];

  return {
    ownerLookup: pipr.tool({
      name: "owner_lookup",
      description: "Return the owner and review policy for a repository path.",
      input: ownerInput,
      output: ownerOutput,
      run({ input, signal }) {
        signal?.throwIfAborted();
        const match = catalog.find((entry) => input.path.startsWith(entry.prefix));
        return {
          path: input.path,
          owner: match?.owner ?? "general",
          policy: match?.policy ?? "Review with the default repository policy.",
        };
      },
      toModelOutput(output) {
        return {
          owner: output.owner,
          policy: output.policy,
        };
      },
    }),
  };
});

export default definePipr((pipr) => {
  const model = pipr.model({
    provider: "deepseek",
    model: "deepseek-v4-pro",
    apiKey: pipr.secret({ name: "DEEPSEEK_API_KEY" }),
    options: { thinking: "high" },
  });

  const owners = pipr.use(ownersPlugin);

  pipr.review({
    id: "owner-aware-review",
    model,
    tools: [...pipr.tools.readOnly, owners.ownerLookup],
    instructions: `
      Review the pull request using owner_lookup for files where ownership or
      policy is unclear. Apply owner policy, but report only actionable defects.
    `,
    entrypoints: {
      changeRequest: ["opened", "updated"],
      command: { pattern: "@pipr owner-review", permission: "write" },
      local: "owner-review",
    },
  });
});
