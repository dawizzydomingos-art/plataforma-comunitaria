
import React, { useState, useRef } from 'react';
import type { User, Post } from '../types';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Spinner } from './ui/Spinner';
import { PhotographIcon, XIcon, SparklesIcon } from './Icons';
import { generatePostText } from '../services/geminiService';

interface CreatePostProps {
  currentUser: User;
  onPostSubmit: (newPost: Omit<Post, 'id' | 'author' | 'timestamp' | 'likes' | 'comments'>) => void;
}

export const CreatePost: React.FC<CreatePostProps> = ({ currentUser, onPostSubmit }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateText = async () => {
    if (!aiPrompt) return;
    setIsGenerating(true);
    try {
      const generatedText = await generatePostText(aiPrompt);
      setPostContent(generatedText);
    } catch (error) {
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (postContent.trim() || imagePreview) {
      onPostSubmit({
        content: postContent,
        image: imagePreview || undefined,
      });
      closeModal();
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setPostContent('');
    setAiPrompt('');
    setImagePreview(null);
    if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  return (
    <>
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex space-x-4 items-start">
          <img src={currentUser.avatar} alt={currentUser.name} className="w-12 h-12 rounded-full" />
          <div className="flex-1">
            <div
              onClick={() => setIsModalOpen(true)}
              className="w-full text-left text-xl text-slate-500 p-3 rounded-lg cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800"
            >
              What's happening?
            </div>
            <div className="flex justify-between items-center mt-2">
                <div className="text-sky-500 flex space-x-4">
                  <button onClick={() => setIsModalOpen(true)} className="p-2 hover:bg-sky-100 dark:hover:bg-sky-900/50 rounded-full">
                    <PhotographIcon className="w-6 h-6" />
                  </button>
                </div>
                <Button onClick={() => setIsModalOpen(true)}>Post</Button>
            </div>
          </div>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={closeModal}>
        <div className="flex items-center justify-between p-3 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold">Create Post</h2>
          <button onClick={closeModal} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700">
            <XIcon className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4">
          <div className="flex space-x-4">
            <img src={currentUser.avatar} alt={currentUser.name} className="w-12 h-12 rounded-full" />
            <textarea
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              placeholder="What's happening?"
              className="w-full text-xl bg-transparent focus:outline-none resize-none"
              rows={5}
            />
          </div>
          {imagePreview && (
            <div className="mt-4 ml-16 relative">
              <img src={imagePreview} alt="Preview" className="rounded-2xl max-h-80 w-auto" />
              <button
                onClick={() => setImagePreview(null)}
                className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1.5"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>
          )}

          <div className="p-3 mt-4 border border-dashed rounded-lg border-sky-500/50 bg-sky-50 dark:bg-sky-900/20">
            <div className="flex items-center space-x-2 text-sky-500 font-semibold mb-2">
              <SparklesIcon className="w-6 h-6" />
              <span>Generate with Gemini</span>
            </div>
             <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
              Give Gemini a prompt and let it write the post for you.
            </p>
            <div className="flex space-x-2">
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="e.g., a post about my morning coffee"
                className="flex-grow bg-slate-200 dark:bg-slate-700 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              <Button onClick={handleGenerateText} disabled={isGenerating || !aiPrompt}>
                {isGenerating ? <Spinner /> : 'Generate'}
              </Button>
            </div>
          </div>


          <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <div className="text-sky-500">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 hover:bg-sky-100 dark:hover:bg-sky-900/50 rounded-full"
              >
                <PhotographIcon className="w-6 h-6" />
              </button>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
            </div>
            <Button type="submit" disabled={!postContent.trim() && !imagePreview}>Post</Button>
          </div>
        </form>
      </Modal>
    </>
  );
};
