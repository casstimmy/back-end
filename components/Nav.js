import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHome,
  faCog,
  faList,
  faBoxes,
  faChartLine,
  faCashRegister,
  faHeadset,
  faCaretRight,
  faCoins,
} from "@fortawesome/free-solid-svg-icons";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";

export default function Sidebar() {
  const [openMenu, setOpenMenu] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { pathname } = router;

  const toggleMenu = (menu) => {
    setOpenMenu(openMenu === menu ? null : menu);
  };

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
    "px-2 py-4 text-gray-700 transition-all duration-300 hover:bg-blue-500 hover:text-white flex items-center justify-center flex-col text-xs cursor-pointer";
  const activeLink = `${baseLink} bg-blue-400 text-white font-semibold`;

  const renderMenuItem = (href, icon, label) => (
    <li key={href} className={pathname === href ? activeLink : baseLink}>
      <Link href={href} onClick={closeMenu}>
        <div className="flex flex-col items-center justify-center">
          <FontAwesomeIcon icon={icon} className="w-6 h-6" />
          <span className="text-xs">{label}</span>
        </div>
      </Link>
    </li>
  );

  const renderSubMenu = (items) =>
    items.map(({ href, label }) => (
      <li
        key={href}
        className="hover:bg-gray-200 h-12 flex items-center px-4"
        onClick={closeMenu}
      >
        <Link href={href} className="w-full h-full flex items-center">
          <span>{label}</span>
        </Link>
      </li>
    ));

  return (
    <>
      <aside className="fixed top-12 left-0 w-20 h-screen bg-gray-100 border-r z-10">
        <nav className="mt-8">
          <ul className="space-y-4">
            {renderMenuItem("/", faHome, "Home")}
            {renderMenuItem("/setup/setup", faCog, "Setup")}

            {/* Manage */}
            <li
              className={
                pathname.startsWith("/manage") ? activeLink : baseLink
              }
            >
              <div
                className="flex flex-col items-center justify-center cursor-pointer"
                onClick={() => toggleMenu("manage")}
              >
                <FontAwesomeIcon icon={faList} className="w-6 h-6" />
                <span className="text-xs">Manage</span>
                <FontAwesomeIcon
                  icon={faCaretRight}
                  className={`w-4 h-4 mt-1 transition-transform duration-300 ${
                    openMenu === "manage" ? "rotate-90" : ""
                  }`}
                />
              </div>
              <ul
                className={`absolute left-full pt-10 top-0 w-48 bg-white border border-gray-300 h-screen transition-all duration-300 ease-in-out z-50 ${
                  openMenu === "manage"
                    ? "translate-x-0 opacity-100 text-gray-500"
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
              className={
                pathname.startsWith("/stock") ? activeLink : baseLink
              }
            >
              <div
                className="flex flex-col items-center justify-center cursor-pointer"
                onClick={() => toggleMenu("stock")}
              >
                <FontAwesomeIcon icon={faBoxes} className="w-6 h-6" />
                <span className="text-xs">Stock</span>
                <FontAwesomeIcon
                  icon={faCaretRight}
                  className={`w-4 h-4 mt-1 transition-transform duration-300 ${
                    openMenu === "stock" ? "rotate-90" : ""
                  }`}
                />
              </div>
              <ul
                className={`absolute left-full pt-10 top-0 w-48 bg-white border border-gray-300 h-screen transition-all duration-300 ease-in-out z-50 ${
                  openMenu === "stock"
                    ? "translate-x-0 opacity-100 text-gray-500"
                    : "translate-x-48 opacity-0 pointer-events-none"
                }`}
              >
                {renderSubMenu([
                  { href: "/stock/management", label: "Stock Management" },
                  { href: "/stock/movement", label: "Stock Movement" },
                ])}
              </ul>
            </li>

             <li
              className={
                pathname.startsWith("/reporting") ? activeLink : baseLink
              }
            >
              <div
                className="flex flex-col items-center justify-center cursor-pointer"
                onClick={() => toggleMenu("reporting")}
              >
                <FontAwesomeIcon icon={faChartLine} className="w-6 h-6" />
                <span className="text-xs">Reporting</span>
                <FontAwesomeIcon
                  icon={faCaretRight}
                  className={`w-4 h-4 mt-1 transition-transform duration-300 ${
                    openMenu === "reporting" ? "rotate-90" : ""
                  }`}
                />
              </div>
              <ul
                className={`absolute left-full pt-10 top-0 w-48 bg-white border border-gray-300 h-screen transition-all duration-300 ease-in-out z-50 ${
                  openMenu === "reporting"
                    ? "translate-x-0 opacity-100 text-gray-500"
                    : "translate-x-48 opacity-0 pointer-events-none"
                }`}
              >
                {renderSubMenu([
                  { href: "/reporting/reporting", label: "Reporting" },
                  { href: "/reporting/completed-Transaction", label: "Completed Transaction" },
                ])}
              </ul>
            </li>
              <li
              className={
                pathname.startsWith("/expenses") ? activeLink : baseLink
              }
            >
              <div
                className="flex flex-col items-center justify-center cursor-pointer"
                onClick={() => toggleMenu("expenses")}
              >
                <FontAwesomeIcon icon={faCoins} className="w-6 h-6" />
                <span className="text-xs">Expenses</span>
                <FontAwesomeIcon
                  icon={faCaretRight}
                  className={`w-4 h-4 mt-1 transition-transform duration-300 ${
                    openMenu === "expenses" ? "rotate-90" : ""
                  }`}
                />
              </div>
              <ul
                className={`absolute left-full pt-10 top-0 w-48 bg-white border border-gray-300 h-screen transition-all duration-300 ease-in-out z-50 ${
                  openMenu === "expenses"
                    ? "translate-x-0 opacity-100 text-gray-500"
                    : "translate-x-48 opacity-0 pointer-events-none"
                }`}
              >
                {renderSubMenu([
                  { href: "/expenses/expenses", label: "Expenses Entry" },
                  { href: "/expenses/analysis", label: "Expenses Analysis" },
                  { href: "/expenses/tax-analysis", label: "Tax Analysis" },
                  { href: "/expenses/tax-personal", label: "Personal Tax Calculator" },


                ])}
              </ul>
            </li>
            {renderMenuItem("/till", faCashRegister, "Till")}
            {renderMenuItem("/support", faHeadset, "Support")}
          </ul>
        </nav>
      </aside>

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="w-16 h-16 border-4 border-white border-t-blue-500 rounded-full animate-spin"></div>
        </div>
      )}
    </>
  );
}
