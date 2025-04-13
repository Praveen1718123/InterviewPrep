/// <reference types="vitest/globals" />
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import CandidateLayout from "./candidate-layout";

describe("Candidate Dashboard", () => {
  it("renders dashboard layout with greeting", () => {
    render(<CandidateLayout />);
    expect(screen.getByText(/welcome/i)).toBeTruthy();
  });

  it('shows "Start Assessment" button when no progress', () => {
    render(<CandidateLayout status="not_started" />);
    expect(
      screen.getByRole("button", { name: /start assessment/i }),
    ).toBeTruthy();
  });

  it('shows "Continue" button when assessment in progress', () => {
    render(<CandidateLayout status="in_progress" />);
    expect(screen.getByRole("button", { name: /continue/i })).toBeTruthy();
  });

  it('shows "View Results" button after completion', () => {
    render(<CandidateLayout status="completed" />);
    expect(screen.getByRole("button", { name: /view results/i })).toBeTruthy();
  });
});
