import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { timeFormat } from "../lib/locale";

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
  answers: Record<string, { choiceId: string; choiceText: string }>;
};

export function VotesTableModal({ onClose, pollId, adminCode }: VotesTableModalProps) {
  const data = useQuery(
    api.polls.votesTable,
    { pollId, adminCode }
  ) as { questions?: Question[]; rows?: Row[]; error?: string } | undefined;

  if (!open) return null;

  const questions = data?.questions;
  const rows = data?.rows;
  const error = data?.error;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-lg max-w-4xl w-full mx-4 p-6 max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-4 shrink-0">
          <h4 className="text-lg font-semibold">Votes</h4>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
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
                    {questions.map((q) => (
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
  );
}
