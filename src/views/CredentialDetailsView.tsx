import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { Credential } from "../types/credential";

type CredentialDetailsViewProps = {
  credential: Credential;
  onBack: () => void;
  onEdit: () => void;
  onCredentialDeleted: () => void;
};

function CredentialDetailsView({
  credential,
  onBack,
  onEdit,
  onCredentialDeleted,
}: CredentialDetailsViewProps) {
  const [showApiKey, setShowApiKey] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] =
    useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function deleteCredential() {
    setIsDeleting(true);

    try {
      await invoke("delete_credential", {
        id: credential.id,
      });

      onCredentialDeleted();
    } catch (error) {
      console.error("Failed to delete credential:", error);
      setIsDeleting(false);
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

          <p className="eyebrow">CREDENTIAL</p>
          <h1>{credential.title}</h1>
          <p className="subtitle">
            {credential.provider}
          </p>
        </div>

        <button
          className="primary-button"
          onClick={onEdit}
        >
          Edit Credential
        </button>
      </header>

      <section className="card">
        <div className="details-grid">
          <div className="detail">
            <span className="detail-label">Provider</span>
            <p>{credential.provider}</p>
          </div>

          <div className="detail">
            <span className="detail-label">
              Credential Type
            </span>
            <p>{credential.credential_type}</p>
          </div>

          <div className="detail full-width">
            <span className="detail-label">API Key</span>

            <div className="secret-row">
              <p className="secret-value">
                {showApiKey
                  ? credential.api_key
                  : "••••••••••••••••"}
              </p>

              <button
                className="secondary-button"
                onClick={() =>
                  setShowApiKey(!showApiKey)
                }
              >
                {showApiKey ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {credential.secret_key && (
            <div className="detail full-width">
              <span className="detail-label">
                Secret Key
              </span>

              <div className="secret-row">
                <p className="secret-value">
                  {showSecretKey
                    ? credential.secret_key
                    : "••••••••••••••••"}
                </p>

                <button
                  className="secondary-button"
                  onClick={() =>
                    setShowSecretKey(!showSecretKey)
                  }
                >
                  {showSecretKey ? "Hide" : "Show"}
                </button>
              </div>
            </div>
          )}

          {credential.tags.length > 0 && (
            <div className="detail full-width">
              <span className="detail-label">Tags</span>

              <div className="credential-meta">
                {credential.tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
            </div>
          )}

          {credential.notes && (
            <div className="detail full-width">
              <span className="detail-label">Notes</span>
              <p>{credential.notes}</p>
            </div>
          )}

          <div className="detail">
            <span className="detail-label">Created</span>
            <p>{credential.created_at}</p>
          </div>

          <div className="detail">
            <span className="detail-label">Updated</span>
            <p>{credential.updated_at}</p>
          </div>
        </div>

        <div className="danger-zone">
          <div>
            <h2>Delete credential</h2>
            <p>
              Permanently remove this credential from your vault.
            </p>
          </div>

          {!showDeleteConfirmation ? (
            <button
              className="danger-button"
              onClick={() =>
                setShowDeleteConfirmation(true)
              }
            >
              Delete Credential
            </button>
          ) : (
            <div className="delete-confirmation">
              <p>
                Are you sure you want to delete this credential?
              </p>

              <div className="confirmation-actions">
                <button
                  className="secondary-button"
                  onClick={() =>
                    setShowDeleteConfirmation(false)
                  }
                  disabled={isDeleting}
                >
                  Cancel
                </button>

                <button
                  className="danger-button"
                  onClick={deleteCredential}
                  disabled={isDeleting}
                >
                  {isDeleting
                    ? "Deleting..."
                    : "Yes, Delete"}
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

export default CredentialDetailsView;