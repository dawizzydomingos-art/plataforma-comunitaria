
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ children, ...props }) => {
  return (
    <button
      {...props}
      className="bg-sky-500 text-white font-bold py-2 px-5 rounded-full hover:bg-sky-600 transition-colors duration-300 disabled:bg-sky-300 disabled:cursor-not-allowed flex items-center justify-center"
    >
      {children}
    </button>
  );
};
