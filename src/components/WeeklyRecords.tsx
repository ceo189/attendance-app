interface AttendanceRecord {
  date: string;
  clock_in: string | null;
  clock_out: string | null;
}

function formatTime(iso: string | null) {
  if (!iso) return "-";
  return new Date(iso).toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
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
    <div className="overflow-hidden rounded-xl border border-gray-200">
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-gray-600">
              날짜
            </th>
            <th className="px-4 py-3 text-center font-medium text-gray-600">
              출근
            </th>
            <th className="px-4 py-3 text-center font-medium text-gray-600">
              퇴근
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {records.map((r) => (
            <tr key={r.date}>
              <td className="px-4 py-3 text-gray-900">{formatDate(r.date)}</td>
              <td className="px-4 py-3 text-center text-gray-700">
                {formatTime(r.clock_in)}
              </td>
              <td className="px-4 py-3 text-center text-gray-700">
                {formatTime(r.clock_out)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
