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
    decimals: 8,
    tokenPrice: 0,
    logo: "",
  });

  const [createdToken, setCreatedToken] = useState(null);
  const [achievementsModified, setAchievementsModified] = useState(false);
  const [userExists, setUserExists] = useState(false);
  const { toast } = useToast();
  const [userToken, setUserToken] = useState(null);

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
        decimals: newToken.decimals,
        token_price: newToken.tokenPrice,
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
          tokenPrice: newToken.tokenPrice,
          principal: tokenPrincipal.toString(),
        });

        // Reset form
        setNewToken({
          name: "",
          symbol: "",
          tokenPrice: newToken.tokenPrice,
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

  useEffect(() => {
    const fetchData = async () => {
      if (isAuthenticated && actors?.tokenFactory) {
        try {
          // Fetch user's token metadata if it exists
          const result = await actors.tokenFactory.get_user_token_metadata();
          if (result.Ok) {
            console.log(result.Ok);
            const [principal, metadata] = result.Ok;
            setUserToken({
              principal: principal,
              metadata: metadata,
            });
          } else {
            console.log("No token found for user:", result.Err);
          }
        } catch (error) {
          console.error("Error fetching token metadata:", error);
        }
      }
    };

    fetchData();
  }, [isAuthenticated, actors]);

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
              <div className="flex flex-col w-full">
                <div className="mb-4">
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Full Name
                  </label>
                  {isEditing ? (
                    <Input
                      value={user.name}
                      onChange={(e) =>
                        setUser({ ...user, name: e.target.value })
                      }
                      className="text-2xl font-bold"
                      placeholder="Enter your full name"
                    />
                  ) : (
                    <CardTitle className="text-2xl font-bold">
                      {user.name || "Not specified"}
                    </CardTitle>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Primary Skill
                  </label>
                  {isEditing ? (
                    <Input
                      value={user.skill}
                      onChange={(e) =>
                        setUser({ ...user, skill: e.target.value })
                      }
                      className="text-xl"
                      placeholder="Enter your primary skill"
                    />
                  ) : (
                    <CardDescription className="text-xl text-gray-600">
                      {user.skill || "Not specified"}
                    </CardDescription>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  About Me
                </label>
                {isEditing ? (
                  <textarea
                    value={user.description}
                    onChange={(e) =>
                      setUser({ ...user, description: e.target.value })
                    }
                    placeholder="Tell us about yourself..."
                    className="w-full min-h-[100px] p-2 border rounded-md bg-gray-800 text-white"
                  />
                ) : (
                  <p className="text-gray-300">
                    {user.description || "No description provided"}
                  </p>
                )}
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Professional Stats</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      Years of Experience
                    </label>
                    <Input
                      type="number"
                      value={user.stats.years_experience}
                      onChange={(e) =>
                        setUser({
                          ...user,
                          stats: {
                            ...user.stats,
                            years_experience: parseInt(e.target.value) || 0,
                          },
                        })
                      }
                      disabled={!isEditing}
                      placeholder="Enter years of experience"
                      className={`bg-gray-800 text-white ${
                        !isEditing ? "bg-gray-700" : ""
                      }`}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      Projects Completed
                    </label>
                    <Input
                      type="number"
                      value={user.stats.projects_completed}
                      onChange={(e) =>
                        setUser({
                          ...user,
                          stats: {
                            ...user.stats,
                            projects_completed: parseInt(e.target.value) || 0,
                          },
                        })
                      }
                      disabled={!isEditing}
                      placeholder="Enter projects completed"
                      className={`bg-gray-800 text-white ${
                        !isEditing ? "bg-gray-700" : ""
                      }`}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      Client Satisfaction (Out of 5)
                    </label>
                    <Input
                      type="number"
                      value={user.stats.client_satisfaction}
                      onChange={(e) =>
                        setUser({
                          ...user,
                          stats: {
                            ...user.stats,
                            client_satisfaction: parseInt(e.target.value) || 0,
                          },
                        })
                      }
                      disabled={!isEditing}
                      placeholder="Enter client satisfaction rating"
                      className={`bg-gray-800 text-white ${
                        !isEditing ? "bg-gray-700" : ""
                      }`}
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 pt-4">
                <Button
                  size="lg"
                  variant={isEditing ? "default" : "outline"}
                  onClick={
                    isEditing ? handleSaveProfile : () => setIsEditing(true)
                  }
                >
                  {isEditing ? "Save Changes" : "Edit Profile"}
                </Button>
                {isEditing && (
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 shadow-lg rounded-lg p-6">
            <CardHeader>
              <CardTitle className="text-2xl">Token Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Create Your Token</CardTitle>
                  <CardDescription>
                    Creating a token requires 100 Talent Tokens. You can request
                    Talent Tokens from the Explore page.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {userToken ? (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">
                        Your Token Details
                      </h3>
                      <div className="space-y-2">
                        <p>
                          <strong>Name:</strong> {userToken.metadata.name}
                        </p>
                        <p>
                          <strong>Symbol:</strong> {userToken.metadata.symbol}
                        </p>
                        <p>
                          <strong>Decimals:</strong>{" "}
                          {userToken.metadata.decimals}
                        </p>
                        <p>
                          <strong>Token Price:</strong>{" "}
                          {userToken.metadata.token_price}
                        </p>
                        <p>
                          <strong>Created:</strong>{" "}
                          {new Date(
                            Number(userToken.metadata.created) / 1000000
                          ).toLocaleDateString()}
                        </p>
                        <p>
                          <strong>Canister ID:</strong>{" "}
                          {userToken.principal.toString()}
                        </p>
                        {userToken.metadata.logo && (
                          <div>
                            <strong>Logo:</strong>
                            <img
                              src={userToken.metadata.logo}
                              alt="Token Logo"
                              className="w-16 h-16 mt-2 rounded-full"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">
                        Create New Token
                      </h3>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          Token Name
                        </label>
                        <Input
                          placeholder="Enter token name"
                          value={newToken.name}
                          onChange={(e) =>
                            setNewToken({ ...newToken, name: e.target.value })
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          Token Symbol
                        </label>
                        <Input
                          placeholder="Enter token symbol (e.g., BTC, ETH)"
                          value={newToken.symbol}
                          onChange={(e) =>
                            setNewToken({ ...newToken, symbol: e.target.value })
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          Token Price in Talent tokens
                        </label>
                        <Input
                          type="number"
                          placeholder="Enter price in TALENT tokens"
                          value={newToken.tokenPrice}
                          onChange={(e) =>
                            setNewToken({
                              ...newToken,
                              tokenPrice: parseInt(e.target.value) || 0,
                            })
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          Decimals
                        </label>
                        <Input
                          type="number"
                          placeholder="Enter number of decimals (default: 8)"
                          value={newToken.decimals}
                          onChange={(e) =>
                            setNewToken({
                              ...newToken,
                              decimals: parseInt(e.target.value) || 8,
                            })
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          Logo URL (Optional)
                        </label>
                        <Input
                          placeholder="Enter logo URL"
                          value={newToken.logo}
                          onChange={(e) =>
                            setNewToken({ ...newToken, logo: e.target.value })
                          }
                        />
                      </div>

                      <Button
                        size="lg"
                        onClick={handleCreateToken}
                        className="w-full"
                      >
                        Create Token
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
                  )}
                </CardContent>
              </Card>
            </CardContent>
          </Card>

          <Card className="border-2 shadow-lg rounded-lg p-6">
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
