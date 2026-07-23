import React, { useState } from "react";
import { User, Role, Department } from "./types";
import { 
  User as UserIcon,
  Eye, 
  EyeOff, 
  ArrowRight, 
  ShieldCheck, 
  AlertCircle,
  Key
} from "lucide-react";
import { motion } from "motion/react";
import CompanyLogo from "./CompanyLogo";

interface LoginScreenProps {
  users: User[];
  roles?: Role[];
  departments?: Department[];
  onLogin: (userId: string) => void;
}

export default function LoginScreen({ users, onLogin }: LoginScreenProps) {
  const [usernameInput, setUsernameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [rememberMe, setRememberMe] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!usernameInput.trim()) {
      setError("Please enter your username or email address.");
      return;
    }

    if (!passwordInput) {
      setError("Please enter your password.");
      return;
    }

    const cleanInput = usernameInput.trim().toLowerCase();
    const matchedUser = users.find(
      u => (u.username.toLowerCase() === cleanInput || u.email.toLowerCase() === cleanInput)
    );

    if (!matchedUser) {
      setError("Invalid username or email. Please check your credentials.");
      return;
    }

    const userPassword = matchedUser.password || "Br0adband#";
    if (passwordInput !== userPassword) {
      setError("Incorrect password for this account.");
      return;
    }

    // Success
    onLogin(matchedUser.id);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden font-sans">
      {/* Background Subtle Gradient Blobs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-amber-500/10 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-[400px] h-[300px] bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden z-10"
      >
        {/* Header Branding */}
        <div className="p-8 pb-6 border-b border-slate-800/80 bg-slate-950/50 text-center relative flex flex-col items-center">
          <CompanyLogo variant="login" theme="dark" />
          <h1 className="text-lg font-bold tracking-tight text-slate-100 mt-1">Time & Task Management System</h1>
          <p className="text-xs text-slate-400 mt-0.5 font-medium">Personnel Portal & Secure Authentication</p>

          <div className="mt-3 inline-flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-1 rounded-full text-[10px] text-amber-400 font-mono">
            <ShieldCheck className="h-3 w-3 text-emerald-400" />
            <span>Role-Based Access Control Enabled</span>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-4">
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-rose-500/10 border border-rose-500/20 text-rose-300 p-3 rounded-xl text-xs flex items-start gap-2.5"
            >
              <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </motion.div>
          )}

          <div className="space-y-1.5 text-xs">
            <label className="block text-slate-300 font-semibold flex items-center gap-1.5">
              <UserIcon className="h-3.5 w-3.5 text-amber-500" />
              Username or Email
            </label>
            <input
              type="text"
              required
              placeholder="e.g. subrata@dril.net.in"
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 text-slate-100 px-3.5 py-2.5 rounded-xl font-medium focus:outline-none transition-colors"
            />
          </div>

          <div className="space-y-1.5 text-xs">
            <label className="block text-slate-300 font-semibold flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Key className="h-3.5 w-3.5 text-amber-500" />
                Password
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Min 4 characters</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="••••••••"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 text-slate-100 pl-3.5 pr-10 py-2.5 rounded-xl font-mono focus:outline-none transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-500 hover:text-slate-300 transition-colors"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 text-xs">
            <label className="flex items-center gap-2 cursor-pointer text-slate-400">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-slate-800 text-amber-500 focus:ring-amber-500/20 bg-slate-950"
              />
              <span>Keep session logged in</span>
            </label>
          </div>

          <button
            type="submit"
            className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3 rounded-xl transition-all shadow-lg shadow-amber-500/10 flex items-center justify-center gap-2 text-xs cursor-pointer mt-2"
          >
            <span>Log In to Workspace</span>
            <ArrowRight className="h-4 w-4 font-bold" />
          </button>
        </form>
      </motion.div>

      {/* Footer copyright */}
      <div className="mt-8 text-center text-[11px] text-slate-600 font-medium">
        Time & Task Management System (Powered by Esteem Infra Projects Pvt Ltd) © 2026
      </div>
    </div>
  );
}
