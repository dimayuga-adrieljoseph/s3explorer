interface SpinnerProps {
    className?: string;
    label?: string;
    variant?: 'ring' | 'dots';
}

export function Spinner({ className = '', label = 'Loading', variant = 'ring' }: SpinnerProps) {
    if (variant === 'dots') {
        return (
            <span className={`premium-spinner ${className}`} role="status" aria-label={label}>
                <span className="premium-spinner-dot" />
                <span className="premium-spinner-dot" />
                <span className="premium-spinner-dot" />
                <span className="sr-only">{label}</span>
            </span>
        );
    }

    return (
        <svg
            className={`animate-spin ${className}`}
            viewBox="0 0 24 24"
            fill="none"
            role="status"
            aria-label={label}
        >
            <circle className="opacity-10" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path
                className="opacity-90"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                d="M12 2a10 10 0 0 1 10 10"
            />
        </svg>
    );
}
