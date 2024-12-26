import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Button } from "../components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "../components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";

const mockTalents = [
  {
    id: 1,
    name: "Alice Johnson",
    skill: "Full-stack Developer",
    tokenPrice: 0.05,
    description:
      "Experienced full-stack developer with expertise in React, Node.js, and blockchain technologies.",
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
      holders: 120,
      weeklyVolume: 5000,
    },
    stats: {
      yearsExperience: 5,
      projectsCompleted: 23,
      clientSatisfaction: 4.8,
    },
  },
  {
    id: 2,
    name: "Bob Smith",
    skill: "AI Researcher",
    tokenPrice: 0.08,
    description: "Expert in machine learning and AI technologies.",
    achievements: [
      "Published 5 research papers",
      "Developed AI models for healthcare",
    ],
    tokenMetadata: {
      symbol: "BOB",
      totalSupply: 500000,
      circulatingSupply: 300000,
      marketCap: 24000,
      holders: 80,
      weeklyVolume: 3000,
    },
    stats: {
      yearsExperience: 4,
      projectsCompleted: 15,
      clientSatisfaction: 4.5,
    },
  },
  {
    id: 3,
    name: "Carol Williams",
    skill: "UX Designer",
    tokenPrice: 0.03,
    description: "Passionate UX designer with a focus on user-centered design.",
    achievements: [
      "Redesigned major e-commerce platform",
      "Conducted user research for 10+ projects",
    ],
    tokenMetadata: {
      symbol: "CAROL",
      totalSupply: 750000,
      circulatingSupply: 500000,
      marketCap: 15000,
      holders: 60,
      weeklyVolume: 2000,
    },
    stats: {
      yearsExperience: 3,
      projectsCompleted: 10,
      clientSatisfaction: 4.9,
    },
  },
];

function TalentProfile() {
  const { id } = useParams();
  const [talent, setTalent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTalent = async () => {
      // Find the talent based on the id
      const foundTalent = mockTalents.find((t) => t.id === parseInt(id));
      if (foundTalent) {
        setTalent(foundTalent);
      } else {
        // Handle case where talent is not found
        console.error("Talent not found");
      }
      setLoading(false);
    };

    fetchTalent();
  }, [id]);

  if (loading) {
    return <div>Loading...</div>;
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
                    <p className="font-medium">{talent.tokenPrice} ICP</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Market Cap</p>
                    <p className="font-medium">
                      {talent.tokenMetadata.marketCap} ICP
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Holders</p>
                    <p className="font-medium">
                      {talent.tokenMetadata.holders}
                    </p>
                  </div>
                </div>
                <Button className="w-full">Buy Token</Button>
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
    </div>
  );
}

export default TalentProfile;
