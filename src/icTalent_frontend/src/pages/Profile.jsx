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
    tokenName: "",
    tokenSymbol: "",
    totalSupply: 0,
    circulatingSupply: 0,
    tokenPrice: 0,
  });

  const [createdToken, setCreatedToken] = useState(null);
  const [achievementsModified, setAchievementsModified] = useState(false);

  useEffect(() => {
    const fetchUserDetails = async () => {
      // Simulate fetching user details
      let result;
      if (isAuthenticated) {
        result = await actors.icTalentBackend.get_user();
        console.log(result);
      }
      if (result.Ok) {
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
        setUser(fetchedUser); // Set fetched user details
      } else {
        console.log(result.Err);
      }
    };

    fetchUserDetails();
  }, []); // Fetch user details on mount

  const handleLogin = async () => {
    login();
  };

  const handleUserUpdate = async () => {
    console.log(user);
    const userUpdate = await actors.icTalentBackend.create_user({
      id: Principal.fromText("aaaaa-aa"),
      name: user.name,
      skill: user.skill,
      description: user.description,
      achievements: user.achievements,
      stats: user.stats,
    });
    console.log(userUpdate);
  };

  const handleAddAchievement = () => {
    if (newAchievement.trim()) {
      setUser((prev) => ({
        ...prev,
        achievements: [...prev.achievements, newAchievement.trim()],
      }));
      setNewAchievement("");
      setAchievementsModified(true);
    }
  };

  const handleRemoveAchievement = (index) => {
    setUser((prev) => ({
      ...prev,
      achievements: prev.achievements.filter((_, i) => i !== index),
    }));
    setAchievementsModified(true);
  };

  const handleSaveProfile = () => {
    handleUserUpdate();
    setIsEditing(false);
  };

  const handleCreateToken = () => {
    // Simulate token creation logic
    const createdTokenDetails = {
      name: newToken.tokenName,
      symbol: newToken.tokenSymbol,
      totalSupply: newToken.totalSupply,
      marketCap: newToken.marketCap,
    };

    // Set the created token details in state
    setCreatedToken(createdTokenDetails);

    // Reset the newToken state after creation
    setNewToken({
      tokenName: "",
      tokenSymbol: "",
      totalSupply: 0,
      marketCap: 0,
    });
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
                    onClick={() => {
                      handleUserUpdate();
                    }}
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
                value={newToken.tokenName}
                onChange={(e) =>
                  setNewToken({ ...newToken, tokenName: e.target.value })
                }
              />
              <Input
                placeholder="Token Symbol"
                value={newToken.tokenSymbol}
                onChange={(e) =>
                  setNewToken({ ...newToken, tokenSymbol: e.target.value })
                }
              />
              <Input
                type="number"
                placeholder="Total Supply"
                value={newToken.totalSupply}
                onChange={(e) =>
                  setNewToken({
                    ...newToken,
                    totalSupply: parseFloat(e.target.value),
                  })
                }
              />
              <Input
                type="number"
                placeholder="Market Cap"
                value={newToken.marketCap}
                onChange={(e) =>
                  setNewToken({
                    ...newToken,
                    marketCap: parseFloat(e.target.value),
                  })
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
                  Market Cap: {createdToken.marketCap}
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
                  onClick={() => {
                    handleUserUpdate();
                  }}
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
