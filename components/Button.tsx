
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', fullWidth = false, className, ...props }) => {
  const baseStyle = "px-4 py-2 rounded-md font-semibold focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-colors duration-150 ease-in-out";
  const variantStyles = {
    primary: `bg-[#0055A4] text-white hover:bg-[#004488] focus:ring-[#0055A4]`,
    secondary: `bg-gray-200 text-gray-700 hover:bg-gray-300 focus:ring-gray-400`,
    danger: `bg-red-500 text-white hover:bg-red-600 focus:ring-red-500`,
  };
  const widthStyle = fullWidth ? "w-full" : "";

  return (
    <button
      className={`${baseStyle} ${variantStyles[variant]} ${widthStyle} ${className || ''} ${props.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
