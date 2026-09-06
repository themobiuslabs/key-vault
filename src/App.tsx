import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import Sidebar from "./components/Sidebar";
import CredentialsView from "./views/CredentialsView";
import AddCredentialView from "./views/AddCredentialView";
import CredentialDetailsView from "./views/CredentialDetailsView";
import EditCredentialView from "./views/EditCredentialView";
import type { Credential } from "./types/credential";
import "./App.css";

type View = "credentials" | "add" | "details" | "edit";

function App() {
  const [view, setView] = useState<View>("credentials");
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [selectedCredential, setSelectedCredential] =
    useState<Credential | null>(null);

  async function loadCredentials(): Promise<Credential[]> {
    try {
      const result = await invoke<Credential[]>("get_credentials");
      setCredentials(result);
      return result;
    } catch (error) {
      console.error("Failed to load credentials:", error);
      return [];
    }
  }

  useEffect(() => {
    loadCredentials();
  }, []);

  function openCredential(credential: Credential) {
    setSelectedCredential(credential);
    setView("details");
  }

  async function handleCredentialUpdated() {
    const updatedCredentials = await loadCredentials();

    if (selectedCredential) {
      const updatedCredential = updatedCredentials.find(
        (credential) =>
          credential.id === selectedCredential.id
      );

      if (updatedCredential) {
        setSelectedCredential(updatedCredential);
      }
    }

    setView("details");
  }

  async function handleCredentialDeleted() {
    setSelectedCredential(null);
    await loadCredentials();
    setView("credentials");
  }

  return (
    <div className="app">
      <Sidebar
        view={view}
        onViewChange={setView}
      />

      <main className="main">
        {view === "credentials" && (
          <CredentialsView
            credentials={credentials}
            onAddCredential={() => setView("add")}
            onCredentialClick={openCredential}
          />
        )}

        {view === "add" && (
          <AddCredentialView
            onBack={() => setView("credentials")}
            onCredentialSaved={async () => {
              await loadCredentials();
              setView("credentials");
            }}
          />
        )}

        {view === "details" && selectedCredential && (
          <CredentialDetailsView
            credential={selectedCredential}
            onBack={() => setView("credentials")}
            onEdit={() => setView("edit")}
            onCredentialDeleted={handleCredentialDeleted}
          />
        )}

        {view === "edit" && selectedCredential && (
          <EditCredentialView
            credential={selectedCredential}
            onBack={() => setView("details")}
            onCredentialUpdated={handleCredentialUpdated}
          />
        )}
      </main>
    </div>
  );
}

export default App;