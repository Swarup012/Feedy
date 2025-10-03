import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";
import Link from 'next/link';

const columns = [
  {
    title: 'Under Consideration',
    description: 'Ideas being evaluated',
    color: 'bg-gray-500',
    tasks: [
      { id: 'task-1', title: 'Multi-language support', feedbackCount: 42, voteCount: 150 },
      { id: 'task-2', title: 'Embeddable widget', feedbackCount: 15, voteCount: 88 },
    ],
  },
  {
    title: 'Planned',
    description: 'Scheduled for future release',
    color: 'bg-blue-500',
    tasks: [
      { id: 'task-3', title: 'Dark Mode', feedbackCount: 25, voteCount: 128 },
      { id: 'task-4', title: 'Jira Integration', feedbackCount: 30, voteCount: 110 },
    ],
  },
  {
    title: 'In Progress',
    description: 'Currently being developed',
    color: 'bg-yellow-500',
    tasks: [
      { id: 'task-5', title: 'Slack Integration', feedbackCount: 18, voteCount: 95 },
    ],
  },
  {
    title: 'Completed',
    description: 'Recently launched features',
    color: 'bg-green-500',
    tasks: [
      { id: 'task-6', title: 'Merge duplicate feedback', feedbackCount: 50, voteCount: 250 },
    ],
  },
];

export default function RoadmapPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold font-headline">Roadmap</h1>
        <Button>
          <Plus className="-ml-1 mr-2 h-4 w-4" />
          Suggest a Feature
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {columns.map((column) => (
          <div key={column.title} className="bg-secondary rounded-lg">
            <div className="p-4 border-b border-border">
              <div className="flex items-center gap-3">
                 <span className={`h-2.5 w-2.5 rounded-full ${column.color}`}></span>
                 <h2 className="font-semibold text-foreground">{column.title}</h2>
                 <span className="text-sm font-medium text-muted-foreground">{column.tasks.length}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">{column.description}</p>
            </div>
            <div className="p-4 space-y-4">
              {column.tasks.map((task) => (
                <Card key={task.id} className="hover:bg-card/80 transition-colors">
                  <CardContent className="p-4">
                    <Link href={`/feedback`}>
                      <h3 className="font-medium hover:text-primary">{task.title}</h3>
                    </Link>
                    <div className="flex justify-between items-center mt-3 text-xs text-muted-foreground">
                      <span>{task.feedbackCount} posts</span>
                      <span>{task.voteCount} votes</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
