import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useGetCallerUserProfile, useGetMyRaceStats, useGetMyFriends } from '../hooks/useQueries';
import { User, Trophy, Target, Users, TrendingUp, Clock, Zap } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import FriendsManager from './FriendsManager';

export default function PlayerProfile() {
  const { data: userProfile, isLoading: profileLoading } = useGetCallerUserProfile();
  const { data: raceStats, isLoading: statsLoading } = useGetMyRaceStats();
  const { data: friends, isLoading: friendsLoading } = useGetMyFriends();

  if (profileLoading || statsLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!userProfile) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <p className="text-muted-foreground">Profile not found</p>
        </CardContent>
      </Card>
    );
  }

  const totalRaces = Number(userProfile.totalRaces);
  const wins = raceStats ? Number(raceStats.wins) : 0;
  const losses = raceStats ? Number(raceStats.losses) : 0;
  const winRate = totalRaces > 0 ? ((wins / totalRaces) * 100).toFixed(1) : '0.0';
  const srLevel = Number(userProfile.srLevel);

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const milliseconds = Math.floor((ms % 1000) / 10);
    return `${seconds}.${milliseconds.toString().padStart(2, '0')}s`;
  };

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center">
                <User className="h-8 w-8 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl">{userProfile.name}</CardTitle>
                <CardDescription className="text-base">Professional Racer</CardDescription>
              </div>
            </div>
            <div className="flex flex-col gap-2 items-end">
              <Badge variant="default" className="text-lg px-4 py-2">
                <Trophy className="h-4 w-4 mr-2" />
                {userProfile.skillRating.toString()} SR
              </Badge>
              <Badge variant="secondary" className="text-sm px-3 py-1">
                <Zap className="h-3 w-3 mr-1" />
                Level {srLevel}
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Races</p>
                <p className="text-2xl font-bold">{totalRaces}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Trophy className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Wins</p>
                <p className="text-2xl font-bold text-green-500">{wins}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Win Rate</p>
                <p className="text-2xl font-bold text-blue-500">{winRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Best Time</p>
                <p className="text-2xl font-bold text-yellow-500">
                  {raceStats && raceStats.bestTime > 0 ? formatTime(Number(raceStats.bestTime)) : '--'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Race Statistics</CardTitle>
          <CardDescription>Your performance breakdown</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Victories</span>
            <span className="font-bold text-green-500">{wins}</span>
          </div>
          <Separator />
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Defeats</span>
            <span className="font-bold text-red-500">{losses}</span>
          </div>
          <Separator />
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Skill Rating</span>
            <Badge variant="default">{userProfile.skillRating.toString()}</Badge>
          </div>
          <Separator />
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">SR Level</span>
            <Badge variant="secondary">
              <Zap className="h-3 w-3 mr-1" />
              {srLevel}
            </Badge>
          </div>
          <Separator />
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Friends</span>
            <Badge variant="secondary">
              <Users className="h-3 w-3 mr-1" />
              {friends?.length || 0}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Friends Manager */}
      <FriendsManager />
    </div>
  );
}
