import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

interface CreatePollFormProps {
  roomCode: string;
  adminCode: string;
  onBack: () => void;
}

interface Question {
  text: string;
  choices: string[];
}

export function CreatePollForm({ roomCode, adminCode, onBack }: CreatePollFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const defaultQuestion : Question = { text: "I accept ", choices: ["Pro", "Against", "Abstain"] };

  const [questions, setQuestions] = useState<Question[]>([
    defaultQuestion
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createPoll = useMutation(api.polls.create);

  const addQuestion = () => {
    setQuestions([...questions, defaultQuestion]);
  };

  const removeQuestion = (index: number) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== index));
    }
  };

  const updateQuestion = (index: number, text: string) => {
    const updated = [...questions];
    updated[index].text = text;
    setQuestions(updated);
  };

  const addChoice = (questionIndex: number) => {
    const updated = [...questions];
    updated[questionIndex].choices.push("");
    setQuestions(updated);
  };

  const removeChoice = (questionIndex: number, choiceIndex: number) => {
    const updated = [...questions];
    if (updated[questionIndex].choices.length > 2) {
      updated[questionIndex].choices.splice(choiceIndex, 1);
      setQuestions(updated);
    }
  };

  const updateChoice = (questionIndex: number, choiceIndex: number, text: string) => {
    const updated = [...questions];
    updated[questionIndex].choices[choiceIndex] = text;
    setQuestions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error("Please enter a poll title");
      return;
    }

    const validQuestions = questions.filter(q => 
      q.text.trim() && q.choices.filter(c => c.trim()).length >= 2
    );

    if (validQuestions.length === 0) {
      toast.error("Please add at least one question with two choices");
      return;
    }

    const pollData = {
      title: title.trim(),
      description: description.trim() || undefined,
      roomCode,
      adminCode,
      questions: validQuestions.map(q => ({
        text: q.text.trim(),
        choices: q.choices.filter(c => c.trim()).map(c => c.trim())
      }))
    };

    setIsSubmitting(true);
      const {pollId, error} = await createPoll(pollData);
      if (error) {
        toast.error(`Failed to create poll: ${error}`);
        setIsSubmitting(false);
        return;
      }

      toast.success("Poll created successfully!");
      onBack();
  };

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="bg-white rounded-lg shadow-xs border border-gray-200 p-6">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={onBack}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            ← Back
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Create New Poll</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Poll Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-hidden transition-shadow"
              placeholder="Enter your poll title..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-hidden transition-shadow"
              placeholder="Describe your poll..."
              rows={3}
            />
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Questions</h3>
              <button
                type="button"
                onClick={addQuestion}
                className="px-4 py-2 text-primary border border-primary rounded-lg hover:bg-primary hover:text-white transition-colors"
              >
                Add Question
              </button>
            </div>

            {questions.map((question, questionIndex) => (
              <div key={questionIndex} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-gray-900">Question {questionIndex + 1}</h4>
                  {questions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeQuestion(questionIndex)}
                      className="text-red-500 hover:text-red-700 transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  <input
                    type="text"
                    value={question.text}
                    onChange={(e) => updateQuestion(questionIndex, e.target.value)}
                    className="w-full px-3 py-2 rounded border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-hidden"
                    placeholder="Enter your question..."
                    required
                  />

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Choices</span>
                      <button
                        type="button"
                        onClick={() => addChoice(questionIndex)}
                        className="text-sm text-primary hover:text-primary-hover transition-colors"
                      >
                        Add Choice
                      </button>
                    </div>

                    {question.choices.map((choice, choiceIndex) => (
                      <div key={choiceIndex} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={choice}
                          onChange={(e) => updateChoice(questionIndex, choiceIndex, e.target.value)}
                          className="flex-1 px-3 py-2 rounded border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-hidden"
                          placeholder={`Choice ${choiceIndex + 1}...`}
                          required
                        />
                        {question.choices.length > 2 && (
                          <button
                            type="button"
                            onClick={() => removeChoice(questionIndex, choiceIndex)}
                            className="text-red-500 hover:text-red-700 transition-colors px-2"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-4 pt-6 border-t border-gray-100">
            <button
              type="button"
              onClick={onBack}
              className="px-6 py-3 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Creating..." : "Create Poll"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
