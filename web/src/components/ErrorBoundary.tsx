import {Component} from 'react'
import {Props, State} from "../types/components.ts";

export class ErrorBoundary extends Component<Props, State> {
    state: State = {error: null}

    static getDerivedStateFromError(error: Error): State {
        return {error}
    }

    componentDidCatch(error: Error, info: { componentStack: string }) {
        console.error('[ErrorBoundary]', error, info.componentStack)
    }

    render() {
        if (this.state.error) {
            return (
                <div className="min-h-screen flex items-center justify-center p-6 bg-page">
                    <div className="max-w-md w-full text-center">
                        <p className="text-text-error text-lg font-semibold mb-2">
                            Something went wrong
                        </p>
                        <p className="text-text-secondary text-sm font-mono bg-surface border border-border rounded-xl px-4 py-3 mb-6">
                            {this.state.error.message}
                        </p>
                        <button
                            onClick={() => this.setState({error: null})}
                            className="px-6 py-3 rounded-xl bg-brand text-text-primary text-sm transition-transform duration-150 hover:scale-[1.02] active:scale-[0.98]"
                        >
                            Try again
                        </button>
                    </div>
                </div>
            )
        }

        return this.props.children
    }
}