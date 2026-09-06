import { useState } from "react";
import type { Credential } from "../types/credential";
import CredentialCard from "../components/CredentialCard";
import EmptyState from "../components/EmptyState";

type CredentialsViewProps = {
  credentials: Credential[];
  onAddCredential: () => void;
  onCredentialClick: (credential: Credential) => void;
};

function CredentialsView({
  credentials,
  onAddCredential,
  onCredentialClick,
}: CredentialsViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [credentialTypeFilter, setCredentialTypeFilter] =
    useState("All");

  const filteredCredentials = credentials.filter(
    (credential) => {
      const query = searchQuery.toLowerCase().trim();

      const matchesSearch =
        query.length === 0 ||
        credential.title.toLowerCase().includes(query) ||
        credential.provider.toLowerCase().includes(query) ||
        credential.tags.some((tag) =>
          tag.toLowerCase().includes(query)
        );

      const matchesType =
        credentialTypeFilter === "All" ||
        credential.credential_type === credentialTypeFilter;

      return matchesSearch && matchesType;
    }
  );

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

        {credentials.length > 0 && (
          <div className="search-controls">
            <input
              value={searchQuery}
              onChange={(event) =>
                setSearchQuery(event.target.value)
              }
              placeholder="Search credentials..."
            />

            <select
              value={credentialTypeFilter}
              onChange={(event) =>
                setCredentialTypeFilter(event.target.value)
              }
            >
              <option value="All">All types</option>
              <option value="API Key">API Key</option>
              <option value="Access Key Pair">
                Access Key Pair
              </option>
              <option value="OAuth Token">
                OAuth Token
              </option>
              <option value="Other">Other</option>
            </select>
          </div>
        )}

        {credentials.length > 0 ? (
          filteredCredentials.length > 0 ? (
            <div className="credential-list">
              {filteredCredentials.map((credential) => (
                <CredentialCard
                  key={credential.id}
                  credential={credential}
                  onClick={() =>
                    onCredentialClick(credential)
                  }
                />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">K</div>

              <h3>No matching credentials</h3>

              <p>
                Try changing your search or filter.
              </p>
            </div>
          )
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