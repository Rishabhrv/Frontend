import Sidebar from "@/components/admin/Sidebar";
import Header from "@/components/admin/Header";
import AddProductFrom from "@/components/products/AddProductFrom";
import { useRouter } from "next/router";
import "../../../app/globals.css";

export default function EditProduct() {
  const router = useRouter();
  const { id } = router.query;

  if (!id) return null;

  return (
    <div className="p-6">
      <div className="flex">
        <Sidebar />
        <div className="flex flex-1 flex-col">
          <Header />
          <AddProductFrom mode="edit" productId={Number(id)} />
        </div>
      </div>
    </div>
  );
}
