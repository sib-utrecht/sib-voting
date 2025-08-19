import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const doAuth = query({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_admin_code", (q) => q.eq("adminCode", args.code))
      .unique();

    if (user) {
      const room = await ctx.db
        .query("rooms")
        .withIndex("by_code", (q) => q.eq("code", user.roomCode))
        .unique();

      if (!room) {
        return {
          "error": "Invalid room code associated with admin code"
        }
      }

      return {
        adminCode: user.adminCode,
        room: room,
      };
    }

    const room = await ctx.db
      .query("rooms")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .unique();
    if (!room) {
      return {
        "error": "Invalid room code"
      }
    }

    return {
      adminCode: null,
      room,
    };
  },
});

const generateRandomCode = (length: number = 6) => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const createRoom = mutation({
  args: {
    name: v.string()
  },
  handler: async (ctx, args) => {
    const roomCode = generateRandomCode();
    const adminCode = generateRandomCode();

    // Create the room
    const roomId = await ctx.db.insert("rooms", {
      code: roomCode,
      name: args.name,
    });

    // Create the admin user
    await ctx.db.insert("users", {
      adminCode: adminCode,
      roomCode: roomCode,
    });

    return { roomId, roomCode, adminCode };
  },
});
