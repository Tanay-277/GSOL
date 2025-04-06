"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BlurFade } from "@/components/ui/blur";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { H3, P } from "@/components/ui/typography";
import { useUser } from "@/hooks/use-user";
import { useState } from "react";

export interface User {
  name?: string;
  email?: string;
  image?: string;
}

export default function ProfilePage() {
  const { user: sessionUser } = useUser();
  const [user, setUser] = useState<User | null>(sessionUser || null);
  const [isEditing, setIsEditing] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUser((prevUser) => (prevUser ? { ...prevUser, [name]: value } : null));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    console.log("Updated user:", user);
    setIsEditing(false);
  };

  if (!user) {
    return <p>Loading...</p>;
  }

  return (
    <BlurFade inView>
      <section className="mx-auto max-w-6xl py-8 pt-4 md:px-4 md:pb-12">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col space-y-2 text-left">
            <H3 className="text-2xl font-bold tracking-tight md:text-3xl">Account</H3>
            <P className="text-muted-foreground">Manage your account information</P>
          </div>
        </div>

        <Card className="my-10 w-full max-w-md">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div className="flex items-center justify-center">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={user?.image} alt={user?.name} />
                    <AvatarFallback className="bg-slate-200 text-xl text-slate-600">
                      {user?.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={user?.name ?? ""}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={user?.email ?? ""}
                    onChange={handleInputChange}
                    disabled
                  />
                </div>
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex justify-end space-x-2">
            {isEditing ? (
              <>
                <Button type="submit" onClick={handleSubmit} variant="outline">
                  Save Changes
                </Button>
                <Button variant="destructive" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsEditing(true)} variant="outline">
                Edit Profile
              </Button>
            )}
          </CardFooter>
        </Card>
      </section>
    </BlurFade>
  );
}
