import React, { ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    (this as any).setState({ error, errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', background: '#fee2e2', color: '#991b1b', border: '2px solid #ef4444', margin: '20px', borderRadius: '8px', fontFamily: 'monospace' }}>
          <h2 style={{ margin: '0 0 10px 0' }}>React Runtime Error</h2>
          <p><strong>{this.state.error?.toString()}</strong></p>
          <pre style={{ overflowX: 'auto', background: '#fff', padding: '10px', fontSize: '12px' }}>
            {this.state.errorInfo?.componentStack}
          </pre>
        </div>
      );
    }

    return (this as any).props.children;
  }
}
