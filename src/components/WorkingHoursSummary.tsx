interface AttendanceRecord {
  clock_in: string | null;
  clock_out: string | null;
}

interface Props {
  records: AttendanceRecord[];
}

function calcWorkedMinutes(clock_in: string | null, clock_out: string | null): number {
  if (!clock_in || !clock_out) return 0;
  const inMs = new Date(clock_in).getTime();
  const outMs = new Date(clock_out).getTime();
  const diffMinutes = Math.floor((outMs - inMs) / 60000);
  // Subtract 1 hour (60 min) lunch break
  return Math.max(0, diffMinutes - 60);
}

function formatHoursMinutes(totalMinutes: number): string {
  if (totalMinutes === 0) return "0시간";
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (minutes === 0) return `${hours}시간`;
  return `${hours}시간 ${minutes}분`;
}

export default function WorkingHoursSummary({ records }: Props) {
  const totalMinutes = records.reduce(
    (acc, r) => acc + calcWorkedMinutes(r.clock_in, r.clock_out),
    0
  );

  const daysWorked = records.filter((r) => r.clock_in && r.clock_out).length;

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
