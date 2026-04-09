"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

function getKoreanDate() {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });
}

const LOCATIONS = [
  { value: "office", label: "사무실" },
  { value: "outside", label: "외부" },
  { value: "remote", label: "재택" },
] as const;

function LocationBadge({ value }: { value: string }) {
  const label = LOCATIONS.find((l) => l.value === value)?.label ?? value;
  return (
    <span className="inline-block rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
      {label}
    </span>
  );
}

function getGPS(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("이 브라우저에서 위치 정보를 지원하지 않습니다."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => {
        if (err.code === 1)
          reject(new Error("위치 정보 접근 권한을 허용해 주세요."));
        else if (err.code === 2)
          reject(new Error("위치 정보를 가져올 수 없습니다."));
        else reject(new Error("위치 정보 요청 시간이 초과되었습니다."));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  });
}

async function sendNotify(
  type: "clock_in" | "clock_out",
  email: string,
  time: string,
  location: string
) {
  try {
    await fetch("/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, email, time, location }),
    });
  } catch {
    // Non-fatal
  }
}

interface Props {
  userId: string;
  userEmail: string;
  recordId: string | null;
  initialClockIn: string | null;
  initialClockOut: string | null;
  initialClockInLocation: string | null;
  initialClockOutLocation: string | null;
  locationConsent: boolean;
}

export default function AttendanceButtons({
  userId,
  userEmail,
  recordId,
  initialClockIn,
  initialClockOut,
  initialClockInLocation,
  initialClockOutLocation,
  locationConsent,
}: Props) {
  const [clockIn, setClockIn] = useState<string | null>(initialClockIn);
  const [clockOut, setClockOut] = useState<string | null>(initialClockOut);
  const [clockInLocation, setClockInLocation] = useState<string>(
    initialClockInLocation ?? ""
  );
  const [clockOutLocation, setClockOutLocation] = useState<string>(
    initialClockOutLocation ?? ""
  );
  const [selectedLocation, setSelectedLocation] = useState<string>("");
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
    if (!selectedLocation) {
      showToast("error", "출근 장소를 선택해주세요.");
      return;
    }
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
          // GPS 실패해도 출퇴근 기록은 진행
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
        .select("id")
        .single();

      if (error) {
        showToast("error", `출근 기록 실패: ${error.message}`);
      } else if (data) {
        setClockIn(now);
        setClockInLocation(selectedLocation);
        setCurrentRecordId(data.id);
        setSelectedLocation("");
        showToast("success", "출근 기록 완료!");
        sendNotify("clock_in", userEmail, now, selectedLocation);
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
    if (!selectedLocation) {
      showToast("error", "퇴근 장소를 선택해주세요.");
      return;
    }
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
          // GPS 실패해도 출퇴근 기록은 진행
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
        .eq("id", currentRecordId);

      if (error) {
        showToast("error", `퇴근 기록 실패: ${error.message}`);
      } else {
        setClockOut(now);
        setClockOutLocation(selectedLocation);
        showToast("success", "퇴근 기록 완료!");
        sendNotify("clock_out", userEmail, now, selectedLocation);
      }
    } catch (err) {
      showToast("error", `네트워크 오류: ${String(err)}`);
    }
    setLoading(false);
  }

  function formatTime(iso: string | null) {
    if (!iso) return "--:--";
    return new Date(iso).toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  }

  const showDropdown = !clockOut;

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
          {toast.type === "success" ? "\u{1F7E2}" : "\u{1F534}"}{" "}
          {toast.message}
        </div>
      )}

      <div className="flex justify-center gap-8 text-center">
        <div>
          <p className="text-sm text-gray-500">출근</p>
          <p className="text-lg font-semibold text-gray-900">
            {formatTime(clockIn)}
          </p>
          {clockInLocation && <LocationBadge value={clockInLocation} />}
        </div>
        <div>
          <p className="text-sm text-gray-500">퇴근</p>
          <p className="text-lg font-semibold text-gray-900">
            {formatTime(clockOut)}
          </p>
          {clockOutLocation && <LocationBadge value={clockOutLocation} />}
        </div>
      </div>

      {showDropdown && (
        <div className="flex justify-center">
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="w-48 rounded-lg border border-gray-300 bg-white px-4 py-3 text-center text-sm font-medium text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="">
              -- {clockIn ? "퇴근" : "출근"} 장소 선택 --
            </option>
            {LOCATIONS.map((loc) => (
              <option key={loc.value} value={loc.value}>
                {loc.label}
              </option>
            ))}
          </select>
        </div>
      )}

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
