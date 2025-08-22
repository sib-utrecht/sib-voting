import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { generateRandomCode } from "./rooms";
import { requireAdmin, getPoll } from "./utils";

export const list = query({
  args: { roomCode: v.string() },
  handler: async (ctx, args) => {
    // Resolve room by code
    const room = await ctx.db
      .query("rooms")
      .withIndex("by_code", (q) => q.eq("code", args.roomCode))
      .unique();
    if (!room) return [];

    const polls = await ctx.db
      .query("polls")
      .withIndex("by_room", (q) => q.eq("roomId", room._id))
      .filter((q) => q.eq(q.field("isVisible"), true))
      .collect();

    return polls.sort((a, b) => {
      const aKey = (a.sortDate ?? a._creationTime);
      const bKey = (b.sortDate ?? b._creationTime);
      return bKey - aKey;
    });
  },
});


export const listAll = query({
  args: { roomCode: v.string() },
  handler: async (ctx, args) => {
    // Resolve room by code
    const room = await ctx.db
      .query("rooms")
      .withIndex("by_code", (q) => q.eq("code", args.roomCode))
      .unique();
    if (!room) return [];

    const polls = await ctx.db
      .query("polls")
      .withIndex("by_room", (q) => q.eq("roomId", room._id))
      .collect();

    const augmented = await Promise.all(
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

    // Sort by sortDate (desc) falling back to _creationTime (desc)
    augmented.sort((a, b) => {
      const aKey = (a.sortDate ?? a._creationTime);
      const bKey = (b.sortDate ?? b._creationTime);
      return bKey - aKey;
    });

    return augmented;
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
    const user = await requireAdmin(ctx, args.adminCode);
    if (!user) return { error: "Invalid admin code" } as const;

    // Resolve room by code to get roomId
    const room = await ctx.db
      .query("rooms")
      .withIndex("by_code", (q) => q.eq("code", args.roomCode))
      .unique();
    if (!room) return { error: "Room not found" } as const;

    const pollId = await ctx.db.insert("polls", {
      title: args.title,
      description: args.description,
      roomId: room._id,
      isActive: true,
      isVisible: true,
      resultsVisible: false,
      sortDate: Date.now(),
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

    return { pollId };
  },
});

// Update an existing poll's metadata, questions and choices.
export const update = mutation({
  args: {
    pollId: v.id("polls"),
    adminCode: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    questions: v.array(
      v.object({
        id: v.optional(v.id("questions")),
        text: v.string(),
        choices: v.array(
          v.object({
            id: v.optional(v.id("choices")),
            text: v.string(),
          })
        ),
      })
    ),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx, args.adminCode);
    if (!admin) return { error: "Invalid admin code" } as const;

    const poll = await getPoll(ctx, args.pollId);
    if (!poll) return { error: "Poll not found" } as const;

    // Patch poll metadata
    await ctx.db.patch(args.pollId, {
      title: args.title,
      description: args.description,
    });

    // Load existing questions and choices
    const existingQuestions = await ctx.db
      .query("questions")
      .withIndex("by_poll", (q) => q.eq("pollId", args.pollId))
      .collect();

    const existingQuestionsById = new Map(existingQuestions.map((q) => [q._id, q]));

    const incomingQuestionIds = new Set<string>();

    // Update or insert questions and their choices
    for (let qi = 0; qi < args.questions.length; qi++) {
      const qInput = args.questions[qi];
      let questionId = qInput.id ?? null;

      if (questionId && !existingQuestionsById.has(questionId)) {
        // Ignore unknown id by treating as new
        questionId = null;
      }

      if (!questionId) {
        // Create new question
        const newQId = await ctx.db.insert("questions", {
          pollId: args.pollId,
          text: qInput.text,
          order: qi,
        });
        questionId = newQId;
      } else {
        // Update existing question text/order
        await ctx.db.patch(questionId, { text: qInput.text, order: qi });
      }

      incomingQuestionIds.add(questionId);

      // Handle choices for this question
      const existingChoices = await ctx.db
        .query("choices")
        .withIndex("by_question", (q) => q.eq("questionId", questionId!))
        .collect();
      const existingChoicesById = new Map(existingChoices.map((c) => [c._id, c]));
      const incomingChoiceIds = new Set<string>();

      for (let ci = 0; ci < qInput.choices.length; ci++) {
        const cInput = qInput.choices[ci];
        let choiceId = cInput.id ?? null;
        if (choiceId && !existingChoicesById.has(choiceId)) {
          choiceId = null;
        }

        if (!choiceId) {
          const newCId = await ctx.db.insert("choices", {
            questionId: questionId!,
            text: cInput.text,
            order: ci,
          });
          choiceId = newCId;
        } else {
          await ctx.db.patch(choiceId, { text: cInput.text, order: ci });
        }
        incomingChoiceIds.add(choiceId);
      }

      // Remove choices not present anymore (only if they have no votes)
      for (const c of existingChoices) {
        if (!incomingChoiceIds.has(c._id)) {
          const votes = await ctx.db
            .query("votes")
            .withIndex("by_choice", (q) => q.eq("choiceId", c._id))
            .collect();
          if (votes.length > 0) {
            return { error: `Cannot remove choice "${c.text}" because it already has votes` } as const;
          }
          await ctx.db.delete(c._id);
        }
      }
    }

    // Remove questions not present anymore (only if they have no votes)
    for (const q of existingQuestions) {
      if (!incomingQuestionIds.has(q._id)) {
        const votesForQuestion = await ctx.db
          .query("votes")
          .withIndex("by_question", (qv) => qv.eq("questionId", q._id))
          .collect();
        if (votesForQuestion.length > 0) {
          return { error: `Cannot remove question "${q.text}" because it already has votes` } as const;
        }
        // delete choices under this question first
        const choices = await ctx.db
          .query("choices")
          .withIndex("by_question", (qch) => qch.eq("questionId", q._id))
          .collect();
        for (const c of choices) {
          await ctx.db.delete(c._id);
        }
        await ctx.db.delete(q._id);
      }
    }

    return { pollId: args.pollId } as const;
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

export const deleteVote = mutation({
  args: { adminCode: v.string(), voteId: v.id("votes") },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx, args.adminCode);
    if (!admin) return { error: "Invalid admin code" } as const;

    const vote = await ctx.db.get(args.voteId);
    if (!vote) return { error: "Vote not found" } as const;

    await ctx.db.delete(args.voteId);
    return { success: true } as const;
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
  args: { pollId: v.id("polls"), adminCode: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const poll = await ctx.db.get(args.pollId);
    if (!poll) return { error: "Poll not found" } as const;

    // Check if user has voted directly

    // Check if this is an admin code
    const adminCode = args.adminCode;
    const adminUser = adminCode ? await ctx.db
      .query("users")
      .withIndex("by_admin_code", (q) => q.eq("adminCode", adminCode))
      .unique() : null;
    const isAdmin = !!adminUser;

    if (!isAdmin && !poll.resultsVisible) {
      return { error: "Results are not visible" } as const;
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
    const admin = await requireAdmin(ctx, args.adminCode);
    if (!admin) return { error: "Invalid admin code" } as const;

    const poll = await getPoll(ctx, args.pollId);
    if (!poll) return { error: "Poll not found" } as const;

    const resultsVisible = args.resultsVisible;

    await ctx.db.patch(args.pollId, {
      resultsVisible,
    });

    return { resultsVisible };
  },
});

export const setVisible = mutation({
  args: { pollId: v.id("polls"), adminCode: v.string(), isVisible: v.boolean() },
  handler: async (ctx, args) => {
    // Verify admin code
    const admin = await requireAdmin(ctx, args.adminCode);
    if (!admin) return { error: "Invalid admin code" } as const;

    const poll = await getPoll(ctx, args.pollId);
    if (!poll) return { error: "Poll not found" } as const;

    const isVisible = args.isVisible;

    await ctx.db.patch(args.pollId, {
      isVisible,
    });

    return { isVisible };
  },
});

export const setActive = mutation({
  args: { pollId: v.id("polls"), adminCode: v.string(), isActive: v.boolean() },
  handler: async (ctx, args) => {
    // Verify admin code
    const admin = await requireAdmin(ctx, args.adminCode);
    if (!admin) return { error: "Invalid admin code" } as const;

    const poll = await getPoll(ctx, args.pollId);
    if (!poll) return { error: "Poll not found" } as const;

    const isActive = args.isActive;

    await ctx.db.patch(args.pollId, {
      isActive,
    });

    return { isActive };
  },
});

export const moveToTop = mutation({
  args: { pollId: v.id("polls"), adminCode: v.string() },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx, args.adminCode);
    if (!admin) return { error: "Invalid admin code" } as const;

    const poll = await getPoll(ctx, args.pollId);
    if (!poll) return { error: "Poll not found" } as const;

    const sortDate = Date.now();
    await ctx.db.patch(args.pollId, { sortDate });
    return { sortDate } as const;
  },
});

export const votesTable = query({
  args: { pollId: v.id("polls"), adminCode: v.string() },
  handler: async (ctx, args) => {
    // Admin verification
    const admin = await requireAdmin(ctx, args.adminCode);
    if (!admin) return { error: "Invalid admin code" } as const;

    const poll = await getPoll(ctx, args.pollId);
    if (!poll) return { error: "Poll not found" } as const;

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
    const rowsMap = new Map<string, { voterCode: string | null; firstSeen: number; lastSeen: number; answers: Record<string, { voteId: string; choiceId: string; choiceText: string }>; }>();

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
        voteId: vDoc._id,
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
