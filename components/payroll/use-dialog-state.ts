import { useCallback, useState } from "react";

/**
 * Open/close state that works both ways: uncontrolled (the dialog owns its
 * state and shows its own trigger button) or controlled by a parent menu
 * (`open` given: the parent opens it and no trigger is shown).
 */
export function useDialogState(
  controlledOpen?: boolean,
  onOpenChange?: (open: boolean) => void,
) {
  const [inner, setInner] = useState(false);
  const controlled = controlledOpen !== undefined;
  const open = controlled ? controlledOpen : inner;

  const setOpen = useCallback(
    (value: boolean) => {
      if (!controlled) setInner(value);
      onOpenChange?.(value);
    },
    [controlled, onOpenChange],
  );

  return { open, setOpen, controlled };
}
