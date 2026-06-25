import Sidebar from "@/components/admin/Sidebar";
import Header from "@/components/admin/Header";
import AdminGuard  from "@/components/admin/AdminGuard";
import ReadyToGoProductForm from "@/components/products/ReadyToGo/ReadyToGoProductFrom";
export default function EditProduct() {


  return (
    <AdminGuard pageKey="products">
          <div className="p-6 bg-white text-gray-700" >
      <div className="flex">
        <Sidebar />
        <div className="flex flex-1 flex-col">
          <Header />
          <ReadyToGoProductForm />
        </div>
      </div>
    </div>
    </AdminGuard>

  );
}
