"use client";

import { StatusBadge } from "@/components/ui/status-badge";
import { useUsersQuery } from "@/server/queries";
import { useT } from "@/lib/i18n";
import { useApp } from "@/store/app-store";

export function UsersTable() {
  const tt = useT();
  const { data: users = [] } = useUsersQuery();
  const mfa = useApp((s) => s.mfa);

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="civix">
          <thead>
            <tr>
              <th>{tt("Name")}</th>
              <th>{tt("Email")}</th>
              <th>{tt("Role")}</th>
              <th>{tt("Department")}</th>
              <th>{tt("MFA")}</th>
              <th>{tt("Status")}</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td className="font-medium">{u.name}</td>
                <td className="text-sm">{u.email}</td>
                <td>{u.role}</td>
                <td>{u.dept}</td>
                <td>
                  {(u.mfa || mfa[u.email])
                    ? <span className="badge badge-pass">Enabled</span>
                    : <span className="badge badge-warn">Disabled</span>}
                </td>
                <td><StatusBadge value={u.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
