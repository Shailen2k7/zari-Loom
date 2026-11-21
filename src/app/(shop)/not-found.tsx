import Link from "next/link";

export default function NotFound() {
  return (
    <div className="wrap max-w-md py-24 text-center">
      <h1 className="display text-5xl">We could not find that</h1>
      <p className="mt-4 text-muted">The piece may have sold, or the link may be old.</p>
      <Link href="/collection" className="btn btn-primary mt-7">Browse the collection</Link>
    </div>
  );
}
