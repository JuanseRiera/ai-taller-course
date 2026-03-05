import { render, screen } from "@testing-library/react";
import { StreamingView } from "./StreamingView";

describe("StreamingView", () => {
  it("shows initializing fallback without an agent", () => {
    render(<StreamingView currentAgent={null} currentPreview="" />);

    expect(screen.getByText(/initializing/i)).toBeInTheDocument();
    expect(screen.getByText(/waiting for agent output/i)).toBeInTheDocument();
  });

  it("shows active agent and preview text", () => {
    render(
      <StreamingView
        currentAgent="Researcher"
        currentPreview="Gathering sources from medical journals"
      />
    );

    expect(screen.getByText(/researcher is working/i)).toBeInTheDocument();
    expect(screen.getByText(/gathering sources from medical journals/i)).toBeInTheDocument();
  });
});
