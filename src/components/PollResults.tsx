import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";

interface PollResultsProps {
  pollId: Id<"polls">;
  roomCode: string;
  onBack: () => void;
}

export function PollResults({ pollId, roomCode, onBack }: PollResultsProps) {
  const results = useQuery(api.polls.getResults, { pollId, voterCode: roomCode });
  const toggleResults = useMutation(api.polls.toggleResults);

  if (results === undefined) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Results Not Available</h3>
          <p className="text-gray-500 mb-6">
            The poll creator hasn't made the results public yet, or you need to vote first to see results.
          </p>
          <button
            onClick={onBack}
            className="px-4 py-2 text-primary hover:bg-gray-100 rounded-lg transition-colors"
          >
            ← Back to polls
          </button>
        </div>
      </div>
    );
  }

  const handleToggleResults = async () => {
    try {
      const newState = await toggleResults({ pollId, roomCode });
      toast.success(newState ? "Results are now public" : "Results are now private");
    } catch (error) {
      toast.error("Failed to toggle results visibility");
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              ← Back
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{results.title}</h1>
              {results.description && (
                <p className="text-gray-600 mt-1">{results.description}</p>
              )}
            </div>
          </div>
          
          {results.isAdmin && (
            <button
              onClick={handleToggleResults}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                results.resultsVisible
                  ? "bg-red-100 text-red-700 hover:bg-red-200"
                  : "bg-green-100 text-green-700 hover:bg-green-200"
              }`}
            >
              {results.resultsVisible ? "Hide Results" : "Show Results"}
            </button>
          )}
        </div>

        <div className="space-y-8">
          {results.questions.map((question, questionIndex) => (
            <div key={question._id} className="border-b border-gray-100 pb-6 last:border-b-0">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
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

        <div className="mt-8 pt-6 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Results {results.resultsVisible ? "are public" : "are private"}
            </p>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${results.resultsVisible ? "bg-green-500" : "bg-gray-400"}`} />
              <span className="text-sm text-gray-600">
                {results.resultsVisible ? "Public" : "Private"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
