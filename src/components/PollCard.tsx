import { useState, useEffect } from "react";
import { Id } from "../../convex/_generated/dataModel";
import { PollDetail } from "./PollDetail";
import { dateFormat } from "../lib/locale";
import { PollResults } from "./PollResults";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export interface Poll {
  _id: Id<"polls">;
  title: string;
  description?: string;
  isActive: boolean;
  resultsVisible: boolean;
  _creationTime: number;
}

interface PollCardProps {
  poll: Poll;
  roomCode: string;
  onVote: () => void;
}

export function PollCard({ poll, roomCode, onVote }: PollCardProps) {
  const [showResults, setShowResults] = useState(false);
  const [votedCount, setVotedCount] = useState(0);

  const pollId = poll._id;

  // unique voter count from server
  const voterCount = useQuery(api.polls.voterCount, { pollId: pollId as any });

  // Load whether the user has voted for this poll from localStorage
  useEffect(() => {
    try {
      const key = `voted:${pollId}`;
      const value = localStorage.getItem(key) ?? "0";
      setVotedCount(+value);
    } catch {
      setVotedCount(0);
    }
  }, [pollId]);

  return (
    <div className="bg-white rounded-lg shadow-xs border border-gray-200 p-6 hover:shadow-sm transition-shadow"
      onClick={poll.isActive ? () => onVote() : undefined}
    >
      <div className="flex flex-col h-full">
        <div className="flex-1">
          <h3 className="text-md font-semibold text-gray-900 mb-2">{poll.title}</h3>
          {poll.description && (
            <p className="text-gray-600 text-sm mb-4 line-clamp-3">{poll.description}</p>
          )}
        </div>

        {showResults &&
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <PollResults pollId={pollId} />
          </div>
        }

        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="text-sm text-gray-500">
            {/* If the poll is 4 weeks old, display its creation date */}
            {poll._creationTime < Date.now() - 1000 * 60 * 60 * 24 * 28 ? (
              <p>{dateFormat.format(new Date(poll._creationTime))}</p>
            ) : null}
            {typeof voterCount === "number" && (
              <p className="text-sm text-gray-600">{voterCount} {voterCount === 1 ? "vote" : "votes"}</p>
            )}
            {
              votedCount > 0 && <p className="text-sm text-green-600 font-medium">You have voted {votedCount} {votedCount === 1 ? "time" : "times"}</p>
            }
          </div>
          <div className="flex flex-col h-full justify-center gap-2">
            {poll.resultsVisible && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowResults(!showResults);
                }}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors font-medium"
              >
                {showResults ? "Hide Results" : "View Results"}
              </button>
            )}
            {
              poll.isActive && (
                <button
                  onClick={() => onVote()}
                  className={
                    votedCount == 0 ?
                      "px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors font-medium"
                      :
                      // Outline button style
                      "px-4 py-2 border border-primary text-primary rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  }
                >
                  {votedCount > 0 ? "Vote again" : "Vote"}
                </button>
              )
            }
          </div>
        </div>
      </div>
    </div>
  );
}
