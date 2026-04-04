interface EmptyStateProps {
    icon: React.ElementType;
    title: string;
    description: string;
    action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
    return (
        <div
            className="flex flex-col items-center justify-center h-full py-16 text-center empty-state px-4"
            role="status"
            aria-label={title}
        >
            <div className="w-12 h-12 rounded-lg bg-background-tertiary flex items-center justify-center mb-3 empty-state-icon border border-border" aria-hidden="true">
                <Icon className="w-6 h-6 text-foreground-muted" />
            </div>
            <h3 className="text-sm font-medium mb-1">{title}</h3>
            <p className="text-xs text-foreground-muted max-w-[220px]">{description}</p>
            {action && <div className="flex justify-center w-full">{action}</div>}
        </div>
    );
}
