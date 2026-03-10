import { Upload } from 'lucide-react';

interface DropOverlayProps {
    isDragActive: boolean;
}

export function DropOverlay({ isDragActive }: DropOverlayProps) {
    if (!isDragActive) return null;

    return (
        <div
            className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none animate-fadeIn"
            role="status"
            aria-live="polite"
            aria-label="Drop files to upload"
        >
            <div
                className="absolute inset-4 border-2 border-dashed rounded-2xl bg-background/90 backdrop-blur-sm drop-overlay-border"
                aria-hidden="true"
            />
            <div className="relative text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-purple to-accent-pink flex items-center justify-center mx-auto mb-4 shadow-lg shadow-accent-purple/20 drop-overlay-icon">
                    <Upload className="w-8 h-8 text-white" aria-hidden="true" />
                </div>
                <p className="text-base font-semibold animate-fadeInUp">Drop to upload</p>
                <p className="text-sm text-foreground-muted mt-1 animate-fadeInUp" style={{ animationDelay: '80ms' }}>Release to start uploading</p>
            </div>
        </div>
    );
}
