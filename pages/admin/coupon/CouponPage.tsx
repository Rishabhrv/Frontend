import Sidebar from "@/components/admin/Sidebar";
import Header from "@/components/admin/Header";
import CouponTable from "@/components/coupon/CouponTable";

export default function ShippingZones() {
  return (
    <div className="p-6">
        <div className="flex">
          <Sidebar />
          <div className="flex-1 flex-col">
            <Header />
            <div className="p-6">
                <CouponTable />
            </div>
          </div>
        </div>
    </div>
  );
}
