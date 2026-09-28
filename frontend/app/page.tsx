import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-73px)] max-w-6xl items-center px-6 py-20">
      <section className="max-w-2xl">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-indigo-400">CodeReview AI</p>
        <h1 className="mt-5 text-5xl font-semibold tracking-tight text-white">Ship code with a clearer point of view.</h1>
        <p className="mt-6 max-w-xl text-lg leading-8 text-gray-400">Upload a project, understand what matters, and turn review feedback into confident next steps.</p>
        <div className="mt-8 flex gap-4">
          <Link className="rounded-md bg-indigo-600 px-5 py-3 font-medium text-white transition hover:bg-indigo-500" href="/register">Get started</Link>
          <Link className="rounded-md border border-gray-700 px-5 py-3 font-medium text-gray-300 transition hover:border-gray-500 hover:text-white" href="/login">Sign in</Link>
        </div>
      </section>
    </main>
  );
}
