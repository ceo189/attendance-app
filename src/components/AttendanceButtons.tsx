"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

function getKoreanDate() {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });
}

interface Props {
  userId: string;
  recordId: string | null;
  initialClockIn: string | null;
  initialClockOut: string | null;
}

export default function AttendanceButtons({
  userId,
  recordId,
  initialClockIn,
  initialClockOut,
}: Props) {
  const [clockIn, setClockIn] = useState<string | null>(initialClockIn);
  const [clockOut, setClockOut] = useState<string | null>(initialClockOut);
  const [currentRecordId, setCurrentRecordId] = useState<string | null>(
    recordId
  );
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const supabase = createClient();

  const showToast = useCallback(
    (type: "success" | "error", message: string) => {
      setToast({ type, message });
      setTimeout(() => setToast(null), 4000);
    },
    []
  );

  async function handleClockIn() {
    setLoading(true);
    try {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from("attendance")
        .insert({
          user_id: userId,
          date: getKoreanDate(),
          clock_in: now,
        })
        .select("id")
        .single();

      if (error) {
        showToast("error", `출근 기록 실패: ${error.message}`);
      } else if (data) {
        setClockIn(now);
        setCurrentRecordId(data.id);
        showToast("success", "출근 기록 완료!");
      }
    } catch (err) {
      showToast("error", `네트워크 오류: ${String(err)}`);
    }
    setLoading(false);
  }

  async function handleClockOut() {
    if (!currentRecordId) {
      showToast("error", "출근 기록이 없어 퇴근 처리할 수 없습니다.");
      return;
    }
    setLoading(true);
    try {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from("attendance")
        .update({ clock_out: now })
        .eq("id", currentRecordId);

      if (error) {
        showToast("error", `퇴근 기록 실패: ${error.message}`);
      } else {
        setClockOut(now);
        showToast("success", "퇴근 기록 완료!");
      }
    } catch (err) {
      showToast("error", `네트워크 오류: ${String(err)}`);
    }
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
      {toast && (
        <div
          className={`mx-auto max-w-sm rounded-lg px-4 py-3 text-center text-sm font-medium shadow-md transition-all ${
            toast.type === "success"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {toast.type === "success" ? "\u{1F7E2}" : "\u{1F534}"} {toast.message}
        </div>
      )}

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
          {loading && !clockIn ? "..." : clockIn ? "출근 완료" : "출근하기"}
        </button>
        <button
          onClick={handleClockOut}
          disabled={!clockIn || !!clockOut || loading}
          className="h-28 w-28 rounded-2xl bg-red-500 text-lg font-bold text-white shadow-lg transition hover:bg-red-600 active:scale-95 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:shadow-none sm:h-36 sm:w-36 sm:text-xl"
        >
          {loading && clockIn && !clockOut
            ? "..."
            : clockOut
              ? "퇴근 완료"
              : "퇴근하기"}
        </button>
      </div>
    </div>
  );
}
