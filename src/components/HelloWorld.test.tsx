import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import HelloWorld from "./HelloWorld";

describe("HelloWorld", () => {
	it("should display Hello World text", () => {
		render(<HelloWorld />);

		expect(screen.getByText("Hello World")).toBeDefined();
	});
});
