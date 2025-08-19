import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Poll, PollCard } from "./PollCard";
import { Id } from "../../convex/_generated/dataModel";
import { PollDetail } from "./PollDetail";

interface PollListProps {
  roomCode: string;
}

export function PollList({ roomCode }: PollListProps) {
  const polls = useQuery(api.polls.list, { roomCode });
  const [votingPollId, setVotingPollId] = useState<Id<"polls"> | undefined>(undefined);
  const [showInactive, setShowInactive] = useState(false);

  if (polls === undefined) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (polls.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🗳️</div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">No active polls</h3>
        <p className="text-gray-500">Check back later for new polls to vote on!</p>
      </div>
    );
  }

  const votingPoll = polls.find((poll) => poll._id === votingPollId);
  if (votingPoll && votingPoll.isActive) {
    return <PollDetail pollId={votingPoll._id} roomCode={roomCode} onBack={() => setVotingPollId(undefined)} />;
  }

  const activePolls = polls.filter((poll) => poll.isActive);
  const inactivePolls = polls.filter((poll) => !poll.isActive);

  return (
    <div className="space-y-6">
      {activePolls.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {activePolls.map((poll) => (
            <PollCard key={poll._id} poll={poll} roomCode={roomCode} onVote={() => setVotingPollId(poll._id)} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🗳️</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No active polls</h3>
          <p className="text-gray-500">Check back later for new polls to vote on!</p>
        </div>
      )}

      {inactivePolls.length > 0 && (
        <div className="border-t pt-4">
          <button
            type="button"
            onClick={() => setShowInactive((v) => !v)}
            className="text-sm text-gray-600 hover:text-gray-800 flex items-center gap-2"
          >
            <span>
              {showInactive
                ? "Hide past polls"
                : `Show past polls (${inactivePolls.length})`}
            </span>
            <svg
              className={`h-4 w-4 transition-transform ${showInactive ? "rotate-180" : "rotate-0"}`}
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.08 1.04l-4.25 4.25a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          {showInactive && (
            <div className="mt-4 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {inactivePolls.map((poll) => (
                <PollCard key={poll._id} poll={poll} roomCode={roomCode} onVote={() => setVotingPollId(poll._id)} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
