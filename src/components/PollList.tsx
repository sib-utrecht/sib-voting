import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { PollCard } from "./PollCard";

interface PollListProps {
  roomCode: string;
}

export function PollList({ roomCode }: PollListProps) {
  const polls = useQuery(api.polls.list, { roomCode });

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

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {polls.map((poll) => (
        <PollCard key={poll._id} poll={poll} roomCode={roomCode} />
      ))}
    </div>
  );
}
