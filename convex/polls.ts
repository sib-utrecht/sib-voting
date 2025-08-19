import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: { roomCode: v.string() },
  handler: async (ctx, args) => {
    const polls = await ctx.db
      .query("polls")
      .withIndex("by_room", (q) => q.eq("roomCode", args.roomCode))
      .filter((q) => q.eq(q.field("isActive"), true))
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
    questions: v.array(
      v.object({
        text: v.string(),
        choices: v.array(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const pollId = await ctx.db.insert("polls", {
      title: args.title,
      description: args.description,
      roomCode: args.roomCode,
      isActive: true,
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
    voterCode: v.string(),
    votes: v.array(
      v.object({
        questionId: v.id("questions"),
        choiceId: v.id("choices"),
      })
    ),
  },
  handler: async (ctx, args) => {
    // Check if user has already voted on this poll
    const existingVotes = await ctx.db
      .query("votes")
      .withIndex("by_poll_voter", (q) => 
        q.eq("pollId", args.pollId).eq("voterCode", args.voterCode)
      )
      .collect();

    if (existingVotes.length > 0) {
      throw new Error("You have already voted on this poll");
    }

    // Submit all votes
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
  args: { pollId: v.id("polls"), voterCode: v.string() },
  handler: async (ctx, args) => {
    const poll = await ctx.db.get(args.pollId);
    if (!poll) return null;

    // Check if user has voted directly
    const userVotes = await ctx.db
      .query("votes")
      .withIndex("by_poll_voter", (q) => 
        q.eq("pollId", args.pollId).eq("voterCode", args.voterCode)
      )
      .collect();
    const hasUserVoted = userVotes.length > 0;
    
    // Check if this is an admin room code
    const room = await ctx.db
      .query("rooms")
      .withIndex("by_code", (q) => q.eq("code", args.voterCode))
      .unique();
    const isAdmin = room?.type === "admin";
    
    if (!isAdmin && !poll.resultsVisible && !hasUserVoted) {
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
      canViewResults: isAdmin || poll.resultsVisible || hasUserVoted,
    };
  },
});

export const toggleResults = mutation({
  args: { pollId: v.id("polls"), roomCode: v.string() },
  handler: async (ctx, args) => {
    // Check if this is an admin room code
    const room = await ctx.db
      .query("rooms")
      .withIndex("by_code", (q) => q.eq("code", args.roomCode))
      .unique();
    
    if (!room || room.type !== "admin") {
      throw new Error("Only admin can toggle results visibility");
    }

    const poll = await ctx.db.get(args.pollId);
    if (!poll) {
      throw new Error("Poll not found");
    }

    await ctx.db.patch(args.pollId, {
      resultsVisible: !poll.resultsVisible,
    });

    return !poll.resultsVisible;
  },
});

export const myPolls = query({
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
