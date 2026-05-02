import { FormEvent, useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext, fetchProtected, loginApi } from '../services/api';

export default function Login() {
  const { setAuth } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'user' | 'admin'>('user');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const submitForm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    try {
      const data = await loginApi(email, password);
      const profile = await fetchProtected<{ role: 'user' | 'admin'; email: string }>('/auth/me', data.access_token);
      setAuth({ token: data.access_token, email: profile.email, role: profile.role });
      navigate(profile.role === 'admin' ? '/admin' : '/user');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to login');
    }
  };

  return (
    <main className="mx-auto flex min-h-[calc(100vh-88px)] max-w-5xl flex-col gap-10 px-5 py-12 text-slate-100">
      <div className="rounded-[2rem] border border-white/10 bg-slate-950/90 p-10 shadow-soft backdrop-blur-xl">
        <div className="mb-8 flex flex-col gap-2 text-center">
          <p className="text-sm uppercase tracking-[0.35em] text-violet-300">Welcome back</p>
          <h1 className="text-4xl font-semibold text-white">Login to your PulseMate account</h1>
          <p className="max-w-2xl mx-auto text-slate-400">Choose the correct role and enter your credentials to access your dashboard.</p>
        </div>

        <form onSubmit={submitForm} className="grid gap-6">
          <div className="flex flex-col gap-3 rounded-3xl border border-slate-800 bg-slate-900/90 p-5">
            <p className="text-sm font-semibold text-slate-200">Login as</p>
            <div className="flex flex-wrap gap-3">
              {(['user', 'admin'] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setRole(option)}
                  className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                    role === option
                      ? 'bg-violet-500 text-white shadow-soft'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {option === 'admin' ? 'Admin' : 'User'}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4">
            <label className="grid gap-2 text-sm text-slate-200">
              Email
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                className="rounded-3xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition focus:border-violet-400"
              />
            </label>
            <label className="grid gap-2 text-sm text-slate-200">
              Password
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                className="rounded-3xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition focus:border-violet-400"
              />
            </label>
          </div>

          {error && <p className="rounded-2xl bg-red-500/20 px-4 py-3 text-sm text-red-200">{error}</p>}

          <button
            type="submit"
            className="inline-flex justify-center rounded-full bg-violet-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-violet-400"
          >
            Sign in as {role === 'admin' ? 'Admin' : 'User'}
          </button>
        </form>
      </div>
    </main>
  );
}
