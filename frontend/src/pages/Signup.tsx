import { FormEvent, useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext, signupApi } from '../services/api';

export default function Signup() {
  const { setAuth } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'user' | 'admin'>('user');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const navigate = useNavigate();

  const submitForm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      const user = await signupApi(email, password, role);
      setSuccess('Account created successfully. Redirecting...');
      setAuth({ token: '', email: user.email, role: user.role });
      setTimeout(() => {
        navigate('/login');
      }, 800);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed');
    }
  };

  return (
    <main className="mx-auto flex min-h-[calc(100vh-88px)] max-w-5xl flex-col gap-10 px-5 py-12 text-slate-100">
      <div className="rounded-[2rem] border border-white/10 bg-slate-950/90 p-10 shadow-soft backdrop-blur-xl">
        <div className="mb-8 text-center">
          <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">Create account</p>
          <h1 className="mt-3 text-4xl font-semibold text-white">Signup for PulseMate access</h1>
          <p className="mx-auto mt-4 max-w-2xl text-slate-400">
            Choose your role and sign up with secure credentials. The system supports both user and admin accounts.
          </p>
        </div>

        <form onSubmit={submitForm} className="grid gap-6">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-5">
            <p className="text-sm font-semibold text-slate-200">Account type</p>
            <div className="mt-4 flex flex-wrap gap-3">
              {(['user', 'admin'] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setRole(option)}
                  className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                    role === option
                      ? 'bg-cyan-500 text-slate-950 shadow-soft'
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
              Email address
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                className="rounded-3xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400"
              />
            </label>
            <label className="grid gap-2 text-sm text-slate-200">
              Password
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                className="rounded-3xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400"
              />
            </label>
          </div>

          {error && <p className="rounded-2xl bg-red-500/20 px-4 py-3 text-sm text-red-200">{error}</p>}
          {success && <p className="rounded-2xl bg-emerald-500/20 px-4 py-3 text-sm text-emerald-200">{success}</p>}

          <button
            type="submit"
            className="inline-flex justify-center rounded-full bg-cyan-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
          >
            Create account
          </button>
        </form>
      </div>
    </main>
  );
}
