import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { CreateCredential } from "../types/credential";

type AddCredentialViewProps = {
  onBack: () => void;
  onCredentialSaved: () => void;
};

function AddCredentialView({
  onBack,
  onCredentialSaved,
}: AddCredentialViewProps) {
  const [title, setTitle] = useState("");
  const [provider, setProvider] = useState("");
  const [credentialType, setCredentialType] = useState("API Key");
  const [apiKey, setApiKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState("");

  async function saveCredential() {
    const tagList = tags
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);

    const credential: CreateCredential = {
      title,
      provider,
      credential_type: credentialType,
      api_key: apiKey,
      secret_key: secretKey || null,
      notes: notes || null,
      tags: tagList,
    };

    try {
      await invoke("create_credential", {
        credential,
      });

      setTitle("");
      setProvider("");
      setCredentialType("API Key");
      setApiKey("");
      setSecretKey("");
      setNotes("");
      setTags("");

      onCredentialSaved();
    } catch (error) {
      console.error("Failed to save credential:", error);
    }
  }

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
              onChange={(event) => setProvider(event.target.value)}
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
            onClick={onBack}
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
  );
}

export default AddCredentialView;