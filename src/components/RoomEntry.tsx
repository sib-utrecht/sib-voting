import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

interface RoomEntryProps {
  onRoomEnter: (code: string) => void;
}

export function RoomEntry({ onRoomEnter }: RoomEntryProps) {
  const [code, setCode] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const createRoom = useMutation(api.rooms.createRoom);

  const handleJoinRoom = () => {
    if (code.length === 6) {
      onRoomEnter(code.toUpperCase());
    } else {
      toast.error("Room code must be 6 characters");
    }
  };

  const handleCreateRoom = async () => {
    if (!newRoomName.trim()) {
      toast.error("Please enter a room name");
      return;
    }
    
    try {
      const result = await createRoom({
        name: newRoomName.trim(),
      });
      
      toast.success(`Room created! Room Code: ${result.roomCode}, Admin Code: ${result.adminCode}`);
      onRoomEnter(result.adminCode);
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to create room");
      }
    }
  };

  if (isCreating) {
    return (
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-xs border border-gray-200 p-8">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-primary mb-2">Create Room</h1>
            <p className="text-gray-600">Set up a new voting room</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Room Name
              </label>
              <input
                type="text"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-hidden transition-shadow"
                placeholder="Enter room name..."
                maxLength={50}
              />
              <p className="text-sm text-gray-500 mt-1">Room and admin codes will be generated automatically</p>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setIsCreating(false)}
                className="flex-1 px-4 py-3 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleCreateRoom}
                className="flex-1 px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors font-medium"
              >
                Create Room
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
              maxLength={6}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleJoinRoom();
                }
              }}
            />
          </div>

          <button
            onClick={handleJoinRoom}
            disabled={code.length !== 6}
            className="w-full px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Join Room
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">or</span>
            </div>
          </div>

          <button
            onClick={() => setIsCreating(true)}
            className="w-full px-4 py-3 text-primary border border-primary rounded-lg hover:bg-primary hover:text-white transition-colors font-medium"
          >
            Create New Room
          </button>
        </div>
      </div>
    </div>
  );
}
