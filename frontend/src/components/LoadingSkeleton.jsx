import React from 'react';
import { Skeleton, SkeletonCard as UiSkeletonCard } from './ui/Skeleton.jsx';

/**
 * LoadingSkeleton — Compatibility wrapper delegating to authoritative ui/Skeleton.
 */
export function LoadingSkeleton(props) {
  return <Skeleton {...props} />;
}

export const SkeletonCard = UiSkeletonCard;

export default LoadingSkeleton;
