import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";
import { PollResults } from "./PollResults";
import { dateFormat } from "../lib/locale";

interface PollDetailProps {
  pollId: Id<"polls">;
  roomCode: string;
  onBack: () => void;
}

export function PollDetail({ pollId, roomCode, onBack }: PollDetailProps) {
  const poll = useQuery(api.polls.get, { pollId });
  const vote = useMutation(api.polls.vote);
  const [selectedChoices, setSelectedChoices] = useState<Record<string, Id<"choices">>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResults, setShowResults] = useState(false);

  if (poll === undefined) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!poll) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Poll not found</p>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 text-primary hover:bg-gray-100 rounded-lg transition-colors"
        >
          ← Back to polls
        </button>
      </div>
    );
  }

  if (showResults) {
    return <PollResults pollId={pollId} onBack={onBack} />;
  }

  const handleChoiceSelect = (questionId: Id<"questions">, choiceId: Id<"choices">) => {
    setSelectedChoices(prev => ({
      ...prev,
      [questionId]: choiceId,
    }));
  };

  const handleSubmit = async () => {
    const votes = poll.questions.map(question => ({
      questionId: question._id,
      choiceId: selectedChoices[question._id],
    }));

    // Check if all questions have been answered
    if (votes.some(vote => !vote.choiceId)) {
      toast.error("Please answer all questions before submitting");
      return;
    }

    setIsSubmitting(true);
    try {
      await vote({ pollId,  votes });
      toast.success("Your vote has been submitted!");
      onBack();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to submit vote");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto w-2xl">
      <div className="bg-white rounded-lg shadow-xs border border-gray-200 p-6">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={onBack}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            ← Back
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{poll.title}</h1>
            {poll.description && (
              <p className="text-gray-600 mt-1">{poll.description}</p>
            )}
          </div>
        </div>

        <div className="space-y-8">
          {poll.questions.map((question, questionIndex) => (
            <div key={question._id} className="border-b border-gray-100 pb-6 last:border-b-0">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {questionIndex + 1}. {question.text}
              </h3>
              <div className="space-y-3">
                {question.choices.map((choice) => (
                  <label
                    key={choice._id}
                    className="flex items-center p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <input
                      type="radio"
                      name={`question-${question._id}`}
                      value={choice._id}
                      checked={selectedChoices[question._id] === choice._id}
                      onChange={() => handleChoiceSelect(question._id, choice._id)}
                      className="mr-3 text-primary focus:ring-1 focus:ring-primary"
                    />
                    <span className="text-gray-700">{choice.text}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-100">
          <p className="text-sm text-gray-500">
            Created on {dateFormat.format(new Date(poll._creationTime))}
          </p>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || Object.keys(selectedChoices).length !== poll.questions.length}
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Submitting..." : "Submit Vote"}
          </button>
        </div>
      </div>
    </div>
  );
}
