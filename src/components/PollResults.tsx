import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";

interface PollResultsProps {
  pollId: Id<"polls">;
  adminCode?: string;
}

export function PollResults({ pollId, adminCode }: PollResultsProps) {
  const results = useQuery(api.polls.getResults, { pollId, adminCode });
  const setResultsVisible = useMutation(api.polls.setResultsVisible);

  if (results === undefined) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (results.error == "Results are not visible") {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-xs border border-gray-200 p-6 text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Results Not Available</h3>
          <p className="text-gray-500 mb-6">
            The results are not public yet.
          </p>
        </div>
      </div>
    );
  }

  if (results.error) {
    toast.error(results.error);
    return (
      <div className="text-center py-8">
        <p className="text-red-500">{results.error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {results.questions.map((question, questionIndex) => (
        <div key={question._id} className="border-b border-gray-100 pb-6 last:border-b-0">
          <h3 className="text-md font-semibold text-gray-900 mb-4">
            {questionIndex + 1}. {question.text}
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Total votes: {question.totalVotes}
          </p>

          <div className="space-y-3">
            {question.choices.map((choice) => (
              <div key={choice._id} className="relative">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-gray-700 font-medium">{choice.text}</span>
                  <span className="text-sm text-gray-500">
                    {choice.voteCount} votes ({choice.percentage}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-primary h-3 rounded-full transition-all duration-500"
                    style={{ width: `${choice.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
