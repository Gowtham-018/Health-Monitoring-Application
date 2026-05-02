import { Link, useLocation } from 'react-router-dom';

const navItems = [
  { label: 'Home', path: '/' },
  { label: 'Login', path: '/login' },
  { label: 'Signup', path: '/signup' },
];

export default function Navbar() {
  const location = useLocation();

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-5 py-4 text-slate-100">
        <div>
          <Link to="/" className="text-2xl font-semibold tracking-tight text-white">
            PulseMate
          </Link>
          <p className="text-sm text-slate-400">AI-driven care monitoring & ticket workflow</p>
        </div>
        <nav className="flex items-center gap-3">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`rounded-full px-4 py-2 text-sm transition ${
                location.pathname === item.path
                  ? 'bg-slate-100 text-slate-950'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
