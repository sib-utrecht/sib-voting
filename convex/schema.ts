import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const applicationTables = {
  rooms: defineTable({
    code: v.string(),
    type: v.union(v.literal("user"), v.literal("admin")),
    name: v.string(),
  }).index("by_code", ["code"]),

  polls: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    roomCode: v.string(),
    isActive: v.boolean(),
    resultsVisible: v.boolean(),
  }).index("by_room", ["roomCode"]),

  questions: defineTable({
    pollId: v.id("polls"),
    text: v.string(),
    order: v.number(),
  }).index("by_poll", ["pollId"]),

  choices: defineTable({
    questionId: v.id("questions"),
    text: v.string(),
    order: v.number(),
  }).index("by_question", ["questionId"]),

  votes: defineTable({
    pollId: v.id("polls"),
    questionId: v.id("questions"),
    choiceId: v.id("choices"),
    voterCode: v.string(),
  })
    .index("by_poll_voter", ["pollId", "voterCode"])
    .index("by_question", ["questionId"])
    .index("by_choice", ["choiceId"]),
};

export default defineSchema({
  ...applicationTables,
});
