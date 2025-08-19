import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { generateRandomCode } from "./rooms";

export const list = query({
  args: { roomCode: v.string() },
  handler: async (ctx, args) => {
    const polls = await ctx.db
      .query("polls")
      .withIndex("by_room", (q) => q.eq("roomCode", args.roomCode))
      .filter((q) => q.eq(q.field("isVisible"), true))
      .collect();
    
    return polls;
  },
});

export const get = query({
  args: { pollId: v.id("polls") },
  handler: async (ctx, args) => {
    const poll = await ctx.db.get(args.pollId);
    if (!poll) return null;

    const questions = await ctx.db
      .query("questions")
      .withIndex("by_poll", (q) => q.eq("pollId", args.pollId))
      .collect();

    const questionsWithChoices = await Promise.all(
      questions
        .sort((a, b) => a.order - b.order)
        .map(async (question) => {
          const choices = await ctx.db
            .query("choices")
            .withIndex("by_question", (q) => q.eq("questionId", question._id))
            .collect();

          return {
            ...question,
            choices: choices.sort((a, b) => a.order - b.order),
          };
        })
    );

    return {
      ...poll,
      questions: questionsWithChoices,
    };
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    roomCode: v.string(),
    adminCode: v.string(),
    questions: v.array(
      v.object({
        text: v.string(),
        choices: v.array(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    // Verify admin code
    const user = await ctx.db
      .query("users")
      .withIndex("by_admin_code", (q) => q.eq("adminCode", args.adminCode))
      .unique();
    
    if (!user) {
      throw new Error("Invalid admin code");
    }

    // Verify the room code matches the admin's room
    if (user.roomCode !== args.roomCode) {
      throw new Error("Room is not owned by admin");
    }

    const pollId = await ctx.db.insert("polls", {
      title: args.title,
      description: args.description,
      roomCode: args.roomCode,
      isActive: true,
      isVisible: true,
      resultsVisible: false,
    });

    for (let i = 0; i < args.questions.length; i++) {
      const question = args.questions[i];
      const questionId = await ctx.db.insert("questions", {
        pollId,
        text: question.text,
        order: i,
      });

      for (let j = 0; j < question.choices.length; j++) {
        await ctx.db.insert("choices", {
          questionId,
          text: question.choices[j],
          order: j,
        });
      }
    }

    return pollId;
  },
});

export const vote = mutation({
  args: {
    pollId: v.id("polls"),
    voterCode: v.optional(v.string()),
    votes: v.array(
      v.object({
        questionId: v.id("questions"),
        choiceId: v.id("choices"),
      })
    ),
  },
  handler: async (ctx, args) => {
    args.voterCode ??= generateRandomCode(12);

    for (const vote of args.votes) {
      await ctx.db.insert("votes", {
        pollId: args.pollId,
        questionId: vote.questionId,
        choiceId: vote.choiceId,
        voterCode: args.voterCode,
      });
    }

    return true;
  },
});

export const hasVoted = query({
  args: { pollId: v.id("polls"), voterCode: v.string() },
  handler: async (ctx, args) => {
    const votes = await ctx.db
      .query("votes")
      .withIndex("by_poll_voter", (q) => 
        q.eq("pollId", args.pollId).eq("voterCode", args.voterCode)
      )
      .collect();

    return votes.length > 0;
  },
});

export const getResults = query({
  args: { pollId: v.id("polls"), adminCode : v.optional(v.string()) },
  handler: async (ctx, args) => {
    const poll = await ctx.db.get(args.pollId);
    if (!poll) return null;

    // Check if user has voted directly
    
    // Check if this is an admin code
    const adminCode = args.adminCode;
    const adminUser = adminCode ? await ctx.db
      .query("users")
      .withIndex("by_admin_code", (q) => q.eq("adminCode", adminCode))
      .unique() : null;
    const isAdmin = !!adminUser;
    
    if (!isAdmin && !poll.resultsVisible) {
      return null;
    }

    const questions = await ctx.db
      .query("questions")
      .withIndex("by_poll", (q) => q.eq("pollId", args.pollId))
      .collect();

    const results = await Promise.all(
      questions
        .sort((a, b) => a.order - b.order)
        .map(async (question) => {
          const choices = await ctx.db
            .query("choices")
            .withIndex("by_question", (q) => q.eq("questionId", question._id))
            .collect();

          const choiceResults = await Promise.all(
            choices
              .sort((a, b) => a.order - b.order)
              .map(async (choice) => {
                const votes = await ctx.db
                  .query("votes")
                  .withIndex("by_choice", (q) => q.eq("choiceId", choice._id))
                  .collect();

                return {
                  ...choice,
                  voteCount: votes.length,
                };
              })
          );

          const totalVotes = choiceResults.reduce((sum, choice) => sum + choice.voteCount, 0);

          return {
            ...question,
            choices: choiceResults.map((choice) => ({
              ...choice,
              percentage: totalVotes > 0 ? Math.round((choice.voteCount / totalVotes) * 100) : 0,
            })),
            totalVotes,
          };
        })
    );

    return {
      ...poll,
      questions: results,
      isAdmin,
      canViewResults: isAdmin || poll.resultsVisible,
    };
  },
});

export const setResultsVisible = mutation({
  args: { pollId: v.id("polls"), adminCode: v.string(), resultsVisible: v.boolean() },
  handler: async (ctx, args) => {
    // Check if this is a valid admin code
    const user = await ctx.db
      .query("users")
      .withIndex("by_admin_code", (q) => q.eq("adminCode", args.adminCode))
      .unique();
    
    if (!user) {
      throw new Error("Invalid admin code");
    }

    const poll = await ctx.db.get(args.pollId);
    if (!poll) {
      throw new Error("Poll not found");
    }

    await ctx.db.patch(args.pollId, {
      resultsVisible: args.resultsVisible,
    });

    return args.resultsVisible;
  },
});

export const setVisible = mutation({
  args: { pollId: v.id("polls"), adminCode: v.string(), isVisible: v.boolean() },
  handler: async (ctx, args) => {
    // Verify admin code
    const user = await ctx.db
      .query("users")
      .withIndex("by_admin_code", (q) => q.eq("adminCode", args.adminCode))
      .unique();

    if (!user) {
      throw new Error("Invalid admin code");
    }

    const poll = await ctx.db.get(args.pollId);
    if (!poll) {
      throw new Error("Poll not found");
    }

    await ctx.db.patch(args.pollId, {
      isVisible: args.isVisible,
    });

    return args.isVisible;
  },
});

export const setActive = mutation({
  args: { pollId: v.id("polls"), adminCode: v.string(), isActive: v.boolean() },
  handler: async (ctx, args) => {
    // Verify admin code
    const user = await ctx.db
      .query("users")
      .withIndex("by_admin_code", (q) => q.eq("adminCode", args.adminCode))
      .unique();

    if (!user) {
      throw new Error("Invalid admin code");
    }

    const poll = await ctx.db.get(args.pollId);
    if (!poll) {
      throw new Error("Poll not found");
    }

    await ctx.db.patch(args.pollId, {
      isActive: args.isActive,
    });

    return args.isActive;
  },
});

export const votesTable = query({
  args: { pollId: v.id("polls"), adminCode: v.string() },
  handler: async (ctx, args) => {
    // Admin verification
    const admin = await ctx.db
      .query("users")
      .withIndex("by_admin_code", (q) => q.eq("adminCode", args.adminCode))
      .unique();
    if (!admin) {
      throw new Error("Invalid admin code");
    }

    const poll = await ctx.db.get(args.pollId);
    if (!poll) {
      throw new Error("Poll not found");
    }

    // Load questions and choices
    const questions = await ctx.db
      .query("questions")
      .withIndex("by_poll", (q) => q.eq("pollId", args.pollId))
      .collect();
    const orderedQuestions = questions.sort((a, b) => a.order - b.order);

    // Preload choices for quick lookup
    const choiceTextById = new Map<string, string>();
    for (const qn of orderedQuestions) {
      const choices = await ctx.db
        .query("choices")
        .withIndex("by_question", (q) => q.eq("questionId", qn._id))
        .collect();
      for (const ch of choices) {
        choiceTextById.set(ch._id, ch.text);
      }
    }

    // Load all votes for this poll
    const votes = await ctx.db
      .query("votes")
      .withIndex("by_poll_voter", (q) => q.eq("pollId", args.pollId))
      .collect();

    // Group votes by voterCode
    const rowsMap = new Map<string, { voterCode: string | null; firstSeen: number; lastSeen: number; answers: Record<string, { choiceId: string; choiceText: string }>; }>();

    const codeKey = (code: string | null | undefined) => (code ?? "");

    for (const vDoc of votes) {
      const key = codeKey(vDoc.voterCode);
      if (!rowsMap.has(key)) {
        rowsMap.set(key, {
          voterCode: vDoc.voterCode ?? null,
          firstSeen: vDoc._creationTime,
          lastSeen: vDoc._creationTime,
          answers: {},
        });
      }
      const row = rowsMap.get(key)!;
      const choiceText = choiceTextById.get(vDoc.choiceId) ?? "";
      row.answers[vDoc.questionId] = {
        choiceId: vDoc.choiceId,
        choiceText,
      };
      if (vDoc._creationTime < row.firstSeen) row.firstSeen = vDoc._creationTime;
      if (vDoc._creationTime > row.lastSeen) row.lastSeen = vDoc._creationTime;
    }

    const rows = Array.from(rowsMap.values()).sort((a, b) => a.firstSeen - b.firstSeen);

    return {
      questions: orderedQuestions.map((q) => ({ _id: q._id, text: q.text })),
      rows,
    };
  },
});

export const listAll = query({
  args: { roomCode: v.string() },
  handler: async (ctx, args) => {
    const polls = await ctx.db
      .query("polls")
      .withIndex("by_room", (q) => q.eq("roomCode", args.roomCode))
      .collect();

    return Promise.all(
      polls.map(async (poll) => {
        const totalVotes = await ctx.db
          .query("votes")
          .withIndex("by_poll_voter", (q) => q.eq("pollId", poll._id))
          .collect();

        // Count unique voters
        const uniqueVoters = new Set(totalVotes.map(vote => vote.voterCode));

        return {
          ...poll,
          voterCount: uniqueVoters.size,
        };
      })
    );
  },
});
