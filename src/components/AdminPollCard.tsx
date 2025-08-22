import { useState } from "react";
import { Id } from "../../convex/_generated/dataModel";
import { PollResults } from "./PollResults";
import { dateFormat } from "../lib/locale";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { VotesTableModal } from "./VotesTableModal";

interface AdminPoll {
  _id: Id<"polls">;
  title: string;
  description?: string;
  isActive: boolean;
  isVisible: boolean;
  resultsVisible: boolean;
  voterCount: number;
  _creationTime: number;
}

interface AdminPollCardProps {
  poll: AdminPoll;
  roomCode: string;
  adminCode: string;
  onEdit?: () => void;
}

export function AdminPollCard({ poll, roomCode, adminCode, onEdit }: AdminPollCardProps) {
  const [showResults, setShowResults] = useState(false);
  const [showVotes, setShowVotes] = useState(false);
  const [isActiveLocal, setIsActiveLocal] = useState(poll.isActive);
  const [isVisibleLocal, setIsVisibleLocal] = useState(poll.isVisible ?? true);
  const [resultsVisibleLocal, setResultsVisibleLocal] = useState(poll.resultsVisible);
  const setActive = useMutation(api.polls.setActive);
  const setVisible = useMutation(api.polls.setVisible);
  const setResultsVisible = useMutation(api.polls.setResultsVisible);
  const moveToTop = useMutation(api.polls.moveToTop);

  const handleToggleActive = async () => {
    const next = !isActiveLocal;
    // optimistic toggle
    setIsActiveLocal(next);
    const { isActive, error } = await setActive({ pollId: poll._id, adminCode, isActive: next });
    if (error) {
      toast.error(error);
      // revert on error
      setIsActiveLocal(poll.isActive);
      return;
    }

    setIsActiveLocal(isActive);
  };

  const handleToggleVisible = async () => {
    const next = !isVisibleLocal;
    // optimistic toggle
    setIsVisibleLocal(next);
    const { isVisible, error } = await setVisible({ pollId: poll._id, adminCode, isVisible: next });
    if (error) {
      toast.error(error);
      // revert on error
      setIsVisibleLocal(poll.isVisible ?? true);
      return;
    }
    setIsVisibleLocal(isVisible);
  };

  const handleToggleResultsVisible = async () => {
    const next = !resultsVisibleLocal;
    setResultsVisibleLocal(next);
    const { resultsVisible, error } = await setResultsVisible({ pollId: poll._id, adminCode, resultsVisible: next });
    if (error) {
      toast.error(error);
      // revert on error
      setResultsVisibleLocal(poll.resultsVisible);
      return;
    }
    setResultsVisibleLocal(resultsVisible);
  };

  const handleMoveToTop = async () => {
    const { sortDate, error } = await moveToTop({ pollId: poll._id, adminCode });
    if (error) {
      toast.error(error);
      return;
    }
    toast.success("Moved to top");
  };

  return (
    <div className={`bg-white rounded-lg shadow-xs border border-gray-200 p-6 hover:shadow-sm transition-shadow ${isActiveLocal && isVisibleLocal ? "ring-2 ring-blue-500" : ""}`}>
      <div className="flex flex-col h-full">
        <div className="flex-1">
          <div className="flex flex-col items-start justify-between mb-3">
            <h3 className="text-md font-semibold text-gray-900">{poll.title}</h3>
            <div className="flex items-center gap-2">
              {/* Edit button */}
              {onEdit && (
                <button
                  onClick={onEdit}
                  className="p-2 rounded-md transition-colors hover:bg-gray-100 text-gray-600"
                  title="Edit poll"
                  aria-label="Edit poll"
                >
                  {/* Pencil icon */}
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4 12.5-12.5z" />
                  </svg>
                </button>
              )}

              {/* Visibility toggle */}
              <button
                onClick={handleToggleVisible}
                className={`p-2 rounded-md transition-colors hover:bg-gray-100 ${isVisibleLocal ? "text-green-600" : "text-gray-400"
                  }`}
                title={isVisibleLocal ? "Hide from room" : "Show in room"}
                aria-label={isVisibleLocal ? "Hide from room" : "Show in room"}
              >
                {isVisibleLocal ? (
                  // Eye icon
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                ) : (
                  // Eye-slash icon
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M17.94 17.94A10.94 10.94 0 0112 20C5 20 1 12 1 12a21.83 21.83 0 015.09-6.26M9.9 4.24A10.94 10.94 0 0112 4c7 0 11 8 11 8a21.8 21.8 0 01-3.87 5.03" />
                    <path d="M14.12 14.12A3 3 0 019.88 9.88M1 1l22 22" />
                  </svg>
                )}
              </button>

              {/* Active toggle */}
              <button
                onClick={handleToggleActive}
                className={`p-2 rounded-md transition-colors hover:bg-gray-100 ${isActiveLocal ? "text-green-600" : "text-gray-400"
                  }`}
                title={isActiveLocal ? "Deactivate poll" : "Activate poll"}
                aria-label={isActiveLocal ? "Deactivate poll" : "Activate poll"}
              >
                {/* Power icon */}
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 2v10" />
                  <path d="M5.5 7a8 8 0 1013 0" />
                </svg>
              </button>

              {/* Results visibility toggle */}
              <button
                onClick={handleToggleResultsVisible}
                className={`p-2 rounded-md transition-colors hover:bg-gray-100 ${resultsVisibleLocal ? "text-green-600" : "text-gray-400"
                  }`}
                title={resultsVisibleLocal ? "Make results private" : "Make results public"}
                aria-label={resultsVisibleLocal ? "Make results private" : "Make results public"}
              >
                {resultsVisibleLocal ? (
                  // Lock-open icon
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M7 11V7a5 5 0 019.9-1" />
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  </svg>
                ) : (
                  // Lock-closed icon
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0110 0v4" />
                  </svg>
                )}
              </button>

              {/* Move to top */}
              <button
                onClick={handleMoveToTop}
                className="p-2 rounded-md transition-colors hover:bg-gray-100 text-gray-400"
                title="Move to top"
                aria-label="Move to top"
              >
                {/* Arrow-up icon */}
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 19V5" />
                  <path d="M5 12l7-7 7 7" />
                </svg>
              </button>

              {/* Votes button */}
              <button
                onClick={() => setShowVotes(true)}
                className="ml-2 px-2 py-1 text-xs rounded-md font-medium border border-gray-200 hover:bg-gray-100 text-gray-700"
                title="View individual votes"
              >
                {poll.voterCount} votes
              </button>
            </div>
          </div>

          {poll.description && (
            <p className="text-gray-600 text-sm mb-4 line-clamp-3">{poll.description}</p>
          )}

          {showResults && (
            <div className="mt-4">
              <PollResults pollId={poll._id} adminCode={adminCode} />
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="text-sm text-gray-500">
            <p>{dateFormat.format(new Date(poll._creationTime))}</p>
          </div>
          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                onClick={onEdit}
                className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Edit
              </button>
            )}
            <button
              onClick={() => setShowResults((v) => !v)}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors font-medium"
            >
              {showResults ? "Hide Results" : "Show Results"}
            </button>
          </div>
        </div>
      </div>

      {showVotes && <VotesTableModal
        onClose={() => setShowVotes(false)}
        pollId={poll._id}
        adminCode={adminCode}
      />}
    </div>
  );
}
