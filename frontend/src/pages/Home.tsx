import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-12 px-5 py-10 md:py-16">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 px-8 py-16 shadow-soft">
        <div className="absolute right-0 top-0 h-56 w-56 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="absolute left-0 top-20 h-40 w-40 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl space-y-6">
            <p className="text-sm uppercase tracking-[0.35em] text-violet-300">PulseMate</p>
            <h1 className="text-4xl font-semibold leading-tight text-white sm:text-5xl">
              Intelligent patient monitoring, ticket automation, and premium care insights.
            </h1>
            <p className="max-w-xl text-base leading-8 text-slate-300">
              Build trust across clinical teams with role-based dashboards, incident workflows, and a modern AI-led healthcare experience.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/signup"
                className="inline-flex rounded-full bg-violet-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-violet-400"
              >
                Get started
              </Link>
              <Link
                to="/login"
                className="inline-flex rounded-full border border-slate-700 bg-slate-950/80 px-6 py-3 text-sm font-semibold text-slate-100 transition hover:border-slate-500"
              >
                Login
              </Link>
            </div>
          </div>
          <div className="relative max-w-xl rounded-[2rem] border border-white/10 bg-slate-950/90 p-8 shadow-soft backdrop-blur-xl">
            <div className="mb-6 rounded-3xl border border-white/10 bg-slate-900/80 p-6">
              <p className="text-sm font-medium uppercase tracking-[0.3em] text-violet-300">Live feed</p>
              <h2 className="mt-4 text-2xl font-semibold text-white">Patient vitals in one place</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {['Heart rate', 'Oxygen', 'Temperature', 'Alerts'].map((item) => (
                <div key={item} className="rounded-3xl bg-slate-900/90 p-5 text-white shadow-xl">
                  <p className="text-sm text-slate-400">{item}</p>
                  <p className="mt-3 text-3xl font-semibold">{item === 'Alert' ? 'Stable' : item === 'Heart rate' ? '72 bpm' : item === 'Oxygen' ? '98%' : '36.7°C'}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-8 shadow-soft">
          <p className="text-sm uppercase tracking-[0.32em] text-violet-300">Analytics</p>
          <h2 className="mt-4 text-2xl font-semibold text-white">Actionable insights for every role.</h2>
          <p className="mt-3 text-slate-400">
            Admins see trend analytics and ticket activity. Users get patient health monitoring with instant clarity.
          </p>
        </div>
        <div className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-8 shadow-soft">
          <p className="text-sm uppercase tracking-[0.32em] text-cyan-300">Security</p>
          <h2 className="mt-4 text-2xl font-semibold text-white">Secure role-based experience.</h2>
          <p className="mt-3 text-slate-400">
            Login as User or Admin with modern authentication flows and a clean access boundary.
          </p>
        </div>
        <div className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-8 shadow-soft">
          <p className="text-sm uppercase tracking-[0.32em] text-fuchsia-300">Chatbot</p>
          <h2 className="mt-4 text-2xl font-semibold text-white">AI assistant always available.</h2>
          <p className="mt-3 text-slate-400">
            Use the floating chatbot to ask about tickets, workflows and patient status from any page.
          </p>
        </div>
      </section>
    </main>
  );
}
