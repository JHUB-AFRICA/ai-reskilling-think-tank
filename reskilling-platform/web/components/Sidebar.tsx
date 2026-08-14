"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAppState } from "@/lib/state";
import { supabase } from "@/lib/supabase";
import styles from "./Sidebar.module.css";

const NAV_ITEMS = [
  { href: "/", label: "Workforce readiness" },
  { href: "/upload", label: "Upload resume" },
  { href: "/trends", label: "Labour market trends" },
  { href: "/pathway", label: "My reskilling pathway" },
  { href: "/lrs", label: "Learning Record Store" },
];

// Requires a signed-in Supabase session -- unlike the five pages
// above, which work fully anonymously against the platform's
// deterministic core.
const AUTH_NAV_ITEMS = [
  { href: "/dashboard", label: "My dashboard" },
  { href: "/guidance", label: "AI career guidance" },
  { href: "/history", label: "My analysis history" },
];

const ADMIN_NAV_ITEMS = [{ href: "/admin", label: "Manage users" }];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { session, sessionLoading, profile } = useAppState();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
  }

  return (
    <nav className={styles.sidebar}>
      <div className={styles.brand}>
        <span className={styles.brandMark} aria-hidden="true" />
        <div>
          <div className={styles.brandTitle}>Reskilling Platform</div>
          <div className={styles.brandSubtitle}>AI-driven skills gap analysis</div>
        </div>
      </div>

      <ul className={styles.navList}>
        {NAV_ITEMS.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className={pathname === item.href ? styles.navItemActive : styles.navItem}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>

      {session && (
        <>
          <div className={styles.navDivider}>Signed in</div>
          <ul className={styles.navList}>
            {AUTH_NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={pathname === item.href ? styles.navItemActive : styles.navItem}
                >
                  {item.label}
                </Link>
              </li>
            ))}
            {profile?.role === "administrator" &&
              ADMIN_NAV_ITEMS.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={pathname === item.href ? styles.navItemActive : styles.navItem}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
          </ul>
        </>
      )}

      <div className={styles.sessionBlock}>
        {sessionLoading ? (
          <span className={styles.sessionLabel}>Checking session...</span>
        ) : session ? (
          <>
            <div className={styles.sessionLabel}>{session.user.email}</div>
            <button className={styles.signOutButton} onClick={handleSignOut}>
              Sign out
            </button>
          </>
        ) : (
          <Link href="/login" className={styles.signInLink}>
            Sign in for career guidance & history
          </Link>
        )}
      </div>
    </nav>
  );
}
