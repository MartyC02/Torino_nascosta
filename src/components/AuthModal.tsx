import { useState, useEffect, FormEvent } from "react";
import { useAuth } from "./AuthContext";
import { X } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: "login" | "register";
}

export function AuthModal({ isOpen, onClose, initialMode = "login" }: AuthModalProps) {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setErrorMsg("");
      setEmail("");
      setPassword("");
      setFirstName("");
      setLastName("");
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    if (!email || !password) {
      setErrorMsg("Email and password are required");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters long");
      setLoading(false);
      return;
    }

    try {
      if (mode === "login") {
        const { error } = await signIn(email, password);
        if (error) {
          setErrorMsg(error.message || "Invalid email or password");
        } else {
          onClose();
        }
      } else {
        if (!firstName || !lastName) {
          setErrorMsg("First and last name are required");
          setLoading(false);
          return;
        }

        const { error } = await signUp(email, password, {
          first_name: firstName,
          last_name: lastName
        });

        if (error) {
          setErrorMsg(error.message || "An error occurred during registration");
        } else {
          onClose();
        }
      }
    } catch (err: any) {
      setErrorMsg("Connection error with Supabase");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-white border border-border-color shadow-2xl rounded-sm w-full max-w-md overflow-hidden relative flex flex-col max-h-full">
        {/* Header */}
        <div className="bg-sidebar-bg text-white p-6 flex justify-between items-center border-b border-white/10 shrink-0">
          <div>
            <h3 className="font-serif italic text-xl text-accent-gold">
              {mode === "login" ? "Sign In" : "Sign Up"}
            </h3>
            <p className="text-[10px] uppercase tracking-widest text-white/60 mt-1">
              {mode === "login" ? "Sign in to customize Torino Nascosta" : "Create a free account"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-all hover:scale-110 p-1 rounded-full cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content & Form */}
        <div className="p-6 overflow-y-auto">
          {errorMsg && (
            <div className="bg-[#A41034]/10 border border-[#A41034]/30 text-[#A41034] text-xs px-4 py-3 rounded-sm mb-4 font-mono uppercase tracking-wider font-bold">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-text-light/70 tracking-widest mb-1.5">
                    First Name
                  </label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="First name"
                    className="w-full text-xs p-3 border border-border-color focus:border-accent-gold outline-none rounded-sm transition-all bg-bg-canvas"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-text-light/70 tracking-widest mb-1.5">
                    Last Name
                  </label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Last name"
                    className="w-full text-xs p-3 border border-border-color focus:border-accent-gold outline-none rounded-sm transition-all bg-bg-canvas"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-black uppercase text-text-light/70 tracking-widest mb-1.5">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full text-xs p-3 border border-border-color focus:border-accent-gold outline-none rounded-sm transition-all bg-bg-canvas"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-text-light/70 tracking-widest mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                className="w-full text-xs p-3 border border-border-color focus:border-accent-gold outline-none rounded-sm transition-all bg-bg-canvas"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full p-3 bg-sidebar-bg text-accent-gold hover:bg-black font-bold uppercase tracking-widest text-[11px] border border-accent-gold/20 hover:border-accent-gold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-center outline-none"
            >
              {loading ? "Processing..." : mode === "login" ? "Sign In" : "Sign Up"}
            </button>
          </form>

          {/* Mode Switcher */}
          <div className="mt-6 text-center border-t border-border-color/60 pt-4">
            <p className="text-xs text-text-light">
              {mode === "login" ? (
                <>
                  Don't have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setMode("register")}
                    className="text-accent-gold hover:underline font-bold focus:outline-none"
                  >
                    Register now
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setMode("login")}
                    className="text-accent-gold hover:underline font-bold focus:outline-none"
                  >
                    Sign in here
                  </button>
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
