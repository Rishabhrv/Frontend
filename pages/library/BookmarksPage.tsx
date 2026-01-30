"use client";

import React from 'react'
import LibraryFooter from '@/components/mylibrary/LibraryFooter';
import LibrarySidebar from '@/components/mylibrary/LibrarySidebar';
import LibraryHeader from '@/components/mylibrary/LibraryHeader';
import BookmarksBook from '@/components/mylibrary/BookmarksBook';
import "../../app/globals.css";

const BookmarksPage = () => {
  return (
        <div >
            <div className="flex">
              <LibrarySidebar />
              <div className="flex flex-1 flex-col">
                <LibraryHeader />
                <BookmarksBook />
                <LibraryFooter />
              </div>
            </div>
        </div>
  )
}

export default BookmarksPage