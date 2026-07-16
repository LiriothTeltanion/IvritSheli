// Module: UI error boundary
// Purpose: Keep a recoverable learner-facing screen when an unexpected React rendering error occurs.
// Author: Kevin "Lirioth" Cusnir
// Date: 2026-07-15 | TZ: Asia/Jerusalem
// Notes: Comments in ENGLISH; emojis sparingly.

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { useI18n } from '../i18n';
import { Icon } from './Icon';

interface ErrorBoundaryState { failed: boolean; message: string; }

function LocalizedErrorFallback({ message }: { message: string }): React.JSX.Element {
  const { t } = useI18n();
  return (
    <main className="fatal-error">
      <div className="fatal-error__icon"><Icon name="bug" size={38} /></div>
      <h1>{t('unexpectedProblem')}</h1>
      <p>{message}</p>
      <button type="button" className="primary-button" onClick={() => window.location.reload()}>{t('reloadSafely')}</button>
    </main>
  );
}

export class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { failed: false, message: '' };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { failed: true, message: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // The local console keeps developer context; the learner sees a clean recovery action.
    console.error('Ivrit Sheli UI error', error, info.componentStack);
  }

  render(): ReactNode {
    if (!this.state.failed) return this.props.children;
    return <LocalizedErrorFallback message={this.state.message} />;
  }
}
