import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/LogoutButton";

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

export default async function AdminPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Check admin role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/dashboard");

  // Get today's date
  const today = new Date().toISOString().split("T")[0];

  // Get all attendance records for today with profile emails
  const { data: records } = await supabase
    .from("attendance")
    .select("clock_in, clock_out, profiles(email)")
    .eq("date", today)
    .order("clock_in", { ascending: true });

  // Get all employees
  const { data: allProfiles } = await supabase
    .from("profiles")
    .select("id, email, role")
    .order("email");

  // Build lookup for today's attendance
  const attendanceMap = new Map<
    string,
    { clock_in: string | null; clock_out: string | null }
  >();
  records?.forEach((r) => {
    const email = (r.profiles as unknown as { email: string })?.email;
    if (email) {
      attendanceMap.set(email, {
        clock_in: r.clock_in,
        clock_out: r.clock_out,
      });
    }
  });

  const todayFormatted = new Date().toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold text-gray-900">관리자 대시보드</h1>
            <a
              href="/dashboard"
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              내 근태
            </a>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">{user.email}</span>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">오늘의 출퇴근 현황</h2>
          <p className="text-sm text-gray-500">{todayFormatted}</p>
        </div>

        <div className="mb-4 flex gap-4">
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-500">전체 직원</p>
            <p className="text-2xl font-bold text-gray-900">
              {allProfiles?.length ?? 0}
            </p>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-500">출근</p>
            <p className="text-2xl font-bold text-green-600">
              {records?.length ?? 0}
            </p>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-500">미출근</p>
            <p className="text-2xl font-bold text-red-500">
              {(allProfiles?.length ?? 0) - (records?.length ?? 0)}
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
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {allProfiles?.map((p) => {
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
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                          p.role === "admin"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {p.role === "admin" ? "관리자" : "직원"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-700">
                      {formatTime(att?.clock_in ?? null)}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-700">
                      {formatTime(att?.clock_out ?? null)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusColor}`}
                      >
                        {status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
