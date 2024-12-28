import React, { useState, useContext, useEffect } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { VisuallyHidden } from "../components/ui/visually-hidden";
import { useToast } from "../hooks/use-toast";

import ActorContext from "../ActorContext";

function Explore() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [tokenAmount, setTokenAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [tokens, setTokens] = useState([]);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { actors, isAuthenticated } = useContext(ActorContext);

  // Fetch tokens on component mount
  useEffect(() => {
    if (actors?.tokenFactory) {
      fetchTokens();
    }
  }, [actors?.tokenFactory]);

  const fetchTokens = async () => {
    try {
      if (!actors?.tokenFactory) {
        throw new Error("Token Factory canister not initialized");
      }
      const result = await actors.tokenFactory.get_list_of_tokens();
      if (result.Ok) {
        const formattedTokens = result.Ok.map(([principal, metadata]) => ({
          id: principal.toString(),
          owner: metadata.owner.toString(),
          name: metadata.name,
          symbol: metadata.symbol,
          tokenPrice: metadata.token_price,
          decimals: metadata.decimals,
          logo: metadata.logo,
          created: metadata.created,
          // Remove unused fields
        }));
        console.log(formattedTokens);
        setTokens(formattedTokens);
      } else {
        throw new Error(result.Err);
      }
    } catch (error) {
      console.error("Error fetching tokens:", error);
      toast({
        title: "Error",
        description: "Failed to fetch tokens",
        variant: "destructive",
      });
    }
  };

  const handleCardClick = (talentId) => {
    navigate(`/talent/${talentId}`);
  };

  // Filter talents based on the search query
  const filteredTokens = tokens.filter((token) =>
    token.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleFaucetRequest = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast({
        title: "Error",
        description: "Please login first",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      if (!actors?.tokenFactory) {
        throw new Error("Token Factory canister not initialized");
      }

      const amount = parseInt(tokenAmount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error("Please enter a valid token amount");
      }

      const result = await actors.tokenFactory.send_token_faucet_request(
        amount
      );

      if (result.Ok) {
        toast({
          title: "Success",
          description: result.Ok,
        });
        setIsFormOpen(false);
        setTokenAmount("");
      } else {
        throw new Error(result.Err);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to request tokens",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold">Explore Talents</h1>
        <Button
          onClick={() => {
            if (!isAuthenticated) {
              toast({
                title: "Error",
                description: "Please login first",
                variant: "destructive",
              });
              return;
            }
            setIsFormOpen(true);
          }}
        >
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
        {filteredTokens.map((token) => (
          <Card
            key={token.id}
            className="cursor-pointer hover:shadow-lg transition-all"
            onClick={() => handleCardClick(token.id)}
          >
            <CardHeader>
              <div className="flex items-center space-x-4">
                <Avatar>
                  {token.logo ? (
                    <AvatarImage src={token.logo} />
                  ) : (
                    <AvatarImage
                      src={`https://api.dicebear.com/6.x/initials/svg?seed=${token.name}`}
                    />
                  )}
                  <AvatarFallback>
                    {token.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle>{token.name}</CardTitle>
                  <CardDescription>{token.symbol}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Token Price
                </span>
                <span className="font-medium">{token.tokenPrice} TALENT</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Symbol</span>
                  <span>{token.symbol}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Decimals</span>
                  <span>{token.decimals}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Created</span>
                  <span>
                    {new Date(
                      Number(token.created) / 1000000
                    ).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Owner</span>
                  <span
                    className="font-mono text-xs truncate max-w-[150px]"
                    title={token.owner}
                  >
                    {token.owner}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
      >
        <DialogContent aria-labelledby="request-tokens-title">
          <DialogHeader>
            <VisuallyHidden>
              <DialogTitle id="request-tokens-title">
                Request Talent Tokens
              </DialogTitle>
            </VisuallyHidden>

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
