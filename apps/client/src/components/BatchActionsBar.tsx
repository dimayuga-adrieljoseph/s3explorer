import { CheckSquare, X, Trash2 } from 'lucide-react';

interface BatchActionsBarProps {
    selectedCount: number;
    onClearSelection: () => void;
    onDeleteSelected: () => void;
}

export function BatchActionsBar({
    selectedCount,
    onClearSelection,
    onDeleteSelected,
}: BatchActionsBarProps) {
    if (selectedCount === 0) return null;

    const selectionLabel = `${selectedCount} ${selectedCount === 1 ? 'item' : 'items'} selected`;

    return (
        <div className="fixed bottom-4 inset-x-0 z-50 px-3 sm:px-4 animate-slideUp">
            <div className="mx-auto w-full max-w-xl rounded-xl border border-border bg-background-secondary/95 backdrop-blur-sm shadow-lg px-3 py-3 sm:px-4 sm:py-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg border border-border bg-background-tertiary flex items-center justify-center flex-shrink-0">
                            <CheckSquare className="w-4 h-4 text-foreground-secondary" aria-hidden="true" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-foreground-muted">
                                Selection
                            </p>
                            <p className="text-sm font-medium text-foreground truncate">
                                {selectionLabel}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 w-full sm:w-auto sm:flex sm:items-center">
                        <button
                            onClick={onClearSelection}
                            className="btn btn-secondary h-9 px-3 text-sm"
                            aria-label="Clear selection"
                        >
                            <X className="w-4 h-4" aria-hidden="true" />
                            Clear
                        </button>
                        <button
                            onClick={onDeleteSelected}
                            className="btn btn-danger h-9 px-3 text-sm"
                            aria-label="Delete selected items"
                        >
                            <Trash2 className="w-4 h-4" aria-hidden="true" />
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
