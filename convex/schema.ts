import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const applicationTables = {
  rooms: defineTable({
    code: v.string(),
    name: v.string(),
  }).index("by_code", ["code"]),

  users: defineTable({
    adminCode: v.string(),
  }).index("by_admin_code", ["adminCode"]),

  polls: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    roomId: v.id("rooms"),
    isActive: v.boolean(),
    isVisible: v.boolean(),
    resultsVisible: v.boolean(),
    sortDate: v.optional(v.number()),
  }).index("by_room", ["roomId"]),

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
    voterCode: v.optional(v.string()),
  })
    .index("by_poll_voter", ["pollId", "voterCode"])
    .index("by_question", ["questionId"])
    .index("by_choice", ["choiceId"]),
};

export default defineSchema({
  ...applicationTables,
});
