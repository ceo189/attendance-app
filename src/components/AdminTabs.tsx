"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

const LOCATION_LABELS: Record<string, string> = {
  office: "사무실",
  outside: "외부",
  remote: "재택",
};

const ROLE_LABELS: Record<string, string> = {
  master: "마스터",
  admin: "관리자",
  employee: "직원",
};

const ROLE_COLORS: Record<string, string> = {
  master: "bg-amber-100 text-amber-700",
  admin: "bg-purple-100 text-purple-700",
  employee: "bg-blue-100 text-blue-700",
};

function formatTime(iso: string | null) {
  if (!iso) return "-";
  return new Date(iso).toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "Asia/Seoul",
  });
}

function formatDateTime(iso: string | null) {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Seoul",
  });
}

interface AttendanceItem {
  id: string;
  user_id: string;
  email: string;
  clock_in: string | null;
  clock_out: string | null;
  clock_in_location: string | null;
  clock_out_location: string | null;
  updated_by: string | null;
  updated_at: string | null;
}

interface ProfileItem {
  id: string;
  email: string;
  role: string;
}

interface Props {
  role: string;
  todayFormatted: string;
  attendanceList: AttendanceItem[];
  profilesList: ProfileItem[];
  totalEmployees: number;
  totalPresent: number;
}

export default function AdminTabs({
  role,
  todayFormatted,
  attendanceList,
  profilesList: initialProfiles,
  totalEmployees,
  totalPresent,
}: Props) {
  const [tab, setTab] = useState<"records" | "roles">("records");
  const [profiles, setProfiles] = useState(initialProfiles);
  const [loading, setLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const supabase = createClient();
  const isMaster = role === "master";

  const showToast = useCallback(
    (type: "success" | "error", message: string) => {
      setToast({ type, message });
      setTimeout(() => setToast(null), 4000);
    },
    []
  );

  // Build email lookup for updated_by display
  const emailMap = new Map(profiles.map((p) => [p.id, p.email]));

  // Build attendance lookup by email
  const attendanceMap = new Map(attendanceList.map((a) => [a.email, a]));

  async function handleRoleChange(
    profileId: string,
    currentRole: string
  ) {
    const newRole = currentRole === "admin" ? "employee" : "admin";
    setLoading(profileId);
    const { error } = await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("id", profileId);

    if (error) {
      showToast("error", `권한 변경 실패: ${error.message}`);
    } else {
      setProfiles((prev) =>
        prev.map((p) => (p.id === profileId ? { ...p, role: newRole } : p))
      );
      showToast("success", `권한이 ${ROLE_LABELS[newRole]}(으)로 변경되었습니다.`);
    }
    setLoading(null);
  }

  return (
    <div>
      {toast && (
        <div
          className={`mb-4 rounded-lg px-4 py-3 text-center text-sm font-medium shadow-md ${
            toast.type === "success"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setTab("records")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
            tab === "records"
              ? "bg-gray-900 text-white"
              : "bg-white text-gray-700 hover:bg-gray-100"
          }`}
        >
          전체 기록
        </button>
        {isMaster && (
          <button
            onClick={() => setTab("roles")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              tab === "roles"
                ? "bg-gray-900 text-white"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            직원 권한 관리
          </button>
        )}
      </div>

      {/* Records Tab */}
      {tab === "records" && (
        <div>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">
              오늘의 출퇴근 현황
            </h2>
            <p className="text-sm text-gray-500">{todayFormatted}</p>
          </div>

          <div className="mb-4 flex gap-4">
            <div className="rounded-xl bg-white p-4 shadow-sm">
              <p className="text-sm text-gray-500">전체 직원</p>
              <p className="text-2xl font-bold text-gray-900">
                {totalEmployees}
              </p>
            </div>
            <div className="rounded-xl bg-white p-4 shadow-sm">
              <p className="text-sm text-gray-500">출근</p>
              <p className="text-2xl font-bold text-green-600">
                {totalPresent}
              </p>
            </div>
            <div className="rounded-xl bg-white p-4 shadow-sm">
              <p className="text-sm text-gray-500">미출근</p>
              <p className="text-2xl font-bold text-red-500">
                {totalEmployees - totalPresent}
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">
                    이메일
                  </th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600">
                    역할
                  </th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600">
                    출근
                  </th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600">
                    퇴근
                  </th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600">
                    상태
                  </th>
                  {isMaster && (
                    <th className="px-4 py-3 text-center font-medium text-gray-600">
                      수정 이력
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {profiles.map((p) => {
                  const att = attendanceMap.get(p.email);
                  const status = att
                    ? att.clock_out
                      ? "퇴근"
                      : "근무중"
                    : "미출근";
                  const statusColor = att
                    ? att.clock_out
                      ? "bg-gray-100 text-gray-700"
                      : "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700";

                  return (
                    <tr key={p.id}>
                      <td className="px-4 py-3 text-gray-900">{p.email}</td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_COLORS[p.role] ?? ROLE_COLORS.employee}`}
                        >
                          {ROLE_LABELS[p.role] ?? p.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="text-gray-700">
                          {formatTime(att?.clock_in ?? null)}
                        </div>
                        {att?.clock_in_location && (
                          <span className="text-xs text-gray-500">
                            {LOCATION_LABELS[att.clock_in_location] ??
                              att.clock_in_location}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="text-gray-700">
                          {formatTime(att?.clock_out ?? null)}
                        </div>
                        {att?.clock_out_location && (
                          <span className="text-xs text-gray-500">
                            {LOCATION_LABELS[att.clock_out_location] ??
                              att.clock_out_location}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusColor}`}
                        >
                          {status}
                        </span>
                      </td>
                      {isMaster && (
                        <td className="px-4 py-3 text-center text-xs text-gray-400">
                          {att?.updated_by ? (
                            <div>
                              <div>
                                {emailMap.get(att.updated_by) ?? "알 수 없음"}
                              </div>
                              <div>{formatDateTime(att.updated_at)}</div>
                            </div>
                          ) : (
                            "-"
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Role Management Tab (Master only) */}
      {tab === "roles" && isMaster && (
        <div>
          <h2 className="mb-4 text-xl font-bold text-gray-900">
            직원 권한 관리
          </h2>
          <p className="mb-6 text-sm text-gray-500">
            직원의 권한을 변경할 수 있습니다. 마스터 권한은 변경할 수 없습니다.
          </p>

          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">
                    이메일
                  </th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600">
                    현재 권한
                  </th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600">
                    변경
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {profiles.map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-3 text-gray-900">{p.email}</td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_COLORS[p.role] ?? ROLE_COLORS.employee}`}
                      >
                        {ROLE_LABELS[p.role] ?? p.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {p.role === "master" ? (
                        <span className="text-xs text-gray-400">
                          변경 불가
                        </span>
                      ) : (
                        <button
                          onClick={() => handleRoleChange(p.id, p.role)}
                          disabled={loading === p.id}
                          className={`rounded-lg px-3 py-1.5 text-xs font-medium text-white transition ${
                            p.role === "admin"
                              ? "bg-blue-500 hover:bg-blue-600"
                              : "bg-purple-500 hover:bg-purple-600"
                          } disabled:opacity-50`}
                        >
                          {loading === p.id
                            ? "..."
                            : p.role === "admin"
                              ? "직원으로 변경"
                              : "관리자로 승격"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
