import { useState } from "react";
import type { Credential } from "../types/credential";

type CredentialDetailsViewProps = {
  credential: Credential;
  onBack: () => void;
};

function CredentialDetailsView({
  credential,
  onBack,
}: CredentialDetailsViewProps) {
  const [showApiKey, setShowApiKey] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);

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
      </header>

      <section className="card">
        <div className="details-grid">
          <div className="detail">
            <span className="detail-label">Provider</span>
            <p>{credential.provider}</p>
          </div>

          <div className="detail">
            <span className="detail-label">Credential Type</span>
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
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {credential.secret_key && (
            <div className="detail full-width">
              <span className="detail-label">Secret Key</span>

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
      </section>
    </>
  );
}

export default CredentialDetailsView;