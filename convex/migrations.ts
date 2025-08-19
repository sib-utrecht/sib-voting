import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

// Backfill the required `isVisible` field on existing `polls` documents.
// Sets a default value for any document missing this field.
export const backfillPollsIsVisible = internalMutation({
  args: { defaultValue: v.boolean() },
  returns: v.number(),
  handler: async (ctx, args) => {
    let updated = 0;
    // Iterate through all polls and set `isVisible` if it's missing.
    for await (const poll of ctx.db.query("polls")) {
      // Older documents may not have this field.
      const hasField = (poll as any).isVisible !== undefined;
      if (!hasField) {
        await ctx.db.patch(poll._id, { isVisible: args.defaultValue });
        updated++;
      }
    }
    return updated;
  },
});
