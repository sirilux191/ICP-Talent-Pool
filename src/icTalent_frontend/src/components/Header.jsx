import React from "react";
import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import { ModeToggle } from "./mode-toggle";

function Header() {
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
          <ModeToggle />
        </nav>
      </div>
    </header>
  );
}

export default Header;
