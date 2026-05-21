
import React, { useState } from 'react';
import type { Post } from '../types';
import { ChatIcon, HeartIcon, ShareIcon, DotsHorizontalIcon } from './Icons';

interface PostCardProps {
  post: Post;
}

export const PostCard: React.FC<PostCardProps> = ({ post }) => {
    const [isLiked, setIsLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(post.likes);

    const handleLike = () => {
        if (isLiked) {
            setLikeCount(prev => prev - 1);
        } else {
            setLikeCount(prev => prev + 1);
        }
        setIsLiked(!isLiked);
    };

    return (
        <article className="p-4 border-b border-slate-200 dark:border-slate-700 flex space-x-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors duration-200 cursor-pointer">
            <div className="flex-shrink-0">
                <img src={post.author.avatar} alt={post.author.name} className="w-12 h-12 rounded-full" />
            </div>
            <div className="flex-1">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-sm">
                        <span className="font-bold text-slate-900 dark:text-slate-50">{post.author.name}</span>
                        <span className="text-slate-500">{post.author.handle}</span>
                        <span className="text-slate-500">·</span>
                        <span className="text-slate-500">{post.timestamp}</span>
                    </div>
                    <button className="text-slate-500 hover:text-sky-500">
                        <DotsHorizontalIcon className="w-5 h-5" />
                    </button>
                </div>
                <p className="mt-1 text-slate-800 dark:text-slate-200 whitespace-pre-wrap">{post.content}</p>
                {post.image && (
                    <div className="mt-3 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
                        <img src={post.image} alt="Post content" className="w-full h-auto object-cover" />
                    </div>
                )}
                <div className="flex justify-between mt-4 max-w-sm text-slate-500">
                    <div className="flex items-center space-x-2 cursor-pointer hover:text-sky-500">
                        <ChatIcon className="w-5 h-5" />
                        <span>{post.comments.length}</span>
                    </div>
                    <button onClick={handleLike} className={`flex items-center space-x-2 cursor-pointer transition-colors duration-200 ${isLiked ? 'text-pink-500' : 'hover:text-pink-500'}`}>
                        <HeartIcon className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                        <span>{likeCount}</span>
                    </button>
                    <div className="flex items-center space-x-2 cursor-pointer hover:text-green-500">
                        <ShareIcon className="w-5 h-5" />
                        <span>Share</span>
                    </div>
                </div>
            </div>
        </article>
    );
};
