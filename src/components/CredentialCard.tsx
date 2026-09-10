import type { Credential } from "../types/credential";

type CredentialCardProps = {
  credential: Credential;
  onClick: () => void;
};

function formatUpdatedTime(
  timestamp: string
): string {
  const updatedAt = new Date(timestamp);
  const now = new Date();

  const difference =
    now.getTime() - updatedAt.getTime();

  const seconds = Math.floor(
    difference / 1000
  );

  if (seconds < 60) {
    return "Updated just now";
  }

  const minutes = Math.floor(
    seconds / 60
  );

  if (minutes < 60) {
    return `Updated ${minutes} minute${
      minutes === 1 ? "" : "s"
    } ago`;
  }

  const hours = Math.floor(
    minutes / 60
  );

  if (hours < 24) {
    return `Updated ${hours} hour${
      hours === 1 ? "" : "s"
    } ago`;
  }

  const days = Math.floor(
    hours / 24
  );

  if (days < 30) {
    return `Updated ${days} day${
      days === 1 ? "" : "s"
    } ago`;
  }

  return `Updated on ${updatedAt.toLocaleDateString()}`;
}

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
        {credential.provider
          .charAt(0)
          .toUpperCase()}
      </div>

      <div className="credential-info">
        <h3>{credential.title}</h3>

        <p>{credential.provider}</p>

        <div className="credential-meta">
          <span>
            {credential.credential_type}
          </span>

          {credential.tags.map((tag) => (
            <span key={tag}>
              {tag}
            </span>
          ))}
        </div>

        <small className="credential-updated">
          {formatUpdatedTime(
            credential.updated_at
          )}
        </small>
      </div>
    </button>
  );
}

export default CredentialCard;