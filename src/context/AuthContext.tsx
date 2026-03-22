import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import type { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { PlanType } from "@/lib/database.types";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoggedIn: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      throw error;
    }
    // Clear any cached data from previous sessions
    queryClient.clear();
    toast.success("Welcome back!");
    navigate("/dashboard/qr-generator");
  }, [navigate, queryClient]);

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      setLoading(true);
      const plan: PlanType = "trial";
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { 
            full_name: name,
            plan: plan
          },
        },
      });
      setLoading(false);
      if (error) {
        toast.error(error.message);
        throw error;
      }
      toast.success("Free 3-day trial started! 🎉");
      navigate("/dashboard/qr-generator");
    },
    [navigate]
  );

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully.");
    navigate("/login");
  }, [navigate]);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoggedIn: !!user,
        loading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
