import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ResearchForm } from "./ResearchForm";

describe("ResearchForm", () => {
  it("keeps submit disabled when question is empty", () => {
    render(<ResearchForm onSubmit={jest.fn()} isLoading={false} />);

    expect(
      screen.getByRole("button", { name: /start investigation/i })
    ).toBeDisabled();
  });

  it("submits configured payload", async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();

    render(<ResearchForm onSubmit={onSubmit} isLoading={false} />);

    await user.type(
      screen.getByRole("textbox", { name: /research question/i }),
      "What is retrieval-augmented generation?"
    );

    await user.click(screen.getByRole("button", { name: /technical/i }));
    await user.selectOptions(screen.getByRole("combobox"), "bullet_points");

    const iterations = screen.getByLabelText(/max iterations/i);
    fireEvent.change(iterations, { target: { value: "8" } });

    await user.click(screen.getByRole("button", { name: /start investigation/i }));

    expect(onSubmit).toHaveBeenCalledWith({
      question: "What is retrieval-augmented generation?",
      depth: "technical",
      report_format: "bullet_points",
      max_iterations: 8,
    });
  });

  it("renders loading state when isLoading is true", () => {
    render(<ResearchForm onSubmit={jest.fn()} isLoading />);

    expect(screen.getByRole("button", { name: /starting research/i })).toBeDisabled();
  });
});
