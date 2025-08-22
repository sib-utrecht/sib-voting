import { useState } from "react";
import { toast } from "sonner";

interface RoomEntryProps {
  error?: string;
  onRoomEnter: (code: string) => void;
}

export function RoomEntry({ error, onRoomEnter }: RoomEntryProps) {
  const [code, setCode] = useState("");

  const handleJoinRoom = () => {
    if (code.length === 6 || code.length >= 12) {
      onRoomEnter(code.toUpperCase());
    } else {
      toast.error("Room code must be 6 characters");
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-lg shadow-xs border border-gray-200 p-8">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-primary mb-2">Enter Room</h1>
          <p className="text-gray-600">Join a voting room with a 6-character code</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Room Code
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-hidden transition-shadow font-mono text-center text-lg tracking-widest"
              placeholder="ABC123"
              maxLength={32}
              onKeyUp={(e) => {
                if (e.key === "Enter") {
                  handleJoinRoom();
                }
              }}
            />
          </div>

          <button
            onClick={handleJoinRoom}
            disabled={code.length !== 6 && code.length < 12}
            className="w-full px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Join Room
          </button>

          {error && (
            <p className="text-red-500 text-sm mt-2">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
