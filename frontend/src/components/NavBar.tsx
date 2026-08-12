import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Flame, Utensils, Network, Sparkles, User as UserIcon, Plus, ChevronDown, Check, ShieldAlert } from "lucide-react";
import { api } from "../api";
import type { User, DbHealth } from "../api";

interface NavBarProps {
  activeUser: string;
  setActiveUser: (name: string) => void;
}

export const NavBar: React.FC<NavBarProps> = ({ activeUser, setActiveUser }) => {
  const location = useLocation();
  const [users, setUsers] = useState<User[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dbHealth, setDbHealth] = useState<DbHealth | null>(null);

  // New User Form State
  const [newName, setNewName] = useState("");
  const [newFoodPref, setNewFoodPref] = useState("Any");
  const [newSpicePref, setNewSpicePref] = useState("Any");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const fetchUsers = async () => {
    try {
      const data = await api.getUsers();
      setUsers(data.map(d => d.u));
    } catch (err) {
      console.error("Failed to load users:", err);
    }
  };

  const fetchHealth = async () => {
    try {
      const health = await api.getHealth();
      setDbHealth(health);
    } catch (err) {
      console.error("Failed to fetch DB health:", err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchHealth();
    // Refresh health and users periodically
    const interval = setInterval(() => {
      fetchHealth();
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const newUser = await api.createUser({
        name: newName.trim(),
        food_preference: newFoodPref,
        spice_preference: newSpicePref
      });
      await fetchUsers();
      setActiveUser(newUser.name);
      setIsModalOpen(false);
      setNewName("");
      setNewFoodPref("Any");
      setNewSpicePref("Any");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to create profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSeed = async () => {
    if (!window.confirm("This will clear the current graph database and seed it with standard Andhra culinary nodes & relationships. Proceed?")) return;
    try {
      const res = await api.seedDatabase();
      alert(`Database successfully seeded! Created ${res.nodes_created} nodes and ${res.relationships_created} relationships.`);
      fetchUsers();
      fetchHealth();
      window.location.reload(); // Reload to refresh all state
    } catch (err: any) {
      alert(`Seeding failed: ${err.message}`);
    }
  };

  const navItems = [
    { path: "/", label: "Dashboard", icon: Utensils },
    { path: "/explorer", label: "Culinary Explorer", icon: Flame },
    { path: "/graph", label: "Graph Canvas", icon: Network },
    { path: "/recommendations", label: "Personalized", icon: Sparkles }
  ];

  return (
    <>
      <nav className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-2">
                <span className="text-2xl">🌶️</span>
                <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-brand-500 via-orange-400 to-spice-500 bg-clip-text text-transparent">
                  AndhraGraph
                </span>
              </Link>
            </div>

            {/* Nav Menu */}
            <div className="hidden md:flex space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? "bg-brand-500/10 border border-brand-500/20 text-brand-400"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
                    }`}
                  >
                    <Icon className={`h-4.5 w-4.5 ${isActive ? "text-brand-500" : ""}`} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Actions: DB Status, Seeding, User Profiles */}
            <div className="flex items-center space-x-3">
              {/* Database Health Badge */}
              {dbHealth && (
                <div
                  className={`hidden lg:flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                    dbHealth.database.connected
                      ? "bg-emerald-950/30 border-emerald-800 text-emerald-400"
                      : "bg-amber-950/30 border-amber-800 text-amber-400"
                  }`}
                  title={dbHealth.database.error || dbHealth.message}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${dbHealth.database.connected ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
                  <span className="capitalize">{dbHealth.database.mode}</span>
                </div>
              )}

              {/* Seed Button */}
              <button
                onClick={handleSeed}
                className="hidden sm:inline-flex items-center text-xs font-medium px-2.5 py-1.5 rounded-lg border border-slate-700/80 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-slate-100 transition-colors"
              >
                Reset & Seed
              </button>

              {/* User Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsOpen(!isOpen)}
                  className="flex items-center space-x-2 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900/60 text-slate-200 hover:bg-slate-900 transition-colors"
                >
                  <div className="h-6 w-6 rounded-full bg-gradient-to-br from-brand-500 to-spice-600 flex items-center justify-center text-xs font-bold text-white uppercase">
                    {activeUser.slice(0, 2)}
                  </div>
                  <span className="text-sm font-semibold max-w-[90px] truncate">{activeUser}</span>
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                </button>

                {isOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-800 bg-slate-900 shadow-2xl z-50 py-1 divide-y divide-slate-800/80">
                    <div className="px-3.5 py-2 text-xs text-slate-500">
                      Select Active Profile
                    </div>
                    <div className="max-h-48 overflow-y-auto py-1">
                      {users.map((u) => (
                        <button
                          key={u.id}
                          onClick={() => {
                            setActiveUser(u.name);
                            setIsOpen(false);
                          }}
                          className="flex items-center justify-between w-full text-left px-3.5 py-2 text-sm text-slate-300 hover:bg-slate-800 transition-colors"
                        >
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-200">{u.name}</span>
                            <span className="text-xs text-slate-500">{u.food_preference} • {u.spice_preference} Spice</span>
                          </div>
                          {u.name.toLowerCase() === activeUser.toLowerCase() && (
                            <Check className="h-4.5 w-4.5 text-brand-500" />
                          )}
                        </button>
                      ))}
                    </div>
                    <div className="p-1.5">
                      <button
                        onClick={() => {
                          setIsModalOpen(true);
                          setIsOpen(false);
                        }}
                        className="flex items-center justify-center space-x-1.5 w-full py-2 px-3 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-500 rounded-lg transition-colors"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Create New Profile</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Database Offline Banner */}
      {dbHealth && !dbHealth.database.connected && (
        <div className="bg-amber-950/40 border-b border-amber-900/60 px-4 py-2 text-center text-xs sm:text-sm text-amber-300 flex items-center justify-center space-x-2">
          <ShieldAlert className="h-4.5 w-4.5 text-amber-500 shrink-0" />
          <span>
            CognoDB Cloud not connected (mode: <strong>Mock Fallback</strong>). Seeding will run in-memory. Configure .env with valid Bolt credentials to go live.
          </span>
        </div>
      )}

      {/* Create User Profile Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
              <UserIcon className="h-5 w-5 text-brand-500" />
              <span>Create Andhra Culinary Profile</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Customize your dietary profile to receive tailored, graph-based recommendations.
            </p>

            <form onSubmit={handleCreateUser} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Your Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Rama Rao"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-brand-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Dietary preference</label>
                  <select
                    value={newFoodPref}
                    onChange={(e) => setNewFoodPref(e.target.value)}
                    className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-brand-500 transition-colors"
                  >
                    <option value="Any">Any Diet</option>
                    <option value="Veg">Vegetarian</option>
                    <option value="Non-Veg">Non-Vegetarian</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Spice tolerance</label>
                  <select
                    value={newSpicePref}
                    onChange={(e) => setNewSpicePref(e.target.value)}
                    className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-brand-500 transition-colors"
                  >
                    <option value="Any">Any Spice</option>
                    <option value="Low">Low (Mild)</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High (Fiery)</option>
                  </select>
                </div>
              </div>

              {errorMsg && (
                <div className="text-xs text-rose-400 font-semibold bg-rose-950/20 border border-rose-900 rounded-lg p-2">
                  {errorMsg}
                </div>
              )}

              <div className="flex items-center justify-end space-x-3 pt-2 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-500 rounded-lg transition-colors flex items-center space-x-1.5"
                >
                  {isSubmitting ? "Creating..." : "Save Profile"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
