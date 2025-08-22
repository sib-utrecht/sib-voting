import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Toaster, toast } from "sonner";
import { PollList } from "./components/PollList";
import { AdminDashboard } from "./components/AdminDashboard";
import { RoomEntry } from "./components/RoomEntry";
import type { Room } from "./types/room";
import { useNavigate } from "react-router-dom";
import { useAdminCode, useRoomCode } from "./lib/useCode";
import { useEffect, useState } from "react";

export default function App() {
  const [authCode, setAuthCode] = useState<string | undefined>(undefined);

  const [adminCode, setAdminCode] = useAdminCode();
  const [roomCode, setRoomCode] = useRoomCode();
  const navigate = useNavigate();

  const authResult = useQuery(api.rooms.doAuth, authCode ? { authCode, roomCode } : "skip");
  const error = authResult?.error;
  const success = authResult && !error;
  
  useEffect(() => {
    if (authCode) {
      return;
    }
    setAuthCode(adminCode ?? roomCode);
  }, [adminCode, roomCode]);

  useEffect(() => {
    if (!success) {
      return;
    }

    console.log("(In App.tsx > useEffect) Auth result:", authResult);

    setAdminCode(authResult.adminCode);
    setRoomCode(roomCode ?? authResult.room?.code);

    if (!authResult.room) {
      navigate("/choose", { replace: true });
    }
  }, [authResult]);

  const isAdmin = !!adminCode;

  // If an admin code was used on the home page, send them to ChooseRoom
  // useEffect(() => {
  //   if (isAdmin && success && !roomCode) {
  //     navigate("/choose", { replace: true });
  //   }
  // }, [isAdmin, navigate]);

  if (authResult === undefined && (authCode || roomCode)) {
    // Spinner
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!success) {
    console.log("No success yet. Auth result:", authResult);
    console.log("Auth code:", authCode);
    console.log("Room code:", roomCode);
    console.log("Is admin:", isAdmin);

    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-xs border-b shadow-xs">
          <div className="max-w-6xl mx-auto px-4 h-16 flex justify-center items-center">
            <h2 className="text-xl font-semibold text-primary">SIB-Utrecht Voting</h2>
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center p-4">
          <RoomEntry error={error} onRoomEnter={(code) => {
            setAuthCode(code);
          }} />
        </main>
        <Toaster />
      </div>
    );
  }

  const room = authResult.room;

  console.log("In App.tsx. room:", room, "adminCode:", adminCode, "roomCode:", roomCode);

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-xs border-b shadow-xs">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col gap-2 md:h-16 md:flex-row md:justify-between items-center">
          <img src="/sib-logo.png" alt="SIB Utrecht Logo" className="h-9 w-9 m-2" />
          
          <h2 className="text-xl font-semibold text-primary w-full text-center md:text-left">{room.name}</h2>

          <div className="flex flex-wrap md:flex-nowrap items-center gap-4 justify-center md:justify-end">
            <div className="flex items-center gap-2 whitespace-nowrap">
              <span className="text-sm text-gray-600">Room:</span>
              <span className="font-mono bg-gray-100 px-2 py-1 rounded text-sm">{roomCode}</span>
            </div>
            {isAdmin && (
              <button
                onClick={async () => {
                  if (!adminCode) return;
                  try {
                    await navigator.clipboard.writeText(adminCode);
                    toast.success("Admin code copied");
                  } catch (e) {
                    toast.error("Failed to copy admin code");
                  }
                }}
                className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200 hover:bg-red-200"
                title="Click to copy admin code"
              >
                Admin
              </button>
            )}
            {/* Link to manage rooms could be a route in a real app; here we just expose the component for dev */}
            {/* <a href="/manage" className="text-sm text-gray-600 hover:text-primary">Manage Rooms</a> */}
            {
              // Switch room
              isAdmin && <button
                onClick={() => {
                  setRoomCode(undefined);
                  navigate("/choose", { replace: true });
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors whitespace-nowrap"
              >
                Switch Room
              </button>
            }
            <button
              onClick={() => {
                setAuthCode(undefined);
                setAdminCode(undefined);
                setRoomCode(undefined);
              }}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors whitespace-nowrap"
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
  adminCode?: string;
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
