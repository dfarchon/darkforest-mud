import React from "react";
import styled from "styled-components";

import { Spacer, Underline } from "../Components/CoreUI";
import { Red } from "../Components/Text";

interface DFErrorBoundaryProps {
  children: React.ReactNode;
}

interface DFErrorBoundaryState {
  hasError: boolean;
}

export class DFErrorBoundary extends React.Component<
  DFErrorBoundaryProps,
  DFErrorBoundaryState
> {
  constructor(props: DFErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, _errorInfo: React.ErrorInfo) {
    console.error("ui rendering error");
    console.error(error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorBoundaryContent>
          <Red>Error!</Red>
          <Spacer height={8} />
          There was an error rendering this UI! Sorry!
          <Spacer height={8} />
          If you would like to report this error, please send a screenshot of
          the developer console to the <Underline>df-feedback</Underline>{" "}
          channel in our discord.
        </ErrorBoundaryContent>
      );
    }

    return this.props.children;
  }
}

const ErrorBoundaryContent = styled.div`
  padding: 8px;
  max-width: 350px;
`;
