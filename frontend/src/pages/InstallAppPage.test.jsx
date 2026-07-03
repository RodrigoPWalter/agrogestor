import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { InstallAppPage } from "./InstallAppPage";

describe("InstallAppPage", () => {
  it("mostra as instruções para Android e iPhone", () => {
    render(<InstallAppPage />);

    expect(
      screen.getByRole("heading", { name: "Instale o AgroGestor" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Android" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "iPhone" })).toBeInTheDocument();
    expect(
      screen.getByText(/continuará usando a internet/i),
    ).toBeInTheDocument();
  });
});
