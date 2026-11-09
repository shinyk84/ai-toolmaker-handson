"use client";

import { useState } from "react";

type Cohort = { id: number; name: string; archived: boolean };

export default function LoginForm({ cohorts, adminDefault }: { cohorts: Cohort[]; adminDefault: boolean }) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [cohortId, setCohortId] = useState<string>(
    adminDefault || cohorts.length === 0 ? "admin" : String((cohorts.find((c) => !c.archived) ?? cohorts[0]).id),
  );
  const [f, setF] = useState({ username: adminDefault ? "admin" : "", password: "", joinCode: "", displayName: "", affiliation: "", password2: "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    if (mode === "signup" && f.password !== f.password2) return setErr("비밀번호 확인이 일치하지 않습니다.");
    setBusy(true);
    try {
      const res = await fetch(mode === "login" ? "/api/auth/login" : "/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cohortId: cohortId === "admin" ? "admin" : Number(cohortId),
          username: f.username,
          password: f.password,
          joinCode: f.joinCode,
          displayName: f.displayName,
          affiliation: f.affiliation,
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "요청에 실패했습니다.");
      location.href = j.redirect;
    } catch (e) {
      setErr((e as Error).message);
      setBusy(false);
    }
  };

  const isAdmin = cohortId === "admin";
  const closed = cohorts.find((c) => String(c.id) === cohortId)?.archived ?? false;
  const noSignup = isAdmin || closed;

  return (
    <form onSubmit={submit} className="card p-6 shadow-sm md:p-8">
      <h1 className="text-2xl font-black tracking-tight">{mode === "login" ? "로그인" : "기수 가입"}</h1>
      <p className="mt-1 text-sm text-ink-3">
        {mode === "login" ? "기수를 고르고 내 아이디로 로그인하세요." : "강사에게 받은 기수 입장 코드가 필요합니다."}
      </p>

      {!noSignup || mode === "login" ? (
        <div className="mt-6 flex rounded-xl bg-canvas p-1 text-sm font-semibold">
          {(["login", "signup"] as const).map((m) => (
            <button
              key={m}
              type="button"
              disabled={m === "signup" && noSignup}
              onClick={() => {
                setMode(m);
                setErr("");
              }}
              className={`flex-1 rounded-lg py-2 transition ${mode === m ? "bg-white shadow-sm" : "text-ink-3"} disabled:opacity-40`}
            >
              {m === "login" ? "로그인" : "처음이에요 (가입)"}
            </button>
          ))}
        </div>
      ) : null}

      <div className="mt-5 space-y-4">
        <div>
          <label className="label" htmlFor="cohort">
            기수
          </label>
          <select
            id="cohort"
            className="input"
            value={cohortId}
            onChange={(e) => {
              setCohortId(e.target.value);
              const c = cohorts.find((x) => String(x.id) === e.target.value);
              if (e.target.value === "admin" || c?.archived) setMode("login");
            }}
          >
            {cohorts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {c.archived ? " (종료)" : ""}
              </option>
            ))}
            <option value="admin">강사(관리자)</option>
          </select>
          {cohorts.length === 0 && <p className="mt-1.5 text-xs text-warn">아직 열린 기수가 없습니다. 강사 계정으로 로그인해 기수를 만들어 주세요.</p>}
        </div>

        {mode === "signup" && (
          <>
            <div>
              <label className="label" htmlFor="joinCode">
                기수 입장 코드
              </label>
              <input id="joinCode" className="input" value={f.joinCode} onChange={set("joinCode")} required autoComplete="off" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label" htmlFor="displayName">
                  이름
                </label>
                <input id="displayName" className="input" value={f.displayName} onChange={set("displayName")} required />
              </div>
              <div>
                <label className="label" htmlFor="affiliation">
                  소속 (선택)
                </label>
                <input id="affiliation" className="input" value={f.affiliation} onChange={set("affiliation")} placeholder="예: 편집1팀" />
              </div>
            </div>
          </>
        )}

        <div>
          <label className="label" htmlFor="username">
            아이디
          </label>
          <input
            id="username"
            className="input"
            value={f.username}
            onChange={set("username")}
            required
            autoComplete="username"
            placeholder={mode === "signup" ? "영문 소문자·숫자 3~20자" : ""}
            autoCapitalize="none"
          />
        </div>
        <div>
          <label className="label" htmlFor="password">
            비밀번호
          </label>
          <input
            id="password"
            type="password"
            className="input"
            value={f.password}
            onChange={set("password")}
            required
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            placeholder={mode === "signup" ? "6자 이상" : ""}
          />
        </div>
        {mode === "signup" && (
          <div>
            <label className="label" htmlFor="password2">
              비밀번호 확인
            </label>
            <input id="password2" type="password" className="input" value={f.password2} onChange={set("password2")} required autoComplete="new-password" />
          </div>
        )}
      </div>

      {err && <p className="mt-4 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{err}</p>}

      <button className="btn btn-primary mt-6 w-full py-3" disabled={busy}>
        {busy ? "확인 중…" : mode === "login" ? "로그인" : "가입하고 시작하기"}
      </button>
      {mode === "login" && !isAdmin && <p className="mt-4 text-center text-xs text-ink-3">비밀번호를 잊었다면 강사에게 초기화를 요청하세요.</p>}
    </form>
  );
}
