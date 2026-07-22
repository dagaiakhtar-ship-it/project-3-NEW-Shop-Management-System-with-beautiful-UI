import React from 'react';
import { useFormContext } from 'react-hook-form';
import { AlertCircle } from 'lucide-react';

/**
 * Common Input Validation Rules for the Shop Management System
 */
export const VALIDATION_RULES = {
  required: (fieldName = 'Field') => ({
    required: `${fieldName} is required`,
  }),
  email: {
    pattern: {
      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
      message: 'Invalid email address',
    },
  },
  phone: {
    pattern: {
      value: /^[+]?[0-9\s-]{7,15}$/,
      message: 'Invalid phone number format (7-15 digits)',
    },
  },
  positiveNumber: {
    min: {
      value: 0.01,
      message: 'Value must be greater than zero',
    },
    valueAsNumber: true,
  },
  nonNegativeNumber: {
    min: {
      value: 0,
      message: 'Value cannot be negative',
    },
    valueAsNumber: true,
  },
  sku: {
    pattern: {
      value: /^[A-Z0-9-_]{3,20}$/i,
      message: 'SKU must be 3-20 alphanumeric characters, dashes, or underscores',
    },
  },
};

interface FormErrorProps {
  name: string;
}

/**
 * FormError Component
 * Displays input validation errors with a small warning icon and styled text.
 */
export const FormError: React.FC<FormErrorProps> = ({ name }) => {
  const { formState: { errors } } = useFormContext();
  const error = errors[name];

  if (!error) return null;

  return (
    <span className="flex items-center gap-1.5 mt-1 text-xs text-red-500 font-medium" id={`err-${name}`}>
      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
      {String(error.message || '')}
    </span>
  );
};

interface FormInputProps {
  name: string;
  label?: string;
  type?: string;
  placeholder?: string;
  validation?: Record<string, any>;
  disabled?: boolean;
  helperText?: string;
  [key: string]: any;
}

/**
 * Reusable FormInput Wrapper
 * Fully styled Tailwind text input field connected to React Hook Form context.
 */
export const FormInput: React.FC<FormInputProps> = ({
  name,
  label,
  type = 'text',
  placeholder = '',
  validation = {},
  disabled = false,
  helperText = '',
  ...props
}) => {
  const { register } = useFormContext();

  return (
    <div className="flex flex-col w-full mb-4">
      {label && (
        <label htmlFor={name} className="block mb-1.5 text-sm font-semibold text-slate-700 dark:text-slate-200">
          {label}
          {validation && (validation as any).required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        id={name}
        type={type}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg shadow-xs focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 dark:focus:border-indigo-500 outline-none transition disabled:bg-slate-50 dark:disabled:bg-slate-900 disabled:text-slate-400 disabled:cursor-not-allowed"
        {...register(name, validation)}
        {...props}
      />
      {helperText && !props.error && (
        <span className="mt-1 text-xs text-slate-500 dark:text-slate-400">{helperText}</span>
      )}
      <FormError name={name} />
    </div>
  );
};

interface FormSelectOption {
  value: string | number;
  label: string;
}

interface FormSelectProps {
  name: string;
  label?: string;
  options?: FormSelectOption[];
  placeholder?: string;
  validation?: Record<string, any>;
  disabled?: boolean;
  [key: string]: any;
}

/**
 * Reusable FormSelect Wrapper
 * Fully styled Tailwind dropdown field connected to React Hook Form context.
 */
export const FormSelect: React.FC<FormSelectProps> = ({
  name,
  label,
  options = [],
  placeholder = 'Select an option',
  validation = {},
  disabled = false,
  ...props
}) => {
  const { register } = useFormContext();

  return (
    <div className="flex flex-col w-full mb-4">
      {label && (
        <label htmlFor={name} className="block mb-1.5 text-sm font-semibold text-slate-700 dark:text-slate-200">
          {label}
          {validation && (validation as any).required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <select
        id={name}
        disabled={disabled}
        className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg shadow-xs focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 dark:focus:border-indigo-500 outline-none transition disabled:bg-slate-50 dark:disabled:bg-slate-900 disabled:text-slate-400 disabled:cursor-not-allowed appearance-none"
        {...register(name, validation)}
        {...props}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <FormError name={name} />
    </div>
  );
};
