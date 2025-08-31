import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStore, faRightFromBracket, faBell } from "@fortawesome/free-solid-svg-icons";
import { useRouter } from "next/router";

// Custom hook for iron-session
import { useUser } from "@/lib/useUser";

const TopBar = () => {
  const router = useRouter();
  const { user, logout } = useUser();

  // Function to get initials
  const getInitials = (text) =>
    text
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();

  async function handleLogout() {
    await logout(); // clears session via /api/logout
    router.push("/login");
  }

  // Pick name or fallback to username
  const displayName = user?.name || user?.username || "Guest";
  const initials = getInitials(displayName) || "G";

  return (
    <div className="fixed top-0 w-full z-20 flex justify-between items-center py-3 px-6 bg-white shadow-md">
      {/* Left Section: Back Office Text */}
      <div className="flex items-center">
        <FontAwesomeIcon icon={faStore} className="w-6 h-6 text-gray-800 mr-3" />
        <h2 className="text-gray-800 text-xl font-semibold">Back Office</h2>
      </div>

      {/* Right Section: Profile and Icons */}
      <div className="flex items-center space-x-6">
        {/* Notification Icon */}
        <button className="relative">
          <FontAwesomeIcon icon={faBell} className="w-6 h-6 text-gray-700" />
          <span className="w-2.5 h-2.5 bg-red-500 rounded-full absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2"></span>
        </button>

        {/* Profile Section */}
        <div className="flex items-center space-x-3">
          {user?.image ? (
            <img
              src={user.image}
              alt="Profile"
              className="w-10 h-10 rounded-full object-cover border border-gray-300 shadow-sm"
            />
          ) : (
            <div className="w-10 h-10 flex items-center justify-center bg-gray-600 text-white rounded-full shadow-sm text-lg font-semibold">
              {initials}
            </div>
          )}

          <div className="flex flex-col">
            <span className="text-gray-900 font-semibold text-sm">{displayName}</span>
            <span className="text-xs text-gray-500">Welcome Back!</span>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center bg-red-600 hover:bg-red-700 text-white text-sm px-3 py-2 rounded-md shadow-sm transition duration-200"
          >
            <FontAwesomeIcon icon={faRightFromBracket} className="w-4 h-4 mr-2" />
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default TopBar;
