import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AgentLogs } from "./AgentLogs";
import { createMockAgentLog } from "@/test/factories";

describe("AgentLogs", () => {
  it("returns null when logs are empty", () => {
    const { container } = render(<AgentLogs logs={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("toggles log visibility", async () => {
    const user = userEvent.setup();

    render(
      <AgentLogs
        logs={[
          createMockAgentLog({ agent: "Researcher", content: "First step" }),
          createMockAgentLog({ agent: "Writer", content: "Second step" }),
        ]}
      />
    );

    expect(screen.queryByText("First step")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /agent trace log/i }));

    expect(screen.getByText("First step")).toBeInTheDocument();
    expect(screen.getByText("Second step")).toBeInTheDocument();
  });
});
