export type User = {
  id: string;
  name: string;
  avatarUrl: string;
};

export type FeedbackStatus = 'open' | 'planned' | 'in-progress' | 'completed' | 'closed';
export const feedbackStatuses: FeedbackStatus[] = ['open', 'planned', 'in-progress', 'completed', 'closed'];

export type FeedbackCategory = 'Feature Request' | 'Bug' | 'Improvement' | 'Integration';
export const feedbackCategories: FeedbackCategory[] = ['Feature Request', 'Bug', 'Improvement', 'Integration'];

export type Feedback = {
  id: string;
  title: string;
  description: string;
  status: FeedbackStatus;
  category: FeedbackCategory;
  tags: string[];
  author: User;
  createdAt: string;
  voteCount: number;
  commentCount: number;
};
