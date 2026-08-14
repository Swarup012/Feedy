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
  PLANNED: "bg-primary/10 text-primary",
  "IN PROGRESS": "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  COMPLETE: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  "UNDER REVIEW": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
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
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-52 bg-card border-r border-border p-4 overflow-y-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-lg font-bold text-foreground">Portal</h1>
          <button className="p-2 hover:bg-muted rounded-lg transition-colors">
            <Settings className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* User Segment */}
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">
            User Segment
          </h3>
          <button className="w-full px-4 py-2 bg-muted text-foreground rounded-lg text-sm font-medium flex items-center justify-between hover:bg-accent transition-colors">
            Everyone (default)
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>

        {/* Date Range */}
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">
            Date Range
          </h3>
          <div className="flex gap-2">
            <button className="flex-1 px-3 py-2 bg-accent text-foreground rounded text-xs font-medium">
              POSTS
            </button>
            <button className="flex-1 px-3 py-2 bg-muted text-muted-foreground rounded text-xs font-medium">
              VOTES
            </button>
          </div>
          <button className="w-full mt-3 px-4 py-2 bg-card text-foreground border border-border rounded-lg text-sm font-medium text-left flex items-center justify-between hover:bg-muted transition-colors">
            All time
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>

        {/* Boards */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-muted-foreground">Boards</h3>
            <button className="text-xs text-primary hover:text-primary/80 font-medium transition-colors">
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
              <span className="text-sm text-foreground">Build a site</span>
              <span className="ml-auto text-xs text-muted-foreground">2</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded" />
              <span className="text-sm text-foreground">Create board</span>
            </label>
          </div>
        </div>

        {/* Status */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-muted-foreground">Status</h3>
            <button className="text-xs text-muted-foreground hover:text-foreground font-medium transition-colors">
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
                <span className="text-sm text-foreground">{status}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Companies */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">
            Companies
          </h3>
          <div className="flex gap-2">
            <button className="flex-1 px-3 py-2 bg-muted text-foreground rounded text-xs font-medium">
              BY NAME
            </button>
            <button className="flex-1 px-3 py-2 bg-card text-muted-foreground border border-border rounded text-xs font-medium">
              BY ACCOUNT OWNER
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Posts List */}
        <div className="w-80 border-r border-border bg-card">
          {/* Search and Filter */}
          <div className="border-b border-border p-4 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-border rounded-lg text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="flex gap-2">
              <button className="flex-1 px-3 py-2 bg-muted text-foreground rounded text-xs font-medium flex items-center justify-center gap-2 hover:bg-accent transition-colors">
                <span>Default</span>
                <ChevronDown className="w-3 h-3" />
              </button>
              <button className="flex-1 px-3 py-2 bg-card border border-border text-muted-foreground rounded text-xs font-medium flex items-center justify-center gap-2 hover:bg-muted transition-colors">
                <TrendingUp className="w-4 h-4" />
                <span>Trending</span>
              </button>
              <button className="px-3 py-2 bg-card border border-border text-muted-foreground rounded text-xs font-medium hover:bg-muted transition-colors">
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
                className={`border-b border-border/60 p-4 cursor-pointer transition-colors ${
                  selectedPost?.id === post.id
                    ? "bg-primary/10 border-l-4 border-l-primary"
                    : "hover:bg-muted/50"
                }`}
              >
                <h3 className="font-semibold text-foreground text-sm mb-1">
                  {post.title}
                </h3>
                {post.description && (
                  <p className="text-xs text-muted-foreground mb-3">
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
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
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
            <div className="bg-card">
              {/* Header */}
              <div className="border-b border-border p-4">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-lg font-bold text-foreground mb-2">
                      {selectedPost.title}
                    </h1>
                    {selectedPost.description && (
                      <p className="text-muted-foreground">
                        {selectedPost.description}
                      </p>
                    )}
                  </div>
                  <button className="p-2 hover:bg-muted rounded-lg transition-colors">
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  </button>
                </div>
              </div>

              {/* Details Panel */}
              <div className="grid grid-cols-3 gap-4 p-4 border-b border-border">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2">
                    DETAILS
                  </p>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Public link</p>
                      <p className="text-sm text-primary truncate">
                        https://swarup001.canny.io...
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Status</p>
                      <p className="text-sm font-medium text-foreground">
                        {selectedPost.status}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Owner</p>
                      <p className="text-sm text-muted-foreground/70">—</p>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-3">Estimated</p>
                  <p className="text-sm text-muted-foreground/70">—</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-3">Category</p>
                  <button className="text-sm text-primary hover:text-primary/80 transition-colors">
                    Add
                  </button>
                </div>
              </div>

              {/* Voting and Info */}
              <div className="p-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => toggleLike(selectedPost.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                      selectedPost.liked
                        ? "bg-destructive/10 text-destructive hover:bg-destructive/20"
                        : "bg-muted text-foreground hover:bg-accent"
                    }`}
                  >
                    <Heart
                      className={`w-4 h-4 ${selectedPost.liked ? "fill-current" : ""}`}
                    />
                    {selectedPost.votes}
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted text-foreground font-medium hover:bg-accent transition-colors">
                    <MessageCircle className="w-4 h-4" />
                    {selectedPost.comments}
                  </button>
                </div>
                <div className="text-xs text-muted-foreground">
                  {selectedPost.date} • by {selectedPost.author}
                </div>
              </div>

              {/* Activity Feed */}
              <div className="p-4">
                <h3 className="text-sm font-semibold text-foreground mb-4">
                  Activity Feed
                </h3>
                <div className="space-y-4">
                  {mockActivity.map((item) => (
                    <div
                      key={item.id}
                      className="flex gap-3 pb-4 border-b border-border/60 last:border-b-0"
                    >
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-semibold text-primary">
                          {item.author[0]}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-foreground">
                          <span className="font-semibold">{item.author}</span>{" "}
                          {item.action}{" "}
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[item.detail as keyof typeof statusColors] || "bg-muted"}`}
                          >
                            {item.detail}
                          </span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {item.date}
                        </p>
                        <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                          <button className="hover:text-primary transition-colors">
                            Edit Comment
                          </button>
                          <button className="hover:text-primary transition-colors">
                            Pin Comment
                          </button>
                          <button className="hover:text-primary transition-colors">Reply</button>
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
