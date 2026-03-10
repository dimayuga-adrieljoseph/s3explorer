import { useState, useEffect } from 'react';
import { Modal } from './Modal';
import type { S3Object, Bucket } from '../types';
import { getFileName } from '../utils/fileUtils';

interface CopyModalProps {
    isOpen: boolean;
    sourceObject: S3Object | null;
    sourceBucket: string;
    buckets: Bucket[];
    currentPath: string;
    onClose: () => void;
    onCopy: (destBucket: string, destKey: string) => void;
}

export function CopyModal({ isOpen, sourceObject, sourceBucket, buckets, currentPath, onClose, onCopy }: CopyModalProps) {
    const [destBucket, setDestBucket] = useState(sourceBucket);
    const [destPath, setDestPath] = useState(currentPath);
    const [destName, setDestName] = useState('');
    const [copying, setCopying] = useState(false);

    useEffect(() => {
        if (sourceObject && isOpen) {
            setDestBucket(sourceBucket);
            setDestPath(currentPath);
            setDestName(getFileName(sourceObject.key));
            setCopying(false);
        }
    }, [sourceObject?.key, isOpen, sourceBucket, currentPath]);

    if (!isOpen || !sourceObject) return null;

    const handleSubmit = async () => {
        if (!destName.trim() || copying) return;
        setCopying(true);
        const destKey = destPath + destName.trim();
        onCopy(destBucket, destKey);
    };

    const isSameLocation = destBucket === sourceBucket && destPath + destName.trim() === sourceObject.key;

    return (
        <Modal title="Copy File" onClose={onClose} size="md">
            <div className="space-y-4">
                <div>
                    <label className="block text-xs font-medium text-foreground-muted uppercase tracking-wider mb-1.5">Source</label>
                    <div className="text-sm text-foreground bg-background-tertiary px-3 py-2 rounded-md truncate">
                        {sourceBucket} / {getFileName(sourceObject.key)}
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-medium text-foreground-muted uppercase tracking-wider mb-1.5" htmlFor="copy-dest-bucket">
                        Destination Bucket
                    </label>
                    <select
                        id="copy-dest-bucket"
                        value={destBucket}
                        onChange={e => setDestBucket(e.target.value)}
                        className="input"
                    >
                        {buckets.map(b => (
                            <option key={b.name} value={b.name}>{b.name}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-xs font-medium text-foreground-muted uppercase tracking-wider mb-1.5" htmlFor="copy-dest-path">
                        Destination Path
                    </label>
                    <input
                        id="copy-dest-path"
                        type="text"
                        value={destPath}
                        onChange={e => setDestPath(e.target.value)}
                        className="input"
                        placeholder="e.g., folder/subfolder/"
                    />
                    <p className="text-xs text-foreground-muted mt-1">Leave empty for bucket root. End with / for folders.</p>
                </div>

                <div>
                    <label className="block text-xs font-medium text-foreground-muted uppercase tracking-wider mb-1.5" htmlFor="copy-dest-name">
                        File Name
                    </label>
                    <input
                        id="copy-dest-name"
                        type="text"
                        value={destName}
                        onChange={e => setDestName(e.target.value)}
                        className="input"
                    />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                    <button onClick={onClose} className="btn btn-ghost" disabled={copying}>
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!destName.trim() || isSameLocation || copying}
                        className="btn btn-primary"
                    >
                        {copying ? 'Copying...' : 'Copy'}
                    </button>
                </div>

                {isSameLocation && (
                    <p className="text-xs text-accent-yellow">Cannot copy to the same location. Change the destination.</p>
                )}
            </div>
        </Modal>
    );
}
