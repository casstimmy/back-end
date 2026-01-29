// components/Layout.js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Nav from "@/components/Nav";
import NavBar from "@/components/NavBar";

export default function Layout({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isNavOpen, setIsNavOpen] = useState(false); // for mobile
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        
        if (data.user) {
          setUser(data.user);
        } else {
          router.push("/login");
        }
      } catch (error) {
        console.error("[Layout] Auth check failed:", error);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) return null;

  const toggleNav = () => setIsNavOpen(!isNavOpen);
  const closeNav = () => setIsNavOpen(false);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top NavBar */}
      <NavBar onMenuToggle={toggleNav} user={user} />

      {/* Sidebar / Nav */}
      <Nav isOpen={isNavOpen} onClose={closeNav} />

      {/* Main Content */}
      <main className="pt-16 sm:pt-16 sm:pl-20 flex-1 bg-slate-50">{children}</main>
    </div>
  );
}
