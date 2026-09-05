import type { Credential } from "../types/credential";

type CredentialCardProps = {
  credential: Credential;
  onClick: () => void;
};

function CredentialCard({
  credential,
  onClick,
}: CredentialCardProps) {
  return (
    <button
      className="credential-card"
      onClick={onClick}
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
    </button>
  );
}

export default CredentialCard;