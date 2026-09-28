"use client";

import { useMemo, useState } from "react";

import type { ReviewResponse } from "../types";

type ReviewCardProps = {
  review: ReviewResponse;
};

const severities = ["all", "critical", "high", "medium", "low"] as const;
type SeverityFilter = (typeof severities)[number];

const severityLabels: Record<Exclude<SeverityFilter, "all">, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
};

export default function ReviewCard({ review }: ReviewCardProps) {
  const [filter, setFilter] = useState<SeverityFilter>("all");
  const issues = useMemo(
    () => filter === "all" ? review.issues : review.issues.filter((issue) => issue.severity === filter),
    [filter, review.issues],
  );

  return (
    <section className="review-results">
      <div className="review-summary-card">
        <div className="review-result-heading">
          <div>
            <p className="eyebrow">{review.template} review</p>
            <h2>Review summary</h2>
          </div>
          <span className="review-date">{new Date(review.created_at).toLocaleString()}</span>
        </div>
        <p>{review.summary}</p>
      </div>

      <div className="review-section-heading">
        <h2>Issues <span>{review.issues.length}</span></h2>
        <div className="severity-tabs">
          {severities.map((severity) => (
            <button className={filter === severity ? "active" : ""} key={severity} onClick={() => setFilter(severity)} type="button">
              {severity === "all" ? "All" : severityLabels[severity]}
            </button>
          ))}
        </div>
      </div>
      <div className="issues-list">
        {issues.length === 0 ? <p className="review-muted">No issues match this filter.</p> : issues.map((issue, index) => (
          <article className="issue-card" key={`${issue.title}-${index}`}>
            <div className="issue-heading">
              <span className={`severity-badge severity-${issue.severity}`}>{issue.severity}</span>
              <h3>{issue.title}</h3>
            </div>
            <p>{issue.description}</p>
            <p className="issue-location">{issue.file}{issue.line !== null ? ` · line ${issue.line}` : ""}</p>
          </article>
        ))}
      </div>

      <div className="recommendations-card">
        <h2>Recommendations</h2>
        {review.recommendations.length === 0 ? <p className="review-muted">No recommendations returned.</p> : <ul>{review.recommendations.map((recommendation, index) => <li key={`${recommendation}-${index}`}>{recommendation}</li>)}</ul>}
      </div>
    </section>
  );
}
