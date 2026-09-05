type SidebarProps = {
  view: "credentials" | "add" | "details";
  onViewChange: (view: "credentials" | "add" | "details") => void;
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
            view === "credentials" || view === "details"
              ? "active"
              : ""
          }`}
          onClick={() => onViewChange("credentials")}
        >
          Credentials
        </button>

        <button className="nav-item">
          Settings
        </button>
      </nav>
    </aside>
  );
}

export default Sidebar;