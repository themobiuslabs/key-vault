import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import type {
  Credential,
  CreateCredential,
} from "../types/credential";
import SecretInput from "../components/SecretInput";

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
  const [title, setTitle] =
    useState(credential.title);

  const [provider, setProvider] =
    useState(credential.provider);

  const [credentialType, setCredentialType] =
    useState(credential.credential_type);

  const [apiKey, setApiKey] =
    useState(credential.api_key);

  const [secretKey, setSecretKey] =
    useState(
      credential.secret_key ?? ""
    );

  const [notes, setNotes] =
    useState(credential.notes ?? "");

  const [tags, setTags] =
    useState(
      credential.tags.join(", ")
    );

  const [error, setError] =
    useState("");

  const [isSaving, setIsSaving] =
    useState(false);

  async function updateCredential() {
    if (isSaving) {
      return;
    }

    setError("");

    const trimmedTitle =
      title.trim();

    const trimmedProvider =
      provider.trim();

    const trimmedApiKey =
      apiKey.trim();

    if (trimmedTitle.length === 0) {
      setError(
        "Please enter a title."
      );
      return;
    }

    if (trimmedProvider.length === 0) {
      setError(
        "Please enter a provider."
      );
      return;
    }

    if (trimmedApiKey.length === 0) {
      setError(
        "Please enter an API key."
      );
      return;
    }

    const tagList = tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(
        (tag) => tag.length > 0
      );

    const updatedCredential:
      CreateCredential = {
      title: trimmedTitle,
      provider: trimmedProvider,
      credential_type:
        credentialType,
      api_key: trimmedApiKey,
      secret_key:
        secretKey || null,
      notes:
        notes.trim() || null,
      tags: tagList,
    };

    setIsSaving(true);

    try {
      await invoke(
        "update_credential",
        {
          id: credential.id,
          credential:
            updatedCredential,
        }
      );

      onCredentialUpdated();
    } catch (error) {
      console.error(
        "Failed to update credential:",
        error
      );

      setError(
        "Failed to update credential. Please try again."
      );
    } finally {
      setIsSaving(false);
    }
  }

  function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    updateCredential();
  }

  return (
    <>
      <header className="header">
        <div>
          <button
            className="back-button"
            onClick={onBack}
            type="button"
            disabled={isSaving}
          >
            ← Back to credential
          </button>

          <p className="eyebrow">
            EDIT CREDENTIAL
          </p>

          <h1>
            Edit Credential
          </h1>

          <p className="subtitle">
            Update your developer credential.
          </p>
        </div>
      </header>

      <section className="card">
        <form
          onSubmit={handleSubmit}
        >
          <div className="form-grid">
            <label>
              <span>Title</span>

              <input
                value={title}
                onChange={(event) =>
                  setTitle(
                    event.target.value
                  )
                }
                placeholder="e.g. OpenAI Production"
                disabled={isSaving}
              />
            </label>

            <label>
              <span>Provider</span>

              <input
                value={provider}
                onChange={(event) =>
                  setProvider(
                    event.target.value
                  )
                }
                placeholder="e.g. OpenAI"
                disabled={isSaving}
              />
            </label>

            <label>
              <span>
                Credential type
              </span>

              <select
                value={credentialType}
                onChange={(event) =>
                  setCredentialType(
                    event.target.value
                  )
                }
                disabled={isSaving}
              >
                <option value="API Key">
                  API Key
                </option>

                <option value="Access Key Pair">
                  Access Key Pair
                </option>

                <option value="OAuth Token">
                  OAuth Token
                </option>

                <option value="Other">
                  Other
                </option>
              </select>
            </label>

            <label>
              <span>
                API Key
              </span>

              <SecretInput
                value={apiKey}
                onChange={setApiKey}
                placeholder="Enter API key"
                disabled={isSaving}
              />

              <small>
                The secret value used to
                authenticate with the provider.
              </small>
            </label>

            <label>
              <span>
                Secret Key{" "}
                <small>
                  Optional
                </small>
              </span>

              <SecretInput
                value={secretKey}
                onChange={setSecretKey}
                placeholder="Enter secret key"
                disabled={isSaving}
              />

              <small>
                Use this for credentials that
                require a second secret value.
              </small>
            </label>

            <label>
              <span>
                Tags{" "}
                <small>
                  Optional
                </small>
              </span>

              <input
                value={tags}
                onChange={(event) =>
                  setTags(
                    event.target.value
                  )
                }
                placeholder="ai, production, personal"
                disabled={isSaving}
              />

              <small>
                Separate multiple tags with commas.
              </small>
            </label>

            <label className="full-width">
              <span>
                Notes{" "}
                <small>
                  Optional
                </small>
              </span>

              <textarea
                value={notes}
                onChange={(event) =>
                  setNotes(
                    event.target.value
                  )
                }
                placeholder="Add anything useful about this credential..."
                rows={4}
                disabled={isSaving}
              />
            </label>
          </div>

          {error && (
            <p className="setup-error">
              {error}
            </p>
          )}

          <div className="form-footer">
            <button
              className="secondary-button"
              onClick={onBack}
              type="button"
              disabled={isSaving}
            >
              Cancel
            </button>

            <button
              className="primary-button"
              type="submit"
              disabled={isSaving}
            >
              {isSaving
                ? "Saving..."
                : "Save Changes"}
            </button>
          </div>
        </form>
      </section>
    </>
  );
}

export default EditCredentialView;