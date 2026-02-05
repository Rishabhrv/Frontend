import React from 'react'
import Sidebar from "@/components/admin/Sidebar";
import Header from "@/components/admin/Header";
import AddCategoriesForm from '@/components/categories/AddCategoriesFrom';
import CategoriesList from '@/components/categories/CategoriesList';
import "../../../app/globals.css";

const addcategories = () => {
  const [editCategory, setEditCategory] = React.useState<any>(null); 

  return (
    <div className="p-6">
      <div className="flex">
        <Sidebar />

        <div className="flex flex-1 flex-col">
          <Header />

          <div className="p-3">
            <div className="grid grid-cols-1 gap-2 lg:grid-cols-5">

              {/* ADD / EDIT FORM */}
              <div className="lg:col-span-2">
                <AddCategoriesForm
                  editCategory={editCategory}
                  clearEdit={() => setEditCategory(null)}
                />
              </div>

              {/* LIST */}
              <div className="lg:col-span-3">
                <CategoriesList
                  onEdit={(cat) => setEditCategory(cat)}
                />
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default addcategories


