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

// Backfill polls.roomId from existing roomCode, then clear roomCode.
export const backfillPollsRoomId = internalMutation({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    let updated = 0;
    for await (const poll of ctx.db.query("polls")) {
      const anyPoll = poll as any;
      if (!anyPoll.roomId && anyPoll.roomCode) {
        const room = await ctx.db
          .query("rooms")
          .withIndex("by_code", (q) => q.eq("code", anyPoll.roomCode))
          .unique();
        if (room) {
          await ctx.db.patch(poll._id, { roomId: room._id });
          updated++;
        }
      }
    }
    return updated;
  },
});

// Update users.roomCode to be required? We'll keep as-is. Migration safely skips when room not found.
