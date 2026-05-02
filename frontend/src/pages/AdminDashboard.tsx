import { useContext } from 'react';
import { AuthContext } from '../services/api';

const analytics = [
  { label: 'Total users', value: '184' },
  { label: 'Average login', value: '27 / day' },
  { label: 'Open tickets', value: '12' },
  { label: 'Resolved this week', value: '8' },
];

const tickets = [
  { id: '#PA-1031', status: 'Open', issue: 'Device disconnect', owner: 'Nurse Lea' },
  { id: '#PA-1079', status: 'In progress', issue: 'Vitals threshold alert', owner: 'Tech Sam' },
  { id: '#PA-1104', status: 'Resolved', issue: 'Patient monitor update', owner: 'Admin Priya' },
];

export default function AdminDashboard() {
  const { auth } = useContext(AuthContext);

  return (
    <main className="mx-auto flex min-h-[calc(100vh-88px)] max-w-7xl flex-col gap-10 px-5 py-12 text-slate-100">
      <section className="rounded-[2rem] border border-white/10 bg-slate-950/90 p-10 shadow-soft backdrop-blur-xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-violet-300">Admin dashboard</p>
            <h1 className="mt-3 text-4xl font-semibold text-white">Welcome back, {auth?.email || 'Admin'}</h1>
            <p className="mt-3 max-w-2xl text-slate-400">
              Review high-level analytics, ticket activity, and ensure operational health across the platform.
            </p>
          </div>
          <div className="rounded-full bg-slate-900 px-5 py-3 text-sm text-slate-200">
            Role: <span className="font-semibold text-white">Admin</span>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[2rem] border border-white/10 bg-slate-900/90 p-8 shadow-soft">
          <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">Analytics</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {analytics.map((metric) => (
              <div key={metric.label} className="rounded-3xl border border-slate-800 bg-slate-950 p-5 shadow-inner">
                <p className="text-sm text-slate-400">{metric.label}</p>
                <p className="mt-3 text-3xl font-semibold text-white">{metric.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-slate-900/90 p-8 shadow-soft">
          <p className="text-sm uppercase tracking-[0.35em] text-violet-300">Ticket overview</p>
          <div className="mt-6 space-y-4">
            {tickets.map((ticket) => (
              <div key={ticket.id} className="rounded-3xl border border-slate-800 bg-slate-950 p-5">
                <div className="flex items-center justify-between gap-3 text-sm text-slate-400">
                  <span>{ticket.id}</span>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    ticket.status === 'Resolved'
                      ? 'bg-emerald-500/15 text-emerald-200'
                      : ticket.status === 'Open'
                      ? 'bg-rose-500/15 text-rose-200'
                      : 'bg-amber-500/15 text-amber-200'
                  }`}>
                    {ticket.status}
                  </span>
                </div>
                <h2 className="mt-3 text-lg font-semibold text-white">{ticket.issue}</h2>
                <p className="mt-2 text-sm text-slate-400">Assigned to {ticket.owner}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
