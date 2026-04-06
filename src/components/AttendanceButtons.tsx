"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Props {
  userId: string;
  initialClockIn: string | null;
  initialClockOut: string | null;
}

export default function AttendanceButtons({
  userId,
  initialClockIn,
  initialClockOut,
}: Props) {
  const [clockIn, setClockIn] = useState<string | null>(initialClockIn);
  const [clockOut, setClockOut] = useState<string | null>(initialClockOut);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const todayStr = new Date().toISOString().split("T")[0];

  async function handleClockIn() {
    setLoading(true);
    const now = new Date().toISOString();
    const { error } = await supabase.from("attendance").insert({
      user_id: userId,
      date: todayStr,
      clock_in: now,
    });
    if (!error) setClockIn(now);
    setLoading(false);
  }

  async function handleClockOut() {
    setLoading(true);
    const now = new Date().toISOString();
    const { error } = await supabase
      .from("attendance")
      .update({ clock_out: now })
      .eq("user_id", userId)
      .eq("date", todayStr);
    if (!error) setClockOut(now);
    setLoading(false);
  }

  function formatTime(iso: string | null) {
    if (!iso) return "--:--:--";
    return new Date(iso).toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-center gap-8 text-center">
        <div>
          <p className="text-sm text-gray-500">출근 시간</p>
          <p className="text-lg font-semibold text-gray-900">
            {formatTime(clockIn)}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500">퇴근 시간</p>
          <p className="text-lg font-semibold text-gray-900">
            {formatTime(clockOut)}
          </p>
        </div>
      </div>

      <div className="flex justify-center gap-4">
        <button
          onClick={handleClockIn}
          disabled={!!clockIn || loading}
          className="h-28 w-28 rounded-2xl bg-green-500 text-lg font-bold text-white shadow-lg transition hover:bg-green-600 active:scale-95 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:shadow-none sm:h-36 sm:w-36 sm:text-xl"
        >
          {clockIn ? "출근 완료" : "출근하기"}
        </button>
        <button
          onClick={handleClockOut}
          disabled={!clockIn || !!clockOut || loading}
          className="h-28 w-28 rounded-2xl bg-red-500 text-lg font-bold text-white shadow-lg transition hover:bg-red-600 active:scale-95 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:shadow-none sm:h-36 sm:w-36 sm:text-xl"
        >
          {clockOut ? "퇴근 완료" : "퇴근하기"}
        </button>
      </div>
    </div>
  );
}
