"use client"
import {useAuth} from '@/hooks/useAuth';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  } from "@/components/ui/card";
import {Button} from "@/components/ui/button"
export default function ProfilePage() {

  const {user} = useAuth();

 return (
    <div className="container mx-auto py-10">
      <Card className="max-w-md mx-auto p-6 shadow-lg">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold">
            👤 User Profile
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          <div>
            <p className="text-sm text-gray-500">Name</p>
            <p className="text-lg font-medium">{user?.name || "No name available"}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Email</p>
            <p className="text-lg font-medium">{user?.email}</p>
          </div>

          <div>

            <p className="text-sm text-gray-500">Role</p>

            <p className="text-lg font-medium">{user?.role}</p>
          </div>

          <div className="pt-6">
            <Button variant="destructive" className="w-full" onClick={() => signOut()}>
              Logout 
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
