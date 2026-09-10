"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  fallback: ReactNode;
  onFallback?: () => void;
};

type State = { failed: boolean };

export class GraphRendererBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    void error;
    void info;
    this.props.onFallback?.();
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
