import Link from "next/link";

export default function NotFound() {
  return (
    <main className="not-found-page">
      <span className="not-found-code">404</span>
      <h1>Page not found</h1>
      <p>The page you requested does not exist or has moved.</p>
      <Link className="primary-button" href="/dashboard">Back to Dashboard</Link>
    </main>
  );
}
