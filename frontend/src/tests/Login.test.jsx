import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import api from "../api";
import { AuthProvider } from "../AuthContext";
import Login from "../pages/Login";

vi.mock("../api", () => ({
  default: { post: vi.fn(), get: vi.fn() },
  getError: (e) => e.response?.data?.detail || e.message,
}));

function setup() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <Login />
      </AuthProvider>
    </MemoryRouter>
  );
}

describe("Login page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("renders email and password fields", () => {
    setup();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /login/i })).toBeInTheDocument();
  });

  it("submits credentials and stores the token", async () => {
    api.post.mockResolvedValue({
      data: { access_token: "abc", user: { id: 1, name: "Ravi", email: "r@test.com", role: "user" } },
    });
    setup();
    await userEvent.type(screen.getByLabelText(/email/i), "r@test.com");
    await userEvent.type(screen.getByLabelText(/password/i), "Password@1");
    await userEvent.click(screen.getByRole("button", { name: /login/i }));
    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith("/auth/login", { email: "r@test.com", password: "Password@1" })
    );
    expect(localStorage.getItem("token")).toBe("abc");
  });

  it("shows an error for wrong credentials", async () => {
    api.post.mockRejectedValue({ response: { data: { detail: "Invalid email or password" } } });
    setup();
    await userEvent.type(screen.getByLabelText(/email/i), "r@test.com");
    await userEvent.type(screen.getByLabelText(/password/i), "wrongpass");
    await userEvent.click(screen.getByRole("button", { name: /login/i }));
    expect(await screen.findByText(/invalid email or password/i)).toBeInTheDocument();
  });
});
