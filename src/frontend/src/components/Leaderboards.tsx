import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Crown, Globe, Trophy, Users } from "lucide-react";
import { useState } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useGetFriendsLeaderboard,
  useGetGlobalLeaderboard,
} from "../hooks/useQueries";

export default function Leaderboards() {
  const [season] = useState<number>(1);
  const { identity } = useInternetIdentity();

  const { data: globalLeaderboard, isLoading: globalLoading } =
    useGetGlobalLeaderboard(season);
  const { data: friendsLeaderboard, isLoading: friendsLoading } =
    useGetFriendsLeaderboard(season);

  const currentPrincipal = identity?.getPrincipal().toString();

  const renderLeaderboardTable = (
    entries: any[] | null | undefined,
    isLoading: boolean,
  ) => {
    if (isLoading) {
      return (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      );
    }

    if (!entries || entries.length === 0) {
      return (
        <div className="text-center py-12">
          <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">
            No leaderboard data available yet
          </p>
        </div>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">Rank</TableHead>
            <TableHead>Player</TableHead>
            <TableHead className="text-right">Skill Rating</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry, index) => {
            const isCurrentUser = entry.player.toString() === currentPrincipal;
            return (
              <TableRow
                key={entry.player.toString()}
                className={isCurrentUser ? "bg-primary/10" : ""}
              >
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {index === 0 && (
                      <Crown className="h-4 w-4 text-yellow-500" />
                    )}
                    {index === 1 && <Crown className="h-4 w-4 text-gray-400" />}
                    {index === 2 && (
                      <Crown className="h-4 w-4 text-amber-700" />
                    )}
                    <span>{index + 1}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs truncate max-w-[200px]">
                      {entry.player.toString().slice(0, 8)}...
                      {entry.player.toString().slice(-6)}
                    </span>
                    {isCurrentUser && <Badge variant="default">You</Badge>}
                  </div>
                </TableCell>
                <TableCell className="text-right font-bold">
                  {entry.skill.toString()}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                Leaderboards
              </CardTitle>
              <CardDescription>Season {season} Rankings</CardDescription>
            </div>
            <Badge variant="outline" className="text-lg px-4 py-2">
              Season {season}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="global" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="global" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Global
              </TabsTrigger>
              <TabsTrigger value="friends" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Friends
              </TabsTrigger>
            </TabsList>

            <TabsContent value="global">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Global Rankings</CardTitle>
                  <CardDescription>
                    Top players from around the world
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {renderLeaderboardTable(globalLeaderboard, globalLoading)}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="friends">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Friends Rankings</CardTitle>
                  <CardDescription>Compete with your friends</CardDescription>
                </CardHeader>
                <CardContent>
                  {renderLeaderboardTable(friendsLeaderboard, friendsLoading)}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
