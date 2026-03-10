import { useState } from 'react';

interface DeleteBucketModalProps {
    bucketName: string | null;
    onClose: () => void;
    onDelete: () => Promise<void> | void;
}

export function DeleteBucketModal({ bucketName, onClose, onDelete }: DeleteBucketModalProps) {
    const [isDeleting, setIsDeleting] = useState(false);

    if (!bucketName) return null;

    const handleDelete = async () => {
        if (isDeleting) return;
        setIsDeleting(true);
        try {
            await onDelete();
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
            onClick={onClose}
        >
            <div
                className="bg-background-secondary border border-border rounded-xl p-6 max-w-sm w-full shadow-2xl animate-scaleIn"
                onClick={e => e.stopPropagation()}
            >
                <h3 className="text-lg font-semibold text-foreground mb-2">
                    Delete Bucket
                </h3>

                <p className="text-sm text-foreground-muted mb-6">
                    Are you sure you want to delete{' '}
                    <span className="text-foreground font-medium">"{bucketName}"</span>?
                </p>

                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="btn btn-secondary flex-1"
                        disabled={isDeleting}
                        autoFocus
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleDelete}
                        className="btn btn-danger flex-1"
                        disabled={isDeleting}
                    >
                        {isDeleting ? (
                            <span className="flex items-center justify-center gap-2">
                                <span className="premium-spinner">
                                    <span className="premium-spinner-dot" />
                                    <span className="premium-spinner-dot" />
                                    <span className="premium-spinner-dot" />
                                </span>
                                Deleting…
                            </span>
                        ) : (
                            'Delete'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
