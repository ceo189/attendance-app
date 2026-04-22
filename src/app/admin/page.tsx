import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/LogoutButton";
import AdminTabs from "@/components/AdminTabs";

export default async function AdminPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, team, title")
    .eq("id", user.id)
    .single();

  // Block employees — only admin and master allowed
  if (!profile?.role || profile.role === "employee") redirect("/dashboard");

  const today = new Date().toLocaleDateString("sv-SE", {
    timeZone: "Asia/Seoul",
  });

  const isMaster = profile.role === "master";
  const adminTeam = profile.team ?? "";

  // For admin: filter profiles and attendance to their team only
  const profilesQuery = supabase
    .from("profiles")
    .select("id, email, name, role, position, title, team, status")
    .order("email");

  const { data: allProfiles } = isMaster
    ? await profilesQuery
    : await profilesQuery.eq("team", adminTeam);

  // Get user_ids for the relevant profiles to filter attendance
  const relevantUserIds = (allProfiles ?? []).map((p) => p.id);

  const attendanceQuery = supabase
    .from("attendance")
    .select(
      "id, user_id, clock_in, clock_out, clock_in_location, clock_out_location, updated_by, updated_at, latitude, longitude, profiles!attendance_user_id_fkey(email)"
    )
    .eq("date", today)
    .order("clock_in", { ascending: true });

  const { data: records } = isMaster
    ? await attendanceQuery
    : await attendanceQuery.in("user_id", relevantUserIds.length > 0 ? relevantUserIds : ["none"]);

  // Fetch leave requests — filtered to team for admin
  const leaveQuery = supabase
    .from("leave_requests")
    .select(
      "id, user_id, leave_type, start_date, end_date, reason, status, admin_status, master_status, admin_processed_by, master_processed_by, admin_processed_at, master_processed_at, created_at, profiles(email)"
    )
    .order("created_at", { ascending: false });

  const { data: leaveRecords } = isMaster
    ? await leaveQuery
    : await leaveQuery.in("user_id", relevantUserIds.length > 0 ? relevantUserIds : ["none"]);

  const todayFormatted = new Date().toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
    timeZone: "Asia/Seoul",
  });

  // Build serializable data
  const attendanceList = (records ?? []).map((r) => ({
    id: r.id,
    user_id: r.user_id,
    email: (r.profiles as unknown as { email: string })?.email ?? "",
    clock_in: r.clock_in,
    clock_out: r.clock_out,
    clock_in_location: r.clock_in_location,
    clock_out_location: r.clock_out_location,
    updated_by: r.updated_by,
    updated_at: r.updated_at,
    latitude: isMaster ? r.latitude : null,
    longitude: isMaster ? r.longitude : null,
  }));

  const profilesList = (allProfiles ?? []).map((p) => ({
    id: p.id,
    email: p.email,
    name: p.name ?? "",
    role: p.role,
    position: p.position ?? "",
    title: p.title ?? "",
    team: p.team ?? "",
    status: p.status ?? "active",
  }));

  const leaveRequests = (leaveRecords ?? []).map((r) => ({
    id: r.id,
    user_id: r.user_id,
    email: (r.profiles as unknown as { email: string })?.email ?? "",
    leave_type: r.leave_type,
    start_date: r.start_date,
    end_date: r.end_date,
    reason: r.reason,
    status: r.status,
    admin_status: r.admin_status ?? "pending",
    master_status: r.master_status ?? "pending",
    admin_processed_by: r.admin_processed_by ?? null,
    master_processed_by: r.master_processed_by ?? null,
    admin_processed_at: r.admin_processed_at ?? null,
    master_processed_at: r.master_processed_at ?? null,
    created_at: r.created_at,
  }));

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
            <span className="hidden text-sm text-gray-500 sm:inline">
              {user.email}
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        <AdminTabs
          role={profile.role}
          currentUserTeam={adminTeam}
          currentUserTitle={profile.title ?? ""}
          todayFormatted={todayFormatted}
          attendanceList={attendanceList}
          profilesList={profilesList}
          totalEmployees={profilesList.length}
          totalPresent={attendanceList.length}
          leaveRequests={leaveRequests}
        />
      </main>
    </div>
  );
}
