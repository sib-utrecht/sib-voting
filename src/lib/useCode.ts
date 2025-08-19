import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

export function useAdminCode() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [adminCode, setAdminCode] = useState<string | undefined>(() => {
    const queryAdminCode = searchParams.get("adminCode");
    if (queryAdminCode) {
      const normalized = queryAdminCode.toUpperCase();
      try {
        localStorage.setItem("adminCode", normalized);
      } catch {}
      // Clean the query param from the URL
      // const next = new URLSearchParams(searchParams);
      // next.delete("adminCode");
      // setSearchParams(next, { replace: true });
      // return;
      return normalized;
    }

    // Fallback to localStorage
    try {
      return localStorage.getItem("adminCode") ?? undefined;
    } catch {}

    return undefined;
  });

  const doSetAdminCode = (newCode: string | undefined) => {
    console.log("Setting adminCode:", newCode);
    setAdminCode(newCode);
    if (newCode) {
      try {
        localStorage.setItem("adminCode", newCode);
      } catch {}
    } else {
      try {
        localStorage.removeItem("adminCode");
      } catch {}
    }
  };

  return [adminCode, doSetAdminCode] as const;
}

/**
 * useCode abstracts reading and persisting the current room code.
 * Priority order on first load:
 * 1) ?code= query param (uppercased, then removed from URL)
 * 2) localStorage("roomCode")
 *
 * Changes to code are persisted to localStorage. Setting undefined clears it.
 */
export function useRoomCode() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [roomCode, setRoomCode] = useState<string | undefined>(() => {
    const queryCode = searchParams.get("code");
    if (queryCode && queryCode.length >= 6) {
      console.log("Using code from query param:", queryCode);

      const normalized = queryCode.toUpperCase();
      try {
        localStorage.setItem("roomCode", normalized);
      } catch {}
      // Clean the query param from the URL
      // const next = new URLSearchParams(searchParams);
      // next.delete("code");
      // setSearchParams(next, { replace: true });
      return normalized;
    }

    // Fallback to localStorage
    try {
      return localStorage.getItem("roomCode") ?? undefined;
    } catch {}

    return undefined;
  });

  // Initialize from ?code= or localStorage
  useEffect(() => {
    if (roomCode) {
      return;
    }

    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const doSetRoomCode = (newCode: string | undefined) => {
    console.log("Setting roomCode:", newCode);
    setRoomCode(newCode);
    if (newCode) {
      try {
        localStorage.setItem("roomCode", newCode);
      } catch {}
    } else {
      try {
        localStorage.removeItem("roomCode");
      } catch {}
    }
  };

  return [roomCode, doSetRoomCode] as const;
}
