import "@testing-library/jest-dom";
import { TextEncoder, TextDecoder } from "util";

Object.defineProperty(global, "TextEncoder", {
  value: TextEncoder,
});

Object.defineProperty(global, "TextDecoder", {
  value: TextDecoder,
});

Object.defineProperty(global, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn().mockResolvedValue(undefined),
  },
});
