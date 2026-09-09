import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";

type UnlockVaultViewProps = {
  onUnlocked: () => void;
};

function UnlockVaultView({
  onUnlocked,
}: UnlockVaultViewProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isUnlocking, setIsUnlocking] =
    useState(false);

  async function unlockVault() {
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

  return (
    <main className="setup-screen">
      <section className="setup-card">
        <div className="logo">
          <div className="logo-mark">K</div>
          <span>KeyVault</span>
        </div>

        <p className="eyebrow">VAULT LOCKED</p>

        <h1>Unlock your vault</h1>

        <p className="subtitle">
          Enter your master password to access your
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
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  unlockVault();
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
            onClick={unlockVault}
            disabled={
              isUnlocking || password.length === 0
            }
          >
            {isUnlocking
              ? "Unlocking..."
              : "Unlock Vault"}
          </button>
        </div>
      </section>
    </main>
  );
}

export default UnlockVaultView;