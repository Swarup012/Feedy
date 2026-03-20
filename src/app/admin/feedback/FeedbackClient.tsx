"use client";

import React, { useState } from "react";
import {
  ChevronDown,
  Heart,
  MessageCircle,
  Pin,
  Search,
  Settings,
  TrendingUp,
  Download,
} from "lucide-react";

interface Post {
  id: number;
  title: string;
  description: string;
  category: string;
  status: "PLANNED" | "IN PROGRESS" | "COMPLETE" | "UNDER REVIEW";
  votes: number;
  comments: number;
  author: string;
  date: string;
  liked: boolean;
}

interface ActivityItem {
  id: number;
  author: string;
  action: string;
  detail: string;
  date: string;
  type: "status-change" | "comment" | "created";
}

const statusColors = {
  PLANNED: "bg-blue-100 text-blue-800",
  "IN PROGRESS": "bg-purple-100 text-purple-800",
  COMPLETE: "bg-green-100 text-green-800",
  "UNDER REVIEW": "bg-yellow-100 text-yellow-800",
};

const mockPosts: Post[] = [
  {
    id: 1,
    title: "hello world",
    description: "",
    category: "general",
    status: "PLANNED",
    votes: 1,
    comments: 0,
    author: "User",
    date: "Sep 25, 2025",
    liked: false,
  },
  {
    id: 2,
    title: "healthcare management System",
    description: "build a healthcare management system",
    category: "feature",
    status: "IN PROGRESS",
    votes: 1,
    comments: 3,
    author: "Swarup Basu",
    date: "Sep 25, 2025",
    liked: false,
  },
];

const mockActivity: ActivityItem[] = [
  {
    id: 1,
    author: "Swarup Basu",
    action: "marked this post as",
    detail: "IN PROGRESS",
    date: "September 25, 2025",
    type: "status-change",
  },
  {
    id: 2,
    author: "Swarup Basu",
    action: "marked this post as",
    detail: "PLANNED",
    date: "September 25, 2025",
    type: "status-change",
  },
  {
    id: 3,
    author: "Swarup Basu",
    action: "created",
    detail: "testing",
    date: "September 25, 2025",
    type: "created",
  },
];

export default function FeedbackClient() {
  const [selectedPost, setSelectedPost] = useState<Post | null>(mockPosts[1]);
  const [posts, setPosts] = useState(mockPosts);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("Default");

  const toggleLike = (postId: number) => {
    setPosts(
      posts.map((p) =>
        p.id === postId
          ? {
              ...p,
              liked: !p.liked,
              votes: p.liked ? p.votes - 1 : p.votes + 1,
            }
          : p,
      ),
    );
    if (selectedPost?.id === postId) {
      setSelectedPost({
        ...selectedPost,
        liked: !selectedPost.liked,
        votes: selectedPost.liked
          ? selectedPost.votes - 1
          : selectedPost.votes + 1,
      });
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white dark:bg-background border-r border-gray-200 dark:border-border p-6 overflow-y-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-lg font-bold text-gray-900">Portal</h1>
          <button className="p-2 hover:bg-gray-100 rounded-lg">
            <Settings className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* User Segment */}
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            User Segment
          </h3>
          <button className="w-full px-4 py-2 bg-gray-100 text-gray-900 rounded-lg text-sm font-medium flex items-center justify-between hover:bg-gray-200">
            Everyone (default)
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>

        {/* Date Range */}
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Date Range
          </h3>
          <div className="flex gap-2">
            <button className="flex-1 px-3 py-2 bg-gray-200 text-gray-900 rounded text-xs font-medium">
              POSTS
            </button>
            <button className="flex-1 px-3 py-2 bg-gray-100 text-gray-600 rounded text-xs font-medium">
              VOTES
            </button>
          </div>
          <button className="w-full mt-3 px-4 py-2 bg-white dark:bg-card text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-border rounded-lg text-sm font-medium text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700">
            All time
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>

        {/* Boards */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">Boards</h3>
            <button className="text-xs text-blue-600 hover:text-blue-700 font-medium">
              Select All
            </button>
          </div>
          <div className="space-y-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                defaultChecked
                className="w-4 h-4 rounded"
              />
              <span className="text-sm text-gray-700">Build a site</span>
              <span className="ml-auto text-xs text-gray-500">2</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded" />
              <span className="text-sm text-gray-700">Create board</span>
            </label>
          </div>
        </div>

        {/* Status */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">Status</h3>
            <button className="text-xs text-gray-500 hover:text-gray-700 font-medium">
              Reset
            </button>
          </div>
          <div className="space-y-2">
            {[
              "Open",
              "Under Review",
              "Planned",
              "In Progress",
              "Complete",
              "Closed",
            ].map((status) => (
              <label
                key={status}
                className="flex items-center gap-3 cursor-pointer"
              >
                <input
                  type="checkbox"
                  defaultChecked={["Open", "Planned", "In Progress"].includes(
                    status,
                  )}
                  className="w-4 h-4 rounded"
                />
                <span className="text-sm text-gray-700">{status}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Companies */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Companies
          </h3>
          <div className="flex gap-2">
            <button className="flex-1 px-3 py-2 bg-gray-100 text-gray-900 rounded text-xs font-medium">
              BY NAME
            </button>
            <button className="flex-1 px-3 py-2 bg-white dark:bg-card text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-border rounded text-xs font-medium">
              BY ACCOUNT OWNER
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Posts List */}
        <div className="w-80 border-r border-gray-200 bg-white">
          {/* Search and Filter */}
          <div className="border-b border-gray-200 p-4 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-2">
              <button className="flex-1 px-3 py-2 bg-gray-100 text-gray-900 rounded text-xs font-medium flex items-center justify-center gap-2 hover:bg-gray-200">
                <span>Default</span>
                <ChevronDown className="w-3 h-3" />
              </button>
              <button className="flex-1 px-3 py-2 bg-white dark:bg-card border border-gray-200 dark:border-border text-gray-600 dark:text-gray-300 rounded text-xs font-medium flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700">
                <TrendingUp className="w-4 h-4" />
                <span>Trending</span>
              </button>
              <button className="px-3 py-2 bg-white dark:bg-card border border-gray-200 dark:border-border text-gray-600 dark:text-gray-300 rounded text-xs font-medium hover:bg-gray-50 dark:hover:bg-gray-700">
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Posts */}
          <div className="overflow-y-auto">
            {posts.map((post) => (
              <div
                key={post.id}
                onClick={() => setSelectedPost(post)}
                className={`border-b border-gray-100 p-4 cursor-pointer transition-colors ${
                  selectedPost?.id === post.id
                    ? "bg-blue-50 border-l-4 border-l-blue-500"
                    : "hover:bg-gray-50"
                }`}
              >
                <h3 className="font-semibold text-gray-900 text-sm mb-1">
                  {post.title}
                </h3>
                {post.description && (
                  <p className="text-xs text-gray-600 mb-3">
                    {post.description}
                  </p>
                )}
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${statusColors[post.status]}`}
                  >
                    {post.status}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>📌 {post.votes}</span>
                  <span>💬 {post.comments}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Post Details */}
        {selectedPost && (
          <div className="flex-1 overflow-y-auto">
            <div className="bg-white">
              {/* Header */}
              <div className="border-b border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                      {selectedPost.title}
                    </h1>
                    {selectedPost.description && (
                      <p className="text-gray-600">
                        {selectedPost.description}
                      </p>
                    )}
                  </div>
                  <button className="p-2 hover:bg-gray-100 rounded-lg">
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </div>

              {/* Details Panel */}
              <div className="grid grid-cols-3 gap-6 p-6 border-b border-gray-200">
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-2">
                    DETAILS
                  </p>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Public link</p>
                      <p className="text-sm text-blue-600 truncate">
                        https://swarup001.canny.io...
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Status</p>
                      <p className="text-sm font-medium text-gray-900">
                        {selectedPost.status}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Owner</p>
                      <p className="text-sm text-gray-400">—</p>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-3">Estimated</p>
                  <p className="text-sm text-gray-400">—</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-3">Category</p>
                  <button className="text-sm text-blue-600 hover:text-blue-700">
                    Add
                  </button>
                </div>
              </div>

              {/* Voting and Info */}
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => toggleLike(selectedPost.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                      selectedPost.liked
                        ? "bg-red-100 text-red-600 hover:bg-red-200"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    <Heart
                      className={`w-4 h-4 ${selectedPost.liked ? "fill-current" : ""}`}
                    />
                    {selectedPost.votes}
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 text-gray-700 font-medium hover:bg-gray-200">
                    <MessageCircle className="w-4 h-4" />
                    {selectedPost.comments}
                  </button>
                </div>
                <div className="text-xs text-gray-500">
                  {selectedPost.date} • by {selectedPost.author}
                </div>
              </div>

              {/* Activity Feed */}
              <div className="p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">
                  Activity Feed
                </h3>
                <div className="space-y-4">
                  {mockActivity.map((item) => (
                    <div
                      key={item.id}
                      className="flex gap-3 pb-4 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-semibold text-blue-600">
                          {item.author[0]}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">
                          <span className="font-semibold">{item.author}</span>{" "}
                          {item.action}{" "}
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[item.detail as keyof typeof statusColors] || "bg-gray-100"}`}
                          >
                            {item.detail}
                          </span>
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {item.date}
                        </p>
                        <div className="flex gap-4 mt-2 text-xs text-gray-600">
                          <button className="hover:text-blue-600">
                            Edit Comment
                          </button>
                          <button className="hover:text-blue-600">
                            Pin Comment
                          </button>
                          <button className="hover:text-blue-600">Reply</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
