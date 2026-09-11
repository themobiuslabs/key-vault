import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";

type UnlockMode =
  | "password"
  | "recovery"
  | "reset-password";

type UnlockVaultViewProps = {
  onUnlocked: () => void;
};

function UnlockVaultView({
  onUnlocked,
}: UnlockVaultViewProps) {
  const [mode, setMode] =
    useState<UnlockMode>("password");

  const [password, setPassword] =
    useState("");

  const [recoveryKey, setRecoveryKey] =
    useState("");

  const [newPassword, setNewPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [error, setError] =
    useState("");

  const [isUnlocking, setIsUnlocking] =
    useState(false);

  async function unlockWithPassword() {
    setError("");
    setIsUnlocking(true);

    try {
      await invoke("unlock_vault", {
        password,
      });

      setPassword("");
      onUnlocked();
    } catch (error) {
      console.error(
        "Failed to unlock vault:",
        error
      );

      setError(
        "Incorrect master password."
      );
    } finally {
      setIsUnlocking(false);
    }
  }

  function startRecovery() {
    setMode("recovery");
    setError("");
    setPassword("");
    setRecoveryKey("");
    setNewPassword("");
    setConfirmPassword("");
  }

  async function verifyRecoveryKey() {
    setError("");
    setIsUnlocking(true);

    try {
      await invoke("recover_vault", {
        recoveryKey:
          recoveryKey.trim(),
      });

      setMode("reset-password");
      setError("");
    } catch (error) {
      console.error(
        "Failed to verify recovery key:",
        error
      );

      setError(
        "Invalid recovery key."
      );
    } finally {
      setIsUnlocking(false);
    }
  }

  async function resetMasterPassword() {
    setError("");

    if (newPassword.length < 8) {
      setError(
        "New master password must be at least 8 characters."
      );
      return;
    }

    if (
      newPassword !== confirmPassword
    ) {
      setError(
        "New passwords do not match."
      );
      return;
    }

    setIsUnlocking(true);

    try {
      await invoke(
        "reset_master_password_with_recovery",
        {
          recoveryKey:
            recoveryKey.trim(),
          newPassword,
        }
      );

      setRecoveryKey("");
      setNewPassword("");
      setConfirmPassword("");

      onUnlocked();
    } catch (error) {
      console.error(
        "Failed to reset master password:",
        error
      );

      setError(
        "Could not reset your master password."
      );
    } finally {
      setIsUnlocking(false);
    }
  }

  function switchToPassword() {
    setMode("password");
    setError("");
    setPassword("");
    setRecoveryKey("");
    setNewPassword("");
    setConfirmPassword("");
  }

  return (
    <main className="setup-screen">
      <section className="setup-card">
        <div className="logo">
          <div className="logo-mark">
            K
          </div>

          <span>KeyVault</span>
        </div>

        <p className="eyebrow">
          VAULT LOCKED
        </p>

        <h1>
          {mode === "password" &&
            "Unlock your vault"}

          {mode === "recovery" &&
            "Recover your vault"}

          {mode === "reset-password" &&
            "Set a new password"}
        </h1>

        <p className="subtitle">
          {mode === "password" &&
            "Enter your master password to access your credentials."}

          {mode === "recovery" &&
            "Enter your recovery key to regain access to your vault."}

          {mode === "reset-password" &&
            "Your recovery key was verified. Create a new master password for your vault."}
        </p>

        <div className="setup-form">
          {mode === "password" && (
            <>
              <label>
                <span>
                  Master password
                </span>

                <input
                  type="password"
                  value={password}
                  onChange={(event) =>
                    setPassword(
                      event.target.value
                    )
                  }
                  onKeyDown={(event) => {
                    if (
                      event.key ===
                        "Enter" &&
                      !isUnlocking &&
                      password.length > 0
                    ) {
                      unlockWithPassword();
                    }
                  }}
                  placeholder="Enter master password"
                  autoFocus
                  autoComplete="current-password"
                />
              </label>

              {error && (
                <p className="setup-error">
                  {error}
                </p>
              )}

              <button
                className="primary-button"
                onClick={
                  unlockWithPassword
                }
                disabled={
                  isUnlocking ||
                  password.length === 0
                }
              >
                {isUnlocking
                  ? "Unlocking..."
                  : "Unlock Vault"}
              </button>

              <button
                className="secondary-button"
                onClick={
                  startRecovery
                }
                disabled={isUnlocking}
              >
                Forgot Master Password?
              </button>
            </>
          )}

          {mode === "recovery" && (
            <>
              <label>
                <span>
                  Recovery key
                </span>

                <input
                  type="text"
                  value={recoveryKey}
                  onChange={(event) =>
                    setRecoveryKey(
                      event.target.value
                    )
                  }
                  onKeyDown={(event) => {
                    if (
                      event.key ===
                        "Enter" &&
                      !isUnlocking &&
                      recoveryKey.trim()
                        .length > 0
                    ) {
                      verifyRecoveryKey();
                    }
                  }}
                  placeholder="Enter recovery key"
                  autoFocus
                  autoComplete="off"
                  spellCheck={false}
                />
              </label>

              {error && (
                <p className="setup-error">
                  {error}
                </p>
              )}

              <button
                className="primary-button"
                onClick={
                  verifyRecoveryKey
                }
                disabled={
                  isUnlocking ||
                  recoveryKey.trim()
                    .length === 0
                }
              >
                {isUnlocking
                  ? "Verifying..."
                  : "Continue"}
              </button>

              <button
                className="secondary-button"
                onClick={
                  switchToPassword
                }
                disabled={isUnlocking}
              >
                Use Master Password
              </button>
            </>
          )}

          {mode === "reset-password" && (
            <>
              <label>
                <span>
                  New master password
                </span>

                <input
                  type="password"
                  value={newPassword}
                  onChange={(event) =>
                    setNewPassword(
                      event.target.value
                    )
                  }
                  onKeyDown={(event) => {
                    if (
                      event.key ===
                        "Enter" &&
                      !isUnlocking &&
                      newPassword.length > 0 &&
                      confirmPassword.length >
                        0
                    ) {
                      resetMasterPassword();
                    }
                  }}
                  placeholder="Enter new master password"
                  autoFocus
                  autoComplete="new-password"
                />
              </label>

              <label>
                <span>
                  Confirm new password
                </span>

                <input
                  type="password"
                  value={
                    confirmPassword
                  }
                  onChange={(event) =>
                    setConfirmPassword(
                      event.target.value
                    )
                  }
                  placeholder="Confirm new master password"
                  autoComplete="new-password"
                />
              </label>

              {error && (
                <p className="setup-error">
                  {error}
                </p>
              )}

              <button
                className="primary-button"
                onClick={
                  resetMasterPassword
                }
                disabled={
                  isUnlocking ||
                  newPassword.length ===
                    0 ||
                  confirmPassword.length ===
                    0
                }
              >
                {isUnlocking
                  ? "Resetting..."
                  : "Set New Password"}
              </button>
            </>
          )}
        </div>
      </section>
    </main>
  );
}

export default UnlockVaultView;
