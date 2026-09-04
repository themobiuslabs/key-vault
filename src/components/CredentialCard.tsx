import type { Credential } from "../types/credential";

type CredentialCardProps = {
  credential: Credential;
};

function CredentialCard({ credential }: CredentialCardProps) {
  return (
    <div className="credential-card">
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
  );
}

export default CredentialCard;