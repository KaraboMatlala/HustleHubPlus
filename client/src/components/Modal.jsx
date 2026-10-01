import { useEffect, useRef } from "react";

import "../styles/Gigs.css";

// Accessible dialog: closes on Esc or backdrop click, moves focus inside,
// and restores focus to whatever opened it.
function Modal({ title, onClose, children }) {
  const dialogRef = useRef(null);
  const onCloseRef = useRef(onClose);

  // Always call the latest onClose without re-running the focus effect below
  // (which would pull focus out of the input someone is typing in).
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    const previouslyFocused = document.activeElement;

    dialogRef.current?.focus();

    function handleKey(event) {
      if (event.key === "Escape") onCloseRef.current();
    }

    document.addEventListener("keydown", handleKey);

    return () => {
      document.removeEventListener("keydown", handleKey);
      previouslyFocused?.focus?.();
    };
  }, []);

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        ref={dialogRef}
      >
        <div className="modal-header">
          <h2>{title}</h2>

          <button
            type="button"
            className="modal-close"
            aria-label="Close"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}

export default Modal;
