"use client";

import React from 'react'
import LibraryFooter from '@/components/mylibrary/LibraryFooter';
import LibrarySidebar from '@/components/mylibrary/LibrarySidebar';
import LibraryHeader from '@/components/mylibrary/LibraryHeader';
import LibraryCategorySection from '@/components/mylibrary/LibraryCategorySection';
import "../../app/globals.css";

const MyLibrary = () => {
  return (
       <div >
            <div className="flex">
              <LibrarySidebar />
              <div className="flex flex-1 flex-col">
                <LibraryHeader />
                 <LibraryCategorySection
        title="Best Sellers"
        categorySlug="best-seller"
        visibleCount={6}
      />

      <LibraryCategorySection
        title="AG Volumes"
        categorySlug="ag-volumes"
        visibleCount={6}
      />

      <LibraryCategorySection
        title="AGPH Originals"
        categorySlug="agph"
        visibleCount={6}
      />

      <LibraryCategorySection
        title="AG Kids"
        categorySlug="ag-kids"
        visibleCount={6}
      />
                <LibraryFooter />
              </div>
            </div>
        </div>
  )
}

export default MyLibrary