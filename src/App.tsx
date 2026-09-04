import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";

type Credential = {
  id: string;
  title: string;
  provider: string;
  credential_type: string;
  api_key: string;
  secret_key: string | null;
  notes: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
};

type View = "credentials" | "add";

function App() {
  const [view, setView] = useState<View>("credentials");
  const [credentials, setCredentials] = useState<Credential[]>([]);

  const [title, setTitle] = useState("");
  const [provider, setProvider] = useState("");
  const [credentialType, setCredentialType] = useState("API Key");
  const [apiKey, setApiKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState("");

  async function loadCredentials() {
    try {
      const result = await invoke<Credential[]>("get_credentials");
      setCredentials(result);
    } catch (error) {
      console.error("Failed to load credentials:", error);
    }
  }

  async function saveCredential() {
    const tagList = tags
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);

    try {
      await invoke("create_credential", {
        credential: {
          title,
          provider,
          credential_type: credentialType,
          api_key: apiKey,
          secret_key: secretKey || null,
          notes: notes || null,
          tags: tagList,
        },
      });

      setTitle("");
      setProvider("");
      setCredentialType("API Key");
      setApiKey("");
      setSecretKey("");
      setNotes("");
      setTags("");

      await loadCredentials();
      setView("credentials");
    } catch (error) {
      console.error("Failed to save credential:", error);
    }
  }

  useEffect(() => {
    loadCredentials();
  }, []);

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="logo">
          <div className="logo-mark">K</div>
          <span>KeyVault</span>
        </div>

        <nav>
          <button
            className={`nav-item ${
              view === "credentials" ? "active" : ""
            }`}
            onClick={() => setView("credentials")}
          >
            Credentials
          </button>

          <button
            className={`nav-item ${view === "add" ? "active" : ""}`}
            onClick={() => setView("add")}
          >
            + Add New
          </button>

          <button className="nav-item">
            Settings
          </button>
        </nav>
      </aside>

      <main className="main">
        {view === "credentials" && (
          <>
            <header className="header">
              <div>
                <p className="eyebrow">YOUR VAULT</p>
                <h1>Credentials</h1>
                <p className="subtitle">
                  Manage your developer credentials locally.
                </p>
              </div>

              <button
                className="primary-button"
                onClick={() => setView("add")}
              >
                + Add Credential
              </button>
            </header>

            <section className="credentials-section">
              <div className="section-header">
                <div>
                  <h2>Saved credentials</h2>
                  <p>
                    {credentials.length === 0
                      ? "No credentials saved yet."
                      : `${credentials.length} credential${
                          credentials.length === 1 ? "" : "s"
                        }`}
                  </p>
                </div>
              </div>

              {credentials.length > 0 ? (
                <div className="credential-list">
                  {credentials.map((credential) => (
                    <div
                      className="credential-card"
                      key={credential.id}
                    >
                      <div className="credential-icon">
                        {credential.provider.charAt(0).toUpperCase()}
                      </div>

                      <div className="credential-info">
                        <h3>{credential.title}</h3>
                        <p>{credential.provider}</p>

                        <div className="credential-meta">
                          <span>{credential.credential_type}</span>

                          {credential.tags.map((tag) => (
                            <span key={tag}>{tag}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-icon">K</div>
                  <h3>No credentials yet</h3>
                  <p>
                    Add your first developer credential to your vault.
                  </p>
                  <button
                    className="primary-button"
                    onClick={() => setView("add")}
                  >
                    Add Credential
                  </button>
                </div>
              )}
            </section>
          </>
        )}

        {view === "add" && (
          <>
            <header className="header">
              <div>
                <button
                  className="back-button"
                  onClick={() => setView("credentials")}
                >
                  ← Back to credentials
                </button>

                <p className="eyebrow">NEW CREDENTIAL</p>
                <h1>Add Credential</h1>
                <p className="subtitle">
                  Add a developer credential to your local vault.
                </p>
              </div>
            </header>

            <section className="card">
              <div className="form-grid">
                <label>
                  <span>Title</span>
                  <input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="e.g. OpenAI Production"
                  />
                </label>

                <label>
                  <span>Provider</span>
                  <input
                    value={provider}
                    onChange={(event) =>
                      setProvider(event.target.value)
                    }
                    placeholder="e.g. OpenAI"
                  />
                </label>

                <label>
                  <span>Credential type</span>
                  <select
                    value={credentialType}
                    onChange={(event) =>
                      setCredentialType(event.target.value)
                    }
                  >
                    <option value="API Key">API Key</option>
                    <option value="Access Key Pair">
                      Access Key Pair
                    </option>
                    <option value="OAuth Token">OAuth Token</option>
                    <option value="Other">Other</option>
                  </select>
                </label>

                <label>
                  <span>API Key</span>
                  <input
                    value={apiKey}
                    onChange={(event) => setApiKey(event.target.value)}
                    placeholder="Enter API key"
                  />
                </label>

                <label>
                  <span>
                    Secret Key <small>Optional</small>
                  </span>
                  <input
                    type="password"
                    value={secretKey}
                    onChange={(event) =>
                      setSecretKey(event.target.value)
                    }
                    placeholder="Enter secret key"
                  />
                </label>

                <label>
                  <span>
                    Tags <small>Optional</small>
                  </span>
                  <input
                    value={tags}
                    onChange={(event) => setTags(event.target.value)}
                    placeholder="ai, production, personal"
                  />
                </label>

                <label className="full-width">
                  <span>
                    Notes <small>Optional</small>
                  </span>
                  <textarea
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    placeholder="Add anything useful about this credential..."
                    rows={4}
                  />
                </label>
              </div>

              <div className="form-footer">
                <button
                  className="secondary-button"
                  onClick={() => setView("credentials")}
                >
                  Cancel
                </button>

                <button
                  className="primary-button"
                  onClick={saveCredential}
                >
                  Save Credential
                </button>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

export default App;