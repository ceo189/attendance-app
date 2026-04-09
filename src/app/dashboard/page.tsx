import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Clock from "@/components/Clock";
import AttendanceButtons from "@/components/AttendanceButtons";
import WeeklyRecords from "@/components/WeeklyRecords";
import LogoutButton from "@/components/LogoutButton";
import ChangePasswordButton from "@/components/ChangePasswordButton";
import ConsentModal from "@/components/ConsentModal";
import ProfileCompleteModal from "@/components/ProfileCompleteModal";
import WorkingHoursSummary from "@/components/WorkingHoursSummary";
import LeaveSection from "@/components/LeaveSection";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, location_consent, name, team, title")
    .eq("id", user.id)
    .single();

  const today = new Date().toLocaleDateString("sv-SE", {
    timeZone: "Asia/Seoul",
  });
  const { data: todayRecord } = await supabase
    .from("attendance")
    .select("id, clock_in, clock_out, clock_in_location, clock_out_location")
    .eq("user_id", user.id)
    .eq("date", today)
    .single();

  const now = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" })
  );
  const dayOfWeek = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  const mondayStr = monday.toLocaleDateString("sv-SE");

  const { data: weeklyRecords } = await supabase
    .from("attendance")
    .select("date, clock_in, clock_out, clock_in_location, clock_out_location")
    .eq("user_id", user.id)
    .gte("date", mondayStr)
    .lte("date", today)
    .order("date", { ascending: false });

  const { data: leaveRequests } = await supabase
    .from("leave_requests")
    .select("id, leave_type, start_date, end_date, reason, status, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  const needsConsent = !profile?.location_consent;
  const needsProfile = !profile?.name;

  return (
    <div className="min-h-screen bg-gray-50">
      {needsProfile && <ProfileCompleteModal userId={user.id} />}
      {!needsProfile && needsConsent && <ConsentModal userId={user.id} />}

      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-4">
          <h1 className="text-lg font-bold text-gray-900">근태관리</h1>
          <div className="flex items-center gap-2 sm:gap-3">
            {(profile?.role === "admin" || profile?.role === "master") && (
              <a
                href="/admin"
                className="rounded-lg bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800"
              >
                관리자
              </a>
            )}
            <span className="hidden text-sm text-gray-500 sm:inline">
              {user.email}
            </span>
            <ChangePasswordButton />
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6 sm:py-8">
        <div className="space-y-6">
          <Clock />

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <AttendanceButtons
              userId={user.id}
              userEmail={user.email ?? ""}
              recordId={todayRecord?.id ?? null}
              initialClockIn={todayRecord?.clock_in ?? null}
              initialClockOut={todayRecord?.clock_out ?? null}
              initialClockInLocation={todayRecord?.clock_in_location ?? null}
              initialClockOutLocation={todayRecord?.clock_out_location ?? null}
              locationConsent={!!profile?.location_consent}
            />
          </div>

          <WorkingHoursSummary records={weeklyRecords ?? []} />

          <LeaveSection
            userId={user.id}
            userEmail={user.email ?? ""}
            leaveRequests={leaveRequests ?? []}
          />

          <div>
            <h2 className="mb-3 text-sm font-semibold text-gray-700">
              이번 주 출퇴근 기록
            </h2>
            <WeeklyRecords records={weeklyRecords ?? []} />
          </div>
        </div>
      </main>
    </div>
  );
}
