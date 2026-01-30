import Sidebar from "@/components/admin/Sidebar";
import Header from "@/components/admin/Header";
import DashboardMain from "@/components/admin/DashboardMain";
import "../../app/globals.css";

export default function DashboardPage() {
  return (
    <div className="flex">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Header />
        <DashboardMain />
      </div>
    </div>
  );
}
