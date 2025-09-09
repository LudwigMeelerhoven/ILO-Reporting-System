
import React from 'react';

interface CheckboxProps {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
  disabled?: boolean; // Added disabled prop
}

const Checkbox: React.FC<CheckboxProps> = ({ id, label, checked, onChange, className, disabled = false }) => {
  return (
    <div className={`flex items-center ${className}`}>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => !disabled && onChange(e.target.checked)} // Call onChange only if not disabled
        className={`h-4 w-4 text-[#0055A4] border-gray-300 rounded focus:ring-[#0055A4] ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
        disabled={disabled} // Apply HTML disabled attribute
      />
      <label 
        htmlFor={id} 
        className={`ml-2 block text-sm ${disabled ? 'text-gray-500' : 'text-gray-700'}`}
      >
        {label}
      </label>
    </div>
  );
};

export default Checkbox;