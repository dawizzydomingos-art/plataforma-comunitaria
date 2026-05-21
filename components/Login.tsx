
import React from 'react';
import { SparklesIcon } from './Icons';
import { Button } from './ui/Button';

interface LoginProps {
  onLogin: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <SparklesIcon className="w-16 h-16 text-sky-500 mx-auto" />
          <h1 className="text-4xl font-bold mt-4">Welcome to Gemini Social</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">Sign in to connect with your friends.</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  defaultValue="user@example.com"
                  className="appearance-none block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm bg-slate-50 dark:bg-slate-700"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password"className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  defaultValue="password"
                  className="appearance-none block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm bg-slate-50 dark:bg-slate-700"
                />
              </div>
            </div>

            <div>
                <Button type="submit" className="w-full !py-3 !text-base">
                    Log In
                </Button>
            </div>
          </form>
        </div>
        <p className="text-center text-xs text-slate-500 mt-6">
            Note: This is a demo. Any email and password will work.
        </p>
      </div>
    </div>
  );
};
