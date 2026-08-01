import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AppUpdateNotice } from "./AppUpdateNotice";
import { clearAppUpdate, markAppUpdateAvailable } from "../pwa/appUpdate";

describe("AppUpdateNotice", () => {
  afterEach(() => {
    act(() => clearAppUpdate());
  });

  it("avisa sobre a nova versão sem recarregar automaticamente", () => {
    const reload = vi.fn();
    render(<AppUpdateNotice reload={reload} />);

    act(() => markAppUpdateAvailable());

    expect(screen.getByText("Nova versão disponível")).toBeInTheDocument();
    expect(reload).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Atualizar" }));
    expect(reload).toHaveBeenCalledOnce();
  });

  it("permite deixar a atualização para depois", () => {
    render(<AppUpdateNotice />);

    act(() => markAppUpdateAvailable());
    fireEvent.click(
      screen.getByRole("button", {
        name: "Lembrar da atualização depois",
      }),
    );

    expect(
      screen.queryByText("Nova versão disponível"),
    ).not.toBeInTheDocument();
  });
});
