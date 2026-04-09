"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Mode = "login" | "signup" | "reset";

export default function LoginForm() {
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [team, setTeam] = useState("");
  const [title, setTitle] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  function switchMode(newMode: Mode) {
    setMode(newMode);
    setError("");
    setSuccess("");
    setPassword("");
    setName("");
    setTeam("");
    setTitle("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (mode === "reset") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/reset`,
        });
        if (error) {
          setError(error.message);
        } else {
          setSuccess(
            "비밀번호 재설정 링크를 이메일로 보냈습니다. 메일함을 확인해주세요."
          );
        }
      } else if (mode === "signup") {
        if (!name.trim()) {
          setError("이름을 입력해주세요.");
          setLoading(false);
          return;
        }
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name.trim(), team: team.trim(), title: title.trim() },
          },
        });
        if (signUpError) {
          setError(signUpError.message);
          setLoading(false);
          return;
        }
        const { error: loginError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (loginError) {
          setSuccess("가입 완료! 로그인해주세요.");
          switchMode("login");
          setEmail(email);
        } else {
          window.location.href = "/dashboard";
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          if (error.message === "Email not confirmed") {
            setError("이메일 인증이 필요합니다. 관리자에게 문의하세요.");
          } else if (error.message === "Invalid login credentials") {
            setError("이메일 또는 비밀번호가 올바르지 않습니다.");
          } else {
            setError(error.message);
          }
        } else {
          window.location.href = "/dashboard";
          return;
        }
      }
    } catch (err) {
      setError(`오류가 발생했습니다: ${String(err)}`);
    }

    setLoading(false);
  }

  const titles: Record<Mode, string> = {
    login: "회사 이메일로 로그인하세요",
    signup: "회사 이메일로 가입하세요",
    reset: "비밀번호 재설정",
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-gray-50 px-4 pb-8">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg sm:p-8">
        <h1 className="mb-2 text-center text-xl font-bold text-gray-900 sm:text-2xl">
          근태관리 시스템
        </h1>
        <p className="mb-6 text-center text-sm text-gray-500 sm:mb-8">
          {titles[mode]}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <>
              <div>
                <label
                  htmlFor="name"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  이름
                </label>
                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="홍길동"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label
                    htmlFor="team"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    팀 <span className="font-normal text-gray-400">(선택)</span>
                  </label>
                  <select
                    id="team"
                    value={team}
                    onChange={(e) => setTeam(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="">선택</option>
                    <option value="MD">MD</option>
                    <option value="마케팅">마케팅</option>
                    <option value="경영지원">경영지원</option>
                    <option value="기획/전략">기획/전략</option>
                    <option value="콘텐츠">콘텐츠</option>
                    <option value="디자인">디자인</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label
                    htmlFor="title"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    직책 <span className="font-normal text-gray-400">(선택)</span>
                  </label>
                  <select
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="">선택</option>
                    <option value="담당">담당</option>
                    <option value="매니저">매니저</option>
                    <option value="책임">책임</option>
                    <option value="실장">실장</option>
                    <option value="이사">이사</option>
                    <option value="상무">상무</option>
                    <option value="대표이사">대표이사</option>
                  </select>
                </div>
              </div>
            </>
          )}

          <div>
            <label
              htmlFor="email"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              이메일
            </label>
            <input
              id="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {mode !== "reset" && (
            <div>
              <label
                htmlFor="password"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                비밀번호
              </label>
              <input
                id="password"
                type="password"
                autoComplete={
                  mode === "signup" ? "new-password" : "current-password"
                }
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="6자 이상"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          )}

          {mode === "signup" && (
            <div className="rounded-lg bg-gray-50 p-3 text-xs leading-relaxed text-gray-600">
              가입 시 아래 사항에 동의하게 됩니다:
              <ul className="mt-1 ml-3 list-disc space-y-0.5">
                <li>
                  출퇴근 기록 및 근무시간 관리를 위한 개인정보(이름, 이메일)
                  수집 및 이용
                </li>
                <li>
                  위치정보(GPS) 수집 및 이용 (출퇴근 증빙 목적, 별도 동의)
                </li>
                <li>근태 데이터의 회사 내 관리자 제공 (3자 제공)</li>
              </ul>
            </div>
          )}

          {error && (
            <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {error}
            </p>
          )}

          {success && (
            <p className="rounded-lg bg-green-50 p-3 text-sm text-green-600">
              {success}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 py-3.5 text-base font-semibold text-white transition active:scale-[0.98] hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "처리 중..."
              : mode === "signup"
                ? "가입하기"
                : mode === "reset"
                  ? "재설정 링크 보내기"
                  : "로그인"}
          </button>
        </form>

        <div className="mt-4 space-y-2 text-center text-sm">
          {mode === "login" && (
            <>
              <button
                onClick={() => switchMode("reset")}
                className="w-full py-1 text-gray-500 hover:underline"
              >
                비밀번호를 잊으셨나요?
              </button>
              <button
                onClick={() => switchMode("signup")}
                className="w-full py-1 text-blue-600 hover:underline"
              >
                계정이 없으신가요? 가입하기
              </button>
            </>
          )}
          {mode === "signup" && (
            <button
              onClick={() => switchMode("login")}
              className="w-full py-1 text-blue-600 hover:underline"
            >
              이미 계정이 있으신가요? 로그인
            </button>
          )}
          {mode === "reset" && (
            <button
              onClick={() => switchMode("login")}
              className="w-full py-1 text-blue-600 hover:underline"
            >
              로그인으로 돌아가기
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
