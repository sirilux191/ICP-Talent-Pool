import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "../components/ui/card";

function Home() {
  const navigate = useNavigate();

  return (
    <div className="space-y-12 py-8">
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-bold tracking-tight">
          Welcome to <span className="text-primary">ICP Talent Pool</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          A decentralized platform where talent meets opportunity. Invest in
          promising individuals and grow your portfolio on the Internet
          Computer.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-2xl">Create Your Talent Token</CardTitle>
            <CardDescription className="text-base">
              Tokenize your skills and let investors support your growth journey
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              size="lg"
              className="w-full"
              onClick={() => navigate("/profile")}
            >
              Create Token
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-2xl">Explore Talents</CardTitle>
            <CardDescription className="text-base">
              Browse through a curated list of talented individuals and invest
              in their future
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              size="lg"
              variant="secondary"
              className="w-full"
              onClick={() => navigate("/explore")}
            >
              Browse Talents
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default Home;
