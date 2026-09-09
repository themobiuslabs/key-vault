import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";

type SetupVaultViewProps = {
  onVaultInitialized: () => void;
};

function SetupVaultView({
  onVaultInitialized,
}: SetupVaultViewProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");
  const [error, setError] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  async function createVault() {
    setError("");

    if (password.length < 8) {
      setError(
        "Master password must be at least 8 characters."
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsCreating(true);

    try {
      await invoke("initialize_vault", {
        password,
      });

      onVaultInitialized();
    } catch (error) {
      console.error(
        "Failed to initialize vault:",
        error
      );

      setError(String(error));
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <main className="setup-screen">
      <section className="setup-card">
        <div className="logo">
          <div className="logo-mark">K</div>
          <span>KeyVault</span>
        </div>

        <p className="eyebrow">FIRST TIME SETUP</p>

        <h1>Create your vault</h1>

        <p className="subtitle">
          Create a master password to protect your
          credentials.
        </p>

        <div className="setup-form">
          <label>
            <span>Master password</span>

            <input
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              placeholder="Enter master password"
            />
          </label>

          <label>
            <span>Confirm password</span>

            <input
              type="password"
              value={confirmPassword}
              onChange={(event) =>
                setConfirmPassword(event.target.value)
              }
              placeholder="Confirm master password"
            />
          </label>

          {error && (
            <p className="setup-error">
              {error}
            </p>
          )}

          <button
            className="primary-button"
            onClick={createVault}
            disabled={isCreating}
          >
            {isCreating
              ? "Creating vault..."
              : "Create Vault"}
          </button>
        </div>
      </section>
    </main>
  );
}

export default SetupVaultView;