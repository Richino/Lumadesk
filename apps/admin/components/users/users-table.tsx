"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Users,
  MoreHorizontal,
  ShieldCheck,
  ShieldOff,
  Trash2,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import type { UserRow, UserRoleFilter } from "@/lib/queries/users";
import type { UserRole } from "@/lib/types";
import { dateShort, fullName, initials } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { setUserRole, inviteUser, removeUser } from "@/app/(dashboard)/users/actions";

const FILTERS: { value: UserRoleFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "admin", label: "Admins" },
  { value: "customer", label: "Customers" },
];

type Props = {
  rows: UserRow[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
  q: string;
  role: UserRoleFilter;
  currentUserId: string;
};

export function UsersTable(props: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(props.q);
  const [inviting, setInviting] = useState(false);
  const [removing, setRemoving] = useState<UserRow | null>(null);

  useEffect(() => {
    if (search === props.q) return;
    const timer = setTimeout(() => updateParams({ q: search || null, page: null }), 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  function updateParams(next: Record<string, string | null>) {
    const sp = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value === null) sp.delete(key);
      else sp.set(key, value);
    }
    startTransition(() => router.push(`${pathname}?${sp.toString()}`));
  }

  function changeRole(user: UserRow, role: UserRole) {
    startTransition(async () => {
      const result = await setUserRole(user.id, role);
      if (result.ok) {
        toast.success(`${fullName(user.first_name, user.last_name, user.email)} is now ${role}.`);
        router.refresh();
      } else toast.error(result.error);
    });
  }

  function confirmRemove() {
    if (!removing) return;
    const id = removing.id;
    startTransition(async () => {
      const result = await removeUser(id);
      if (result.ok) {
        toast.success("User removed.");
        setRemoving(null);
        router.refresh();
      } else toast.error(result.error);
    });
  }

  const rangeStart = props.total === 0 ? 0 : (props.page - 1) * props.pageSize + 1;
  const rangeEnd = Math.min(props.page * props.pageSize, props.total);

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users…" className="pl-9" />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-border p-1">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => updateParams({ role: f.value === "all" ? null : f.value, page: null })}
              className={cn(
                "rounded-md px-3 py-1 text-sm font-medium transition-colors",
                props.role === f.value ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <Button size="sm" onClick={() => setInviting(true)}>
          <UserPlus className="h-4 w-4" /> Invite
        </Button>
        {isPending && <Loader2 className="hidden h-4 w-4 animate-spin text-muted-foreground sm:block" />}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border">
        {props.rows.length === 0 ? (
          <EmptyState icon={Users} title="No users found" description={props.q ? "Try a different search." : undefined} className="border-0" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {props.rows.map((user) => {
                const isSelf = user.id === props.currentUserId;
                return (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          {user.avatar_url && <AvatarImage src={user.avatar_url} alt="" />}
                          <AvatarFallback>{initials(user.first_name, user.last_name, user.email)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {fullName(user.first_name, user.last_name, "Unnamed")}
                            {isSelf && <span className="ml-1.5 text-xs text-muted-foreground">(you)</span>}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.role === "admin" ? <Badge variant="default">Admin</Badge> : <Badge variant="muted">Customer</Badge>}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">{dateShort(user.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon-sm" variant="ghost" aria-label="User actions" disabled={isSelf}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          {user.role === "admin" ? (
                            <DropdownMenuItem onSelect={() => changeRole(user, "customer")}>
                              <ShieldOff /> Revoke admin
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onSelect={() => changeRole(user, "admin")}>
                              <ShieldCheck /> Make admin
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem variant="destructive" onSelect={() => setRemoving(user)}>
                            <Trash2 /> Remove user
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <p>{props.total === 0 ? "No results" : `${rangeStart}–${rangeEnd} of ${props.total}`}</p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={props.page <= 1 || isPending} onClick={() => updateParams({ page: String(props.page - 1) })}>
            <ChevronLeft className="h-4 w-4" /> Prev
          </Button>
          <span className="tabular-nums">Page {props.page} / {props.pageCount}</span>
          <Button variant="outline" size="sm" disabled={props.page >= props.pageCount || isPending} onClick={() => updateParams({ page: String(props.page + 1) })}>
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {inviting && <InviteDialog onClose={() => setInviting(false)} />}

      <ConfirmDialog
        open={!!removing}
        onOpenChange={(open) => !open && setRemoving(null)}
        title="Remove user?"
        description={`This permanently deletes ${removing ? fullName(removing.first_name, removing.last_name, removing.email) : "this user"}'s account and data. This can't be undone.`}
        confirmLabel="Remove user"
        destructive
        loading={isPending}
        onConfirm={confirmRemove}
      />
    </div>
  );
}

function InviteDialog({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("admin");

  function submit() {
    startTransition(async () => {
      const result = await inviteUser({ email, role });
      if (result.ok) {
        toast.success(`Invitation sent to ${email}.`);
        onClose();
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite a user</DialogTitle>
          <DialogDescription>
            They&apos;ll receive an email invitation to set a password and join. Requires email
            delivery to be configured in Supabase.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="invite-email" className="text-xs">Email</Label>
            <Input id="invite-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="teammate@lumadesk.com" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin — full access</SelectItem>
                <SelectItem value="customer">Customer — storefront only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={isPending}>Cancel</Button>
          <Button onClick={submit} disabled={isPending || !email.trim()}>
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Send invite
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
