"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (isSignUp) {
        if (!name.trim()) {
          setError("이름을 입력해주세요.");
          setLoading(false);
          return;
        }
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name.trim() },
          },
        });
        if (signUpError) {
          setError(signUpError.message);
          setLoading(false);
          return;
        }
        // Auto-login after signup
        const { error: loginError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (loginError) {
          setSuccess("가입 완료! 로그인해주세요.");
          setIsSignUp(false);
          setName("");
          setPassword("");
        } else {
          router.push("/dashboard");
          router.refresh();
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
          router.push("/dashboard");
          router.refresh();
          return;
        }
      }
    } catch (err) {
      setError(`오류가 발생했습니다: ${String(err)}`);
    }

    setLoading(false);
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-gray-50 px-4 pb-8">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg sm:p-8">
        <h1 className="mb-2 text-center text-xl font-bold text-gray-900 sm:text-2xl">
          근태관리 시스템
        </h1>
        <p className="mb-6 text-center text-sm text-gray-500 sm:mb-8">
          {isSignUp ? "회사 이메일로 가입하세요" : "회사 이메일로 로그인하세요"}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
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
              autoComplete={isSignUp ? "new-password" : "current-password"}
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="6자 이상"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {isSignUp && (
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
            {loading ? "처리 중..." : isSignUp ? "가입하기" : "로그인"}
          </button>
        </form>

        <button
          onClick={() => {
            setIsSignUp(!isSignUp);
            setError("");
            setSuccess("");
          }}
          className="mt-4 w-full py-2 text-center text-sm text-blue-600 hover:underline"
        >
          {isSignUp
            ? "이미 계정이 있으신가요? 로그인"
            : "계정이 없으신가요? 가입하기"}
        </button>
      </div>
    </div>
  );
}
