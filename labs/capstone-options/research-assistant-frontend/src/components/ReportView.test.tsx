import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReportView } from "./ReportView";

jest.mock("react-markdown", () => ({
  __esModule: true,
  default: ({ children }: { children: string }) => <div>{children}</div>,
}));

jest.mock("remark-gfm", () => jest.fn());

describe("ReportView", () => {
  it("returns null when there is no report", () => {
    const { container } = render(<ReportView finalReport={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows draft banner when report is draft", () => {
    render(<ReportView finalReport="# Draft" reportStatus="draft" />);
    expect(screen.getByText(/draft report/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /research draft/i })).toBeInTheDocument();
  });

  it("copies report content to clipboard", async () => {
    const user = userEvent.setup();
    const writeText = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });

    render(<ReportView finalReport="# Copy me" reportStatus="complete" />);

    await user.click(screen.getByRole("button", { name: /^copy$/i }));

    expect(writeText).toHaveBeenCalledWith("# Copy me");
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /copied!/i })).toBeInTheDocument();
    });
  });

  it("downloads report as markdown file", async () => {
    const user = userEvent.setup();
    const createObjectURL = jest.fn().mockReturnValue("blob:mock-url");
    const revokeObjectURL = jest.fn();
    const clickSpy = jest
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {});

    Object.defineProperty(URL, "createObjectURL", {
      value: createObjectURL,
      configurable: true,
    });

    Object.defineProperty(URL, "revokeObjectURL", {
      value: revokeObjectURL,
      configurable: true,
    });

    render(<ReportView finalReport="# Download me" reportStatus="complete" />);

    await user.click(screen.getByRole("button", { name: /download/i }));

    expect(createObjectURL).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:mock-url");
    clickSpy.mockRestore();
  });
});
