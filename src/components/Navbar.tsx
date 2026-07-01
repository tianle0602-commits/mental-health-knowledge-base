import { Link, useLocation } from 'react-router-dom';
import { Search, BookOpen, BookHeart, Home, Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const navLinks = [
    { path: '/', label: '首页', icon: Home },
    { path: '/knowledge', label: '知识库', icon: BookOpen },
    { path: '/search', label: '情绪罗盘', icon: Search },
    { path: '/diary', label: '心灵日记', icon: BookHeart },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-warm-200/40">
      <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="font-serif text-2xl font-bold text-ink-700 hover:text-sage-600 transition-colors tracking-wide">
          心镜
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.path);
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  active
                    ? 'bg-sage-500 text-white shadow-sm'
                    : 'text-ink-100 hover:text-ink-700 hover:bg-warm-50'
                }`}
              >
                <Icon size={16} />
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden p-2 rounded-full text-ink-100 hover:bg-warm-100 transition-colors"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="菜单"
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile nav dropdown */}
      {menuOpen && (
        <div className="md:hidden bg-white/95 backdrop-blur-md border-b border-warm-200/40 px-6 pb-4 pt-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.path);
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium mb-1 transition-all duration-200 ${
                  active
                    ? 'bg-sage-500 text-white'
                    : 'text-ink-100 hover:bg-warm-50 hover:text-ink-700'
                }`}
              >
                <Icon size={18} />
                {link.label}
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
}