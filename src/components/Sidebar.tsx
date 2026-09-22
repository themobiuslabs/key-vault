type SidebarProps = {
  view:
    | "credentials"
    | "add"
    | "details"
    | "edit"
    | "settings";

  onViewChange: (
    view:
      | "credentials"
      | "add"
      | "details"
      | "edit"
      | "settings"
  ) => void;
};

function Sidebar({
  view,
  onViewChange,
}: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="logo">
        <img
          className="logo-image"
          src="/key-vault-icon.png"
          alt=""
        />

        <span>Key Vault</span>
      </div>

      <nav>
        <button
          className={`nav-item ${
            view === "credentials" ||
            view === "details" ||
            view === "edit"
              ? "active"
              : ""
          }`}
          onClick={() =>
            onViewChange("credentials")
          }
        >
          Credentials
        </button>

        <button
          className={`nav-item ${
            view === "settings"
              ? "active"
              : ""
          }`}
          onClick={() =>
            onViewChange("settings")
          }
        >
          Settings
        </button>
      </nav>
    </aside>
  );
}

export default Sidebar;
