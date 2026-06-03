import { createContext, useContext, useEffect, useState, ReactNode } from "react";

// @ts-ignore
const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || "").replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase: any = null;
try {
  // @ts-ignore
  if (window.supabase) {
    // @ts-ignore
    supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
  }
} catch (err) {
  console.error("Failed to initialize Supabase within AuthContext:", err);
}

export interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  created_at?: string;
}

interface AuthContextType {
  user: any | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, extra: { first_name: string; last_name: string }) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchProfile = async (userId: string) => {
    if (!supabase) return null;
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (!error && data) {
        setProfile(data);
      } else if (error) {
        console.error("Error fetching user profile:", error);
      }
    } catch (e) {
      console.error("Error inside fetchProfile:", e);
    }
  };

  const refreshProfile = async () => {
    if (user?.id) {
      await fetchProfile(user.id);
    }
  };

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    // Get current session
    supabase.auth.getSession().then(({ data: { session } }: any) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id).finally(() => setLoading(false));
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: string, session: any) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!supabase) return { error: { message: "Supabase client not loaded" } };
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (error) return { error };
      setUser(data.user);
      if (data.user) {
        await fetchProfile(data.user.id);
      }
      return { error: null };
    } catch (err: any) {
      return { error: err };
    }
  };

  const signUp = async (email: string, password: string, extra: { first_name: string; last_name: string }) => {
    if (!supabase) return { error: { message: "Supabase client not loaded" } };
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password
      });
      
      if (error) return { error };

      const newUser = data.user;
      if (newUser) {
        // Insert profile
        const { error: profileError } = await supabase
          .from("profiles")
          .insert([
            {
              id: newUser.id,
              first_name: extra.first_name,
              last_name: extra.last_name,
              email: email
            }
          ]);

        if (profileError) {
          console.error("Error creating profile:", profileError);
        }
        
        setUser(newUser);
        await fetchProfile(newUser.id);
      }
      return { error: null };
    } catch (err: any) {
      return { error: err };
    }
  };

  const signOut = async () => {
    if (!supabase) return;
    try {
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
    } catch (err) {
      console.error("Error signing out:", err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
