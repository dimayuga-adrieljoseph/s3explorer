import { useState } from 'react';

import { getFileName } from '../../utils/fileUtils';
import type { S3Object } from '../../types';

interface DeleteModalProps {
    object: S3Object | null;
    onClose: () => void;
    onDelete: () => Promise<void> | void;
}

export function DeleteModal({ object, onClose, onDelete }: DeleteModalProps) {
    const [isDeleting, setIsDeleting] = useState(false);

    if (!object) return null;

    const handleDelete = async () => {
        if (isDeleting) return;
        setIsDeleting(true);
        try {
            await onDelete();
        } finally {
            setIsDeleting(false);
        }
    };

    const fileName = getFileName(object.key);
    const isFolder = object.isFolder;

    return (
        <div
            className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
            onClick={onClose}
        >
            <div
                className="bg-background-secondary border border-border rounded-xl p-6 max-w-sm w-full shadow-2xl animate-scaleIn"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <h3 className="text-lg font-semibold text-foreground mb-2">
                    Delete {isFolder ? 'Folder' : 'File'}
                </h3>

                {/* Description */}
                <p className="text-sm text-foreground-muted mb-4">
                    Are you sure you want to delete{' '}
                    <span className="text-foreground font-medium">"{fileName}"</span>?
                </p>

                {/* Warning for folders */}


                {/* Actions */}
                <div className="flex gap-3 mt-5">
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
