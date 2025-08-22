import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { timeFormat } from "../lib/locale";
import { useState } from "react";
import { toast } from "sonner";

type VotesTableModalProps = {
  onClose: () => void;
  pollId: Id<"polls">;
  adminCode: string;
};

type Question = { _id: Id<"questions">; text: string };

type Row = {
  voterCode: string | null;
  firstSeen: number;
  lastSeen: number;
  answers: Record<string, { voteId: Id<"votes">; choiceId: Id<"choices">; choiceText: string }>;
};

export function VotesTableModal({ onClose, pollId, adminCode }: VotesTableModalProps) {
  const data = useQuery(
    api.polls.votesTable,
    { pollId, adminCode }
  ) as { questions?: Question[]; rows?: Row[]; error?: string } | undefined;

  const [deleteMode, setDeleteMode] = useState(false);
  const deleteVote = useMutation(api.polls.deleteVote);

  const questions = data?.questions;
  const rows = data?.rows;
  const error = data?.error;

  const handleDelete = async (voteId: Id<"votes">) => {
    const { success, error } = await deleteVote({ voteId, adminCode } as any);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success("Vote deleted");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-lg max-w-4xl w-full mx-4 p-6 max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-4 shrink-0">
          <h4 className="text-lg font-semibold">Votes</h4>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDeleteMode((v) => !v)}
              className={`px-3 py-1 rounded-md text-sm border ${deleteMode ? "bg-red-50 border-red-200 text-red-700" : "border-gray-200 text-gray-700 hover:bg-gray-100"}`}
              title="Toggle delete mode"
            >
              {deleteMode ? "Delete mode: ON" : "Delete mode"}
            </button>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
          </div>
        </div>

        {!questions || !rows ? (
          error ? (
            <div className="text-red-500 text-sm">{error}</div>
          ) : (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          )
        ) : (
          <div className="flex-1 overflow-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left px-3 py-2 border-b">#</th>
                  <th className="text-left px-3 py-2 border-b">Time</th>
                  {questions.map((q) => (
                    <th key={q._id} className="text-left px-3 py-2 border-b">{q.text}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr key={idx} className="border-b last:border-b-0">
                    <td className="px-3 py-2 text-gray-500">{idx + 1}</td>
                    <td className="px-3 py-2 text-gray-700 whitespace-nowrap">
                      {timeFormat.format(new Date(row.lastSeen))}
                    </td>
                    {questions.map((q) => {
                      const ans = row.answers[q._id];
                      return (
                        <td key={q._id} className="px-3 py-2 text-gray-900">
                          <div className="flex items-center gap-2">
                            <span>{ans?.choiceText ?? ""}</span>
                            {deleteMode && ans?.voteId && (
                              <button
                                onClick={() => handleDelete(ans.voteId)}
                                className="p-1 rounded hover:bg-red-50 text-red-600"
                                title="Delete this vote"
                              >
                                {/* Trash icon */}
                                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                  <polyline points="3 6 5 6 21 6" />
                                  <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                                  <path d="M10 11v6" />
                                  <path d="M14 11v6" />
                                  <path d="M9 6V4a2 2 0 012-2h2a2 2 0 012 2v2" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
