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
        <div className="logo-mark">
          K
        </div>

        <span>KeyVault</span>
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