import { useEffect, useRef } from 'react';

interface ContextMenuProps {
    x: number;
    y: number;
    onClose: () => void;
    children: React.ReactNode;
}

export function ContextMenu({ x, y, onClose, children }: ContextMenuProps) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                onClose();
            }
        };
        window.addEventListener('mousedown', handleClick);
        return () => window.removeEventListener('mousedown', handleClick);
    }, [onClose]);

    const adjustedX = Math.min(x, window.innerWidth - 180);
    const adjustedY = Math.min(y, window.innerHeight - 160);

    return (
        <div
            ref={ref}
            className="fixed z-50 card py-1 min-w-[150px] context-menu"
            style={{ left: adjustedX, top: adjustedY }}
            role="menu"
            aria-label="Context menu"
        >
            {children}
        </div>
    );
}

interface ContextMenuItemProps {
    icon: React.ElementType;
    label: string;
    onClick: () => void;
    danger?: boolean;
}

export function ContextMenuItem({ icon: Icon, label, onClick, danger = false }: ContextMenuItemProps) {
    const colorClasses = danger
        ? 'text-accent-red hover:bg-accent-red/15'
        : 'text-foreground-secondary hover:bg-background-hover hover:text-foreground';

    return (
        <button
            onClick={onClick}
            className={`context-menu-item w-full flex items-center gap-2.5 px-3 py-1.5 text-[13px] ${colorClasses}`}
            role="menuitem"
        >
            <Icon className="w-4 h-4" aria-hidden="true" />
            {label}
        </button>
    );
}
