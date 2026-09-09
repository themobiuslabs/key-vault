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
  const [recoveryKey, setRecoveryKey] =
    useState<string | null>(null);
  const [error, setError] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [hasConfirmedRecoveryKey, setHasConfirmedRecoveryKey] =
    useState(false);

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
      const generatedRecoveryKey =
        await invoke<string>("initialize_vault", {
          password,
        });

      setRecoveryKey(generatedRecoveryKey);
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

  function continueToVault() {
    if (!hasConfirmedRecoveryKey) {
      setError(
        "Please confirm that you have saved your recovery key."
      );
      return;
    }

    onVaultInitialized();
  }

  if (recoveryKey) {
    return (
      <main className="setup-screen">
        <section className="setup-card">
          <div className="logo">
            <div className="logo-mark">K</div>
            <span>KeyVault</span>
          </div>

          <p className="eyebrow">
            RECOVERY KEY
          </p>

          <h1>Save your recovery key</h1>

          <p className="subtitle">
            This is the only time KeyVault will show
            you this recovery key. Store it somewhere
            safe and private.
          </p>

          <div className="recovery-key">
            {recoveryKey}
          </div>

          <label className="recovery-confirmation">
            <input
              type="checkbox"
              checked={hasConfirmedRecoveryKey}
              onChange={(event) =>
                setHasConfirmedRecoveryKey(
                  event.target.checked
                )
              }
            />

            <span>
              I have saved my recovery key somewhere
              safe.
            </span>
          </label>

          {error && (
            <p className="setup-error">
              {error}
            </p>
          )}

          <button
            className="primary-button"
            onClick={continueToVault}
          >
            Continue to Vault
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="setup-screen">
      <section className="setup-card">
        <div className="logo">
          <div className="logo-mark">K</div>
          <span>KeyVault</span>
        </div>

        <p className="eyebrow">
          FIRST TIME SETUP
        </p>

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