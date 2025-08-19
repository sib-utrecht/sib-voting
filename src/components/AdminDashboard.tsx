import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { CreatePollForm } from "./CreatePollForm";
import { AdminPollCard } from "./AdminPollCard";
import { Room } from "@/types/room";

interface AdminDashboardProps {
  room: Room;
  adminCode: string;
}

export function AdminDashboard({ room, adminCode }: AdminDashboardProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const roomCode = room.code;

  const myPolls = useQuery(api.polls.myPolls, { roomCode });

  if (myPolls === undefined) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (showCreateForm) {
    return <CreatePollForm roomCode={roomCode} adminCode={adminCode} onBack={() => setShowCreateForm(false)} />;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-gray-900">My Polls</h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors font-medium"
        >
          Create New Poll
        </button>
      </div>

      {myPolls.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No polls yet</h3>
          <p className="text-gray-500 mb-6">Create your first poll to get started!</p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors font-medium"
          >
            Create Poll
          </button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
          {myPolls.map((poll) => (
            <AdminPollCard key={poll._id} poll={poll} adminCode={adminCode} roomCode={roomCode} />
          ))}
        </div>
      )}
    </div>
  );
}
