import React from 'react';

type Props = { children: React.ReactNode };

type State = { hasError: boolean };

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Ideally send to logging endpoint
    // console.error('Captured error', error, info);
  }

  render() {
    if (this.state.hasError) {
      return <div>Etwas ist schiefgelaufen. Bitte neu laden.</div>;
    }

    return this.props.children as JSX.Element;
  }
}
