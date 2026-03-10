import { Spinner } from './Spinner';

interface UploadProgressProps {
    uploading: boolean;
    progress: number;
}

export function UploadProgress({ uploading, progress }: UploadProgressProps) {
    if (!uploading) return null;

    return (
        <div
            className="px-4 py-3 border-b border-border bg-background-secondary animate-fadeInDown relative"
            role="status"
            aria-live="polite"
            aria-label={`Uploading files: ${progress}% complete`}
        >
            {/* Top loading bar accent */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-background-tertiary overflow-hidden">
                <div
                    className="h-full bg-gradient-to-r from-accent-purple via-accent-pink to-accent-purple"
                    style={{
                        width: `${progress}%`,
                        backgroundSize: '200% 100%',
                        animation: 'gradientSlide 2s linear infinite',
                        transition: 'width 300ms cubic-bezier(0.22, 1, 0.36, 1)',
                    }}
                />
            </div>

            <div className="flex items-center gap-3">
                <Spinner className="w-4 h-4 text-accent-pink" label="Uploading" />

                <div className="flex-1">
                    <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-medium">Uploading…</span>
                        <span className="text-sm text-foreground-muted tabular-nums">{progress}%</span>
                    </div>

                    <div
                        className="progress-bar"
                        role="progressbar"
                        aria-valuenow={progress}
                        aria-valuemin={0}
                        aria-valuemax={100}
                    >
                        <div
                            className="progress-fill"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
