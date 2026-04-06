"use client";

import { useState } from "react";

const LEAVE_TYPE_LABELS: Record<string, string> = {
  annual: "연차",
  sick: "병가",
  personal: "개인사유",
  other: "기타",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "검토중",
  approved: "승인",
  rejected: "반려",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

export interface LeaveRequest {
  id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string | null;
  status: string;
  created_at: string;
}

interface Props {
  requests: LeaveRequest[];
}

export default function LeaveList({ requests }: Props) {
  const [expanded, setExpanded] = useState(false);

  const visible = expanded ? requests : requests.slice(0, 3);

  if (requests.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-gray-400">
        휴가 신청 내역이 없습니다.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {visible.map((req) => (
        <div
          key={req.id}
          className="flex items-start justify-between rounded-xl border border-gray-200 bg-white px-4 py-3"
        >
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-gray-900">
                {LEAVE_TYPE_LABELS[req.leave_type] ?? req.leave_type}
              </span>
              <span className="text-xs text-gray-500">
                {req.start_date === req.end_date
                  ? req.start_date
                  : `${req.start_date} ~ ${req.end_date}`}
              </span>
            </div>
            {req.reason && (
              <p className="mt-0.5 truncate text-xs text-gray-500">
                {req.reason}
              </p>
            )}
          </div>
          <span
            className={`ml-3 shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[req.status] ?? STATUS_COLORS.pending}`}
          >
            {STATUS_LABELS[req.status] ?? req.status}
          </span>
        </div>
      ))}

      {requests.length > 3 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full py-2 text-xs font-medium text-blue-600 hover:text-blue-700"
        >
          {expanded ? "접기" : `더 보기 (${requests.length - 3}건)`}
        </button>
      )}
    </div>
  );
}
