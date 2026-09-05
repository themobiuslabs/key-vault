import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import Sidebar from "./components/Sidebar";
import CredentialsView from "./views/CredentialsView";
import AddCredentialView from "./views/AddCredentialView";
import CredentialDetailsView from "./views/CredentialDetailsView";
import type { Credential } from "./types/credential";
import "./App.css";

type View = "credentials" | "add" | "details";

function App() {
  const [view, setView] = useState<View>("credentials");
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [selectedCredential, setSelectedCredential] =
    useState<Credential | null>(null);

  async function loadCredentials() {
    try {
      const result = await invoke<Credential[]>("get_credentials");
      setCredentials(result);
    } catch (error) {
      console.error("Failed to load credentials:", error);
    }
  }

  useEffect(() => {
    loadCredentials();
  }, []);

  function openCredential(credential: Credential) {
    setSelectedCredential(credential);
    setView("details");
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
          />
        )}
      </main>
    </div>
  );
}

export default App;