import { NavLink } from 'react-router-dom';
import { Home, ClipboardCheck, BarChart3, User } from 'lucide-react';

const tabs = [
  { path: '/', icon: Home, label: '首页' },
  { path: '/record', icon: ClipboardCheck, label: '记录' },
  { path: '/stats', icon: BarChart3, label: '统计' },
  { path: '/profile', icon: User, label: '我的' },
];

export default function TabBar() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-surface/95 backdrop-blur-sm border-t border-border z-50"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex justify-around items-center h-14 max-w-lg mx-auto">
        {tabs.map((tab) => (
          <NavLink
            key={tab.path}
            to={tab.path}
            end={tab.path === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 w-16 py-1 transition-colors duration-200 relative ${
                isActive ? 'text-tab-active' : 'text-tab-inactive'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute -top-px left-1/2 -translate-x-1/2 w-5 h-0.5 bg-accent rounded-full" />
                )}
                <tab.icon size={22} strokeWidth={isActive ? 2.2 : 1.8} />
                <span className={`text-[10px] leading-tight ${isActive ? 'font-medium' : ''}`}>
                  {tab.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
