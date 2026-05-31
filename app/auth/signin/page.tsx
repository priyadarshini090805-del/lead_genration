"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function SignInPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    if (mode === "signup") {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); setLoading(false); return; }
      setMode("signin");
      setLoading(false);
      setError("Account created! Sign in below.");
      return;
    }
    const result = await signIn("credentials", { email, password, redirect: false });
    if (result?.error) { setError("Invalid email or password"); setLoading(false); return; }
    router.push("/dashboard");
  }

  async function handleOAuth(provider: "google" | "linkedin") {
    setOauthLoading(provider);
    await signIn(provider, { callbackUrl: "/dashboard" });
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <span className="text-black font-bold text-sm">H</span>
            </div>
            <span className="text-white font-semibold text-xl tracking-tight">Hanexis</span>
          </div>
          <p className="text-neutral-500 text-sm">AI-driven lead generation platform</p>
        </div>

        <div className="card">
          {/* Tab toggle */}
          <div className="flex bg-neutral-800 rounded-lg p-1 mb-6">
            {(["signin","signup"] as const).map(m => (
              <button key={m} onClick={() => setMode(m)}
                className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-all ${mode === m ? "bg-white text-black" : "text-neutral-400 hover:text-white"}`}>
                {m === "signin" ? "Sign In" : "Create Account"}
              </button>
            ))}
          </div>

          {/* OAuth */}
          <div className="space-y-2 mb-5">
            <button onClick={() => handleOAuth("google")} disabled={!!oauthLoading}
              className="w-full flex items-center justify-center gap-3 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-white rounded-lg py-2.5 text-sm font-medium transition-all disabled:opacity-50">
              {oauthLoading === "google" ? <Spinner /> : <GoogleIcon />}
              Continue with Google
            </button>
            <button onClick={() => handleOAuth("linkedin")} disabled={!!oauthLoading}
              className="w-full flex items-center justify-center gap-3 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-white rounded-lg py-2.5 text-sm font-medium transition-all disabled:opacity-50">
              {oauthLoading === "linkedin" ? <Spinner /> : <LinkedInIcon />}
              Continue with LinkedIn
            </button>
          </div>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-neutral-800" />
            <span className="text-neutral-600 text-xs">or</span>
            <div className="flex-1 h-px bg-neutral-800" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === "signup" && (
              <input className="input" placeholder="Full name" value={name} onChange={e => setName(e.target.value)} />
            )}
            <input className="input" type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} required />
            <input className="input" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
            {error && (
              <p className={`text-xs px-3 py-2 rounded-lg ${error.includes("created") ? "bg-white/5 text-green-400" : "bg-red-500/10 text-red-400"}`}>{error}</p>
            )}
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center flex">
              {loading ? <Spinner /> : mode === "signin" ? "Sign In" : "Create Account"}
            </button>
          </form>
        </div>

        <p className="text-center text-neutral-600 text-xs mt-4">
          By continuing, you agree to Hanexis Terms of Service
        </p>
      </div>
    </div>
  );
}

function Spinner() {
  return <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />;
}

function GoogleIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24">
      <path fill="#EA4335" d="M5.26620003,9.76452941 C6.19878754,6.93863203 8.85444915,4.90909091 12,4.90909091 C13.6545455,4.90909091 15.1581818,5.47272727 16.3490909,6.40363636 L19.8181818,2.93454545 C17.7890909,1.11636364 15.0527273,0 12,0 C7.27006974,0 3.1977497,2.69829785 1.23999023,6.65002441 L5.26620003,9.76452941 Z"/>
      <path fill="#34A853" d="M16.0407269,18.0125889 C14.9509167,18.7163016 13.5660892,19.0909091 12,19.0909091 C8.86648613,19.0909091 6.21911939,17.076871 5.27698177,14.2678769 L1.23746264,17.3349879 C3.19279051,21.2936293 7.26500293,24 12,24 C14.9328362,24 17.7353462,22.9573905 19.834192,20.9995801 L16.0407269,18.0125889 Z"/>
      <path fill="#4A90E2" d="M19.834192,20.9995801 C22.0291676,18.9520994 23.4545455,15.903663 23.4545455,12 C23.4545455,11.2909091 23.3454545,10.5272727 23.1818182,9.81818182 L12,9.81818182 L12,14.4545455 L18.4363636,14.4545455 C18.1187732,16.013626 17.2662994,17.2212117 16.0407269,18.0125889 L19.834192,20.9995801 Z"/>
      <path fill="#FBBC05" d="M5.27698177,14.2678769 C5.03832634,13.556323 4.90909091,12.7937589 4.90909091,12 C4.90909091,11.2182781 5.03443647,10.4668121 5.26620003,9.76452941 L1.23999023,6.65002441 C0.43658717,8.26043162 0,10.0753848 0,12 C0,13.9195484 0.444780743,15.7301709 1.23746264,17.3349879 L5.27698177,14.2678769 Z"/>
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  );
}
