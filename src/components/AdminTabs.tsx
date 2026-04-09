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

const LEAVE_TYPE_LABELS: Record<string, string> = {
  annual: "연차",
  sick: "병가",
  personal: "개인사유",
  other: "기타",
};

const LEAVE_STATUS_LABELS: Record<string, string> = {
  pending: "검토중",
  approved: "승인",
  rejected: "반려",
};

const LEAVE_STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
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
  latitude: number | null;
  longitude: number | null;
}

interface ProfileItem {
  id: string;
  email: string;
  name: string;
  role: string;
  position: string;
  title: string;
  team: string;
}

export interface LeaveRequestItem {
  id: string;
  user_id: string;
  email: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string | null;
  status: string;
  created_at: string;
}

interface Props {
  role: string;
  todayFormatted: string;
  attendanceList: AttendanceItem[];
  profilesList: ProfileItem[];
  totalEmployees: number;
  totalPresent: number;
  leaveRequests: LeaveRequestItem[];
}

type TabType = "records" | "leaves" | "roles";

export default function AdminTabs({
  role,
  todayFormatted,
  attendanceList,
  profilesList: initialProfiles,
  totalEmployees,
  totalPresent,
  leaveRequests: initialLeaveRequests,
}: Props) {
  const [tab, setTab] = useState<TabType>("records");
  const [profiles, setProfiles] = useState(initialProfiles);
  const [leaveRequests, setLeaveRequests] = useState(initialLeaveRequests);
  const [loading, setLoading] = useState<string | null>(null);
  const [csvMonth, setCsvMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const supabase = createClient();
  const isMaster = role === "master";
  const isAdminOrMaster = role === "admin" || role === "master";

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

  async function handleRoleChange(profileId: string, currentRole: string) {
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
      showToast(
        "success",
        `권한이 ${ROLE_LABELS[newRole]}(으)로 변경되었습니다.`
      );
    }
    setLoading(null);
  }

  async function handleLeaveStatusChange(
    leaveId: string,
    newStatus: "approved" | "rejected"
  ) {
    setLoading(leaveId);
    const { error } = await supabase
      .from("leave_requests")
      .update({ status: newStatus })
      .eq("id", leaveId);

    if (error) {
      showToast("error", `상태 변경 실패: ${error.message}`);
    } else {
      setLeaveRequests((prev) =>
        prev.map((r) => (r.id === leaveId ? { ...r, status: newStatus } : r))
      );
      showToast(
        "success",
        newStatus === "approved" ? "휴가 신청이 승인되었습니다." : "휴가 신청이 반려되었습니다."
      );
    }
    setLoading(null);
  }

  async function handleCsvExport() {
    if (!csvMonth) {
      showToast("error", "월을 선택해주세요.");
      return;
    }
    setLoading("csv");

    const [year, month] = csvMonth.split("-");
    const startDate = `${year}-${month}-01`;
    const lastDay = new Date(Number(year), Number(month), 0).getDate();
    const endDate = `${year}-${month}-${String(lastDay).padStart(2, "0")}`;

    const [{ data: attData }, { data: leaveData }] = await Promise.all([
      supabase
        .from("attendance")
        .select(
          "user_id, date, clock_in, clock_out, clock_in_location, clock_out_location, profiles(email)"
        )
        .gte("date", startDate)
        .lte("date", endDate)
        .order("date", { ascending: true }),
      supabase
        .from("leave_requests")
        .select(
          "user_id, leave_type, start_date, end_date, reason, status, profiles(email)"
        )
        .gte("start_date", startDate)
        .lte("start_date", endDate)
        .order("start_date", { ascending: true }),
    ]);

    const rows: string[][] = [];

    // Attendance section
    rows.push(["=== 출퇴근 기록 ==="]);
    rows.push(["이메일", "날짜", "출근시간", "퇴근시간", "출근장소", "퇴근장소", "근무시간(h)"]);
    for (const r of attData ?? []) {
      const email =
        (r.profiles as unknown as { email: string })?.email ?? "";
      let workedH = "";
      if (r.clock_in && r.clock_out) {
        const mins = Math.floor(
          (new Date(r.clock_out).getTime() - new Date(r.clock_in).getTime()) /
            60000
        );
        const worked = Math.max(0, mins - 60);
        workedH = (worked / 60).toFixed(2);
      }
      rows.push([
        email,
        r.date,
        r.clock_in
          ? new Date(r.clock_in).toLocaleTimeString("ko-KR", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
              timeZone: "Asia/Seoul",
            })
          : "",
        r.clock_out
          ? new Date(r.clock_out).toLocaleTimeString("ko-KR", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
              timeZone: "Asia/Seoul",
            })
          : "",
        LOCATION_LABELS[r.clock_in_location ?? ""] ?? r.clock_in_location ?? "",
        LOCATION_LABELS[r.clock_out_location ?? ""] ?? r.clock_out_location ?? "",
        workedH,
      ]);
    }

    rows.push([]);
    rows.push(["=== 휴가 기록 ==="]);
    rows.push(["이메일", "휴가종류", "시작일", "종료일", "사유", "상태"]);
    for (const r of leaveData ?? []) {
      const email =
        (r.profiles as unknown as { email: string })?.email ?? "";
      rows.push([
        email,
        LEAVE_TYPE_LABELS[r.leave_type] ?? r.leave_type,
        r.start_date,
        r.end_date,
        r.reason ?? "",
        LEAVE_STATUS_LABELS[r.status] ?? r.status,
      ]);
    }

    const csvContent =
      "\uFEFF" +
      rows
        .map((row) =>
          row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
        )
        .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `근태리포트_${csvMonth}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    setLoading(null);
    showToast("success", "CSV 다운로드 완료!");
  }

  const TAB_BUTTONS: { key: TabType; label: string; visible: boolean }[] = [
    { key: "records", label: "전체 기록", visible: true },
    { key: "leaves", label: "휴가 관리", visible: isAdminOrMaster },
    { key: "roles", label: "직원 권한 관리", visible: isMaster },
  ];

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
      <div className="mb-6 flex flex-wrap gap-2">
        {TAB_BUTTONS.filter((t) => t.visible).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              tab === t.key
                ? "bg-gray-900 text-white"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            {t.label}
          </button>
        ))}

        {/* CSV Export button (master only, shown in records tab) */}
        {isMaster && tab === "records" && (
          <div className="ml-auto flex items-center gap-2">
            <input
              type="month"
              value={csvMonth}
              onChange={(e) => setCsvMonth(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
            />
            <button
              onClick={handleCsvExport}
              disabled={loading === "csv"}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading === "csv" ? "생성 중..." : "월간 리포트 다운로드"}
            </button>
          </div>
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

          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">
                    이름
                  </th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600">
                    팀 / 직책
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
                      위치
                    </th>
                  )}
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
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">
                          {p.name || p.email.split("@")[0]}
                        </div>
                        <div className="text-xs text-gray-400">{p.email}</div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {(p.team || p.title || p.position) ? (
                          <div>
                            {p.team && (
                              <div className="text-xs font-medium text-gray-700">{p.team}</div>
                            )}
                            {(p.title || p.position) && (
                              <div className="text-xs text-gray-500">
                                {[p.title, p.position].filter(Boolean).join(" / ")}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span
                            className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_COLORS[p.role] ?? ROLE_COLORS.employee}`}
                          >
                            {ROLE_LABELS[p.role] ?? p.role}
                          </span>
                        )}
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
                        <td className="px-4 py-3 text-center text-xs">
                          {att?.latitude && att?.longitude ? (
                            <a
                              href={`https://www.google.com/maps?q=${att.latitude},${att.longitude}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-block rounded bg-green-100 px-2 py-1 text-green-700 hover:bg-green-200"
                            >
                              지도 보기
                            </a>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                      )}
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

      {/* Leave Management Tab */}
      {tab === "leaves" && isAdminOrMaster && (
        <div>
          <h2 className="mb-4 text-xl font-bold text-gray-900">휴가 관리</h2>

          {leaveRequests.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">
              휴가 신청 내역이 없습니다.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">
                      이메일
                    </th>
                    <th className="px-4 py-3 text-center font-medium text-gray-600">
                      종류
                    </th>
                    <th className="px-4 py-3 text-center font-medium text-gray-600">
                      기간
                    </th>
                    <th className="px-4 py-3 text-center font-medium text-gray-600">
                      사유
                    </th>
                    <th className="px-4 py-3 text-center font-medium text-gray-600">
                      상태
                    </th>
                    <th className="px-4 py-3 text-center font-medium text-gray-600">
                      처리
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {leaveRequests.map((req) => (
                    <tr key={req.id}>
                      <td className="px-4 py-3 text-gray-900">{req.email}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-block rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                          {LEAVE_TYPE_LABELS[req.leave_type] ?? req.leave_type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-xs text-gray-700">
                        {req.start_date === req.end_date
                          ? req.start_date
                          : `${req.start_date}~${req.end_date}`}
                      </td>
                      <td className="max-w-[160px] px-4 py-3 text-center text-xs text-gray-500">
                        <span className="line-clamp-2">
                          {req.reason ?? "-"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${LEAVE_STATUS_COLORS[req.status] ?? LEAVE_STATUS_COLORS.pending}`}
                        >
                          {LEAVE_STATUS_LABELS[req.status] ?? req.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {req.status === "pending" ? (
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() =>
                                handleLeaveStatusChange(req.id, "approved")
                              }
                              disabled={loading === req.id}
                              className="rounded-lg bg-green-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-600 disabled:opacity-50"
                            >
                              승인
                            </button>
                            <button
                              onClick={() =>
                                handleLeaveStatusChange(req.id, "rejected")
                              }
                              disabled={loading === req.id}
                              className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-600 disabled:opacity-50"
                            >
                              반려
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">처리 완료</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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
                    직원
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
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">
                        {p.name || p.email.split("@")[0]}
                      </div>
                      <div className="text-xs text-gray-400">{p.email}</div>
                    </td>
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
