"use client";

import { Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { useT } from "@/lib/i18n";

const users = [
  { id: "u1", name: "Eng. Fahad Al-Otaibi",   email: "fahad@aramco-lab.sa",  role: "Lab Engineer",     dept: "Concrete",  status: "active",   mfa: true  },
  { id: "u2", name: "Sarah Mansour",          email: "sarah@aramco-lab.sa",  role: "Project Manager",  dept: "Soil",      status: "active",   mfa: true  },
  { id: "u3", name: "Ahmed Hassan",           email: "ahmed@aramco-lab.sa",  role: "Lab Technician",   dept: "Concrete",  status: "active",   mfa: false },
  { id: "u4", name: "Yousef Al-Harbi",        email: "yousef@aramco-lab.sa", role: "Field Technician", dept: "Field",     status: "active",   mfa: true  },
  { id: "u5", name: "Dr. Abdullah Al-Rashid", email: "rashid@aramco-lab.sa", role: "Approver",         dept: "Quality",   status: "active",   mfa: true  },
  { id: "u6", name: "Layla Hashem",           email: "layla@aramco-lab.sa",  role: "Quality Manager",  dept: "Quality",   status: "active",   mfa: true  },
  { id: "u7", name: "Mahmoud Saleh",          email: "mahmoud@aramco-lab.sa",role: "Lab Technician",   dept: "Asphalt",   status: "active",   mfa: false },
];

export default function UsersPage() {
  const tt = useT();
  return (
    <div className="space-y-6">
      <PageHeader
        title="Users & roles"
        description="11 RBAC roles with ISO 17025 audit trail."
        actions={<button className="btn btn-primary"><Plus className="w-4 h-4" /> {tt("Invite user")}</button>}
      />

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="civix">
            <thead>
              <tr><th>{tt("Name")}</th><th>{tt("Email")}</th><th>{tt("Role")}</th><th>{tt("Department")}</th><th>{tt("MFA")}</th><th>{tt("Status")}</th></tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="font-medium">{u.name}</td>
                  <td className="text-sm">{u.email}</td>
                  <td>{u.role}</td>
                  <td>{u.dept}</td>
                  <td>
                    {u.mfa
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
    </div>
  );
}
