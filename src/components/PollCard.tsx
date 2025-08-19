import { useState } from "react";
import { Id } from "../../convex/_generated/dataModel";
import { PollDetail } from "./PollDetail";

interface Poll {
  _id: Id<"polls">;
  title: string;
  description?: string;
  _creationTime: number;
}

interface PollCardProps {
  poll: Poll;
  roomCode: string;
}

export function PollCard({ poll, roomCode }: PollCardProps) {
  const [showDetail, setShowDetail] = useState(false);

  if (showDetail) {
    return <PollDetail pollId={poll._id} roomCode={roomCode} onBack={() => setShowDetail(false)} />;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex flex-col h-full">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{poll.title}</h3>
          {poll.description && (
            <p className="text-gray-600 text-sm mb-4 line-clamp-3">{poll.description}</p>
          )}
        </div>
        
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="text-sm text-gray-500">
            <p>{new Date(poll._creationTime).toLocaleDateString()}</p>
          </div>
          <button
            onClick={() => setShowDetail(true)}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors font-medium"
          >
            Vote
          </button>
        </div>
      </div>
    </div>
  );
}
