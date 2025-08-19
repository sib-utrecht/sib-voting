import { useState } from "react";
import { Id } from "../../convex/_generated/dataModel";
import { PollResults } from "./PollResults";
import { dateFormat, timeFormat } from "../lib/locale";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

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
}

export function AdminPollCard({ poll, roomCode, adminCode }: AdminPollCardProps) {
  const [showResults, setShowResults] = useState(false);
  const [showVotes, setShowVotes] = useState(false);
  const [isActiveLocal, setIsActiveLocal] = useState(poll.isActive);
  const [isVisibleLocal, setIsVisibleLocal] = useState(poll.isVisible ?? true);
  const [resultsVisibleLocal, setResultsVisibleLocal] = useState(poll.resultsVisible);
  const setActive = useMutation(api.polls.setActive);
  const setVisible = useMutation(api.polls.setVisible);
  const setResultsVisible = useMutation(api.polls.setResultsVisible);

  const votesData = useQuery(api.polls.votesTable, showVotes ? { pollId: poll._id, adminCode } : "skip");

  if (showResults) {
    return <PollResults pollId={poll._id} adminCode={adminCode} onBack={() => setShowResults(false)} />;
  }

  const handleToggleActive = async () => {
    try {
      const next = !isActiveLocal;
      // optimistic toggle
      setIsActiveLocal(next);
      const newState = await setActive({ pollId: poll._id, adminCode, isActive: next });
      setIsActiveLocal(newState);
    } catch (e) {
      // revert on error
      setIsActiveLocal(poll.isActive);
      console.error(e);
    }
  };

  const handleToggleVisible = async () => {
    try {
      const next = !isVisibleLocal;
      setIsVisibleLocal(next);
      const newState = await setVisible({ pollId: poll._id, adminCode, isVisible: next });
      setIsVisibleLocal(newState);
    } catch (e) {
      setIsVisibleLocal(poll.isVisible ?? true);
      console.error(e);
    }
  };

  const handleToggleResultsVisible = async () => {
    try {
      const next = !resultsVisibleLocal;
      setResultsVisibleLocal(next);
      const newState = await setResultsVisible({ pollId: poll._id, adminCode, resultsVisible: next });
      setResultsVisibleLocal(newState);
    } catch (e) {
      setResultsVisibleLocal(poll.resultsVisible);
      console.error(e);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-xs border border-gray-200 p-6 hover:shadow-sm transition-shadow">
      <div className="flex flex-col h-full">
        <div className="flex-1">
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900">{poll.title}</h3>
            <div className="flex items-center gap-2">
              {/* Visibility toggle */}
              <button
                onClick={handleToggleVisible}
                className={`p-2 rounded-md transition-colors hover:bg-gray-100 ${
                  isVisibleLocal ? "text-green-600" : "text-gray-400"
                }`}
                title={isVisibleLocal ? "Hide from room" : "Show in room"}
                aria-label={isVisibleLocal ? "Hide from room" : "Show in room"}
              >
                {isVisibleLocal ? (
                  // Eye icon
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                ) : (
                  // Eye-slash icon
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M17.94 17.94A10.94 10.94 0 0112 20C5 20 1 12 1 12a21.83 21.83 0 015.09-6.26M9.9 4.24A10.94 10.94 0 0112 4c7 0 11 8 11 8a21.8 21.8 0 01-3.87 5.03"/>
                    <path d="M14.12 14.12A3 3 0 019.88 9.88M1 1l22 22"/>
                  </svg>
                )}
              </button>

              {/* Active toggle */}
              <button
                onClick={handleToggleActive}
                className={`p-2 rounded-md transition-colors hover:bg-gray-100 ${
                  isActiveLocal ? "text-green-600" : "text-gray-400"
                }`}
                title={isActiveLocal ? "Deactivate poll" : "Activate poll"}
                aria-label={isActiveLocal ? "Deactivate poll" : "Activate poll"}
              >
                {/* Power icon */}
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 2v10"/>
                  <path d="M5.5 7a8 8 0 1013 0"/>
                </svg>
              </button>

              {/* Results visibility toggle */}
              <button
                onClick={handleToggleResultsVisible}
                className={`p-2 rounded-md transition-colors hover:bg-gray-100 ${
                  resultsVisibleLocal ? "text-green-600" : "text-gray-400"
                }`}
                title={resultsVisibleLocal ? "Make results private" : "Make results public"}
                aria-label={resultsVisibleLocal ? "Make results private" : "Make results public"}
              >
                {resultsVisibleLocal ? (
                  // Lock-open icon
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M7 11V7a5 5 0 019.9-1"/>
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  </svg>
                ) : (
                  // Lock-closed icon
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0110 0v4"/>
                  </svg>
                )}
              </button>

              {/* Votes button */}
              <button
                onClick={() => setShowVotes(true)}
                className="ml-2 px-2 py-1 text-xs rounded-md font-medium border border-gray-200 hover:bg-gray-100 text-gray-700"
                title="View individual votes"
              >
                Votes
              </button>
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
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Results:</span>
                <div className="flex items-center gap-3">
                  <span className={`font-medium ${resultsVisibleLocal ? "text-green-600" : "text-gray-600"}`}>
                    {resultsVisibleLocal ? "Public" : "Private"}
                  </span>
                  <button
                    onClick={handleToggleResultsVisible}
                    className={`px-2 py-1 text-xs rounded-md font-medium border transition-colors ${
                      resultsVisibleLocal
                        ? "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                        : "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                    }`}
                    title={resultsVisibleLocal ? "Make results private" : "Make results public"}
                  >
                    {resultsVisibleLocal ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Visibility:</span>
                <div className="flex items-center gap-3">
                  <span className={`font-medium ${isVisibleLocal ? "text-green-600" : "text-gray-600"}`}>
                    {isVisibleLocal ? "Listed" : "Hidden"}
                  </span>
                  <button
                    onClick={handleToggleVisible}
                    className={`px-2 py-1 text-xs rounded-md font-medium border transition-colors ${
                      isVisibleLocal
                        ? "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                        : "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                    }`}
                    title={isVisibleLocal ? "Hide from room" : "Show in room"}
                  >
                    {isVisibleLocal ? "Hide" : "Show"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="text-sm text-gray-500">
            <p>{dateFormat.format(new Date(poll._creationTime))}</p>
          </div>
          <button
            onClick={() => setShowResults(true)}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors font-medium"
          >
            View Results
          </button>
        </div>
      </div>

      {showVotes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowVotes(false)} />
          <div className="relative bg-white rounded-lg shadow-lg max-w-4xl w-full mx-4 p-6 max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4 shrink-0">
              <h4 className="text-lg font-semibold">Votes</h4>
              <button onClick={() => setShowVotes(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>

            {!votesData ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="flex-1 overflow-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr>
                      <th className="text-left px-3 py-2 border-b">#</th>
                      <th className="text-left px-3 py-2 border-b">Time</th>
                      {votesData.questions.map((q) => (
                        <th key={q._id} className="text-left px-3 py-2 border-b">{q.text}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {votesData.rows.map((row, idx) => (
                      <tr key={idx} className="border-b last:border-b-0">
                        <td className="px-3 py-2 text-gray-500">{idx + 1}</td>
                        <td className="px-3 py-2 text-gray-700 whitespace-nowrap">
                          {timeFormat.format(new Date(row.lastSeen))}
                        </td>
                        {votesData.questions.map((q) => (
                          <td key={q._id} className="px-3 py-2 text-gray-900">
                            {row.answers[q._id]?.choiceText ?? ""}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
