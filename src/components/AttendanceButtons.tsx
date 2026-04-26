"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function getKoreanDate() {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });
}

const LOCATIONS = [
  { value: "office", label: "사무실" },
  { value: "outside", label: "외부" },
  { value: "remote", label: "재택" },
] as const;

const LOCATION_LABELS: Record<string, string> = {
  office: "사무실",
  outside: "외부",
  remote: "재택",
};

function getGPS(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("위치 미지원"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => reject(new Error("위치 실패")),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  });
}

async function sendNotify(
  type: "clock_in" | "clock_out",
  profile: { email: string; name?: string; team?: string; title?: string },
  time: string,
  location: string
) {
  try {
    await fetch("/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, ...profile, time, location }),
    });
  } catch {
    // Non-fatal
  }
}

interface Session {
  id: string;
  clock_in: string | null;
  clock_out: string | null;
  clock_in_location: string | null;
  clock_out_location: string | null;
}

interface Props {
  userId: string;
  userEmail: string;
  userName: string;
  userTeam: string;
  userTitle: string;
  todaySessions: Session[];
  locationConsent: boolean;
}

export default function AttendanceButtons({
  userId,
  userEmail,
  userName,
  userTeam,
  userTitle,
  todaySessions: initialSessions,
  locationConsent,
}: Props) {
  const [sessions, setSessions] = useState<Session[]>(initialSessions);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const submittingRef = useRef(false);
  const supabase = createClient();
  const router = useRouter();

  const showToast = useCallback(
    (type: "success" | "error", message: string) => {
      setToast({ type, message });
      setTimeout(() => setToast(null), 4000);
    },
    []
  );

  // Find the active (latest) session
  const activeSession = sessions.find((s) => s.clock_in && !s.clock_out);
  const lastSession = sessions[0]; // sessions are ordered desc by clock_in
  const canClockIn = !activeSession && (!lastSession || !!lastSession.clock_out);
  const canClockOut = !!activeSession;
  const canReClockIn =
    sessions.length > 0 &&
    !activeSession &&
    !!lastSession?.clock_out;

  function formatTime(iso: string | null) {
    if (!iso) return "--:--";
    return new Date(iso).toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  }

  async function handleClockIn() {
    if (submittingRef.current) return;
    if (!selectedLocation) {
      showToast("error", "장소를 선택해주세요.");
      return;
    }
    submittingRef.current = true;
    setLoading(true);
    try {
      let lat: number | null = null;
      let lng: number | null = null;
      if (locationConsent) {
        try {
          const gps = await getGPS();
          lat = gps.lat;
          lng = gps.lng;
        } catch {
          // GPS 실패해도 진행
        }
      }

      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from("attendance")
        .insert({
          user_id: userId,
          date: getKoreanDate(),
          clock_in: now,
          clock_in_location: selectedLocation,
          ...(lat !== null && { latitude: lat, longitude: lng }),
        })
        .select("id, clock_in, clock_out, clock_in_location, clock_out_location")
        .single();

      if (error) {
        console.error("출근 실패:", error);
        showToast("error", "출근 기록에 실패했습니다. 다시 시도해주세요.");
      } else if (data) {
        setSessions((prev) => [data, ...prev]);
        setSelectedLocation("");
        showToast("success", "출근 기록 완료!");
        sendNotify(
          "clock_in",
          { email: userEmail, name: userName, team: userTeam, title: userTitle },
          now,
          selectedLocation
        );
        router.refresh();
      }
    } catch {
      showToast("error", "네트워크 오류가 발생했습니다.");
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
  }

  async function handleClockOut() {
    if (submittingRef.current || !activeSession) return;
    if (!selectedLocation) {
      showToast("error", "장소를 선택해주세요.");
      return;
    }
    submittingRef.current = true;
    setLoading(true);
    try {
      let lat: number | null = null;
      let lng: number | null = null;
      if (locationConsent) {
        try {
          const gps = await getGPS();
          lat = gps.lat;
          lng = gps.lng;
        } catch {
          // GPS 실패해도 진행
        }
      }

      const now = new Date().toISOString();
      const { error } = await supabase
        .from("attendance")
        .update({
          clock_out: now,
          clock_out_location: selectedLocation,
          ...(lat !== null && { latitude: lat, longitude: lng }),
        })
        .eq("id", activeSession.id);

      if (error) {
        console.error("퇴근 실패:", error);
        showToast("error", "퇴근 기록에 실패했습니다. 다시 시도해주세요.");
      } else {
        setSessions((prev) =>
          prev.map((s) =>
            s.id === activeSession.id
              ? { ...s, clock_out: now, clock_out_location: selectedLocation }
              : s
          )
        );
        setSelectedLocation("");
        showToast("success", "퇴근 기록 완료!");
        sendNotify(
          "clock_out",
          { email: userEmail, name: userName, team: userTeam, title: userTitle },
          now,
          selectedLocation
        );
        router.refresh();
      }
    } catch {
      showToast("error", "네트워크 오류가 발생했습니다.");
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
  }

  const showDropdown = canClockIn || canClockOut;
  const dropdownLabel = canClockOut ? "퇴근" : "출근";

  return (
    <div className="space-y-5">
      {toast && (
        <div
          className={`mx-auto max-w-sm rounded-lg px-4 py-3 text-center text-sm font-medium shadow-md ${
            toast.type === "success"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Today's sessions list */}
      {sessions.length > 0 && (
        <div className="space-y-2">
          <p className="text-center text-xs font-medium text-gray-500">
            오늘의 근무 기록
          </p>
          {[...sessions].reverse().map((s, i) => (
            <div
              key={s.id}
              className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-2 text-sm"
            >
              <span className="text-xs text-gray-400">
                {sessions.length > 1 ? `${i + 1}차` : ""}
              </span>
              <div className="flex items-center gap-3">
                <span className="text-green-600">
                  {formatTime(s.clock_in)}
                </span>
                {s.clock_in_location && (
                  <span className="text-xs text-gray-400">
                    {LOCATION_LABELS[s.clock_in_location] ?? s.clock_in_location}
                  </span>
                )}
              </div>
              <span className="text-gray-300">→</span>
              <div className="flex items-center gap-3">
                <span className={s.clock_out ? "text-red-500" : "text-gray-300"}>
                  {s.clock_out ? formatTime(s.clock_out) : "근무중"}
                </span>
                {s.clock_out_location && (
                  <span className="text-xs text-gray-400">
                    {LOCATION_LABELS[s.clock_out_location] ?? s.clock_out_location}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Location dropdown */}
      {showDropdown && (
        <div className="flex justify-center">
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="w-48 rounded-lg border border-gray-300 bg-white px-4 py-3 text-center text-sm font-medium text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="">-- {dropdownLabel} 장소 선택 --</option>
            {LOCATIONS.map((loc) => (
              <option key={loc.value} value={loc.value}>
                {loc.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Clock in / out buttons */}
      <div className="flex justify-center gap-4">
        {canClockIn ? (
          <button
            onClick={handleClockIn}
            disabled={loading}
            className="h-28 w-28 rounded-2xl bg-green-500 text-lg font-bold text-white shadow-lg transition hover:bg-green-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 sm:h-36 sm:w-36 sm:text-xl"
          >
            {loading ? "..." : sessions.length > 0 ? "재출근" : "출근하기"}
          </button>
        ) : (
          <button
            disabled
            className="h-28 w-28 rounded-2xl bg-gray-300 text-lg font-bold text-white sm:h-36 sm:w-36 sm:text-xl"
          >
            출근 완료
          </button>
        )}

        {canClockOut ? (
          <button
            onClick={handleClockOut}
            disabled={loading}
            className="h-28 w-28 rounded-2xl bg-red-500 text-lg font-bold text-white shadow-lg transition hover:bg-red-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 sm:h-36 sm:w-36 sm:text-xl"
          >
            {loading ? "..." : "퇴근하기"}
          </button>
        ) : (
          <button
            disabled
            className="h-28 w-28 rounded-2xl bg-gray-300 text-lg font-bold text-white sm:h-36 sm:w-36 sm:text-xl"
          >
            퇴근하기
          </button>
        )}
      </div>
    </div>
  );
}
