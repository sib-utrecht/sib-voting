import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Toaster } from "sonner";
import { PollList } from "./components/PollList";
import { AdminDashboard } from "./components/AdminDashboard";
import { RoomEntry } from "./components/RoomEntry";
import type { Room } from "./types/room";

export default function App() {
  // Initialize from localStorage on first render, SSR-safe
  const [code, setCode] = useState<string | undefined>(() =>
    window?.localStorage.getItem("roomCode") ?? undefined
  );

  // Persist to localStorage whenever code changes
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (code) {
      localStorage.setItem("roomCode", code);
    } else {
      localStorage.removeItem("roomCode");
    }
  }, [code]);

  const authResult = useQuery(api.rooms.doAuth, code ? { code: code } : "skip");
  const { adminCode, room } = (authResult && !authResult.error) ? authResult : { adminCode: null, room: null };

  if (!room) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-xs border-b shadow-xs">
          <div className="max-w-6xl mx-auto px-4 h-16 flex justify-center items-center">
            <h2 className="text-xl font-semibold text-primary">VoteHub</h2>
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center p-4">
          <RoomEntry onRoomEnter={(code) => {
            setCode(code);
          }} />
        </main>
        <Toaster />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-xs border-b shadow-xs">
        <div className="max-w-6xl mx-auto px-4 h-16 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-primary">VoteHub</h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Room:</span>
              <span className="font-mono bg-gray-100 px-2 py-1 rounded text-sm">{room.code}</span>
            </div>
            {/* {isAdmin && (
              <nav className="flex gap-2">
                <button
                  onClick={() => setActiveTab("polls")}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === "polls"
                    ? "bg-primary text-white"
                    : "text-gray-600 hover:text-primary hover:bg-gray-100"
                    }`}
                >
                  Polls
                </button>
                <button
                  onClick={() => setActiveTab("admin")}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === "admin"
                    ? "bg-primary text-white"
                    : "text-gray-600 hover:text-primary hover:bg-gray-100"
                    }`}
                >
                  Manage
                </button>
              </nav>
            )} */}
            <button
              onClick={() => {
                setCode(undefined);
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
          <Content room={room} adminCode={adminCode} />
        </div>
      </main>
      <Toaster />
    </div>
  );
}

function Content({
  room,
  adminCode,
}: {
  adminCode: string | null;
  room: Room;
}) {
  const isAdmin = !!adminCode;

  return (
    <div className="flex flex-col gap-8">
      {/* <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-primary mb-2">
          Welcome, {room?.name}!
        </h1>
        <p className="text-gray-600">
          {isAdmin
            ? "Vote on polls or view results"
            : "Manage polls and view live results"
          }
        </p>
      </div> */}

      {isAdmin ? (
        <AdminDashboard room={room} adminCode={adminCode} />
      ) : (
        <PollList roomCode={room.code} />
      )}
    </div>
  );
}
