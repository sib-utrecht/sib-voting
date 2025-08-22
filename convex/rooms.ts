import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./utils";

export const doAuth = query({
  args: { authCode: v.string(), roomCode: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await requireAdmin(ctx, args.authCode);

    const roomCode = user ? args.roomCode : args.authCode;

    const room = roomCode ? await ctx.db
      .query("rooms")
      .withIndex("by_code", (q) => q.eq("code", roomCode))
      .unique() : null;

    if (!user && !room) {
      return {
        error: `Invalid room code.`,
      } as const;
    }

    return {
      adminCode: user?.adminCode,
      room,
    };
  },
});

export const generateRandomCode = (length: number = 6) => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const createRoom = mutation({
  args: {
    name: v.string(),
    adminCode: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify admin code
    const user = await requireAdmin(ctx, args.adminCode);
    if (!user) {
      return { error: "Invalid admin code" } as const;
    }

    const roomCode = generateRandomCode();

    // Create the room
    const roomId = await ctx.db.insert("rooms", {
      code: roomCode,
      name: args.name,
    });

    return { roomId, roomCode };
  },
});

export const listRooms = query({
  args: {
    adminCode: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify admin code
    const user = await requireAdmin(ctx, args.adminCode);

    if (!user) {
      return {
        error: "Invalid admin code",
      } as const;
    }

    // List all rooms ordered by newest first
    const rooms = await ctx.db.query("rooms").order("desc").collect();
    return {
      rooms,
    };
  },
});
