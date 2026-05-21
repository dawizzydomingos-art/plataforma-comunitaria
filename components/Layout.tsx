
import React from 'react';
import { SidebarNav } from './SidebarNav';
import { RightSidebar } from './RightSidebar';
import type { User } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, user, onLogout }) => {
  return (
    <div className="min-h-screen text-slate-800 dark:text-slate-200">
      <div className="container mx-auto">
        <div className="grid grid-cols-12 gap-x-4">
          <SidebarNav user={user} onLogout={onLogout} />
          {children}
          <RightSidebar />
        </div>
      </div>
    </div>
  );
};
