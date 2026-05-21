
import React from 'react';
import { PostCard } from './PostCard';
import type { Post } from '../types';

interface FeedProps {
  posts: Post[];
}

export const Feed: React.FC<FeedProps> = ({ posts }) => {
  return (
    <div className="mt-6 border-t border-slate-200 dark:border-slate-700">
      {posts.map(post => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
};
