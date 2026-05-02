import { useContext } from 'react';
import { AuthContext } from '../services/api';

const patients = [
  { name: 'Ava Chen', heartRate: 72, oxygen: 98, status: 'Stable' },
  { name: 'Noah Kim', heartRate: 88, oxygen: 95, status: 'Monitor' },
  { name: 'Mila Ross', heartRate: 65, oxygen: 99, status: 'Stable' },
];

export default function UserDashboard() {
  const { auth } = useContext(AuthContext);

  return (
    <main className="mx-auto flex min-h-[calc(100vh-88px)] max-w-7xl flex-col gap-10 px-5 py-12 text-slate-100">
      <section className="rounded-[2rem] border border-white/10 bg-slate-950/90 p-10 shadow-soft backdrop-blur-xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">User dashboard</p>
            <h1 className="mt-3 text-4xl font-semibold text-white">Good to see you, {auth?.email || 'Care Team'}</h1>
            <p className="mt-3 max-w-2xl text-slate-400">
              Monitor patient health metrics, trending vitals, and alerts from a modern clinical cockpit.
            </p>
          </div>
          <div className="rounded-full bg-slate-900 px-5 py-3 text-sm text-slate-200">
            Role: <span className="font-semibold text-white">User</span>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-[2rem] border border-white/10 bg-slate-900/90 p-8 shadow-soft">
          <p className="text-sm uppercase tracking-[0.35em] text-violet-300">Vitals snapshot</p>
          <div className="mt-8 space-y-4">
            <div className="rounded-3xl bg-slate-950 p-5">
              <p className="text-sm text-slate-400">Heart rate</p>
              <p className="mt-3 text-3xl font-semibold text-white">74 bpm</p>
            </div>
            <div className="rounded-3xl bg-slate-950 p-5">
              <p className="text-sm text-slate-400">Oxygen saturation</p>
              <p className="mt-3 text-3xl font-semibold text-white">97%</p>
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-slate-900/90 p-8 shadow-soft">
          <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">Alerts</p>
          <div className="mt-6 space-y-4">
            <div className="rounded-3xl bg-slate-950 p-5 text-slate-100">
              <p className="text-sm text-slate-400">Vital alert</p>
              <p className="mt-3 text-lg font-semibold">No urgent alerts</p>
              <p className="mt-2 text-slate-400">All patient devices are connected and stable.</p>
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-slate-900/90 p-8 shadow-soft">
          <p className="text-sm uppercase tracking-[0.35em] text-fuchsia-300">Trend report</p>
          <p className="mt-5 text-slate-400">
            Patient health remains consistent across the care group, with moderate monitoring required for one case.
          </p>
          <div className="mt-6 flex items-center gap-4 rounded-3xl border border-slate-800 bg-slate-950 p-5">
            <div className="h-12 w-12 rounded-2xl bg-violet-500/20" />
            <div>
              <p className="text-base font-semibold text-white">Stable incidence</p>
              <p className="text-sm text-slate-400">1 patient under observation</p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-slate-900/90 p-8 shadow-soft">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">Patient monitoring</p>
            <h2 className="mt-3 text-2xl font-semibold text-white">Live health board</h2>
          </div>
          <button className="rounded-full bg-violet-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-violet-400">
            Refresh data
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {patients.map((patient) => (
            <div key={patient.name} className="rounded-3xl bg-slate-950 p-6 shadow-inner">
              <h3 className="text-lg font-semibold text-white">{patient.name}</h3>
              <div className="mt-4 space-y-3 text-sm text-slate-300">
                <p>
                  <span className="font-semibold text-slate-100">Heart rate:</span> {patient.heartRate} bpm
                </p>
                <p>
                  <span className="font-semibold text-slate-100">Oxygen:</span> {patient.oxygen}%
                </p>
                <p>
                  <span className="font-semibold text-slate-100">Status:</span> {patient.status}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
