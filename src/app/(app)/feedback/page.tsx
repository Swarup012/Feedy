import { mockFeedback } from '@/lib/data';
import { feedbackCategories, feedbackStatuses } from '@/lib/types';
import { FeedbackCard } from './components/feedback-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { List, LayoutGrid } from 'lucide-react';
import { SubmitFeedback } from './components/submit-feedback';

export default function FeedbackPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <aside className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-sm font-medium mb-2">Status</h3>
                <div className="space-y-2">
                  {feedbackStatuses.map((status) => (
                    <div key={status} className="flex items-center space-x-2">
                      <Checkbox id={`status-${status}`} />
                      <Label htmlFor={`status-${status}`} className="capitalize font-normal">{status.replace('-', ' ')}</Label>
                    </div>
                  ))}
                </div>
              </div>
              <Separator />
              <div>
                <h3 className="text-sm font-medium mb-2">Category</h3>
                <div className="space-y-2">
                  {feedbackCategories.map((category) => (
                    <div key={category} className="flex items-center space-x-2">
                      <Checkbox id={`category-${category}`} />
                      <Label htmlFor={`category-${category}`} className="font-normal">{category}</Label>
                    </div>
                  ))}
                </div>
              </div>
              <Separator />
              <Button variant="ghost" className="w-full">Clear all filters</Button>
            </CardContent>
          </Card>
        </aside>

        <main className="md:col-span-3">
          <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
            <h1 className="text-2xl font-bold font-headline">Feedback Board</h1>
            <div className="flex items-center gap-4">
              <Select defaultValue="most-votes">
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="most-votes">Most Votes</SelectItem>
                  <SelectItem value="trending">Trending</SelectItem>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="oldest">Oldest</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                 <Button variant="outline" size="icon"><LayoutGrid className="h-4 w-4" /></Button>
                 <Button variant="ghost" size="icon"><List className="h-4 w-4" /></Button>
              </div>
              <SubmitFeedback />
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-6">
            {mockFeedback.map((feedback) => (
              <FeedbackCard key={feedback.id} feedback={feedback} />
            ))}
          </div>

          <div className="flex items-center justify-center mt-8">
            <Button variant="outline">Load more</Button>
          </div>
        </main>
      </div>
    </div>
  );
}
