import Sidebar from "@/components/admin/Sidebar";
import Header from "@/components/admin/Header";
import "../../../app/globals.css";
import  ReviewTable  from "@/components/reviews/ReviewTable";

export default function UsersPage() {
  return (
    <div className="p-6">

        <div className="flex">
              <Sidebar />
              <div className="flex flex-1 flex-col">
                <Header />
                <ReviewTable />
              </div>
            </div>
    </div>
  );
}
