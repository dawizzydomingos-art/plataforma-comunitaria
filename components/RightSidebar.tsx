
import React from 'react';

const TrendItem: React.FC<{ category: string, title: string, posts: string }> = ({ category, title, posts }) => (
    <div className="p-3 rounded-lg cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors duration-200">
        <p className="text-sm text-slate-500">{category}</p>
        <h3 className="font-bold">{title}</h3>
        <p className="text-sm text-slate-500">{posts} posts</p>
    </div>
);

const SuggestedFriend: React.FC<{ avatar: string, name: string, handle: string }> = ({ avatar, name, handle }) => (
    <div className="flex items-center justify-between p-3 rounded-lg cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors duration-200">
        <div className="flex items-center space-x-3">
            <img src={avatar} alt={name} className="w-10 h-10 rounded-full" />
            <div>
                <p className="font-bold text-sm">{name}</p>
                <p className="text-slate-500 dark:text-slate-400 text-sm">{handle}</p>
            </div>
        </div>
        <button className="bg-slate-900 dark:bg-white text-white dark:text-black font-bold text-sm py-1.5 px-4 rounded-full">Follow</button>
    </div>
);

export const RightSidebar: React.FC = () => {
    return (
        <aside className="hidden lg:block col-span-3 xl:col-span-4">
            <div className="sticky top-0 h-screen flex flex-col space-y-4 py-2 pl-4">
                <div className="relative">
                    <input type="text" placeholder="Search" className="w-full bg-slate-200 dark:bg-slate-800 rounded-full py-2.5 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-sky-500" />
                    <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>

                <div className="bg-slate-200/70 dark:bg-slate-800/70 rounded-xl p-1">
                    <h2 className="font-bold text-xl p-3">Trends for you</h2>
                    <TrendItem category="Tech · Trending" title="#GeminiAPI" posts="42.1K" />
                    <TrendItem category="Gaming · Trending" title="New Zelda Game" posts="120K" />
                    <TrendItem category="World News" title="Climate Summit" posts="25.5K" />
                </div>

                <div className="bg-slate-200/70 dark:bg-slate-800/70 rounded-xl p-1">
                    <h2 className="font-bold text-xl p-3">Who to follow</h2>
                    <SuggestedFriend avatar="https://picsum.photos/id/1005/200/200" name="Bob Johnson" handle="@bobjohnson" />
                    <SuggestedFriend avatar="https://picsum.photos/id/1027/200/200" name="Jane Smith" handle="@janesmith" />
                    <SuggestedFriend avatar="https://picsum.photos/id/305/200/200" name="Foodie Travels" handle="@foodie_travels" />
                </div>
            </div>
        </aside>
    );
};
