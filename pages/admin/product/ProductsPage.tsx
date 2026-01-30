import ProductsTable from "@/components/products/ProductsTable";
import Sidebar from "@/components/admin/Sidebar";
import Header from "@/components/admin/Header";
import "../../../app/globals.css";

export default function ProductsPage() {
  return (
    <div className="p-6">

        <div className="flex">
              <Sidebar />
              <div className="flex flex-1 flex-col">
                <Header />
                <ProductsTable />
              </div>
            </div>
    </div>
  );
}
