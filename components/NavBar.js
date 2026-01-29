// components/NavBar.js
import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStore, faRightFromBracket, faBars } from "@fortawesome/free-solid-svg-icons";
import { useRouter } from "next/router";
import { useUser } from "@/lib/useUser";
import NotificationsCenter from "./NotificationsCenter";

export default function NavBar({ onMenuToggle, user }) {
  const router = useRouter();
  const { logout } = useUser();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const getInitials = (text) => text?.split(" ").map((n) => n[0]).join("").toUpperCase();

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  const displayName = user?.name || user?.username || "Guest";
  const initials = getInitials(displayName) || "G";

  return (
<div className="fixed top-0 w-full z-50 flex justify-between items-center py-3 px-4 sm:px-6 bg-gradient-to-r from-[#FAF8F5] to-[#FFFDF9] shadow-sm border-b border-[#E6E1DA]">
      {/* Left */}
      <div className="flex items-center gap-2">
        <button className="sm:hidden" onClick={onMenuToggle}>
          <FontAwesomeIcon icon={faBars} className="w-6 h-6 text-amber-600" />
        </button>
        <FontAwesomeIcon icon={faStore} className="w-6 h-6 text-amber-600" />
        <h2 className="text-[#3E2C1C] text-lg sm:text-xl font-semibold tracking-wide">Back Office</h2>
      </div>

      {/* Right */}
      <div className="flex items-center space-x-2 sm:space-x-6">
        <NotificationsCenter />

        <div className="relative">
          <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="flex items-center gap-2">
            {user?.image ? (
              <img src={user.image} alt="Profile" className="w-10 h-10 rounded-full object-cover border border-[#E6E1DA] shadow-sm" />
            ) : (
              <div className="w-10 h-10 flex items-center justify-center bg-amber-600 text-white rounded-full shadow-md text-lg font-semibold">{initials}</div>
            )}
            <span className="hidden sm:block text-sm text-[#3E2C1C] font-semibold">{displayName}</span>
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 shadow-lg rounded-md py-2">
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-amber-100"
              >
                <FontAwesomeIcon icon={faRightFromBracket} />
                Log Out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
