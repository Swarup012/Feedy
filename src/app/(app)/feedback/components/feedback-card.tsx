import Link from 'next/link';
import Image from 'next/image';
import type { Feedback } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, ArrowUp } from 'lucide-react';

interface FeedbackCardProps {
  feedback: Feedback;
}

const statusColors: { [key: string]: string } = {
  open: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
  planned: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
  'in-progress': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
  closed: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
};

export function FeedbackCard({ feedback }: FeedbackCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4 flex items-start gap-4">
        <div className="flex flex-col items-center gap-1">
          <Button variant="outline" size="sm" className="flex flex-col h-auto p-2">
            <ArrowUp className="h-4 w-4" />
            <span className="text-xs font-bold">{feedback.voteCount}</span>
          </Button>
        </div>
        <div className="flex-grow">
          <div className="flex items-center justify-between mb-2">
             <Link href={`/feedback/${feedback.id}`}>
               <h3 className="font-semibold hover:text-primary transition-colors">{feedback.title}</h3>
             </Link>
             <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MessageSquare className="h-4 w-4" />
                    <span>{feedback.commentCount}</span>
                </div>
                <Badge className={`border-transparent text-xs capitalize ${statusColors[feedback.status]}`}>{feedback.status.replace('-', ' ')}</Badge>
             </div>
          </div>
          
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{feedback.description}</p>
          
          <div className="flex items-center justify-between text-xs text-muted-foreground">
             <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={feedback.author.avatarUrl} alt={feedback.author.name} />
                <AvatarFallback>{feedback.author.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <span>{feedback.author.name} &middot; {feedback.createdAt}</span>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="secondary">{feedback.category}</Badge>
              {feedback.tags.map(tag => (
                  <Badge key={tag} variant="outline" className="hidden sm:inline-flex capitalize">{tag}</Badge>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
