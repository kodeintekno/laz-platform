import { useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";
import { formatThousands, parseThousands } from "@/lib/utils";

/**
 * Keeps a text input displaying an Indonesian thousand-separated number ("1.000.000")
 * while the caller's value/onChange stay plain numbers. Restores cursor position by
 * digit count so editing/deleting mid-string doesn't jump the caret to the end.
 */
export function useThousandsInput(value: number, onChange: (value: number) => void) {
  const [displayValue, setDisplayValue] = useState(() => formatThousands(value));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (parseThousands(displayValue) !== value) {
      setDisplayValue(formatThousands(value));
    }
    // Only resync when the external value changes (e.g. programmatic setValue) —
    // not on every keystroke, which is handled by handleChange itself.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const input = e.target;
      const rawValue = input.value;
      const cursorPos = input.selectionStart ?? rawValue.length;
      const digitsBeforeCursor = rawValue.slice(0, cursorPos).replace(/\D/g, "").length;

      const parsed = parseThousands(rawValue);
      const formatted = formatThousands(parsed);

      setDisplayValue(formatted);
      onChange(parsed);

      requestAnimationFrame(() => {
        const el = inputRef.current;
        if (!el) return;
        let pos = 0;
        let digitCount = 0;
        while (pos < formatted.length && digitCount < digitsBeforeCursor) {
          if (/\d/.test(formatted[pos])) digitCount++;
          pos++;
        }
        el.setSelectionRange(pos, pos);
      });
    },
    [onChange]
  );

  return { displayValue, handleChange, inputRef };
}
