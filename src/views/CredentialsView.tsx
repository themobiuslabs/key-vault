import type { Credential } from "../types/credential";
import CredentialCard from "../components/CredentialCard";
import EmptyState from "../components/EmptyState";

type CredentialsViewProps = {
  credentials: Credential[];
  onAddCredential: () => void;
};

function CredentialsView({
  credentials,
  onAddCredential,
}: CredentialsViewProps) {
  return (
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
          onClick={onAddCredential}
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
              <CredentialCard
                key={credential.id}
                credential={credential}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            onAddCredential={onAddCredential}
          />
        )}
      </section>
    </>
  );
}

export default CredentialsView;