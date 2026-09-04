import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import Sidebar from "./components/Sidebar";
import type { Credential } from "./types/credential";
import CredentialCard from "./components/CredentialCard";
import EmptyState from "./components/EmptyState";
import CredentialsView from "./views/CredentialsView";
import AddCredentialView from "./views/AddCredentialView";
import "./App.css";

type View = "credentials" | "add";

function App() {
  const [view, setView] = useState<View>("credentials");
  const [credentials, setCredentials] = useState<Credential[]>([]);

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
      </main>
    </div>
  );
}

export default App;