import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, LogOut, UserPlus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { TeamRole } from "../backend";
import {
  useChangeRole,
  useGetCallerUserProfile,
  useGetTeamRoster,
  useJoinTeam,
  useLeaveTeam,
} from "../hooks/useQueries";

const careerRoles = [
  {
    role: TeamRole.driver,
    name: "Driver",
    icon: "/assets/generated/driver-steering-wheel-icon.dim_64x64.png",
    color: "bg-blue-500",
    borderColor: "border-blue-500",
    description:
      "Primary racer responsible for vehicle control and race performance",
    responsibilities: [
      "Control the F1 car during races",
      "Execute optimal racing lines and overtaking maneuvers",
      "Communicate track conditions to the team",
      "Achieve fastest lap times and race victories",
    ],
  },
  {
    role: TeamRole.pitCrew,
    name: "Pit Crew",
    icon: "/assets/generated/pit-crew-wrench-icon.dim_64x64.png",
    color: "bg-orange-500",
    borderColor: "border-orange-500",
    description:
      "Technical support managing vehicle maintenance and race strategy",
    responsibilities: [
      "Monitor vehicle performance and telemetry",
      "Plan pit stop timing and tire strategies",
      "Provide technical feedback to drivers",
      "Optimize car setup for track conditions",
    ],
  },
  {
    role: TeamRole.director,
    name: "Director",
    icon: "/assets/generated/director-headset-icon.dim_64x64.png",
    color: "bg-purple-500",
    borderColor: "border-purple-500",
    description: "Team leader coordinating overall team strategy and decisions",
    responsibilities: [
      "Develop race strategy and tactics",
      "Coordinate communication between team members",
      "Make critical race-time decisions",
      "Analyze competitor strategies and adapt",
    ],
  },
];

export default function Team() {
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<TeamRole>(TeamRole.driver);
  const [playerName, setPlayerName] = useState("");

  const { data: roster, isLoading } = useGetTeamRoster();
  const { data: userProfile } = useGetCallerUserProfile();
  const joinTeam = useJoinTeam();
  const changeRole = useChangeRole();
  const leaveTeam = useLeaveTeam();

  const currentMember = roster
    ? [...roster.drivers, ...roster.pitCrew, ...roster.directors].find(
        (member) => userProfile && member.name === userProfile.name,
      )
    : null;

  const handleJoinTeam = async () => {
    if (!playerName.trim()) {
      toast.error("Please enter your name");
      return;
    }

    joinTeam.mutate(
      { name: playerName, role: selectedRole },
      {
        onSuccess: () => {
          setIsJoinDialogOpen(false);
          setPlayerName("");
        },
      },
    );
  };

  const handleChangeRole = (newRole: TeamRole) => {
    changeRole.mutate(newRole);
  };

  const handleLeaveTeam = () => {
    if (confirm("Are you sure you want to leave the team?")) {
      leaveTeam.mutate();
    }
  };

  const getRoleMembers = (role: TeamRole) => {
    if (!roster) return [];
    switch (role) {
      case TeamRole.driver:
        return roster.drivers;
      case TeamRole.pitCrew:
        return roster.pitCrew;
      case TeamRole.director:
        return roster.directors;
      default:
        return [];
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">
                Full Throttle Team Careers
              </CardTitle>
              <CardDescription>
                Choose your role and join the racing team
              </CardDescription>
            </div>
            {currentMember ? (
              <div className="flex items-center gap-2">
                <Badge
                  className={
                    careerRoles.find((r) => r.role === currentMember.role)
                      ?.color
                  }
                >
                  {careerRoles.find((r) => r.role === currentMember.role)?.name}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLeaveTeam}
                  disabled={leaveTeam.isPending}
                >
                  {leaveTeam.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <LogOut className="mr-2 h-4 w-4" />
                      Leave Team
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <Dialog
                open={isJoinDialogOpen}
                onOpenChange={setIsJoinDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Join Team
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Join the Team</DialogTitle>
                    <DialogDescription>
                      Select your career role and enter your name
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="playerName">Your Name</Label>
                      <Input
                        id="playerName"
                        placeholder="Enter your name"
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role">Career Role</Label>
                      <Select
                        value={selectedRole}
                        onValueChange={(value) =>
                          setSelectedRole(value as TeamRole)
                        }
                      >
                        <SelectTrigger id="role">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {careerRoles.map((career) => (
                            <SelectItem key={career.role} value={career.role}>
                              <div className="flex items-center gap-2">
                                <img
                                  src={career.icon}
                                  alt={career.name}
                                  className="h-5 w-5"
                                />
                                {career.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsJoinDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleJoinTeam}
                      disabled={joinTeam.isPending}
                    >
                      {joinTeam.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Join Team
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
        {careerRoles.map((career) => {
          const members = getRoleMembers(career.role);
          const isCurrentRole = currentMember?.role === career.role;

          return (
            <Card
              key={career.role}
              className={`hover:border-primary transition-colors ${isCurrentRole ? `border-2 ${career.borderColor}` : ""}`}
            >
              <CardHeader>
                <div className="flex items-center gap-4 mb-4">
                  <div className={`p-3 rounded-lg ${career.color}`}>
                    <img
                      src={career.icon}
                      alt={career.name}
                      className="h-12 w-12"
                    />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-xl">{career.name}</CardTitle>
                    <Badge variant="outline" className="mt-1">
                      {members.length}{" "}
                      {members.length === 1 ? "Member" : "Members"}
                    </Badge>
                  </div>
                </div>
                <CardDescription className="text-sm">
                  {career.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-sm mb-2">
                    Responsibilities:
                  </h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {career.responsibilities.map((responsibility) => (
                      <li
                        key={responsibility}
                        className="flex items-start gap-2"
                      >
                        <span className="text-primary mt-1">•</span>
                        <span>{responsibility}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {members.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Team Roster:</h4>
                    <div className="space-y-2">
                      {members.map((member) => (
                        <div
                          key={member.name}
                          className="flex items-center gap-2 p-2 rounded-md bg-secondary/50 text-sm"
                        >
                          <div
                            className={`h-2 w-2 rounded-full ${career.color}`}
                          />
                          <span className="font-medium">{member.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {currentMember && !isCurrentRole && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleChangeRole(career.role)}
                    disabled={changeRole.isPending}
                  >
                    {changeRole.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      `Switch to ${career.name}`
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">About Team Careers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Full Throttle features three distinct career roles that allow
            players to contribute to the team in different ways. Each role has
            unique responsibilities and plays a crucial part in achieving racing
            success.
          </p>
          <p>
            <strong className="text-foreground">One Role Per Player:</strong>{" "}
            You can only select one career role at a time. Choose the role that
            best matches your skills and interests, or switch roles to
            experience different aspects of team racing.
          </p>
          <p>
            <strong className="text-foreground">Team Collaboration:</strong>{" "}
            Work together with other team members across all three roles to
            develop winning strategies, optimize performance, and dominate the
            competition.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
