import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Toaster } from "sonner";
import { PollList } from "./components/PollList";
import { AdminDashboard } from "./components/AdminDashboard";
import { RoomEntry } from "./components/RoomEntry";

export default function App() {
  const [roomCode, setRoomCode] = useState<string>("");
  const [roomType, setRoomType] = useState<"user" | "admin" | null>(null);
  const [activeTab, setActiveTab] = useState<"polls" | "admin">("polls");

  const room = useQuery(api.rooms.validateRoom, roomCode ? { code: roomCode } : "skip");

  useEffect(() => {
    if (room) {
      setRoomType(room.type);
      if (room.type === "user") {
        setActiveTab("polls");
      }
    } else if (roomCode) {
      setRoomType(null);
    }
  }, [room, roomCode]);

  if (!roomCode || !room) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b shadow-sm">
          <div className="max-w-6xl mx-auto px-4 h-16 flex justify-center items-center">
            <h2 className="text-xl font-semibold text-primary">VoteHub</h2>
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center p-4">
          <RoomEntry onRoomEnter={setRoomCode} />
        </main>
        <Toaster />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-primary">VoteHub</h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Room:</span>
              <span className="font-mono bg-gray-100 px-2 py-1 rounded text-sm">{roomCode}</span>
            </div>
            {roomType === "admin" && (
              <nav className="flex gap-2">
                <button
                  onClick={() => setActiveTab("polls")}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeTab === "polls"
                      ? "bg-primary text-white"
                      : "text-gray-600 hover:text-primary hover:bg-gray-100"
                  }`}
                >
                  Polls
                </button>
                <button
                  onClick={() => setActiveTab("admin")}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeTab === "admin"
                      ? "bg-primary text-white"
                      : "text-gray-600 hover:text-primary hover:bg-gray-100"
                  }`}
                >
                  Manage
                </button>
              </nav>
            )}
            <button
              onClick={() => {
                setRoomCode("");
                setRoomType(null);
              }}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Leave Room
            </button>
          </div>
        </div>
      </header>
      <main className="flex-1 p-4">
        <div className="max-w-6xl mx-auto">
          <Content activeTab={activeTab} roomCode={roomCode} roomType={roomType} room={room} />
        </div>
      </main>
      <Toaster />
    </div>
  );
}

function Content({ 
  activeTab, 
  roomCode, 
  roomType, 
  room 
}: { 
  activeTab: "polls" | "admin";
  roomCode: string;
  roomType: "user" | "admin" | null;
  room: any;
}) {
  return (
    <div className="flex flex-col gap-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-primary mb-2">
          Welcome, {room?.name}!
        </h1>
        <p className="text-gray-600">
          {roomType === "admin" 
            ? activeTab === "polls" 
              ? "Vote on polls or view results" 
              : "Manage your polls and view live results"
            : "Vote on active polls or view results"
          }
        </p>
      </div>

      {roomType === "admin" && activeTab === "admin" ? (
        <AdminDashboard roomCode={roomCode} />
      ) : (
        <PollList roomCode={roomCode} />
      )}
    </div>
  );
}
