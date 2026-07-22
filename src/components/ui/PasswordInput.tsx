import React, { forwardRef, useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';
import Input, { InputProps } from './Input';

export interface PasswordInputProps extends Omit<InputProps, 'type'> {
  showIconToggle?: boolean;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ showIconToggle = true, className = '', ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    const toggleShowPassword = () => {
      setShowPassword((prev) => !prev);
    };

    return (
      <Input
        ref={ref}
        type={showPassword ? 'text' : 'password'}
        leftIcon={<Lock className="h-4 w-4" />}
        rightIcon={
          showIconToggle ? (
            <button
              type="button"
              onClick={toggleShowPassword}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 focus:outline-none transition-colors cursor-pointer"
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          ) : undefined
        }
        className={className}
        {...props}
      />
    );
  }
);

PasswordInput.displayName = 'PasswordInput';
export default PasswordInput;
