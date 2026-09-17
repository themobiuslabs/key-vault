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
  onCredentialUpdated: () => Promise<void>;
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

      try {
        await onCredentialUpdated();
      } catch (error) {
        console.error(
          "Credential updated but details refresh failed:",
          error
        );

        setError(
          "Credential updated, but the details could not be refreshed. Please try again."
        );
        return;
      }

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
            <label htmlFor="edit-title">
              <span>Title</span>

              <input
                id="edit-title"
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

            <label htmlFor="edit-provider">
              <span>Provider</span>

              <input
                id="edit-provider"
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

            <label htmlFor="edit-credential-type">
              <span>
                Credential type
              </span>

              <select
                id="edit-credential-type"
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

            <div className="form-field">
              <label htmlFor="edit-api-key">
                <span>
                  API Key
                </span>
              </label>

              <SecretInput
                id="edit-api-key"
                label="API key"
                value={apiKey}
                onChange={setApiKey}
                placeholder="Enter API key"
                describedBy="edit-api-key-help"
                disabled={isSaving}
              />

              <small id="edit-api-key-help">
                The secret value used to
                authenticate with the provider.
              </small>
            </div>

            <div className="form-field">
              <label htmlFor="edit-secret-key">
                <span>
                  Secret Key{" "}
                  <small>
                    Optional
                  </small>
                </span>
              </label>

              <SecretInput
                id="edit-secret-key"
                label="secret key"
                value={secretKey}
                onChange={setSecretKey}
                placeholder="Enter secret key"
                describedBy="edit-secret-key-help"
                disabled={isSaving}
              />

              <small id="edit-secret-key-help">
                Use this for credentials that
                require a second secret value.
              </small>
            </div>

            <label htmlFor="edit-tags">
              <span>
                Tags{" "}
                <small>
                  Optional
                </small>
              </span>

              <input
                id="edit-tags"
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

            <label
              className="full-width"
              htmlFor="edit-notes"
            >
              <span>
                Notes{" "}
                <small>
                  Optional
                </small>
              </span>

              <textarea
                id="edit-notes"
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
            <p className="setup-error" role="alert">
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
