type SidebarProps = {
  view: "credentials" | "add";
  onViewChange: (view: "credentials" | "add") => void;
};

function Sidebar({ view, onViewChange }: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="logo">
        <div className="logo-mark">K</div>
        <span>KeyVault</span>
      </div>

      <nav>
        <button
          className={`nav-item ${
            view === "credentials" ? "active" : ""
          }`}
          onClick={() => onViewChange("credentials")}
        >
          Credentials
        </button>

        <button
          className={`nav-item ${view === "add" ? "active" : ""}`}
          onClick={() => onViewChange("add")}
        >
          + Add New
        </button>

        <button className="nav-item">
          Settings
        </button>
      </nav>
    </aside>
  );
}

export default Sidebar;