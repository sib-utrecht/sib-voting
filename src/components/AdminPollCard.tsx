import { useState } from "react";
import { Id } from "../../convex/_generated/dataModel";
import { PollResults } from "./PollResults";

interface AdminPoll {
  _id: Id<"polls">;
  title: string;
  description?: string;
  isActive: boolean;
  resultsVisible: boolean;
  voterCount: number;
  _creationTime: number;
}

interface AdminPollCardProps {
  poll: AdminPoll;
  roomCode: string;
}

export function AdminPollCard({ poll, roomCode }: AdminPollCardProps) {
  const [showResults, setShowResults] = useState(false);

  if (showResults) {
    return <PollResults pollId={poll._id} roomCode={roomCode} onBack={() => setShowResults(false)} />;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex flex-col h-full">
        <div className="flex-1">
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900">{poll.title}</h3>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${poll.isActive ? "bg-green-500" : "bg-gray-400"}`} />
              <span className="text-xs text-gray-500">
                {poll.isActive ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
          
          {poll.description && (
            <p className="text-gray-600 text-sm mb-4 line-clamp-3">{poll.description}</p>
          )}

          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Voters:</span>
              <span className="font-medium text-gray-900">{poll.voterCount}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Results:</span>
              <span className={`font-medium ${poll.resultsVisible ? "text-green-600" : "text-gray-600"}`}>
                {poll.resultsVisible ? "Public" : "Private"}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="text-sm text-gray-500">
            <p>{new Date(poll._creationTime).toLocaleDateString()}</p>
          </div>
          <button
            onClick={() => setShowResults(true)}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors font-medium"
          >
            View Results
          </button>
        </div>
      </div>
    </div>
  );
}
