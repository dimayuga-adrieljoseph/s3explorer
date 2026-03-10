import { useState, useEffect, useCallback } from 'react';
import { X, Download } from 'lucide-react';
import type { S3Object } from '../types';
import { getFileName, getPreviewType } from '../utils/fileUtils';
import { getProxyUrl } from '../api';
import { formatBytes } from '../utils/formatters';

interface FilePreviewModalProps {
    object: S3Object | null;
    bucket: string;
    onClose: () => void;
    onDownload: (obj: S3Object) => void;
}

const MAX_TEXT_SIZE = 5 * 1024 * 1024; // 5MB

export function FilePreviewModal({ object, bucket, onClose, onDownload }: FilePreviewModalProps) {
    const [textContent, setTextContent] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [imageLoaded, setImageLoaded] = useState(false);

    const fileName = object ? getFileName(object.key) : '';
    const previewType = object ? getPreviewType(object.key) : null;
    const proxyUrl = object ? getProxyUrl(bucket, object.key) : '';

    // Reset states when object changes
    useEffect(() => {
        setImageLoaded(false);
        setError(null);
        setTextContent(null);
        setLoading(false);
    }, [object?.key]);

    // Fetch text content
    useEffect(() => {
        if (!object || previewType !== 'text') return;

        if (object.size > MAX_TEXT_SIZE) {
            setError(`File too large to preview (${formatBytes(object.size)}, max ${formatBytes(MAX_TEXT_SIZE)})`);
            return;
        }

        setLoading(true);
        setError(null);

        const controller = new AbortController();
        fetch(proxyUrl, { credentials: 'include', signal: controller.signal })
            .then(res => {
                if (!res.ok) throw new Error('Failed to load file');
                return res.text();
            })
            .then(text => setTextContent(text))
            .catch(err => {
                if (err.name !== 'AbortError') {
                    setError(err.message || 'Failed to load file');
                }
            })
            .finally(() => setLoading(false));

        return () => controller.abort();
    }, [object?.key, previewType, proxyUrl, object?.size]);

    // Handle escape key and body scroll lock
    const stableOnClose = useCallback(() => onClose(), [onClose]);
    useEffect(() => {
        if (!object) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') stableOnClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        document.body.style.overflow = 'hidden';
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [object, stableOnClose]);

    if (!object) return null;

    const renderPreview = () => {
        if (error) {
            return (
                <div className="text-center p-8">
                    <p className="text-foreground-muted">{error}</p>
                    <button onClick={() => onDownload(object)} className="btn btn-secondary mt-4">
                        Download instead
                    </button>
                </div>
            );
        }

        switch (previewType) {
            case 'image':
                return (
                    <div className="flex items-center justify-center h-full">
                        {!imageLoaded && (
                            <svg className="w-6 h-6 animate-spin text-foreground-muted" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                        )}
                        <img
                            src={proxyUrl}
                            alt={fileName}
                            className={`max-w-full max-h-full object-contain rounded ${imageLoaded ? '' : 'hidden'}`}
                            onLoad={() => setImageLoaded(true)}
                            onError={() => setError('Failed to load image')}
                        />
                    </div>
                );

            case 'video':
                return (
                    <div className="flex items-center justify-center h-full">
                        <video
                            controls
                            autoPlay
                            className="max-w-full max-h-full rounded"
                            onError={() => setError('Failed to load video')}
                        >
                            <source src={proxyUrl} />
                            Your browser does not support video playback.
                        </video>
                    </div>
                );

            case 'audio':
                return (
                    <div className="flex flex-col items-center justify-center gap-4 p-8">
                        <div className="w-24 h-24 rounded-full bg-background-tertiary flex items-center justify-center">
                            <svg className="w-10 h-10 text-accent-purple" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
                            </svg>
                        </div>
                        <p className="text-sm text-foreground-secondary">{fileName}</p>
                        <audio
                            controls
                            autoPlay
                            className="w-full max-w-md"
                            onError={() => setError('Failed to load audio')}
                        >
                            <source src={proxyUrl} />
                            Your browser does not support audio playback.
                        </audio>
                    </div>
                );

            case 'text':
                if (loading) {
                    return (
                        <div className="flex items-center justify-center h-full">
                            <svg className="w-6 h-6 animate-spin text-foreground-muted" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                        </div>
                    );
                }
                return (
                    <div className="w-full h-full overflow-auto bg-background rounded border border-border">
                        <pre className="text-[13px] font-mono text-foreground whitespace-pre-wrap break-words p-4 leading-relaxed">
                            {textContent}
                        </pre>
                    </div>
                );

            case 'pdf':
                return (
                    <iframe
                        src={proxyUrl}
                        className="w-full h-full border-0 rounded bg-white"
                        title={fileName}
                    />
                );

            default:
                return (
                    <div className="text-center p-8">
                        <p className="text-foreground-muted">Preview not available for this file type</p>
                        <button onClick={() => onDownload(object)} className="btn btn-secondary mt-4">
                            Download
                        </button>
                    </div>
                );
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex flex-col bg-black/85 backdrop-blur-sm"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-label={`Preview: ${fileName}`}
        >
            {/* Header */}
            <div
                className="flex items-center justify-between px-3 sm:px-4 py-2.5 bg-background-secondary/95 border-b border-border flex-shrink-0"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                    <h3 className="text-sm font-medium truncate">{fileName}</h3>
                    {object.size > 0 && (
                        <span className="text-xs text-foreground-muted flex-shrink-0">{formatBytes(object.size)}</span>
                    )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                        onClick={(e) => { e.stopPropagation(); onDownload(object); }}
                        className="btn btn-ghost btn-icon w-9 h-9"
                        aria-label="Download file"
                    >
                        <Download className="w-4 h-4" />
                    </button>
                    <button
                        onClick={onClose}
                        className="btn btn-ghost btn-icon w-9 h-9"
                        aria-label="Close preview"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div
                className="flex-1 flex items-center justify-center p-3 sm:p-6 overflow-hidden min-h-0"
                onClick={e => e.stopPropagation()}
            >
                {renderPreview()}
            </div>
        </div>
    );
}
