import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import type {
  Credential,
  CreateCredential,
} from "../types/credential";

type EditCredentialViewProps = {
  credential: Credential;
  onBack: () => void;
  onCredentialUpdated: () => void;
};

function EditCredentialView({
  credential,
  onBack,
  onCredentialUpdated,
}: EditCredentialViewProps) {
  const [title, setTitle] = useState(credential.title);
  const [provider, setProvider] = useState(credential.provider);
  const [credentialType, setCredentialType] = useState(
    credential.credential_type
  );
  const [apiKey, setApiKey] = useState(credential.api_key);
  const [secretKey, setSecretKey] = useState(
    credential.secret_key ?? ""
  );
  const [notes, setNotes] = useState(
    credential.notes ?? ""
  );
  const [tags, setTags] = useState(
    credential.tags.join(", ")
  );

  async function updateCredential() {
    const tagList = tags
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);

    const updatedCredential: CreateCredential = {
      title,
      provider,
      credential_type: credentialType,
      api_key: apiKey,
      secret_key: secretKey || null,
      notes: notes || null,
      tags: tagList,
    };

    try {
      await invoke("update_credential", {
        id: credential.id,
        credential: updatedCredential,
      });

      onCredentialUpdated();
    } catch (error) {
      console.error("Failed to update credential:", error);
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
            ← Back to credential
          </button>

          <p className="eyebrow">EDIT CREDENTIAL</p>
          <h1>Edit Credential</h1>
          <p className="subtitle">
            Update your developer credential.
          </p>
        </div>
      </header>

      <section className="card">
        <div className="form-grid">
          <label>
            <span>Title</span>
            <input
              value={title}
              onChange={(event) =>
                setTitle(event.target.value)
              }
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
              <option value="OAuth Token">
                OAuth Token
              </option>
              <option value="Other">Other</option>
            </select>
          </label>

          <label>
            <span>API Key</span>
            <input
              value={apiKey}
              onChange={(event) =>
                setApiKey(event.target.value)
              }
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
              onChange={(event) =>
                setTags(event.target.value)
              }
              placeholder="ai, production, personal"
            />
          </label>

          <label className="full-width">
            <span>
              Notes <small>Optional</small>
            </span>
            <textarea
              value={notes}
              onChange={(event) =>
                setNotes(event.target.value)
              }
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
            onClick={updateCredential}
          >
            Save Changes
          </button>
        </div>
      </section>
    </>
  );
}

export default EditCredentialView;