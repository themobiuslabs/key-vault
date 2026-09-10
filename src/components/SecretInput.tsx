import { useState } from "react";

type SecretInputProps = {
  value: string;
  onChange: (
    value: string
  ) => void;
  placeholder: string;
  disabled?: boolean;
};

function SecretInput({
  value,
  onChange,
  placeholder,
  disabled = false,
}: SecretInputProps) {
  const [isVisible, setIsVisible] =
    useState(false);

  return (
    <div className="secret-input">
      <input
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
        autoComplete="off"
        disabled={disabled}
      />

      <button
        type="button"
        className="secret-toggle"
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