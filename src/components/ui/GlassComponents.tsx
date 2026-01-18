'use client';

import { ReactNode, CSSProperties } from 'react';

interface GlassCardProps {
    children: ReactNode;
    className?: string;
    hover?: boolean;
    padding?: 'none' | 'sm' | 'md' | 'lg';
    style?: CSSProperties;
}

export function GlassCard({
    children,
    className = '',
    hover = true,
    padding = 'md',
    style
}: GlassCardProps) {
    const paddingClasses = {
        none: '',
        sm: 'p-3',
        md: 'p-4 md:p-6',
        lg: 'p-6 md:p-8',
    };

    return (
        <div
            className={`
                glass 
                ${paddingClasses[padding]}
                ${hover ? 'transition-all duration-300 hover:translate-y-[-4px] hover:shadow-xl' : ''}
                ${className}
            `}
            style={style}
        >
            {children}
        </div>
    );
}

interface GlassButtonProps {
    children: ReactNode;
    onClick?: () => void;
    variant?: 'default' | 'primary' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    disabled?: boolean;
    className?: string;
    type?: 'button' | 'submit' | 'reset';
    'aria-label'?: string;
}

export function GlassButton({
    children,
    onClick,
    variant = 'default',
    size = 'md',
    disabled = false,
    className = '',
    type = 'button',
    'aria-label': ariaLabel,
}: GlassButtonProps) {
    const sizeClasses = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2',
        lg: 'px-6 py-3 text-lg',
    };

    const variantClasses = {
        default: 'glass-button',
        primary: 'glass-button-primary',
        ghost: 'bg-transparent hover:bg-white/10 border-transparent hover:border-white/20',
    };

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            aria-label={ariaLabel}
            className={`
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none
        ${className}
      `}
        >
            {children}
        </button>
    );
}

interface GlassInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    type?: 'text' | 'number' | 'email' | 'search';
    className?: string;
    disabled?: boolean;
    required?: boolean;
    'aria-label'?: string;
}

export function GlassInput({
    value,
    onChange,
    placeholder,
    type = 'text',
    className = '',
    disabled = false,
    required = false,
    'aria-label': ariaLabel,
}: GlassInputProps) {
    return (
        <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            aria-label={ariaLabel}
            className={`glass-input ${className}`}
        />
    );
}

interface GlassSelectProps {
    value: string;
    onChange: (value: string) => void;
    options: { value: string; label: string }[];
    placeholder?: string;
    className?: string;
    disabled?: boolean;
    'aria-label'?: string;
}

export function GlassSelect({
    value,
    onChange,
    options,
    placeholder,
    className = '',
    disabled = false,
    'aria-label': ariaLabel,
}: GlassSelectProps) {
    return (
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            aria-label={ariaLabel}
            className={`glass-select ${className}`}
        >
            {placeholder && (
                <option value="" disabled>
                    {placeholder}
                </option>
            )}
            {options.map((option) => (
                <option key={option.value} value={option.value}>
                    {option.label}
                </option>
            ))}
        </select>
    );
}

interface BadgeProps {
    children: ReactNode;
    variant?: 'success' | 'warning' | 'error' | 'info';
    className?: string;
}

export function Badge({ children, variant = 'info', className = '' }: BadgeProps) {
    const variantClasses = {
        success: 'badge-success',
        warning: 'badge-warning',
        error: 'badge-error',
        info: 'badge-info',
    };

    return (
        <span className={`badge ${variantClasses[variant]} ${className}`}>
            {children}
        </span>
    );
}
