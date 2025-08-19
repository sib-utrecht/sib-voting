import type { QueryCtx, MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

export type DbCtx = QueryCtx | MutationCtx;

export async function requireAdmin(ctx: DbCtx, adminCode: string) {
  const user = await ctx.db
    .query("users")
    .withIndex("by_admin_code", (q: any) => q.eq("adminCode", adminCode))
    .unique();
  return user ?? null;
}

export async function getPoll(ctx: DbCtx, pollId: Id<"polls">) {
  const poll = await ctx.db.get(pollId);
  return poll ?? null;
}
