import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { Moon, Sun, Trophy } from "lucide-react";
import { useTheme } from "next-themes";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export default function Header() {
  const { login, clear, loginStatus, identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const { theme, setTheme } = useTheme();

  const isAuthenticated = !!identity;
  const disabled = loginStatus === "logging-in";
  const text =
    loginStatus === "logging-in"
      ? "Logging in..."
      : isAuthenticated
        ? "Logout"
        : "Login";

  const handleAuth = async () => {
    if (isAuthenticated) {
      await clear();
      queryClient.clear();
    } else {
      try {
        await login();
      } catch (error: any) {
        console.error("Login error:", error);
        if (error.message === "User is already authenticated") {
          await clear();
          setTimeout(() => login(), 300);
        }
      }
    }
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Trophy className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold text-foreground">Racing Arena</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            {theme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>
          <Button
            onClick={handleAuth}
            disabled={disabled}
            variant={isAuthenticated ? "outline" : "default"}
          >
            {text}
          </Button>
        </div>
      </div>
    </header>
  );
}
