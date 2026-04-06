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
    .select("role")
    .eq("id", user.id)
    .single();

  // Block employees — only admin and master allowed
  if (!profile?.role || profile.role === "employee") redirect("/dashboard");

  const today = new Date().toLocaleDateString("sv-SE", {
    timeZone: "Asia/Seoul",
  });

  const { data: records } = await supabase
    .from("attendance")
    .select(
      "id, user_id, clock_in, clock_out, clock_in_location, clock_out_location, updated_by, updated_at, latitude, longitude, profiles(email)"
    )
    .eq("date", today)
    .order("clock_in", { ascending: true });

  const { data: allProfiles } = await supabase
    .from("profiles")
    .select("id, email, role")
    .order("email");

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
    latitude: profile.role === "master" ? r.latitude : null,
    longitude: profile.role === "master" ? r.longitude : null,
  }));

  const profilesList = (allProfiles ?? []).map((p) => ({
    id: p.id,
    email: p.email,
    role: p.role,
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
            <span className="text-sm text-gray-500">{user.email}</span>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        <AdminTabs
          role={profile.role}
          todayFormatted={todayFormatted}
          attendanceList={attendanceList}
          profilesList={profilesList}
          totalEmployees={profilesList.length}
          totalPresent={attendanceList.length}
        />
      </main>
    </div>
  );
}
