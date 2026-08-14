import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import SteamWindow from '../ui/SteamWindow';
import SteamButton from '../ui/SteamButton';
import SteamInset from '../ui/SteamInset';

export default class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("ErrorBoundary caught an error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    handleReload = () => {
        window.location.reload();
    };

    handleGoHome = () => {
        window.location.href = '/';
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-hcDark flex items-center justify-center p-4">
                    <SteamWindow className="max-w-lg w-full p-4 flex flex-col gap-4 shadow-2xl">
                        <div className="steam-dialog-header flex items-center gap-2">
                            <AlertTriangle size={16} className="text-hcRed" />
                            <span>COMM-LINK FAILURE — SYSTEM MALFUNCTION</span>
                        </div>

                        <div className="text-center py-2 flex flex-col items-center gap-2">
                            <AlertTriangle size={48} className="text-hcRed opacity-80" />
                            <h2 className="text-base font-bold uppercase tracking-widest text-white">
                                Связь со спутником прервана
                            </h2>
                            <p className="text-xs text-hcMuted max-w-sm">
                                Произошла непредвиденная ошибка при синхронизации тактических данных.
                            </p>
                        </div>

                        {this.state.error && (
                            <SteamInset className="p-3 bg-black/50 text-[11px] font-mono text-red-300 max-h-36 overflow-y-auto custom-scrollbar">
                                <p className="font-bold text-hcRed mb-1">{this.state.error.toString()}</p>
                                {this.state.errorInfo && (
                                    <pre className="text-[9px] text-hcMuted whitespace-pre-wrap">
                                        {this.state.errorInfo.componentStack}
                                    </pre>
                                )}
                            </SteamInset>
                        )}

                        <div className="flex gap-2 justify-end mt-2">
                            <SteamButton
                                variant="tab"
                                onClick={this.handleGoHome}
                                className="px-4 py-2 text-xs font-bold uppercase flex items-center gap-1.5"
                            >
                                <Home size={14} /> На главную
                            </SteamButton>
                            <SteamButton
                                variant="primary"
                                onClick={this.handleReload}
                                className="px-4 py-2 text-xs font-bold uppercase flex items-center gap-1.5"
                            >
                                <RefreshCw size={14} /> Перезагрузить
                            </SteamButton>
                        </div>
                    </SteamWindow>
                </div>
            );
        }

        return this.props.children;
    }
}
