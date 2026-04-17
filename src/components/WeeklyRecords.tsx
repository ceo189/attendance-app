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

function calcWorkedMinutes(clock_in: string | null, clock_out: string | null): number {
  if (!clock_in || !clock_out) return 0;
  return Math.max(
    0,
    Math.floor((new Date(clock_out).getTime() - new Date(clock_in).getTime()) / 60000)
  );
}

function formatDuration(totalMinutes: number): string {
  if (totalMinutes === 0) return "-";
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
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

  // Group records by date, preserving descending date order
  const dateOrder: string[] = [];
  const byDate = new Map<string, AttendanceRecord[]>();
  for (const r of records) {
    if (!byDate.has(r.date)) {
      dateOrder.push(r.date);
      byDate.set(r.date, []);
    }
    byDate.get(r.date)!.push(r);
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
          {dateOrder.map((date) => {
            const sessions = byDate.get(date)!;
            // Total minutes for the day (no lunch deduction per session — handled in summary)
            const totalMinutes = sessions.reduce(
              (acc, s) => acc + calcWorkedMinutes(s.clock_in, s.clock_out),
              0
            );
            // Deduct 1 lunch hour once for the whole day if there are completed sessions
            const completedSessions = sessions.filter((s) => s.clock_in && s.clock_out);
            const dailyMinutes = completedSessions.length > 0
              ? Math.max(0, totalMinutes - 60)
              : totalMinutes;

            return sessions.map((session, idx) => (
              <tr key={`${date}-${idx}`} className={idx > 0 ? "bg-gray-50/50" : ""}>
                {idx === 0 ? (
                  <td
                    className="px-3 py-3 text-gray-900 align-top"
                    rowSpan={sessions.length}
                  >
                    {formatDate(date)}
                  </td>
                ) : null}
                <td className="px-3 py-3 text-center">
                  <div className="text-gray-700">{formatTime(session.clock_in)}</div>
                  <LocationBadge value={session.clock_in_location} />
                </td>
                <td className="px-3 py-3 text-center">
                  <div className="text-gray-700">{formatTime(session.clock_out)}</div>
                  <LocationBadge value={session.clock_out_location} />
                </td>
                {idx === 0 ? (
                  <td
                    className="px-3 py-3 text-center align-middle"
                    rowSpan={sessions.length}
                  >
                    <span className="font-medium text-gray-700">
                      {sessions.length > 1
                        ? formatDuration(dailyMinutes)
                        : formatDuration(Math.max(0, calcWorkedMinutes(session.clock_in, session.clock_out) - 60))}
                    </span>
                    {sessions.length > 1 && (
                      <span className="block text-xs text-gray-400">
                        {sessions.length}회 세션
                      </span>
                    )}
                  </td>
                ) : null}
              </tr>
            ));
          })}
        </tbody>
      </table>
    </div>
  );
}
