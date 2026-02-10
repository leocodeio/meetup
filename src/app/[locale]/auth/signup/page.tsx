"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  betterAuthGoogle,
  betterAuthSignUp,
} from "@/server/services/auth/auth-client";
import { Home, User, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { PROFILE_PICTURES } from "@/lib/models/profilePictures";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";

export default function SignupPage() {
  const t = useTranslations("Auth");
  const params = useParams();
  const locale = params.locale as string;
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    image: PROFILE_PICTURES[0],
  });

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      await betterAuthGoogle(`/${locale}/dashboard`);
    } catch (error) {
      console.error("Google sign in error:", error);
      toast.error("Google sign up failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }

    try {
      setIsLoading(true);
      await betterAuthSignUp(
        formData.name,
        formData.email,
        formData.password,
        formData.image,
        `/${locale}/dashboard`
      );
    } catch (error) {
      console.error("Email sign up error:", error);
      toast.error("Sign up failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">
          {t("signup.title")}
        </CardTitle>
        <CardDescription className="text-center">
          {t("signup.description")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-end">
          <Link href={`/${locale}`} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
            <Home className="h-3.5 w-3.5" />
            {t("common.goHome")}
          </Link>
        </div>

        {/* Google Sign Up */}
        <Button
          className="w-full"
          onClick={handleGoogleSignIn}
          disabled={isLoading}
        >
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          {t("signup.google")}
        </Button>

        {/* Email/Password Signup */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator className="w-full" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              {t("common.or")}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t("common.name")}</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="name"
                type="text"
                placeholder={t("common.namePlaceholder")}
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t("common.profilePicture")}</Label>
            <div className="grid grid-cols-4 gap-2">
              {PROFILE_PICTURES.map((pic: string, index: number) => (
                <div
                  key={index}
                  className="cursor-pointer flex items-center justify-center"
                  onClick={() => setFormData({ ...formData, image: pic })}
                >
                  <Avatar
                    className={`h-16 w-16 rounded-full border-2 transition-colors duration-200 ${
                      formData.image === pic
                        ? "border-primary"
                        : "border-transparent"
                    }`}
                  >
                    <AvatarImage src={pic} alt={`Profile ${index + 1}`} />
                  </Avatar>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">{t("common.email")}</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder={t("common.emailPlaceholder")}
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">{t("common.password")}</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder={t("common.passwordPlaceholder")}
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="pl-10 pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">
              {t("common.confirmPassword")}
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder={t("common.confirmPasswordPlaceholder")}
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData({ ...formData, confirmPassword: e.target.value })
                }
                className="pl-10 pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {t("signup.submit")}
          </Button>
        </form>

        {/* Login Link */}
        <div className="text-center text-sm">
          <span className="text-muted-foreground">
            {t("signup.hasAccount")}{" "}
          </span>
          <Link
            href="login"
            className="text-primary hover:underline font-medium"
          >
            {t("signup.signIn")}
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
