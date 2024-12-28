import React, { useEffect, useState, useContext } from "react";
import { useParams } from "react-router-dom";
import ActorContext from "../ActorContext";
import { Principal } from "@dfinity/principal";
import { Button } from "../components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "../components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { useToast } from "../hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";

function TalentProfile() {
  const { id } = useParams();
  const [talent, setTalent] = useState(null);
  const [loading, setLoading] = useState(true);
  const { actors } = useContext(ActorContext);
  const { toast } = useToast();
  const [buyQuantity, setBuyQuantity] = useState(1);
  const [showBuyDialog, setShowBuyDialog] = useState(false);

  useEffect(() => {
    const fetchTalentData = async () => {
      try {
        // Fetch token metadata
        const tokenResult = await actors.tokenFactory.get_token_metadata(
          Principal.fromText(id)
        );
        if (!tokenResult.Ok) {
          throw new Error("Token not found");
        }
        const tokenData = tokenResult.Ok;

        // Fetch user profile data
        const userResult = await actors.icTalentBackend.get_user_by_id(
          Principal.fromText(tokenData.owner.toString())
        );
        if (!userResult.Ok) {
          throw new Error("User profile not found");
        }
        const userData = userResult.Ok;

        // Get token balance
        const balanceResult = await actors.tokenFactory.get_total_supply(
          Principal.fromText(id)
        );
        console.log(balanceResult);
        const tokenBalance = balanceResult.Ok ? Number(balanceResult.Ok) : 0;
        console.log(tokenBalance);
        // Combine token and user data
        setTalent({
          id,
          name: userData.name,
          skill: userData.skill,
          description: userData.description,
          achievements: userData.achievements,
          tokenMetadata: {
            symbol: tokenData.symbol,

            circulatingSupply: tokenBalance,
            tokenPrice: Number(tokenData.token_price),
            created: tokenData.created,
            decimals: tokenData.decimals,
            owner: tokenData.owner.toString(),
          },
          stats: {
            yearsExperience: userData.stats.years_experience,
            projectsCompleted: userData.stats.projects_completed,
            clientSatisfaction: userData.stats.client_satisfaction,
          },
        });
      } catch (error) {
        console.error("Error fetching talent data:", error);
        toast({
          title: "Error",
          description: error.message || "Failed to fetch talent data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (actors?.tokenFactory && actors?.icTalentBackend) {
      fetchTalentData();
    }
  }, [id, actors]);

  const handleApproveTokenSpending = async (amount) => {
    try {
      const approveArgument = {
        fee: [],
        memo: [],
        from_subaccount: [],
        created_at_time: [],
        amount: BigInt(amount),
        expected_allowance: [],
        expires_at: [],

        spender: {
          owner: Principal.fromText(
            process.env.CANISTER_ID_IC_TALENT_TOKEN_FACTORY_CANISTER
          ),
          subaccount: [],
        },
      };

      const result =
        await actors.icrc_talent_token_ledger_canister.icrc2_approve(
          approveArgument
        );

      if ("Ok" in result) {
        toast({
          title: "Success",
          description: "Token spending approved",
        });
        return true;
      } else {
        const errorMessage =
          typeof result.Err === "object"
            ? Object.keys(result.Err)[0]
            : "Failed to approve token spending";
        throw new Error(errorMessage);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to approve token spending",
        variant: "destructive",
      });
      return false;
    }
  };

  const handleBuyToken = async (quantity) => {
    try {
      if (!actors?.tokenFactory) {
        throw new Error("Token Factory not initialized");
      }

      // Calculate total cost
      const totalCost = talent.tokenMetadata.tokenPrice * quantity;

      // First approve token spending
      const approvalSuccess = await handleApproveTokenSpending(
        totalCost,
        Principal.fromText(id)
      );
      if (!approvalSuccess) {
        return;
      }

      // Execute the buy transaction
      const result = await actors.tokenFactory.buy_talent_token(
        Principal.fromText(id),
        quantity
      );

      if ("Ok" in result) {
        toast({
          title: "Success",
          description: "Tokens purchased successfully",
        });
      } else {
        throw new Error(result.Err);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to buy tokens",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-8 flex justify-center">
        <p>Loading talent profile...</p>
      </div>
    );
  }

  if (!talent) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="text-2xl text-center">
              Profile Not Found
            </CardTitle>
            <CardDescription className="text-center">
              The talent profile you're looking for could not be found.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Card className="border-2">
        <CardHeader>
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <Avatar className="w-24 h-24 border-2 border-primary">
              <AvatarImage
                src={`https://api.dicebear.com/6.x/initials/svg?seed=${talent.name}`}
              />
              <AvatarFallback className="text-2xl">
                {talent.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <CardTitle className="text-3xl">{talent.name}</CardTitle>
              <CardDescription className="text-xl">
                {talent.skill}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Token Information */}
            <Card>
              <CardHeader>
                <CardTitle>Token Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Symbol</p>
                    <p className="font-medium">{talent.tokenMetadata.symbol}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Price</p>
                    <p className="font-medium">
                      {talent.tokenMetadata.tokenPrice} ICP
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Market Cap</p>
                    <p className="font-medium">
                      {talent.tokenMetadata.circulatingSupply *
                        talent.tokenMetadata.tokenPrice}{" "}
                      Talent
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Circulating Supply
                    </p>
                    <p className="font-medium">
                      {talent.tokenMetadata.circulatingSupply}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Created</p>
                    <p className="font-medium">
                      {new Date(
                        Number(talent.tokenMetadata.created) / 1000000
                      ).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Decimals</p>
                    <p className="font-medium">
                      {talent.tokenMetadata.decimals}
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Owner</p>
                  <p
                    className="font-mono text-xs truncate"
                    title={talent.tokenMetadata.owner}
                  >
                    {talent.tokenMetadata.owner}
                  </p>
                </div>
                <Button
                  className="w-full"
                  onClick={() => setShowBuyDialog(true)}
                >
                  Buy Tokens
                </Button>
              </CardContent>
            </Card>

            {/* Professional Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Professional Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Experience</p>
                    <p className="font-medium">
                      {talent.stats.yearsExperience} years
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Projects</p>
                    <p className="font-medium">
                      {talent.stats.projectsCompleted}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Satisfaction
                    </p>
                    <p className="font-medium">
                      {talent.stats.clientSatisfaction}/5
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>About</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{talent.description}</p>
            </CardContent>
          </Card>

          {/* Achievements */}
          <Card>
            <CardHeader>
              <CardTitle>Achievements</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-2">
                {talent.achievements.map((achievement, index) => (
                  <li key={index}>{achievement}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      <Dialog
        open={showBuyDialog}
        onOpenChange={setShowBuyDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Buy Tokens</DialogTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Purchase tokens using your Talent Tokens. You can request Talent
              Tokens from the Explore page.
            </p>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Quantity</label>
              <Input
                type="number"
                min="1"
                value={buyQuantity}
                onChange={(e) => setBuyQuantity(parseInt(e.target.value) || 1)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Total Cost</label>
              <p className="text-lg font-medium">
                {(buyQuantity * talent.tokenMetadata.tokenPrice).toFixed(2)}{" "}
                Talent Tokens
              </p>
            </div>
            <Button
              className="w-full"
              onClick={() => {
                handleBuyToken(buyQuantity);
                setShowBuyDialog(false);
              }}
            >
              Confirm Purchase
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Need Talent Tokens? Visit the{" "}
              <a
                href="/explore"
                className="text-primary hover:underline"
              >
                Explore page
              </a>{" "}
              to request them.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default TalentProfile;
