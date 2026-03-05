import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Sidebar } from "./Sidebar";
import { createMockHistoryItem } from "@/test/factories";

describe("Sidebar", () => {
  it("renders empty history state", () => {
    render(
      <Sidebar
        history={[]}
        onSelect={jest.fn()}
        onNewResearch={jest.fn()}
        onDelete={jest.fn()}
      />
    );

    expect(screen.getByText(/no research yet/i)).toBeInTheDocument();
  });

  it("calls onNewResearch when clicking New Research", async () => {
    const user = userEvent.setup();
    const onNewResearch = jest.fn();

    render(
      <Sidebar
        history={[]}
        onSelect={jest.fn()}
        onNewResearch={onNewResearch}
        onDelete={jest.fn()}
      />
    );

    await user.click(screen.getByRole("button", { name: /new research/i }));
    expect(onNewResearch).toHaveBeenCalledTimes(1);
  });

  it("selects and deletes history items", async () => {
    const user = userEvent.setup();
    const item = createMockHistoryItem({
      id: "h-1",
      question: "Agentic workflows",
      status: "draft",
    });
    const onSelect = jest.fn();
    const onDelete = jest.fn();

    render(
      <Sidebar
        history={[item]}
        onSelect={onSelect}
        onNewResearch={jest.fn()}
        onDelete={onDelete}
      />
    );

    await user.click(screen.getByRole("button", { name: /agentic workflows/i }));
    expect(onSelect).toHaveBeenCalledWith(item);

    await user.click(screen.getByTitle(/delete research/i));
    expect(onDelete).toHaveBeenCalledWith("h-1");
    expect(screen.getByText(/draft/i)).toBeInTheDocument();
  });
});
