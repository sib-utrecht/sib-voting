import { useState } from "react";
import { CreateRoom } from "../components/CreateRoom";
import { RoomEntry } from "../components/RoomEntry";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAdminCode, useRoomCode } from "@/lib/useCode";
import { useNavigate } from "react-router-dom";

export default function ChooseRoom() {
  const [showCreate, setShowCreate] = useState(true);
  const [lastCreated, setLastCreated] = useState<{ roomCode: string } | null>(null);
  const [_, setRoomCode] = useRoomCode();
  const [adminCode, __] = useAdminCode();
  const navigate = useNavigate();

  const roomsResult = useQuery(api.rooms.listRooms, adminCode ? { adminCode } : "skip");
  const rooms = roomsResult?.rooms || [];

  if (!adminCode) {
    navigate("/", { replace: true });
    return null; // Redirecting, no need to render anything
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-xs border-b shadow-xs">
        <div className="max-w-4xl mx-auto px-4 h-16 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-primary">Choose Room</h2>
        </div>
      </header>
      <main className="flex-1 p-4">
        <div className="max-w-4xl mx-auto grid gap-8 md:grid-cols-2">
          <div>
            {showCreate ? (
              <CreateRoom
                onCreated={(roomCode) => {
                  setLastCreated({ roomCode });
                  setShowCreate(false);
                }}
                onBack={() => setShowCreate(false)}
                adminCode={adminCode}
              />
            ) : (
              <div className="space-y-6">
                <RoomEntry onRoomEnter={() => { /* no-op */ }} />
                {lastCreated && (
                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <h3 className="font-semibold mb-2">Last created</h3>
                    <p className="text-sm text-gray-600">Room Code: <span className="font-mono">{lastCreated.roomCode}</span></p>
                  </div>
                )}
                <button
                  onClick={() => setShowCreate(true)}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover"
                >
                  Create another room
                </button>
              </div>
            )}
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Existing Rooms</h3>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              {
                roomsResult && roomsResult.error && (
                  <p className="text-red-500 text-sm mb-4">{roomsResult.error}</p>
                )}
              {roomsResult === undefined ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (rooms.length === 0) ? (
                <p className="text-sm text-gray-600">No rooms yet.</p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {rooms.map((r) => (
                    <li key={r._id} className="py-3 flex items-center justify-between">
                      <div>
                        <div className="font-medium">{r.name}</div>
                        <div className="text-xs text-gray-500">Created {new Date(r._creationTime).toLocaleString()}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-600">Code</span>
                        <span className="font-mono text-sm bg-gray-50 border px-2 py-1 rounded">{r.code}</span>
                        <a href={`/?code=${r.code}`} className="text-primary text-sm hover:underline">Open</a>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
