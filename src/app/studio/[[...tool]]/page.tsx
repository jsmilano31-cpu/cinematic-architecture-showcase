import type { Metadata } from "next";
import Studio from "@/sanity/Studio";
export const metadata: Metadata = {
  title: "Project Studio",
  robots: { index: false, follow: false },
};
import Link from "next/link";
export default function StudioPage() {
  if (
    process.env.NEXT_PUBLIC_SANITY_PROJECT_ID &&
    process.env.NEXT_PUBLIC_SANITY_DATASET
  )
    return <Studio />;
  return (
    <main className="setup">
      <h1>Project Studio</h1>
      <p>
        The local demo is ready. Connect a Sanity project and dataset in{" "}
        <code>.env.local</code> to enable editorial access.
      </p>
      <Link href="/">Return to the project</Link>
    </main>
  );
}
