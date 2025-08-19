import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const validateRoom = query({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const room = await ctx.db
      .query("rooms")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .unique();
    
    return room;
  },
});

export const createRoom = mutation({
  args: { 
    code: v.string(), 
    type: v.union(v.literal("user"), v.literal("admin")),
    name: v.string()
  },
  handler: async (ctx, args) => {
    // Check if room already exists
    const existing = await ctx.db
      .query("rooms")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .unique();
    
    if (existing) {
      throw new Error("Room code already exists");
    }

    return await ctx.db.insert("rooms", {
      code: args.code,
      type: args.type,
      name: args.name,
    });
  },
});
