"use client";

import React, { useState } from "react";
import Sidebar from "@/components/admin/Sidebar";
import Header from "@/components/admin/Header";
import AuthorTable from "@/components/authors/AuthorTable";
import AuthorForm from "@/components/authors/AuthorForm";
import "../../../app/globals.css";

const ProductAuthor = () => {
  const [editAuthor, setEditAuthor] = useState<any>(null);

  return (
    <div className="p-6">
      <div className="flex">
        <Sidebar />

        <div className="flex flex-1 flex-col">
          <Header />

          {/* CONTENT */}
          <div className="flex gap-4 p-4">
            {/* LEFT: FORM */}
            <div className="w-110">
              <AuthorForm
                editAuthor={editAuthor}
                clearEdit={() => setEditAuthor(null)}
              />
            </div>

            {/* RIGHT: TABLE */}
            <div className="flex-1">
              <AuthorTable
                onEdit={(author) => setEditAuthor(author)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductAuthor;
