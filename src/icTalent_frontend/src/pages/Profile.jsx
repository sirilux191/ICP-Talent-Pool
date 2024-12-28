import React, { useEffect, useState, useContext } from "react";
import { Button } from "../components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "../components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Input } from "../components/ui/input";
import ActorContext from "../ActorContext";
import { Principal } from "@dfinity/principal";
import { useToast } from "../hooks/use-toast";

function Profile() {
  const { actors, isAuthenticated, login, logout } = useContext(ActorContext);
  const [isEditing, setIsEditing] = useState(false);
  const [user, setUser] = useState({
    name: "",
    skill: "",
    tokenPrice: 0,
    description: "",
    achievements: [],

    stats: {
      years_experience: 0,
      projects_completed: 0,
      client_satisfaction: 0,
    },
  });
  const [newAchievement, setNewAchievement] = useState("");

  const [newToken, setNewToken] = useState({
    name: "",
    symbol: "",
    totalSupply: BigInt(0),
    decimals: 8,
    logo: "",
  });

  const [createdToken, setCreatedToken] = useState(null);
  const [achievementsModified, setAchievementsModified] = useState(false);
  const [userExists, setUserExists] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchUserDetails = async () => {
      if (isAuthenticated && actors?.icTalentBackend) {
        try {
          const result = await actors.icTalentBackend.get_user();
          if (result.Ok) {
            setUserExists(true);
            const fetchedUser = {
              name: result.Ok.name,
              skill: result.Ok.skill,
              description: result.Ok.description,
              achievements: result.Ok.achievements,
              stats: {
                years_experience: result.Ok.stats.years_experience,
                projects_completed: result.Ok.stats.projects_completed,
                client_satisfaction: result.Ok.stats.client_satisfaction,
              },
            };
            setUser(fetchedUser);
          } else {
            setUserExists(false);
            console.log(result.Err);
          }
        } catch (error) {
          console.error("Error fetching user details:", error);
          setUserExists(false);
        }
      }
    };

    fetchUserDetails();
  }, [isAuthenticated, actors]);

  const handleLogin = async () => {
    login();
  };

  const handleUserCreate = async () => {
    try {
      const result = await actors.icTalentBackend.create_user({
        id: Principal.fromText("aaaaa-aa"),
        name: user.name,
        skill: user.skill,
        description: user.description,
        achievements: user.achievements,
        stats: user.stats,
      });
      if (result.Ok) {
        toast({
          title: "Success",
          description: "Profile created successfully",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to create profile",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An error occurred while creating profile",
      });
    }
  };

  const handleUserUpdate = async () => {
    try {
      const result = await actors.icTalentBackend.update_user({
        id: Principal.fromText("aaaaa-aa"),
        name: user.name,
        skill: user.skill,
        description: user.description,
        achievements: user.achievements,
        stats: user.stats,
      });
      if (result.Ok) {
        toast({
          title: "Success",
          description: "Profile updated successfully",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to update profile",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An error occurred while updating profile",
      });
    }
  };

  const handleAddAchievement = () => {
    if (newAchievement.trim()) {
      setUser((prev) => ({
        ...prev,
        achievements: [...prev.achievements, newAchievement.trim()],
      }));
      setNewAchievement("");
      setAchievementsModified(true);
      toast({
        title: "Success",
        description: "Achievement added successfully",
      });
    }
  };

  const handleRemoveAchievement = (index) => {
    setUser((prev) => ({
      ...prev,
      achievements: prev.achievements.filter((_, i) => i !== index),
    }));
    setAchievementsModified(true);
    toast({
      title: "Success",
      description: "Achievement removed successfully",
    });
  };

  const handleSaveProfile = async () => {
    if (userExists) {
      await handleUserUpdate();
    } else {
      await handleUserCreate();
      setUserExists(true);
    }
    setIsEditing(false);
    setAchievementsModified(false);
  };

  const handleSaveAchievements = async () => {
    if (userExists) {
      await handleUserUpdate();
    } else {
      await handleUserCreate();
      setUserExists(true);
    }
    setAchievementsModified(false);
  };

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

  const handleCreateToken = async () => {
    try {
      if (!actors?.icTalentBackend) {
        throw new Error("Backend not initialized");
      }

      // First approve token spending (100 tokens required)
      const approvalSuccess = await handleApproveTokenSpending(100n);
      if (!approvalSuccess) {
        return;
      }

      const createTokenArgs = {
        name: newToken.name,
        symbol: newToken.symbol,
        total_supply: newToken.totalSupply,
        decimals: newToken.decimals,
        logo: [newToken.logo],
      };

      const result = await actors.tokenFactory.create_talent_token_canister(
        createTokenArgs
      );

      if (result.Ok) {
        const tokenPrincipal = result.Ok;
        setCreatedToken({
          name: newToken.name,
          symbol: newToken.symbol,
          totalSupply: newToken.totalSupply.toString(),
          principal: tokenPrincipal.toString(),
        });

        // Reset form
        setNewToken({
          name: "",
          symbol: "",
          totalSupply: BigInt(0),
          decimals: 8,
          logo: "",
        });

        toast({
          title: "Success",
          description: "Token created successfully",
        });
      } else {
        throw new Error(result.Err);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create token",
      });
    }
  };

  if (!user) return <div>Loading...</div>; // Show loading while fetching user

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {!isAuthenticated ? (
        <Card className="border-2">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl mb-4">
              Welcome to ICP Talent Pool
            </CardTitle>
            <CardDescription className="text-lg mb-6">
              Please authenticate with Internet Identity to manage your profile
            </CardDescription>
            <Button
              size="lg"
              onClick={handleLogin}
            >
              Login with Internet Identity
            </Button>
          </CardHeader>
        </Card>
      ) : (
        <>
          <Card className="border-2 shadow-lg rounded-lg p-6">
            <CardHeader className="flex items-center space-x-4">
              <Avatar className="w-24 h-24 border-2 border-primary">
                <AvatarImage
                  src={`https://api.dicebear.com/6.x/initials/svg?seed=${user.name}`}
                />
                <AvatarFallback className="text-2xl">
                  {user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                {isEditing ? (
                  <Input
                    value={user.name}
                    onChange={(e) => setUser({ ...user, name: e.target.value })}
                    className="text-3xl font-bold"
                  />
                ) : (
                  <CardTitle className="text-3xl font-bold">
                    {user.name}
                  </CardTitle>
                )}
                {isEditing ? (
                  <Input
                    value={user.skill}
                    onChange={(e) =>
                      setUser({ ...user, skill: e.target.value })
                    }
                    className="text-xl text-gray-600"
                  />
                ) : (
                  <CardDescription className="text-xl text-gray-600">
                    {user.skill}
                  </CardDescription>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <Input
                  value={user.description}
                  onChange={(e) =>
                    setUser({ ...user, description: e.target.value })
                  }
                  placeholder="About Me"
                  className="text-gray-700"
                />
              ) : (
                <p className="text-gray-700">{user.description}</p>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Token Price</p>
                  <Input
                    type="number"
                    value={newToken.tokenPrice}
                    onChange={(e) =>
                      setNewToken({
                        ...newToken,
                        tokenPrice: parseFloat(e.target.value),
                      })
                    }
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Symbol</p>
                  <Input
                    value={newToken.tokenSymbol}
                    onChange={(e) =>
                      setNewToken({
                        ...newToken,
                        tokenSymbol: e.target.value,
                      })
                    }
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Market Cap</p>
                  <Input
                    type="number"
                    value={newToken.totalSupply}
                    onChange={(e) =>
                      setNewToken({
                        ...newToken,
                        totalSupply: parseFloat(e.target.value),
                      })
                    }
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Experience</p>
                  <Input
                    type="number"
                    value={user.stats.years_experience}
                    onChange={(e) =>
                      setUser({
                        ...user,
                        stats: {
                          ...user.stats,
                          yearsExperience: parseInt(e.target.value),
                        },
                      })
                    }
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Projects Completed
                  </p>
                  <Input
                    type="number"
                    value={user.stats.projects_completed}
                    onChange={(e) =>
                      setUser({
                        ...user,
                        stats: {
                          ...user.stats,
                          projectsCompleted: parseInt(e.target.value),
                        },
                      })
                    }
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Client Satisfaction
                  </p>
                  <Input
                    type="number"
                    value={user.stats.client_satisfaction}
                    onChange={(e) =>
                      setUser({
                        ...user,
                        stats: {
                          ...user.stats,
                          clientSatisfaction: parseFloat(e.target.value),
                        },
                      })
                    }
                    disabled={!isEditing}
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-4">
                <Button
                  size="lg"
                  onClick={
                    isEditing ? handleSaveProfile : () => setIsEditing(true)
                  }
                >
                  {isEditing ? "Save Profile" : "Edit Profile"}
                </Button>
                {achievementsModified && (
                  <Button
                    size="lg"
                    onClick={handleSaveAchievements}
                  >
                    Save Achievements
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 shadow-lg rounded-lg p-6">
            <CardHeader>
              <CardTitle className="text-2xl">Create Token</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Token Name"
                value={newToken.name}
                onChange={(e) =>
                  setNewToken({ ...newToken, name: e.target.value })
                }
              />
              <Input
                placeholder="Token Symbol"
                value={newToken.symbol}
                onChange={(e) =>
                  setNewToken({ ...newToken, symbol: e.target.value })
                }
              />
              <Input
                type="number"
                placeholder="Total Supply"
                value={Number(newToken.totalSupply)}
                onChange={(e) =>
                  setNewToken({
                    ...newToken,
                    totalSupply: BigInt(e.target.value || 0),
                  })
                }
              />
              <Input
                type="number"
                placeholder="Decimals"
                value={newToken.decimals}
                onChange={(e) =>
                  setNewToken({
                    ...newToken,
                    decimals: parseInt(e.target.value) || 8,
                  })
                }
              />
              <Input
                placeholder="Logo URL (optional)"
                value={newToken.logo}
                onChange={(e) =>
                  setNewToken({ ...newToken, logo: e.target.value })
                }
              />
              <Button
                size="lg"
                onClick={handleCreateToken}
              >
                Create Token
              </Button>
            </CardContent>
          </Card>

          {createdToken && (
            <Card className="border-2 shadow-lg rounded-lg p-6">
              <CardHeader>
                <CardTitle className="text-2xl">Token Details</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-bold">
                  Token Name: {createdToken.name}
                </p>
                <p className="text-lg font-bold">
                  Token Symbol: {createdToken.symbol}
                </p>
                <p className="text-lg font-bold">
                  Total Supply: {createdToken.totalSupply}
                </p>
                <p className="text-lg font-bold">
                  Canister ID: {createdToken.principal}
                </p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Achievements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex gap-4">
                <Input
                  placeholder="Add new achievement..."
                  value={newAchievement}
                  onChange={(e) => setNewAchievement(e.target.value)}
                  onKeyPress={(e) =>
                    e.key === "Enter" && handleAddAchievement()
                  }
                />
                <Button onClick={handleAddAchievement}>Add</Button>
              </div>
              <ul className="space-y-4">
                {user.achievements.map((achievement, index) => (
                  <li
                    key={index}
                    className="flex items-center justify-between gap-3 p-3 rounded-lg hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                      <span>{achievement}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveAchievement(index)}
                    >
                      Remove
                    </Button>
                  </li>
                ))}
              </ul>
              {achievementsModified && (
                <Button
                  size="lg"
                  onClick={handleSaveAchievements}
                >
                  Save Achievements
                </Button>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

export default Profile;
