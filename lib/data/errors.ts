/**
 * Message to show for a failed write. A month-closed refusal from the database
 * is explicit and useful, so it is passed through; anything else gets the
 * generic text (never leak raw database errors to the screen).
 */
export function writeErrorMessage(error: unknown, fallback: string): string {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "object" && error !== null && "message" in error
        ? String((error as { message: unknown }).message)
        : "";
  return /clôtur/i.test(message) ? message : fallback;
}
