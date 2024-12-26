import React, { useState } from "react";
import { Input } from "../components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "../components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import Dialog, {
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { useToast } from "../components/ui/use-toast";

const talents = [
  {
    id: 1,
    name: "Alice Johnson",
    skill: "Full-stack Developer",
    tokenPrice: 0.05,
    achievements: [
      "Built scalable microservices architecture",
      "Led team of 5 developers",
      "Contributed to open-source projects",
    ],
    tokenMetadata: {
      symbol: "ALICE",
      totalSupply: 1000000,
      circulatingSupply: 750000,
      marketCap: 50000,
    },
  },
  {
    id: 2,
    name: "Bob Smith",
    skill: "AI Researcher",
    tokenPrice: 0.08,
    achievements: [],
    tokenMetadata: {
      symbol: "BOB",
      totalSupply: 500000,
      circulatingSupply: 300000,
      marketCap: 24000,
    },
  },
  {
    id: 3,
    name: "Carol Williams",
    skill: "UX Designer",
    tokenPrice: 0.03,
    achievements: [],
    tokenMetadata: {
      symbol: "CAROL",
      totalSupply: 750000,
      circulatingSupply: 500000,
      marketCap: 15000,
    },
  },
];

function Explore() {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [tokenAmount, setTokenAmount] = useState("");
  const { notify } = useToast();

  const handleCardClick = (talentId) => {
    navigate(`/talent/${talentId}`);
  };

  // Filter talents based on the search query
  const filteredTalents = talents.filter((talent) =>
    talent.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleFaucetRequest = async (e) => {
    e.preventDefault();
    try {
      // Add your API call here to request tokens
      // For now, just simulating success
      notify({
        title: "Success!",
        description: `Successfully requested ${tokenAmount} Talent Tokens`,
      });
      setIsFormOpen(false);
      setTokenAmount("");
    } catch (error) {
      notify({
        title: "Error",
        description: "Failed to request tokens. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold">Explore Talents</h1>
        <Button onClick={() => setIsFormOpen(true)}>
          Request Talent Tokens
        </Button>
      </div>
      <Input
        placeholder="Search talents..."
        className="max-w-md"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)} // Update search query state
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTalents.map((talent) => (
          <Card
            key={talent.id}
            className="cursor-pointer hover:shadow-lg transition-all"
            onClick={() => handleCardClick(talent.id)}
          >
            <CardHeader>
              <div className="flex items-center space-x-4">
                <Avatar>
                  <AvatarImage
                    src={`https://api.dicebear.com/6.x/initials/svg?seed=${talent.name}`}
                  />
                  <AvatarFallback>
                    {talent.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle>{talent.name}</CardTitle>
                  <CardDescription>{talent.skill}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Token Price
                </span>
                <span className="font-medium">{talent.tokenPrice} ICP</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Symbol</span>
                  <span>{talent.tokenMetadata.symbol}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Market Cap</span>
                  <span>{talent.tokenMetadata.marketCap} ICP</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Circulating Supply
                  </span>
                  <span>{talent.tokenMetadata.circulatingSupply}</span>
                </div>
              </div>
              <div className="pt-2">
                <div className="text-sm text-muted-foreground mb-2">
                  Recent Achievements
                </div>
                <ul className="text-sm list-disc list-inside space-y-1">
                  {(talent.achievements || [])
                    .slice(0, 2)
                    .map((achievement, index) => (
                      <li
                        key={index}
                        className="truncate"
                      >
                        {achievement}
                      </li>
                    ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Talent Tokens</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={handleFaucetRequest}
            className="space-y-4"
          >
            <div>
              <Input
                type="number"
                placeholder="Enter amount of tokens"
                value={tokenAmount}
                onChange={(e) => setTokenAmount(e.target.value)}
                required
                min="1"
              />
            </div>
            <Button
              type="submit"
              className="w-full"
            >
              Send Request
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Explore;
