"use client";

import { useEffect, useState } from "react";
import { useAppState } from "@/lib/state";
import { authedApi, ApiError, type UserProfile } from "@/lib/api";
import styles from "./page.module.css";

const ROLES: UserProfile["role"][] = ["job_seeker", "workforce_analyst", "administrator"];

export default function AdminPage() {
  const { session, sessionLoading, profile, profileLoading } = useAppState();
  const [users, setUsers] = useState<UserProfile[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (!session || profile?.role !== "administrator") return;
    authedApi
      .adminListUsers(session.access_token)
      .then(setUsers)
      .catch((e) => setError(e instanceof ApiError ? e.message : "Failed to load users."));
  }, [session, profile]);

  if (sessionLoading || profileLoading) {
    return <p>Loading...</p>;
  }

  if (!session) {
    return <p>Sign in required.</p>;
  }

  if (profile?.role !== "administrator") {
    return (
      <div>
        <h1>Manage users</h1>
        <p className={styles.denied}>
          This page requires the administrator role. Your current role is{" "}
          {profile?.role.replace("_", " ") ?? "unknown"}.
        </p>
      </div>
    );
  }

  async function handleRoleChange(userId: string, newRole: string) {
    setUpdatingId(userId);
    setError(null);
    try {
      await authedApi.adminUpdateRole(userId, newRole, session!.access_token);
      setUsers((prev) =>
        prev
          ? prev.map((u) => (u.id === userId ? { ...u, role: newRole as UserProfile["role"] } : u))
          : prev,
      );
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Role update failed.");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div>
      <h1>Manage users</h1>
      <p className={styles.lead}>
        Role changes take effect immediately. There is no undo confirmation — double-check
        before changing anyone to administrator.
      </p>

      {error && <p className={styles.error}>{error}</p>}

      {!users && <p>Loading users...</p>}

      {users && (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Email</th>
              <th>Role</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.email}</td>
                <td>
                  <select
                    value={u.role}
                    disabled={updatingId === u.id}
                    onChange={(e) => handleRoleChange(u.id, e.target.value)}
                    className={styles.select}
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r.replace("_", " ")}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
