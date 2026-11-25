import Link from "next/link";
export default function NotFound() {
  return (
    <main className="setup">
      <span className="eyebrow">404</span>
      <h1>Page unavailable.</h1>
      <p>This project or chapter could not be found.</p>
      <Link href="/">Return to the project</Link>
    </main>
  );
}
