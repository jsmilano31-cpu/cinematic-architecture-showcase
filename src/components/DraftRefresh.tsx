"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
export function DraftRefresh() {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => {
      if (!document.hidden) router.refresh();
    }, 3000);
    return () => clearInterval(id);
  }, [router]);
  return (
    <a className="preview-badge" href="/api/draft-mode/disable">
      Draft preview · Exit
    </a>
  );
}
