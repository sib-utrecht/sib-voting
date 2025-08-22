import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./utils";
import { generateRandomCode } from "./rooms";

export const createAdmin = internalMutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    const adminCode = generateRandomCode(16);

    // Create the admin user
    await ctx.db.insert("users", {
      adminCode: adminCode,
    });
    
    return adminCode;
  },
});