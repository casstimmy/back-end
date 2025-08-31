import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Nav from "@/components/Nav";
import NavBar from "@/components/NavBar";

export default function Layout({ children }) {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) setUser(data.user);
        else router.push("/login"); // redirect if not logged in
      });
  }, [router]);

  if (!user) {
    return null; // or loading spinner
  }

  return (
    <div>
      <div className="bg-slate-50 min-h-screen flex">
        <Nav className="fixed top-24 left-0 h-full w-[5rem] z-10" />
        <div className="ml-[5rem] w-full flex justify-center overflow-hidden">
          <div className="w-full max-w-[calc(100%-42px)] p-6 mt-20 bg-slate-100">
            {children}
          </div>
        </div>
      </div>
      <NavBar />
    </div>
  );
}
