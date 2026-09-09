import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";

type UnlockVaultViewProps = {
  onUnlocked: () => void;
};

function UnlockVaultView({
  onUnlocked,
}: UnlockVaultViewProps) {
  const [mode, setMode] = useState<
    "password" | "recovery"
  >("password");

  const [password, setPassword] = useState("");
  const [recoveryKey, setRecoveryKey] =
    useState("");

  const [error, setError] = useState("");
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

      setError("Incorrect master password.");
    } finally {
      setIsUnlocking(false);
    }
  }

  async function unlockWithRecoveryKey() {
    setError("");
    setIsUnlocking(true);

    try {
      await invoke("recover_vault", {
        recoveryKey: recoveryKey.trim(),
      });

      setRecoveryKey("");
      onUnlocked();
    } catch (error) {
      console.error(
        "Failed to recover vault:",
        error
      );

      setError("Invalid recovery key.");
    } finally {
      setIsUnlocking(false);
    }
  }

  function switchMode(
    nextMode: "password" | "recovery"
  ) {
    setMode(nextMode);
    setError("");
    setPassword("");
    setRecoveryKey("");
  }

  return (
    <main className="setup-screen">
      <section className="setup-card">
        <div className="logo">
          <div className="logo-mark">K</div>
          <span>KeyVault</span>
        </div>

        <p className="eyebrow">
          VAULT LOCKED
        </p>

        <h1>
          {mode === "password"
            ? "Unlock your vault"
            : "Recover your vault"}
        </h1>

        <p className="subtitle">
          {mode === "password"
            ? "Enter your master password to access your credentials."
            : "Enter your recovery key to regain access to your vault."}
        </p>

        <div className="setup-form">
          {mode === "password" ? (
            <>
              <label>
                <span>Master password</span>

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
                      event.key === "Enter" &&
                      !isUnlocking &&
                      password.length > 0
                    ) {
                      unlockWithPassword();
                    }
                  }}
                  placeholder="Enter master password"
                  autoFocus
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
                onClick={() =>
                  switchMode("recovery")
                }
                disabled={isUnlocking}
              >
                Use Recovery Key
              </button>
            </>
          ) : (
            <>
              <label>
                <span>Recovery key</span>

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
                      event.key === "Enter" &&
                      !isUnlocking &&
                      recoveryKey.trim().length > 0
                    ) {
                      unlockWithRecoveryKey();
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
                  unlockWithRecoveryKey
                }
                disabled={
                  isUnlocking ||
                  recoveryKey.trim().length === 0
                }
              >
                {isUnlocking
                  ? "Recovering..."
                  : "Recover Vault"}
              </button>

              <button
                className="secondary-button"
                onClick={() =>
                  switchMode("password")
                }
                disabled={isUnlocking}
              >
                Use Master Password
              </button>
            </>
          )}
        </div>
      </section>
    </main>
  );
}

export default UnlockVaultView;