// components/Nav.js
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHome,
  faCog,
  faList,
  faBoxes,
  faChartLine,
  faCaretRight,
  faCoins,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";

export default function Nav({ isOpen, onClose }) {
  const [openMenu, setOpenMenu] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { pathname } = router;

  const toggleMenu = (menu) => setOpenMenu(openMenu === menu ? null : menu);
  const closeMenu = () => setOpenMenu(null);

  useEffect(() => {
    const handleStart = () => setLoading(true);
    const handleStop = () => setLoading(false);

    router.events.on("routeChangeStart", handleStart);
    router.events.on("routeChangeComplete", handleStop);
    router.events.on("routeChangeError", handleStop);

    return () => {
      router.events.off("routeChangeStart", handleStart);
      router.events.off("routeChangeComplete", handleStop);
      router.events.off("routeChangeError", handleStop);
    };
  }, [router]);

  const baseLink =
    "px-2 py-4 text-[#3E2C1C] transition-all duration-300 flex items-center justify-center flex-col text-xs cursor-pointer hover:text-amber-900 hover:bg-amber-100";
  const activeLink =
    "px-2 py-4 bg-amber-500 text-white font-semibold shadow-md flex items-center justify-center flex-col text-xs";

  const renderMenuItem = (href, icon, label) => (
    <li key={href} className={pathname === href ? activeLink : baseLink}>
      <Link href={href} onClick={onClose}>
        <div className="flex flex-col items-center justify-center">
          <FontAwesomeIcon icon={icon} className="w-6 h-6 mb-1" />
          <span className="text-xs">{label}</span>
        </div>
      </Link>
    </li>
  );

  const renderSubMenu = (items) =>
    items.map(({ href, label }) => (
      <li
        key={href}
        className="hover:bg-[#FAF8F5] hover:border-b hover:border-amber-800 text-base text-[#3E2C1C] hover:text-amber-800 h-[6%] flex items-center px-4 transition-colors"
        onClick={() => {
          closeMenu();
          onClose();
        }}
      >
        <Link href={href} className="w-full h-full flex items-center">
          <span>{label}</span>
        </Link>
      </li>
    ));

  return (
    <>
      {/* Mobile Backdrop */}
      <div
        className={`fixed inset-0 bg-black/40 transition-opacity duration-300 sm:hidden ${
          isOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      ></div>
      <aside
        className={`fixed top-16 left-0 h-[calc(100vh-4rem)] bg-gradient-to-b from-[#FAF8F5] to-[#FFFDF9] border-r border-[#E6E1DA] shadow-sm z-20 transform transition-transform duration-300 sm:translate-x-0 w-20 ${
          isOpen ? "translate-x-0" : "-translate-x-full sm:translate-x-0"
        }`}
      >
       

        <nav className="mt-8">
          <ul className="space-y-4">
            {renderMenuItem("/", faHome, "Home")}
            {renderMenuItem("/setup/setup", faCog, "Setup")}

            {/* Manage */}
            <li
              className={pathname.startsWith("/manage") ? activeLink : baseLink}
            >
              <div
                className="flex flex-col items-center justify-center cursor-pointer"
                onClick={() => toggleMenu("manage")}
              >
                <FontAwesomeIcon icon={faList} className="w-6 h-6 mb-1" />
                <span className="text-xs">Manage</span>
                <FontAwesomeIcon
                  icon={faCaretRight}
                  className={`w-4 h-4 mt-1 transition-transform duration-300 ${
                    openMenu === "manage" ? "rotate-90" : ""
                  }`}
                />
              </div>
              <ul
                className={`absolute left-full pt-10 top-0 w-48 bg-white border border-[#E6E1DA] h-screen shadow-md transition-all duration-300 ease-in-out z-50 ${
                  openMenu === "manage"
                    ? "translate-x-0 opacity-100"
                    : "translate-x-48 opacity-0 pointer-events-none"
                }`}
              >
                {renderSubMenu([
                  { href: "/manage/products", label: "Product List" },
                  { href: "/manage/archived", label: "Archived Products" },
                  { href: "/manage/categories", label: "Categories" },
                  { href: "/manage/orders", label: "Orders" },
                  { href: "/manage/staff", label: "Staff" },
                ])}
              </ul>
            </li>

            {/* Stock */}
            <li
              className={pathname.startsWith("/stock") ? activeLink : baseLink}
            >
              <div
                className="flex flex-col items-center justify-center cursor-pointer"
                onClick={() => toggleMenu("stock")}
              >
                <FontAwesomeIcon icon={faBoxes} className="w-6 h-6 mb-1" />
                <span className="text-xs">Stock</span>
                <FontAwesomeIcon
                  icon={faCaretRight}
                  className={`w-4 h-4 mt-1 transition-transform duration-300 ${
                    openMenu === "stock" ? "rotate-90" : ""
                  }`}
                />
              </div>
              <ul
                className={`absolute left-full pt-10 top-0 w-48 bg-white border border-[#E6E1DA] h-screen shadow-md transition-all duration-300 ease-in-out z-50 ${
                  openMenu === "stock"
                    ? "translate-x-0 opacity-100"
                    : "translate-x-48 opacity-0 pointer-events-none"
                }`}
              >
                {renderSubMenu([
                  { href: "/stock/management", label: "Stock Management" },
                  { href: "/stock/movement", label: "Stock Movement" },
                ])}
              </ul>
            </li>

            {/* Reporting */}
            <li
              className={
                pathname.startsWith("/reporting") ? activeLink : baseLink
              }
            >
              <div
                className="flex flex-col items-center justify-center cursor-pointer"
                onClick={() => toggleMenu("reporting")}
              >
                <FontAwesomeIcon icon={faChartLine} className="w-6 h-6 mb-1" />
                <span className="text-xs">Reporting</span>
                <FontAwesomeIcon
                  icon={faCaretRight}
                  className={`w-4 h-4 mt-1 transition-transform duration-300 ${
                    openMenu === "reporting" ? "rotate-90" : ""
                  }`}
                />
              </div>
              <ul
                className={`absolute left-full pt-10 top-0 w-48 bg-white border border-[#E6E1DA] h-screen shadow-md transition-all duration-300 ease-in-out z-50 ${
                  openMenu === "reporting"
                    ? "translate-x-0 opacity-100"
                    : "translate-x-48 opacity-0 pointer-events-none"
                }`}
              >
                {renderSubMenu([
                  { href: "/reporting/reporting", label: "Reporting" },
                  {
                    href: "/reporting/completed-Transaction",
                    label: "Completed Transaction",
                  },
                ])}
              </ul>
            </li>

            {/* Expenses */}
            <li
              className={
                pathname.startsWith("/expenses") ? activeLink : baseLink
              }
            >
              <div
                className="flex flex-col items-center justify-center cursor-pointer"
                onClick={() => toggleMenu("expenses")}
              >
                <FontAwesomeIcon icon={faCoins} className="w-6 h-6 mb-1" />
                <span className="text-xs">Expenses</span>
                <FontAwesomeIcon
                  icon={faCaretRight}
                  className={`w-4 h-4 mt-1 transition-transform duration-300 ${
                    openMenu === "expenses" ? "rotate-90" : ""
                  }`}
                />
              </div>
              <ul
                className={`absolute left-full pt-10 top-0 w-48 bg-white border border-[#E6E1DA] h-screen shadow-md transition-all duration-300 ease-in-out z-50 ${
                  openMenu === "expenses"
                    ? "translate-x-0 opacity-100"
                    : "translate-x-48 opacity-0 pointer-events-none"
                }`}
              >
                {renderSubMenu([
                  { href: "/expenses/expenses", label: "Expenses Entry" },
                  { href: "/expenses/analysis", label: "Expenses Analysis" },
                  { href: "/expenses/tax-analysis", label: "Tax Analysis" },
                  {
                    href: "/expenses/tax-personal",
                    label: "Personal Tax Calculator",
                  },
                ])}
              </ul>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="w-16 h-16 border-4 border-white border-t-amber-500 rounded-full animate-spin"></div>
        </div>
      )}
    </>
  );
}
