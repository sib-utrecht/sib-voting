import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

interface CreateRoomProps {
  onCreated?: (roomCode: string, adminCode: string) => void;
  onBack?: () => void;
  adminCode: string;
}

export function CreateRoom({ onCreated, onBack, adminCode }: CreateRoomProps) {
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createRoom = useMutation(api.rooms.createRoom);

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("Please enter a room name");
      return;
    }
    setIsSubmitting(true);
    const result = await createRoom({ name: name.trim(), adminCode });
    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success(`Room created! Code: ${result.roomCode}`);
    onCreated?.(result.roomCode, result.adminCode);
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-lg shadow-xs border border-gray-200 p-8">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-primary mb-2">Create Room</h1>
          <p className="text-gray-600">Set up a new voting room</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Room Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-hidden transition-shadow"
              placeholder="Enter room name..."
              maxLength={50}
            />
            <p className="text-sm text-gray-500 mt-1">Room and admin codes will be generated automatically</p>
          </div>

          <div className="flex gap-3 pt-4">
            {onBack && (
              <button
                onClick={onBack}
                className="flex-1 px-4 py-3 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
            )}
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors font-medium disabled:opacity-50"
            >
              {isSubmitting ? "Creating..." : "Create Room"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
