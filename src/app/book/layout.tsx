export default function BookLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="book-shell">
      {children}
    </div>
  );
}
