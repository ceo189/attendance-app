interface AttendanceRecord {
  date: string;
  clock_in: string | null;
  clock_out: string | null;
}

interface Props {
  records: AttendanceRecord[];
}

function calcWorkedMinutesRaw(clock_in: string | null, clock_out: string | null): number {
  if (!clock_in || !clock_out) return 0;
  return Math.max(
    0,
    Math.floor((new Date(clock_out).getTime() - new Date(clock_in).getTime()) / 60000)
  );
}

function formatHoursMinutes(totalMinutes: number): string {
  if (totalMinutes === 0) return "0시간";
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (minutes === 0) return `${hours}시간`;
  return `${hours}시간 ${minutes}분`;
}

export default function WorkingHoursSummary({ records }: Props) {
  // Group by date to deduct lunch once per day
  const byDate = new Map<string, AttendanceRecord[]>();
  for (const r of records) {
    if (!byDate.has(r.date)) byDate.set(r.date, []);
    byDate.get(r.date)!.push(r);
  }

  let totalMinutes = 0;
  let daysWorked = 0;

  for (const [, sessions] of byDate) {
    const completedSessions = sessions.filter((s) => s.clock_in && s.clock_out);
    if (completedSessions.length === 0) continue;
    daysWorked += 1;
    const dayRaw = completedSessions.reduce(
      (acc, s) => acc + calcWorkedMinutesRaw(s.clock_in, s.clock_out),
      0
    );
    // Deduct 1 lunch hour once per day
    totalMinutes += Math.max(0, dayRaw - 60);
  }

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold text-gray-700">이번 주 근무 현황</h2>
      <div className="flex gap-4">
        <div className="flex-1 rounded-xl bg-blue-50 px-4 py-3 text-center">
          <p className="text-xs text-blue-600">총 근무시간</p>
          <p className="mt-1 text-xl font-bold text-blue-700">
            {formatHoursMinutes(totalMinutes)}
          </p>
          <p className="text-xs text-blue-500">(점심 1시간 제외)</p>
        </div>
        <div className="flex-1 rounded-xl bg-green-50 px-4 py-3 text-center">
          <p className="text-xs text-green-600">출근 일수</p>
          <p className="mt-1 text-xl font-bold text-green-700">{daysWorked}일</p>
          <p className="text-xs text-green-500">이번 주</p>
        </div>
      </div>
    </div>
  );
}
