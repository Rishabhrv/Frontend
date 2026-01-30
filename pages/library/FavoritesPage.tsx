"use client";

import React from 'react'
import LibraryFooter from '@/components/mylibrary/LibraryFooter';
import LibrarySidebar from '@/components/mylibrary/LibrarySidebar';
import LibraryHeader from '@/components/mylibrary/LibraryHeader';
import LibraryFavoriteBook from '@/components/mylibrary/LibraryFavoriteBook';
import "../../app/globals.css";

const FavoritesPage = () => {
  return (
      <div >
                <div className="flex">
                  <LibrarySidebar />
                  <div className="flex flex-1 flex-col">
                    <LibraryHeader />
                    <LibraryFavoriteBook />
                    <LibraryFooter />
                  </div>
                </div>
            </div>
  )
}

export default FavoritesPage