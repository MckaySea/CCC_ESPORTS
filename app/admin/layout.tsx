import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "admin") {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-sm h-screen fixed left-0 top-16">
          <div className="p-4">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Admin Panel
            </h2>
            <nav className="space-y-2">
              <a
                href="/admin/users"
                className="block px-4 py-2 text-gray-700 hover:bg-primary/10 hover:text-primary rounded-md transition-colors"
              >
                Users
              </a>
              <a
                href="/admin/teams"
                className="block px-4 py-2 text-gray-700 hover:bg-primary/10 hover:text-primary rounded-md transition-colors"
              >
                Teams
              </a>
              <a
                href="/admin/players"
                className="block px-4 py-2 text-gray-700 hover:bg-primary/10 hover:text-primary rounded-md transition-colors"
              >
                Players
              </a>
              <a
                href="/admin/games"
                className="block px-4 py-2 text-gray-700 hover:bg-primary/10 hover:text-primary rounded-md transition-colors"
              >
                Games
              </a>
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="ml-64 flex-1 p-8 pt-24">{children}</div>
      </div>
    </div>
  );
}
