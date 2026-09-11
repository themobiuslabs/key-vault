import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import Sidebar from "./components/Sidebar";
import CredentialsView from "./views/CredentialsView";
import AddCredentialView from "./views/AddCredentialView";
import CredentialDetailsView from "./views/CredentialDetailsView";
import EditCredentialView from "./views/EditCredentialView";
import SetupVaultView from "./views/SetupVaultView";
import UnlockVaultView from "./views/UnlockVaultView";
import SettingsView from "./views/SettingsView";
import type { Credential } from "./types/credential";
import type { ThemePreference } from "./types/theme";
import "./App.css";

type View =
  | "credentials"
  | "add"
  | "details"
  | "edit"
  | "settings";

function App() {
  const [vaultInitialized, setVaultInitialized] =
    useState<boolean | null>(null);

  const [vaultUnlocked, setVaultUnlocked] =
    useState(false);

  const [view, setView] =
    useState<View>("credentials");

  const [credentials, setCredentials] =
    useState<Credential[]>([]);

  const [appError, setAppError] =
    useState("");

  const [selectedCredential, setSelectedCredential] =
    useState<Credential | null>(null);

  const [autoLockSeconds, setAutoLockSeconds] =
    useState(600);

  const [theme, setTheme] =
    useState<ThemePreference>("system");

  const [themeLoaded, setThemeLoaded] =
    useState(false);

  async function checkVaultStatus() {
    try {
      const initialized = await invoke<boolean>(
        "is_vault_initialized"
      );

      setVaultInitialized(initialized);

      if (initialized) {
        const unlocked = await invoke<boolean>(
          "is_vault_unlocked"
        );

        setVaultUnlocked(unlocked);
      }
    } catch (error) {
      console.error(
        "Failed to check vault status:",
        error
      );

      setAppError(
        "KeyVault could not check the vault status."
      );
    }
  }

  async function loadCredentials(): Promise<Credential[]> {
    try {
      setAppError("");

      const result = await invoke<Credential[]>(
        "get_credentials"
      );

      setCredentials(result);

      return result;
    } catch (error) {
      console.error(
        "Failed to load credentials:",
        error
      );

      setAppError(
        "KeyVault could not read your credentials. Your vault may be corrupted or unavailable."
      );

      throw error;
    }
  }

  async function loadAutoLockSetting() {
    try {
      const seconds =
        await invoke<number>(
          "get_auto_lock_seconds"
        );

      setAutoLockSeconds(seconds);
    } catch (error) {
      console.error(
        "Failed to load auto-lock setting:",
        error
      );
    }
  }

  async function loadThemeSetting() {
    try {
      const savedTheme =
        await invoke<ThemePreference>(
          "get_theme"
        );

      setTheme(savedTheme);
    } catch (error) {
      console.error(
        "Failed to load theme setting:",
        error
      );
    } finally {
      setThemeLoaded(true);
    }
  }

  useEffect(() => {
    loadThemeSetting();
    checkVaultStatus();
  }, []);

  useEffect(() => {
    if (vaultUnlocked) {
      loadCredentials().catch(() => {});
      loadAutoLockSetting();
    }
  }, [vaultUnlocked]);

  useEffect(() => {
    if (!vaultUnlocked) {
      return;
    }

    if (autoLockSeconds === 0) {
      return;
    }

    let timer: ReturnType<typeof setTimeout>;

    function resetAutoLockTimer() {
      clearTimeout(timer);

      timer = setTimeout(() => {
        handleLock();
      }, autoLockSeconds * 1000);
    }

    const activityEvents = [
      "mousemove",
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
    ];

    activityEvents.forEach(
      (eventName) => {
        window.addEventListener(
          eventName,
          resetAutoLockTimer
        );
      }
    );

    resetAutoLockTimer();

    return () => {
      clearTimeout(timer);

      activityEvents.forEach(
        (eventName) => {
          window.removeEventListener(
            eventName,
            resetAutoLockTimer
          );
        }
      );
    };
  }, [
    vaultUnlocked,
    autoLockSeconds,
  ]);

  async function handleLock() {
    try {
      await invoke("lock_vault");

      setCredentials([]);
      setSelectedCredential(null);
      setAppError("");
      setVaultUnlocked(false);
      setView("credentials");
    } catch (error) {
      console.error(
        "Failed to lock vault:",
        error
      );
    }
  }

  async function handleThemeChanged(
    nextTheme: ThemePreference
  ) {
    const previousTheme = theme;

    setTheme(nextTheme);

    try {
      await invoke("set_theme", {
        theme: nextTheme,
      });
    } catch (error) {
      setTheme(previousTheme);
      throw error;
    }
  }

  function openCredential(
    credential: Credential
  ) {
    setSelectedCredential(credential);
    setView("details");
  }

  async function handleCredentialUpdated() {
    const updatedCredentials =
      await loadCredentials();

    if (selectedCredential) {
      const updatedCredential =
        updatedCredentials.find(
          (credential) =>
            credential.id ===
            selectedCredential.id
        );

      if (updatedCredential) {
        setSelectedCredential(
          updatedCredential
        );
      }
    }

    setView("details");
  }

  async function handleCredentialDeleted() {
    setSelectedCredential(null);

    await loadCredentials();

    setView("credentials");
  }

  if (
    vaultInitialized === null ||
    !themeLoaded
  ) {
    return null;
  }

  if (!vaultInitialized) {
    return (
      <div
        className="app-root"
        data-theme={theme}
      >
        <SetupVaultView
          onVaultInitialized={() => {
            setVaultInitialized(true);
          }}
        />
      </div>
    );
  }

  if (!vaultUnlocked) {
    return (
      <div
        className="app-root"
        data-theme={theme}
      >
        <UnlockVaultView
          onUnlocked={() => {
            setVaultUnlocked(true);
          }}
        />
      </div>
    );
  }

  return (
    <div
      className="app app-root"
      data-theme={theme}
    >
      <Sidebar
        view={view}
        onViewChange={setView}
      />

      <main className="main">
        {appError && (
          <div className="setup-error">
            {appError}
          </div>
        )}

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginBottom: "20px",
          }}
        >
          <button
            className="secondary-button"
            onClick={handleLock}
          >
            Lock Vault
          </button>
        </div>

        {view === "credentials" && (
          <CredentialsView
            credentials={credentials}
            onAddCredential={() =>
              setView("add")
            }
            onCredentialClick={
              openCredential
            }
          />
        )}

        {view === "add" && (
          <AddCredentialView
            onBack={() =>
              setView("credentials")
            }
            onCredentialSaved={async () => {
              await loadCredentials();
              setView("credentials");
            }}
          />
        )}

        {view === "details" &&
          selectedCredential && (
            <CredentialDetailsView
              credential={
                selectedCredential
              }
              onBack={() =>
                setView("credentials")
              }
              onEdit={() =>
                setView("edit")
              }
              onCredentialDeleted={
                handleCredentialDeleted
              }
            />
          )}

        {view === "edit" &&
          selectedCredential && (
            <EditCredentialView
              credential={
                selectedCredential
              }
              onBack={() =>
                setView("details")
              }
              onCredentialUpdated={
                handleCredentialUpdated
              }
            />
          )}

        {view === "settings" && (
          <SettingsView
            onBack={() =>
              setView("credentials")
            }
            onAutoLockChanged={
              setAutoLockSeconds
            }
            theme={theme}
            onThemeChanged={
              handleThemeChanged
            }
          />
        )}
      </main>
    </div>
  );
}

export default App;
