import React from 'react';
import { Link } from 'react-router-dom';
import ReviewCard from './ReviewCard.jsx';
import { SkeletonCard, EmptyState, Button } from './ui/index.js';
import { StarIcon } from './ui/Icons.jsx';

/**
 * StudentReviews — Renders approved student reviews.
 * Strictly displays only authentic database records.
 */
export function StudentReviews({ reviews = [], loading = false, onShareClick }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonCard key={i} className="h-44" />
        ))}
      </div>
    );
  }

  if (!reviews || reviews.length === 0) {
    return (
      <EmptyState
        icon={<StarIcon className="w-8 h-8 text-amber-400" />}
        title="No student reviews yet"
        description="Be the first student to share your experience."
        action={
          onShareClick ? (
            <Button variant="primary" onClick={onShareClick}>
              Share Your Experience
            </Button>
          ) : (
            <Link to="/reviews">
              <Button variant="primary">
                Share Your Experience
              </Button>
            </Link>
          )
        }
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {reviews.map((review) => (
        <ReviewCard key={review._id || review.id} review={review} />
      ))}
    </div>
  );
}

export default StudentReviews;
