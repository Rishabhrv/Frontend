import Sidebar from "@/components/admin/Sidebar";
import Header from "@/components/admin/Header";
import UserTable from "@/components/users/UserTable";
import "../../../app/globals.css";

export default function UsersPage() {
  return (
    <div className="p-6">

        <div className="flex">
              <Sidebar />
              <div className="flex flex-1 flex-col">
                <Header />
                <UserTable />
              </div>
            </div>
    </div>
  );
}
