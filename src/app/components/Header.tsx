"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { IoMdSearch } from "react-icons/io";
import { IoHelp, IoPersonOutline } from "react-icons/io5";
import { PiShoppingCartSimpleBold } from "react-icons/pi";
import { FaBars } from "react-icons/fa";
import { RxCross2 } from "react-icons/rx";
import { LuArrowUpRight } from "react-icons/lu";
import { FaUserCircle } from "react-icons/fa";

import styles from "./styles/Header.module.scss";
import { useCartCount } from "../hooks/useCartCount";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

interface HeaderProps {
  showGetApp?: boolean;
  showProfile?: boolean;
}

const Header: React.FC<HeaderProps> = ({
  showGetApp = true,
  showProfile = true,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const isLandingPage = pathname === "/";

  const [scrolling, setScrolling] = useState(false);
  const [userFullName, setUserFullName] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const { count: cartCount } = useCartCount();

  useEffect(() => {
    const handleScroll = () => {
      setScrolling(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        // Optional: Notify backend to invalidate the session
        await fetch(`${BACKEND_URL}/api/user/auth/logout`, {
          method: "POST",
          credentials: "include",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }

      // Clear token and redirect
      localStorage.removeItem("token");
      setUserFullName(null);
      window.dispatchEvent(new Event("authChanged")); // Notify header
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setUserFullName(null);
          return;
        }

        const response = await fetch(`${BACKEND_URL}/api/user/auth/user`, {
          credentials: "include",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setUserFullName(data.fullName);
        } else {
          setUserFullName(null);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        setUserFullName(null);
      }
    };

    fetchUser();

    // Listen for custom authChanged event
    const handleAuthChanged = () => {
      fetchUser();
    };
    window.addEventListener("authChanged", handleAuthChanged);
    return () => {
      window.removeEventListener("authChanged", handleAuthChanged);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (menuOpen && isMobile) {
      document.body.classList.add("menu-open");
    } else {
      document.body.classList.remove("menu-open");
    }
  }, [menuOpen, isMobile]);

  const handleLinkClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    // For regular links in the mobile menu: just close the menu on normal clicks.
    // We don't touch modifier clicks so the browser/Next.js can handle them.
    const isModifierClick = e.ctrlKey || e.metaKey || e.shiftKey || e.button === 1;

    if (isModifierClick) {
      return;
    }

    setMenuOpen(false);
  }, []);

  const handleCartClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      const isModifierClick = e.ctrlKey || e.metaKey || e.button === 1;

      if (isModifierClick) {
        // Explicitly open /cart in a new tab when using Ctrl/Cmd/middle-click
        e.preventDefault();
        window.open("/cart", "_blank", "noopener,noreferrer");
        return;
      }

      // Normal click: behave like other links (and close mobile menu if open)
      if (isMobile) {
        setMenuOpen(false);
      }
    },
    [isMobile]
  );

  const handleDropdownLinkClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    // Allow Ctrl+Click (or Cmd+Click on Mac) to open in new tab
    // Next.js Link handles this automatically, but we need to avoid closing dropdown
    const isModifierClick = e.ctrlKey || e.metaKey || e.shiftKey || e.button === 1;
    
    if (isModifierClick) {
      // Let the browser and Next.js Link handle modifier clicks naturally
      // Don't close dropdown, don't prevent default
      return;
    }
    
    // Only close dropdown on regular left clicks
    setShowDropdown(false);
  }, []);

  return (
    <header className={`${styles.header} ${scrolling ? styles.scrolled : ""}`}>
      <div className={styles.logoContainer}>
        <Link href="/">
          <Image
            src="https://res.cloudinary.com/dt45pu5mx/image/upload/v1754770229/FullLogo_Transparent_NoBuffer_1_fg1iux.png"
            alt="KAMPYN Logo"
            width={150} // adjust width as needed
            height={50} // adjust height as needed
          />
        </Link>
      </div>

      <div className={styles.menuToggle} onClick={() => setMenuOpen(!menuOpen)}>
        {menuOpen ? (
          <RxCross2 size={24} className={styles.menuToggleIcon} />
        ) : (
          <FaBars size={24} />
        )}
      </div>

      {!isLandingPage && menuOpen && isMobile && (
        <motion.div
          className={styles.overlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          onClick={() => setMenuOpen(false)}
        />
      )}

      {!isLandingPage ? (
        isMobile ? (
          <AnimatePresence>
            {menuOpen && (
              <motion.nav
                className={styles.navOptions}
                initial={{ x: "100%", opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: "100%", opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                <div className={styles.menuBox}>
                  <Link
                    href="/search"
                    className={`${styles.navItem} ${
                      pathname === "/search" ? styles.activeNavItem : ""
                    }`}
                    onClick={handleLinkClick}
                  >
                    <IoMdSearch size={24} />
                    <span>Search</span>
                  </Link>
                  <Link
                    href="/help"
                    className={`${styles.navItem} ${
                      pathname === "/help" ? styles.activeNavItem : ""
                    }`}
                    onClick={handleLinkClick}
                  >
                    <IoHelp size={24} />
                    <span>Help</span>
                  </Link>
                  <Link
                    href={userFullName ? "/profile" : "/login"}
                    className={`${styles.navItem} ${
                      pathname === "/profile" || pathname === "/login"
                        ? styles.activeNavItem
                        : ""
                    }`}
                    onClick={handleLinkClick}
                  >
                    <IoPersonOutline size={24} />
                    <span>{userFullName || "Login"}</span>
                  </Link>
                  <Link
                    href="/cart"
                    className={`${styles.navItem} ${styles.cartItem} ${
                      pathname === "/cart" ? styles.activeNavItem : ""
                    }`}
                    onClick={handleCartClick}
                  >
                    <div className={styles.cartIconWrapper}>
                      <PiShoppingCartSimpleBold size={24} />
                      {cartCount > 0 && (
                        <span className={styles.cartBadge}>{cartCount}</span>
                      )}
                    </div>
                    <span>Cart</span>
                  </Link>
                </div>
              </motion.nav>
            )}
          </AnimatePresence>
        ) : (
          <nav className={styles.navOptions}>
            <div className={styles.menuBox}>
              <Link
                href="/search"
                className={`${styles.navItem} ${
                  pathname === "/search" ? styles.activeNavItem : ""
                }`}
              >
                <IoMdSearch size={24} />
                <span>Search</span>
              </Link>
              <Link
                href="/help"
                className={`${styles.navItem} ${
                  pathname === "/help" ? styles.activeNavItem : ""
                }`}
              >
                <IoHelp size={24} />
                <span>Help</span>
              </Link>
              <Link
                href={userFullName ? "/profile" : "/login"}
                className={`${styles.navItem} ${
                  pathname === "/profile" || pathname === "/login"
                    ? styles.activeNavItem
                    : ""
                }`}
              >
                <IoPersonOutline size={24} />
                <span>{userFullName || "Login"}</span>
              </Link>
              <Link
                href="/cart"
                className={`${styles.navItem} ${styles.cartItem} ${
                  pathname === "/cart" ? styles.activeNavItem : ""
                }`}
                onClick={handleCartClick}
              >
                <div className={styles.cartIconWrapper}>
                  <PiShoppingCartSimpleBold size={24} />
                  {cartCount > 0 && (
                    <span className={styles.cartBadge}>{cartCount}</span>
                  )}
                </div>
                <span>Cart</span>
              </Link>
            </div>
          </nav>
        )
      ) : isMobile && menuOpen ? (
        <AnimatePresence>
          <motion.nav
            className={styles.navOptions}
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className={styles.menuBox}>
              {showGetApp && (
                <Link
                  href="/home"
                  className={styles.navItem}
                  onClick={handleLinkClick}
                >
                  <LuArrowUpRight size={24} />
                  <span>GET THE APP</span>
                </Link>
              )}
              {showProfile && (
                <Link
                  href={userFullName ? "/profile" : "/login"}
                  className={styles.navItem}
                  onClick={handleLinkClick}
                >
                  {userFullName ? (
                    <FaUserCircle size={24} />
                  ) : (
                    <IoPersonOutline size={24} />
                  )}
                  <span>{userFullName || "Login"}</span>
                </Link>
              )}
            </div>
          </motion.nav>
        </AnimatePresence>
      ) : (
        <div className={styles.rightOptions}>
          <Link href="/home" className={styles.navItem}>
            <LuArrowUpRight size={18} />
            <span>GET THE APP</span>
          </Link>

          {userFullName ? (
            <div className={styles.profileContainer} ref={dropdownRef}>
              <div
                className={styles.navItem}
                onClick={() => setShowDropdown((prev) => !prev)}
              >
                <FaUserCircle size={32} />
              </div>
              <AnimatePresence>
                {showDropdown && (
                  <motion.div
                    className={styles.dropdownWrapper}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className={styles.dropdownMenu}>
                      <Link
                        href="/profile"
                        className={styles.navItem}
                        style={{ fontSize: "1rem" }}
                        onClick={handleDropdownLinkClick}
                      >
                        <span style={{ fontSize: "1rem" }}>Profile</span>
                      </Link>
                      <Link
                        href="/activeorders"
                        className={styles.navItem}
                        style={{ fontSize: "1rem" }}
                        onClick={handleDropdownLinkClick}
                      >
                        <span style={{ fontSize: "1rem" }}>Orders</span>
                      </Link>
                      <Link
                        href="/fav"
                        className={styles.navItem}
                        style={{ fontSize: "1rem" }}
                        onClick={handleDropdownLinkClick}
                      >
                        <span style={{ fontSize: "1rem" }}>Favourites</span>
                      </Link>
                      <div
                        className={styles.navItem}
                        onClick={handleLogout}
                        style={{ fontSize: "1rem" }}
                      >
                        <span style={{ fontSize: "1rem" }}>Logout</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Link href="/login" className={styles.navItem}>
              <IoPersonOutline size={24} />
              <span>Login</span>
            </Link>
          )}
        </div>
      )}
    </header>
  );
};

export default Header;
