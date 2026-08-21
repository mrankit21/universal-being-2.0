"use client";

/** User Management (requirement #10/#11): admin/manager/editor/sales_executive roles. */
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Pencil } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { DataTable, type Column } from "@/components/admin/data-table";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { FormField } from "@/components/admin/form-field";
import { Badge } from "@/components/ui/badge";

interface UserRow {
  _id: string;
  name: string;
  email: string;
  role: "admin" | "manager" | "editor" | "sales_executive";
  active: boolean;
}

function blankUser(): { name: string; email: string; password: string; role: UserRow["role"]; active: boolean } {
  return { name: "", email: "", password: "", role: "editor", active: true };
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState(blankUser());
  const [creating, setCreating] = useState(false);

  // Edit / reset-password dialog — there was previously no way to change
  // an existing user's password (including your own) from the Admin UI at
  // all; the API (`PATCH /api/admin/users/[id]`) already supported it.
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState<UserRow["role"]>("editor");
  const [editPassword, setEditPassword] = useState("");
  const [saving, setSaving] = useState(false);

  function openEdit(user: UserRow) {
    setEditing(user);
    setEditName(user.name);
    setEditRole(user.role);
    setEditPassword("");
  }

  async function handleSaveEdit() {
    if (!editing) return;
    setSaving(true);
    try {
      const body: Record<string, unknown> = { name: editName, role: editRole };
      if (editPassword) body.password = editPassword;
      const res = await fetch(`/api/admin/users/${editing._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!json.success) { toast.error(json.error); return; }
      toast.success(editPassword ? "User updated & password changed" : "User updated");
      setUsers((prev) => prev.map((u) => (u._id === editing._id ? json.data : u)));
      setEditing(null);
    } finally {
      setSaving(false);
    }
  }

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/users");
    const json = await res.json();
    if (json.success) setUsers(json.data);
    else toast.error(json.error);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleCreate() {
    setCreating(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const json = await res.json();
      if (!json.success) { toast.error(json.error); return; }
      toast.success("User created");
      setDraft(blankUser());
      setUsers((prev) => [json.data, ...prev]);
    } finally {
      setCreating(false);
    }
  }

  async function toggleActive(user: UserRow) {
    const res = await fetch(`/api/admin/users/${user._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !user.active }),
    });
    const json = await res.json();
    if (json.success) setUsers((prev) => prev.map((u) => (u._id === user._id ? json.data : u)));
    else toast.error(json.error);
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    const json = await res.json();
    if (json.success) {
      toast.success("User removed");
      setUsers((prev) => prev.filter((u) => u._id !== id));
    } else {
      toast.error(json.error);
    }
  }

  const columns: Column<UserRow>[] = [
    { header: "Name", cell: (u) => u.name },
    { header: "Email", cell: (u) => u.email },
    { header: "Role", cell: (u) => <Badge className="capitalize">{u.role.replace("_", " ")}</Badge> },
    {
      header: "Active",
      cell: (u) => <Switch checked={u.active} onCheckedChange={() => toggleActive(u)} />,
    },
    {
      header: "",
      cell: (u) => (
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="icon" onClick={() => openEdit(u)}>
            <Pencil className="size-4" />
          </Button>
          <ConfirmDialog
            trigger={<Button variant="ghost" size="icon"><Trash2 className="size-4 text-destructive" /></Button>}
            title={`Remove ${u.name}?`}
            description="They will immediately lose access to the Admin Panel."
            onConfirm={() => handleDelete(u._id)}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">User Management</h1>
        <p className="text-sm text-muted-foreground">Admin, Manager, Editor, and Sales Executive roles with different levels of access.</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Add User</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <FormField label="Name"><Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></FormField>
          <FormField label="Email"><Input type="email" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} /></FormField>
          <FormField label="Password" hint="Min. 8 characters"><Input type="password" value={draft.password} onChange={(e) => setDraft({ ...draft, password: e.target.value })} /></FormField>
          <FormField label="Role">
            <Select value={draft.role} onValueChange={(v) => setDraft({ ...draft, role: v as UserRow["role"] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="editor">Editor</SelectItem>
                <SelectItem value="sales_executive">Sales Executive</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
          <div className="md:col-span-4 flex justify-end">
            <Button onClick={handleCreate} disabled={creating || !draft.name || !draft.email || draft.password.length < 8}>
              <Plus className="size-4" /> Create User
            </Button>
          </div>
        </CardContent>
      </Card>

      <DataTable columns={columns} rows={users} loading={loading} rowKey={(u) => u._id} emptyMessage="No users yet." />

      <div className="rounded-md border border-border bg-muted/30 p-4 text-xs text-muted-foreground">
        <p><strong>Admin</strong> — full access including Users and Site Settings.</p>
        <p><strong>Manager</strong> — everything except User Management.</p>
        <p><strong>Editor</strong> — content only: Trips, Destinations, Homepage, Announcements, Media.</p>
      </div>

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit {editing?.name}</DialogTitle>
            <DialogDescription>Update their name, role, or reset their password. Leave the password blank to keep it unchanged.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <FormField label="Name"><Input value={editName} onChange={(e) => setEditName(e.target.value)} /></FormField>
            <FormField label="Role">
              <Select value={editRole} onValueChange={(v) => setEditRole(v as UserRow["role"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                  <SelectItem value="sales_executive">Sales Executive</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="New Password" hint="Leave blank to keep the current password. Min. 8 characters if changing.">
              <Input type="password" value={editPassword} onChange={(e) => setEditPassword(e.target.value)} placeholder="••••••••" />
            </FormField>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button
              onClick={handleSaveEdit}
              disabled={saving || !editName || (editPassword.length > 0 && editPassword.length < 8)}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
