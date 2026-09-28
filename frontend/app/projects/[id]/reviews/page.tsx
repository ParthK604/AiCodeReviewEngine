"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { searchReviews } from "../../../../lib/api";
import type { ReviewResponse } from "../../../../types";

type TemplateFilter = "all" | "security" | "performance" | "quality";
const filters: TemplateFilter[] = ["all", "security", "performance", "quality"];

function issueCounts(review: ReviewResponse): string[] {
  return ["critical", "high", "medium", "low"].flatMap((severity) => {
    const count = review.issues.filter((issue) => issue.severity === severity).length;
    return count ? [`${count} ${severity}`] : [];
  });
}

export default function ReviewHistoryPage() {
  const params = useParams<{ id: string }>();
  const projectId = params.id;
  const [reviews, setReviews] = useState<ReviewResponse[]>([]);
  const [query, setQuery] = useState("");
  const [template, setTemplate] = useState<TemplateFilter>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void searchReviews(projectId, template === "all" ? undefined : template, query || undefined)
        .then(setReviews)
        .finally(() => setLoading(false));
    }, 180);
    return () => window.clearTimeout(timeout);
  }, [projectId, query, template]);

  return (
    <main className="history-shell">
      <header className="history-header"><div><p className="eyebrow">Archive</p><h1>Review history</h1><p className="page-subtitle">Past analyses for this project.</p></div><Link className="primary-button" href={`/projects/${projectId}/review`}>Run a review</Link></header>
      <div className="history-controls"><input aria-label="Search review summaries" onChange={(event) => setQuery(event.target.value)} placeholder="Search summaries..." value={query} /><div className="history-filters">{filters.map((filter) => <button className={template === filter ? "active" : ""} key={filter} onClick={() => setTemplate(filter)} type="button">{filter === "all" ? "All" : filter}</button>)}</div></div>
      {loading ? <div className="history-loading">Loading review history...</div> : reviews.length === 0 ? <section className="empty-state"><span className="empty-mark">⌁</span><h2>No reviews yet</h2><p>Run your first review to start building project history.</p><Link className="secondary-button" href={`/projects/${projectId}/review`}>Run your first review</Link></section> : <div className="history-list">{reviews.map((review) => <Link className="history-card" href={`/projects/${projectId}/reviews/${review.id}`} key={review.id}><div className="history-card-top"><span className={`template-badge template-${review.template}`}>{review.template}</span><span className="review-date">{new Date(review.created_at).toLocaleString()}</span></div><p>{review.summary}</p><div className="history-card-meta"><span>{review.file_ids.length} files</span><span>{review.issues.length} issues</span><span className="issue-counts">{issueCounts(review).join(" · ") || "No issues"}</span></div></Link>)}</div>}
    </main>
  );
}
