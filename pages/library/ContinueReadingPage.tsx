"use client";

import React from 'react'
import LibraryFooter from '@/components/mylibrary/LibraryFooter';
import LibrarySidebar from '@/components/mylibrary/LibrarySidebar';
import LibraryHeader from '@/components/mylibrary/LibraryHeader';
import ContinueReadingBook from '@/components/mylibrary/ContinueReadingBook';
import "../../app/globals.css";

const ContinueReadingPage = () => {
  return (
     <div >
                <div className="flex">
                  <LibrarySidebar />
                  <div className="flex flex-1 flex-col">
                    <LibraryHeader />
                    <ContinueReadingBook />
        
                    <LibraryFooter />
                  </div>
                </div>
            </div>
  )
}


export default ContinueReadingPage