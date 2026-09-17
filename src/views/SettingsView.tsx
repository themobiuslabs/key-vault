import {
  useEffect,
  useState,
  type FormEvent,
} from "react";
import { invoke } from "@tauri-apps/api/core";
import type { ThemePreference } from "../types/theme";

type SettingsViewProps = {
  onBack: () => void;
  onAutoLockChanged: (
    seconds: number
  ) => void;
  theme: ThemePreference;
  onThemeChanged: (
    theme: ThemePreference
  ) => Promise<void>;
};

type SettingsAction =
  | "none"
  | "password"
  | "recovery";

const AUTO_LOCK_OPTIONS = [
  { label: "Never", seconds: 0 },
  { label: "1 minute", seconds: 60 },
  { label: "5 minutes", seconds: 300 },
  { label: "10 minutes", seconds: 600 },
  { label: "30 minutes", seconds: 1800 },
  { label: "1 hour", seconds: 3600 },
];

const THEME_OPTIONS: {
  label: string;
  value: ThemePreference;
}[] = [
  { label: "System", value: "system" },
  { label: "Light", value: "light" },
  { label: "Dark", value: "dark" },
];

function formatRecoveryKey(key: string): string {
  return key.match(/.{1,8}/g)?.join(" ") ?? key;
}

function SettingsView({
  onBack,
  onAutoLockChanged,
  theme,
  onThemeChanged,
}: SettingsViewProps) {
  const [action, setAction] =
    useState<SettingsAction>("none");

  const [currentPassword, setCurrentPassword] =
    useState("");

  const [newPassword, setNewPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [recoveryKey, setRecoveryKey] =
    useState<string | null>(null);

  const [hasSavedRecoveryKey, setHasSavedRecoveryKey] =
    useState(false);

  const [hasAcknowledgedRecoveryReplacement, setHasAcknowledgedRecoveryReplacement] =
    useState(false);

  const [isCopied, setIsCopied] =
    useState(false);

  const [isCopying, setIsCopying] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [isChanging, setIsChanging] =
    useState(false);

  const [
    isGeneratingRecoveryKey,
    setIsGeneratingRecoveryKey,
  ] = useState(false);

  const [autoLockSeconds, setAutoLockSeconds] =
    useState(600);

  const [isLoadingSettings, setIsLoadingSettings] =
    useState(true);

  const [isSavingAutoLock, setIsSavingAutoLock] =
    useState(false);

  const [isSavingTheme, setIsSavingTheme] =
    useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const seconds =
        await invoke<number>(
          "get_auto_lock_seconds"
        );

      setAutoLockSeconds(seconds);
      onAutoLockChanged(seconds);
    } catch (error) {
      console.error(
        "Failed to load settings:",
        error
      );

      setError(
        "Failed to load vault settings."
      );
    } finally {
      setIsLoadingSettings(false);
    }
  }

  function openAction(
    nextAction: SettingsAction
  ) {
    setAction(nextAction);
    setError("");
    setSuccess("");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setRecoveryKey(null);
    setHasSavedRecoveryKey(false);
    setHasAcknowledgedRecoveryReplacement(false);
    setIsCopied(false);
    setIsCopying(false);
  }

  function returnToDashboard() {
    setAction("none");
    setError("");
    setSuccess("");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setRecoveryKey(null);
    setHasSavedRecoveryKey(false);
    setHasAcknowledgedRecoveryReplacement(false);
    setIsCopied(false);
    setIsCopying(false);
  }

  async function changeMasterPassword() {
    if (isChanging) {
      return;
    }

    setError("");
    setSuccess("");

    if (currentPassword.length === 0) {
      setError(
        "Enter your current master password."
      );
      return;
    }

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

    setIsChanging(true);

    try {
      await invoke(
        "change_master_password",
        {
          currentPassword,
          newPassword,
        }
      );

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setSuccess(
        "Master password changed successfully."
      );
    } catch (error) {
      console.error(
        "Failed to change master password:",
        error
      );

      setError(
        "Current master password is incorrect."
      );
    } finally {
      setIsChanging(false);
    }
  }

  async function generateNewRecoveryKey() {
    if (isGeneratingRecoveryKey) {
      return;
    }

    setError("");
    setSuccess("");
    setIsGeneratingRecoveryKey(true);

    try {
      const generatedRecoveryKey =
        await invoke<string>(
          "generate_new_recovery_key"
        );

      setRecoveryKey(
        generatedRecoveryKey
      );

      setHasSavedRecoveryKey(false);
      setIsCopied(false);
    } catch (error) {
      console.error(
        "Failed to generate recovery key:",
        error
      );

      setError(
        "Could not generate a new recovery key. Please try again."
      );
    } finally {
      setIsGeneratingRecoveryKey(false);
    }
  }

  async function copyRecoveryKey() {
    if (!recoveryKey || isCopying) {
      return;
    }

    setIsCopying(true);

    try {
      await navigator.clipboard.writeText(
        recoveryKey
      );

      setIsCopied(true);
      setError("");

      setTimeout(() => {
        setIsCopied(false);
      }, 1500);
    } catch (error) {
      console.error(
        "Failed to copy recovery key:",
        error
      );

      setError(
        "Could not copy the recovery key."
      );
    } finally {
      setIsCopying(false);
    }
  }

  function confirmRecoveryKey() {
    if (!hasSavedRecoveryKey) {
      setError(
        "Please confirm that you have saved your recovery key."
      );
      return;
    }

    setRecoveryKey(null);
    setHasSavedRecoveryKey(false);
    setHasAcknowledgedRecoveryReplacement(false);
    setIsCopied(false);
    setIsCopying(false);

    setSuccess(
      "Recovery key updated successfully."
    );
  }

  async function handleAutoLockChange(
    seconds: number
  ) {
    if (isSavingAutoLock) {
      return;
    }

    setError("");
    setSuccess("");
    setIsSavingAutoLock(true);

    try {
      await invoke(
        "set_auto_lock_seconds",
        {
          seconds,
        }
      );

      setAutoLockSeconds(seconds);
      onAutoLockChanged(seconds);
    } catch (error) {
      console.error(
        "Failed to save auto-lock setting:",
        error
      );

      setError(
        "Failed to save auto-lock setting."
      );
    } finally {
      setIsSavingAutoLock(false);
    }
  }

  async function handleThemeChange(
    nextTheme: ThemePreference
  ) {
    if (isSavingTheme) {
      return;
    }

    setError("");
    setSuccess("");
    setIsSavingTheme(true);

    try {
      await onThemeChanged(nextTheme);
    } catch (error) {
      console.error(
        "Failed to save theme setting:",
        error
      );

      setError(
        "Failed to save theme setting."
      );
    } finally {
      setIsSavingTheme(false);
    }
  }

  function renderDashboard() {
    return (
      <>
        <header className="header">
          <div>
            <button
              className="back-button"
              onClick={onBack}
            >
              ← Back to credentials
            </button>

            <p className="eyebrow">
              SETTINGS
            </p>

            <h1>Settings</h1>

            <p className="subtitle">
              Manage your vault and application preferences.
            </p>
          </div>
        </header>

        {error && (
          <p className="setup-error" role="alert">
            {error}
          </p>
        )}

        {success && (
          <p className="settings-success" role="status">
            {success}
          </p>
        )}

        <section className="settings-group">
          <div className="settings-group-header">
            <h2>Security</h2>

            <p>
              Manage how your vault is protected.
            </p>
          </div>

          <div className="settings-card-grid">
            <button
              className="settings-card"
              onClick={() =>
                openAction("password")
              }
            >
              <div>
                <strong>
                  Master Password
                </strong>

                <span>
                  Change the password used to unlock your vault.
                </span>
              </div>

              <span className="settings-card-arrow">
                →
              </span>
            </button>

            <button
              className="settings-card"
              onClick={() =>
                openAction("recovery")
              }
            >
              <div>
                <strong>
                  Recovery Key
                </strong>

                <span>
                  Generate a new recovery key for your vault.
                </span>
              </div>

              <span className="settings-card-arrow">
                →
              </span>
            </button>
          </div>
        </section>

        <section className="settings-group">
          <div className="settings-group-header">
            <h2>Vault</h2>

            <p>
              Configure how your vault behaves while you are using it.
            </p>
          </div>

          <div className="settings-card-grid">
            <div className="settings-card settings-card-static">
              <div>
                <label
                  className="settings-card-label"
                  htmlFor="auto-lock-select"
                >
                  <strong>
                    Auto Lock
                  </strong>
                </label>

                <span id="auto-lock-description">
                  Automatically lock the vault after a period of inactivity.
                </span>
              </div>

              <select
                id="auto-lock-select"
                aria-describedby="auto-lock-description"
                value={autoLockSeconds}
                onChange={(event) =>
                  handleAutoLockChange(
                    Number(
                      event.target.value
                    )
                  )
                }
                disabled={
                  isLoadingSettings ||
                  isSavingAutoLock
                }
              >
                {AUTO_LOCK_OPTIONS.map(
                  (option) => (
                    <option
                      key={option.seconds}
                      value={option.seconds}
                    >
                      {option.label}
                    </option>
                  )
                )}
              </select>
            </div>
          </div>
        </section>

        <section className="settings-group">
          <div className="settings-group-header">
            <h2>Appearance</h2>

            <p>
              Customize how KeyVault looks.
            </p>
          </div>

          <div className="settings-card-grid">
            <div className="settings-card settings-card-static">
              <div>
                <label
                  className="settings-card-label"
                  htmlFor="theme-select"
                >
                  <strong>
                    Theme
                  </strong>
                </label>

                <span id="theme-description">
                  Choose the appearance of KeyVault.
                </span>
              </div>

              <select
                id="theme-select"
                aria-describedby="theme-description"
                value={theme}
                onChange={(event) =>
                  handleThemeChange(
                    event.target
                      .value as ThemePreference
                  )
                }
                disabled={isSavingTheme}
              >
                {THEME_OPTIONS.map(
                  (option) => (
                    <option
                      key={option.value}
                      value={option.value}
                    >
                      {option.label}
                    </option>
                  )
                )}
              </select>
            </div>
          </div>
        </section>
      </>
    );
  }

  function renderPasswordSettings() {
    return (
      <section className="settings-action-card">
        <div className="settings-action-header">
          <button
            className="back-button"
            onClick={
              returnToDashboard
            }
          >
            ← Back to settings
          </button>

          <h2>
            Change Master Password
          </h2>

          <p>
            Your current password will be verified before the new password is applied.
          </p>
        </div>

        <form
          className="settings-form"
          onSubmit={(event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            void changeMasterPassword();
          }}
        >
          <label>
            <span>
              Current master password
            </span>

            <input
              type="password"
              value={currentPassword}
              onChange={(event) =>
                setCurrentPassword(
                  event.target.value
                )
              }
              placeholder="Enter current password"
              autoComplete="current-password"
              autoFocus
            />
          </label>

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
              placeholder="Enter new password"
              autoComplete="new-password"
            />
          </label>

          <label>
            <span>
              Confirm new password
            </span>

            <input
              type="password"
              value={confirmPassword}
              onChange={(event) =>
                setConfirmPassword(
                  event.target.value
                )
              }
              placeholder="Confirm new password"
              autoComplete="new-password"
            />
          </label>

          {error && (
            <p className="setup-error" role="alert">
              {error}
            </p>
          )}

          {success && (
            <p className="settings-success" role="status">
              {success}
            </p>
          )}

          <button
            type="submit"
            className="primary-button"
            disabled={isChanging}
          >
            {isChanging
              ? "Changing Password..."
              : "Change Password"}
          </button>
        </form>
      </section>
    );
  }

  function renderRecoverySettings() {
    if (recoveryKey) {
      return (
        <section className="settings-action-card">
          <div className="settings-action-header">
            <button
              className="back-button"
              onClick={
                returnToDashboard
              }
            >
              ← Back to settings
            </button>

            <h2>
              Save Your New Recovery Key
            </h2>

            <p>
              This recovery key replaces your previous one. KeyVault will not show it again after you continue.
            </p>
          </div>

          <div className="settings-form">
            <div className="recovery-key-section">
              <div className="recovery-key-header">
                <div>
                  <span className="recovery-key-label">
                    Your new recovery key
                  </span>

                  <span className="recovery-key-meta">
                    64 characters
                  </span>
                </div>

                <span className="recovery-key-private">
                  Keep private
                </span>
              </div>

              <div className="recovery-key-container">
                <code className="recovery-key">
                  {formatRecoveryKey(
                    recoveryKey
                  )}
                </code>

                <button
                  type="button"
                  className="secondary-button recovery-copy-button"
                  onClick={copyRecoveryKey}
                  disabled={isCopying}
                >
                  {isCopying
                    ? "Copying..."
                    : isCopied
                    ? "Copied"
                    : "Copy recovery key"}
                </button>
              </div>

              {isCopied && (
                <p className="settings-success" role="status">
                  Recovery key copied to the clipboard.
                </p>
              )}

              <div className="recovery-key-warning">
                <span className="recovery-warning-icon">
                  !
                </span>

                <p>
                  Anyone with this key can recover your vault. KeyVault cannot show it to you again.
                </p>
              </div>
            </div>

            <label className="recovery-confirmation">
              <input
                type="checkbox"
                checked={
                  hasSavedRecoveryKey
                }
                onChange={(event) =>
                  setHasSavedRecoveryKey(
                    event.target.checked
                  )
                }
              />

              <span>
                I have saved my recovery key somewhere safe.
              </span>
            </label>

            {error && (
              <p className="setup-error" role="alert">
                {error}
              </p>
            )}

            <button
              className="primary-button"
              onClick={
                confirmRecoveryKey
              }
              disabled={!hasSavedRecoveryKey}
            >
              Continue
            </button>
          </div>
        </section>
      );
    }

    return (
      <section className="settings-action-card">
        <div className="settings-action-header">
          <button
            className="back-button"
            onClick={
              returnToDashboard
            }
          >
            ← Back to settings
          </button>

          <h2>
            Recovery Key
          </h2>

          <p>
            Generate a new recovery key if you want to replace your existing one.
          </p>
        </div>

        <div className="settings-form">
          <p className="settings-warning">
            Generating a new recovery key will invalidate your existing recovery key.
          </p>

          <label className="recovery-confirmation">
            <input
              type="checkbox"
              checked={
                hasAcknowledgedRecoveryReplacement
              }
              onChange={(event) =>
                setHasAcknowledgedRecoveryReplacement(
                  event.target.checked
                )
              }
              disabled={isGeneratingRecoveryKey}
            />

            <span>
              I understand that generating a new key will invalidate my existing recovery key.
            </span>
          </label>

          {error && (
            <p className="setup-error" role="alert">
              {error}
            </p>
          )}

          <button
            className="primary-button"
            onClick={
              generateNewRecoveryKey
            }
            disabled={
              isGeneratingRecoveryKey ||
              !hasAcknowledgedRecoveryReplacement
            }
          >
            {isGeneratingRecoveryKey
              ? "Generating..."
              : "Generate New Recovery Key"}
          </button>
        </div>
      </section>
    );
  }

  if (action === "password") {
    return renderPasswordSettings();
  }

  if (action === "recovery") {
    return renderRecoverySettings();
  }

  return renderDashboard();
}

export default SettingsView;
