
import React from 'react';
import { HomeIcon, HashIcon, BellIcon, MailIcon, BookmarkIcon, UserIcon, LogoutIcon, SparklesIcon } from './Icons';
import type { User } from '../types';

interface SidebarNavProps {
    user: User;
    onLogout: () => void;
}

const NavItem: React.FC<{ icon: React.ReactNode; label: string; active?: boolean; onClick?: (e: React.MouseEvent) => void }> = ({ icon, label, active, onClick }) => (
    <a href="#" onClick={onClick} className={`flex items-center space-x-4 p-3 rounded-full transition-colors duration-200 hover:bg-sky-100 dark:hover:bg-sky-900/50 ${active ? 'font-bold text-sky-500' : ''}`}>
        {icon}
        <span className="text-xl hidden xl:inline">{label}</span>
    </a>
);

export const SidebarNav: React.FC<SidebarNavProps> = ({ user, onLogout }) => {
    
    const handleNavClick = (e: React.MouseEvent) => {
        e.preventDefault();
        // Placeholder for navigation logic
    };

    return (
        <header className="hidden md:block col-span-1 xl:col-span-3">
            <div className="sticky top-0 h-screen flex flex-col justify-between py-2 pr-4">
                <div className="flex flex-col space-y-2">
                    <div className="p-3">
                        <SparklesIcon className="w-8 h-8 text-sky-500" />
                    </div>
                    <nav>
                        <NavItem icon={<HomeIcon className="w-7 h-7" />} label="Home" active onClick={handleNavClick} />
                        <NavItem icon={<HashIcon className="w-7 h-7" />} label="Explore" onClick={handleNavClick} />
                        <NavItem icon={<BellIcon className="w-7 h-7" />} label="Notifications" onClick={handleNavClick} />
                        <NavItem icon={<MailIcon className="w-7 h-7" />} label="Messages" onClick={handleNavClick} />
                        <NavItem icon={<BookmarkIcon className="w-7 h-7" />} label="Bookmarks" onClick={handleNavClick} />
                        <NavItem icon={<UserIcon className="w-7 h-7" />} label="Profile" onClick={handleNavClick} />
                        <NavItem icon={<LogoutIcon className="w-7 h-7" />} label="Logout" onClick={(e) => { e.preventDefault(); onLogout(); }} />
                    </nav>
                    <button className="mt-4 w-full xl:w-56 bg-sky-500 text-white font-bold py-3 px-6 rounded-full text-lg hover:bg-sky-600 transition-colors duration-300">
                        <span className="hidden xl:inline">Post</span>
                        <span className="inline xl:hidden">+</span>
                    </button>
                </div>

                <div className="flex items-center space-x-3 p-3 rounded-full cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800">
                    <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full" />
                    <div className="hidden xl:inline">
                        <p className="font-bold text-sm">{user.name}</p>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">{user.handle}</p>
                    </div>
                </div>
            </div>
        </header>
    );
};
