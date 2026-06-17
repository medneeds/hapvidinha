import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: unknown) {
    console.error("[ErrorBoundary] Caught error:", error, info);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          fontFamily: "system-ui, sans-serif",
          background: "#f8fafc",
        }}>
          <div style={{
            maxWidth: 520,
            background: "white",
            border: "1px solid #e2e8f0",
            borderRadius: 12,
            padding: 24,
            boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
          }}>
            <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#0f172a" }}>
              Ocorreu um erro ao carregar a plataforma
            </h1>
            <p style={{ marginTop: 8, fontSize: 13, color: "#475569" }}>
              Tente recarregar a página. Se o problema persistir, contate o suporte.
            </p>
            {this.state.error?.message && (
              <pre style={{
                marginTop: 12,
                padding: 12,
                background: "#f1f5f9",
                borderRadius: 8,
                fontSize: 11,
                color: "#0f172a",
                overflow: "auto",
                maxHeight: 160,
                whiteSpace: "pre-wrap",
              }}>{this.state.error.message}</pre>
            )}
            <button
              onClick={this.handleReload}
              style={{
                marginTop: 16,
                padding: "10px 16px",
                background: "#013ba6",
                color: "white",
                border: "none",
                borderRadius: 8,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Recarregar
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
