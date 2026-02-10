"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getSession } from "@/server/services/auth/auth-client";
import { toast } from "sonner";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { PROFILE_PICTURES } from "@/lib/models/profilePictures";
import { Avatar, AvatarImage } from "@/components/ui/avatar";

interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
}

export default function ProfilePage() {
  const t = useTranslations("Profile");
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [name, setName] = useState("");
  const [image, setImage] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [updatingImage, setUpdatingImage] = useState(false);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const session = await getSession();
        if (session?.data?.user) {
          const userData = {
            id: session.data.user.id,
            name: session.data.user.name || "User",
            email: session.data.user.email,
            image: session.data.user.image || undefined,
          };
          setUser(userData);
          setName(userData.name);
          setImage(userData.image || PROFILE_PICTURES[0]);
        } else {
          router.push("/auth/login");
        }
      } catch (error) {
        console.error("Failed to get session:", error);
        toast.error("Failed to load profile");
        router.push("/auth/login");
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [router]);

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Name cannot be empty");
      return;
    }

    setUpdating(true);
    try {
      const response = await fetch("/api/user/update-name", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) throw new Error("Failed to update name");

      setUser(user ? { ...user, name } : null);
      toast.success("Name updated successfully");
    } catch (error) {
      console.error("Error updating name:", error);
      toast.error("Failed to update name");
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateImage = async () => {
    if (!image.trim()) {
      toast.error("Please select a profile picture");
      return;
    }

    setUpdatingImage(true);
    try {
      const response = await fetch("/api/user/update-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image }),
      });

      if (!response.ok) throw new Error("Failed to update image");

      setUser(user ? { ...user, image } : null);
      toast.success("Profile picture updated successfully");
    } catch (error) {
      console.error("Error updating image:", error);
      toast.error("Failed to update profile picture");
    } finally {
      setUpdatingImage(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">{t("loading")}</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <Sidebar user={user} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <Header page="Profile" user={user} />

        {/* Main Content */}
        <main className="px-4 py-8 md:py-12 flex-1">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>Edit Profile</CardTitle>
              <CardDescription>Update your profile information</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateName} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Profile Picture</label>
                  <div className="grid grid-cols-4 gap-2">
                    {PROFILE_PICTURES.map((pic: string, index: number) => (
                      <div
                        key={index}
                        className="cursor-pointer flex items-center justify-center"
                        onClick={() => setImage(pic)}
                      >
                        <Avatar
                          className={`h-16 w-16 rounded-full border-2 transition-colors duration-200 ${image === pic
                              ? "border-primary"
                              : "border-transparent"
                            }`}
                        >
                          <AvatarImage src={pic} alt={`Profile ${index + 1}`} />
                        </Avatar>
                      </div>
                    ))}
                  </div>
                  <Button
                    type="button"
                    onClick={handleUpdateImage}
                    className="w-full"
                    disabled={updatingImage || image === user.image}
                  >
                    {updatingImage ? "Updating..." : "Update Profile Picture"}
                  </Button>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Name</label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <Input value={user.email} disabled />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={updating || name === user.name || !name.trim()}
                >
                  {updating ? "Updating..." : "Update Name"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
