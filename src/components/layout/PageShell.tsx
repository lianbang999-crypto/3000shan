import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PageShellProps {
  title: string;
  children: React.ReactNode;
  showBack?: boolean;
  rightAction?: React.ReactNode;
}

export default function PageShell({ title, children, showBack, rightAction }: PageShellProps) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex items-center justify-between h-12 px-4 bg-surface border-b border-border shrink-0">
        <div className="w-10">
          {showBack && (
            <button
              onClick={() => navigate(-1)}
              className="p-1 -ml-1 text-text-secondary hover:text-text transition-colors"
            >
              <ChevronLeft size={22} />
            </button>
          )}
        </div>
        <h1 className="text-base font-medium text-text">{title}</h1>
        <div className="w-10 flex justify-end">{rightAction}</div>
      </header>

      {/* Content */}
      <div className="page-content flex-1">{children}</div>
    </div>
  );
}
