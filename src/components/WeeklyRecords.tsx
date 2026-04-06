const LOCATION_LABELS: Record<string, string> = {
  office: "사무실",
  outside: "외부",
  remote: "재택",
};

interface AttendanceRecord {
  date: string;
  clock_in: string | null;
  clock_out: string | null;
  clock_in_location: string | null;
  clock_out_location: string | null;
}

function formatTime(iso: string | null) {
  if (!iso) return "-";
  return new Date(iso).toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Seoul",
  });
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("ko-KR", {
    month: "short",
    day: "numeric",
    weekday: "short",
  });
}

function calcWorkedHours(clock_in: string | null, clock_out: string | null): string {
  if (!clock_in || !clock_out) return "-";
  const diffMinutes = Math.floor(
    (new Date(clock_out).getTime() - new Date(clock_in).getTime()) / 60000
  );
  const worked = Math.max(0, diffMinutes - 60);
  if (worked === 0) return "0h";
  const h = Math.floor(worked / 60);
  const m = worked % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

function LocationBadge({ value }: { value: string | null }) {
  if (!value) return <span className="text-gray-400">-</span>;
  return (
    <span className="inline-block rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
      {LOCATION_LABELS[value] ?? value}
    </span>
  );
}

export default function WeeklyRecords({
  records,
}: {
  records: AttendanceRecord[];
}) {
  if (records.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-gray-400">
        이번 주 출퇴근 기록이 없습니다.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200">
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-3 py-3 text-left font-medium text-gray-600">
              날짜
            </th>
            <th className="px-3 py-3 text-center font-medium text-gray-600">
              출근
            </th>
            <th className="px-3 py-3 text-center font-medium text-gray-600">
              퇴근
            </th>
            <th className="px-3 py-3 text-center font-medium text-gray-600">
              근무시간
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {records.map((r) => (
            <tr key={r.date}>
              <td className="px-3 py-3 text-gray-900">{formatDate(r.date)}</td>
              <td className="px-3 py-3 text-center">
                <div className="text-gray-700">{formatTime(r.clock_in)}</div>
                <LocationBadge value={r.clock_in_location} />
              </td>
              <td className="px-3 py-3 text-center">
                <div className="text-gray-700">{formatTime(r.clock_out)}</div>
                <LocationBadge value={r.clock_out_location} />
              </td>
              <td className="px-3 py-3 text-center">
                <span className="font-medium text-gray-700">
                  {calcWorkedHours(r.clock_in, r.clock_out)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
