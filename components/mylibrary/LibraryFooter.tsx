export default function LibraryFooter() {
  return (
    <footer className="bg-gray-100 text-gray-400 text-xs">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between">
        <span>© {new Date().getFullYear()} My Library</span>
        <span>Happy Reading 📖</span>
      </div>
    </footer>
  );
}
