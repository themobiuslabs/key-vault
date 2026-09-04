type EmptyStateProps = {
  onAddCredential: () => void;
};

function EmptyState({ onAddCredential }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <div className="empty-icon">K</div>

      <h3>No credentials yet</h3>

      <p>
        Add your first developer credential to your vault.
      </p>

      <button
        className="primary-button"
        onClick={onAddCredential}
      >
        Add Credential
      </button>
    </div>
  );
}

export default EmptyState;