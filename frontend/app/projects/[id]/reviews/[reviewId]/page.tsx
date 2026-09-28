"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import ReviewCard from "../../../../../components/ReviewCard";
import { createReview, getReview } from "../../../../../lib/api";
import type { ReviewResponse } from "../../../../../types";

type ReviewTemplate = "security" | "performance" | "quality";

export default function ReviewDetailPage() {
  const params = useParams<{ id: string; reviewId: string }>();
  const router = useRouter();
  const [review, setReview] = useState<ReviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [rerunning, setRerunning] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    void getReview(params.reviewId)
      .then(setReview)
      .catch(() => setError("This review could not be loaded."))
      .finally(() => setLoading(false));
  }, [params.reviewId]);

  async function rerunReview(): Promise<void> {
    if (!review) return;
    setRerunning(true);
    setError("");
    try {
      const nextReview = await createReview({ project_id: review.project_id, file_ids: review.file_ids, template: review.template as ReviewTemplate });
      router.push(`/projects/${params.id}/reviews/${nextReview.id}`);
    } catch {
      setError("The review could not be re-run.");
    } finally {
      setRerunning(false);
    }
  }

  if (loading) return <main className="project-loading">Loading review...</main>;
  if (!review) return <main className="project-loading"><p className="form-error">{error}</p></main>;

  return (
    <main className="history-detail-shell">
      <header className="detail-header"><Link className="back-link" href={`/projects/${params.id}/reviews`}>← Review history</Link><button className="secondary-button" disabled={rerunning} onClick={() => void rerunReview()} type="button">{rerunning ? "Running..." : "Re-run review"}</button></header>
      {error ? <p className="form-error">{error}</p> : null}
      <ReviewCard review={review} />
    </main>
  );
}
