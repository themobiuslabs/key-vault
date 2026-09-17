import { useState } from "react";

type SecretInputProps = {
  id: string;
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
  placeholder: string;
  describedBy?: string;
  disabled?: boolean;
};

function SecretInput({
  id,
  label,
  value,
  onChange,
  placeholder,
  describedBy,
  disabled = false,
}: SecretInputProps) {
  const [isVisible, setIsVisible] =
    useState(false);

  return (
    <div className="secret-input">
      <input
        id={id}
        type={
          isVisible
            ? "text"
            : "password"
        }
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        placeholder={placeholder}
        aria-describedby={describedBy}
        autoComplete="off"
        disabled={disabled}
      />

      <button
        type="button"
        className="secret-toggle"
        aria-label={`${isVisible ? "Hide" : "Show"} ${label}`}
        aria-controls={id}
        aria-pressed={isVisible}
        onClick={() =>
          setIsVisible(
            !isVisible
          )
        }
        disabled={disabled}
      >
        {isVisible
          ? "Hide"
          : "Show"}
      </button>
    </div>
  );
}

export default SecretInput;
