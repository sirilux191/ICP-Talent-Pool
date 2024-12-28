import React, { useState, useContext } from "react";
import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import { ModeToggle } from "./mode-toggle";
import ActorContext from "../ActorContext";
import { Copy, LogOut, LogIn } from "lucide-react";
import { useToast } from "../hooks/use-toast";

function Header() {
  const { actors, isAuthenticated, login, logout } = useContext(ActorContext);
  const { toast } = useToast();
  const [principal, setPrincipal] = useState(null);

  const fetchAndCopyPrincipal = async () => {
    try {
      const res = await actors.icTalentBackend.whoami();
      const principalStr = res.toString();
      setPrincipal(principalStr);
      await navigator.clipboard.writeText(principalStr);
      toast({
        title: "Success",
        description: "Principal copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy principal",
        variant: "destructive",
      });
    }
  };

  const handleAuth = async () => {
    if (isAuthenticated) {
      await logout();
      setPrincipal(null);
    } else {
      await login();
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link
          to="/"
          className="flex items-center space-x-2"
        >
          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold">IC</span>
          </div>
          <span className="font-bold text-xl">Talent Pool</span>
        </Link>
        <nav className="flex items-center space-x-6">
          <Link to="/explore">
            <Button
              variant="ghost"
              className="text-base"
            >
              Explore
            </Button>
          </Link>
          <Link to="/profile">
            <Button
              variant="ghost"
              className="text-base"
            >
              Profile
            </Button>
          </Link>
          <Link to="/transactions">
            <Button
              variant="ghost"
              className="text-base"
            >
              Wallet
            </Button>
          </Link>
          {isAuthenticated && (
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              onClick={fetchAndCopyPrincipal}
            >
              <span className="truncate max-w-[100px]">
                {principal || "Get Principal"}
              </span>
              <Copy className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
            onClick={handleAuth}
          >
            {isAuthenticated ? (
              <>
                <span>Logout</span>
                <LogOut className="h-4 w-4" />
              </>
            ) : (
              <>
                <span>Login</span>
                <LogIn className="h-4 w-4" />
              </>
            )}
          </Button>
          <ModeToggle />
        </nav>
      </div>
    </header>
  );
}

export default Header;
