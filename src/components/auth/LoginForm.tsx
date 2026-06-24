"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Eye, EyeOff, LogIn } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuthStore } from "@/store/authStore";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { AxiosError } from "axios";
import { Checkbox } from "@/components/ui/checkbox";

const loginSchema = z.object({
  account: z.string().min(1, "아이디를 입력해주세요"),
  password: z.string().min(1, "비밀번호를 입력해주세요"),
  rememberMe: z.boolean().optional().default(false),
});

type LoginForm = z.infer<typeof loginSchema>;

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { login, isLoading } = useAuthStore();

  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      account: "",
      password: "",
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      setError("");
      await login({
        account: data.account,
        password: data.password,
        rememberMe: data.rememberMe,
      });

      window.location.href = "/dashboard";
    } catch (error: unknown | AxiosError) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : error && typeof error === "object" && "response" in error
          ? (error as { response: { data: { message: string } } })?.response
              ?.data?.message || "로그인에 실패했습니다"
          : "로그인에 실패했습니다";

      if ((error as AxiosError).response?.status === 400) {
        setError("로그인 정보가 일치하지 않습니다");
      } else {
        setError(errorMessage);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            관리자 로그인
          </CardTitle>
          <CardDescription className="text-center">
            계정 정보를 입력하여 로그인하세요
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="account">아이디</Label>
              <Input
                id="account"
                type="text"
                placeholder="아이디를 입력하세요"
                {...form.register("account")}
                disabled={isLoading}
              />
              {form.formState.errors.account && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.account.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="비밀번호를 입력하세요"
                  {...form.register("password")}
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {form.formState.errors.password && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>

            <div className="flex items-center space-x-2 mt-2">
              <Checkbox
                id="rememberMe"
                {...form.register("rememberMe")}
                checked={form.watch("rememberMe")}
                onCheckedChange={(checked) =>
                  form.setValue("rememberMe", Boolean(checked))
                }
              />
              <Label
                htmlFor="rememberMe"
                className="text-sm font-medium leading-none"
              >
                로그인 상태 유지
              </Label>
            </div>

            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  로그인 중...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <LogIn className="h-4 w-4" />
                  로그인
                </div>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
