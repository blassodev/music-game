import { AdminNav } from "@/components/admin/admin-nav";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <div className="border-b bg-background py-4">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl font-bold">Admin Panel</h1>
          <p className="text-sm text-muted-foreground">
            Manage your music library and decks
          </p>
        </div>
      </div>
      <AdminNav />
      <main className="container mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
