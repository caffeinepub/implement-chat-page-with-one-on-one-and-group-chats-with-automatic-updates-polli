import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useGetCallerUserProfile } from '../hooks/useQueries';
import { Users, Search, Trophy, Zap, Clock, Target } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import F1RaceTrack from './F1RaceTrack';

type MatchmakingState = 'idle' | 'searching' | 'found' | 'racing';

export default function Matchmaking() {
  const [matchmakingState, setMatchmakingState] = useState<MatchmakingState>('idle');
  const [searchProgress, setSearchProgress] = useState(0);
  const [matchedPlayers, setMatchedPlayers] = useState<string[]>([]);
  const { data: userProfile } = useGetCallerUserProfile();

  const handleJoinMatchmaking = () => {
    setMatchmakingState('searching');
    setSearchProgress(0);

    // Simulate matchmaking progress
    const interval = setInterval(() => {
      setSearchProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setMatchmakingState('found');
          // Simulate matched players (in real app, this would come from backend)
          setMatchedPlayers(['player1', 'player2']);
          return 100;
        }
        return prev + 10;
      });
    }, 500);
  };

  const handleCancelSearch = () => {
    setMatchmakingState('idle');
    setSearchProgress(0);
  };

  const handleAcceptMatch = () => {
    setMatchmakingState('racing');
  };

  const skillRating = userProfile ? Number(userProfile.skillRating) : 1000;
  const skillTier = skillRating >= 1500 ? 'Expert' : skillRating >= 1200 ? 'Advanced' : 'Beginner';

  if (matchmakingState === 'racing') {
    return <F1RaceTrack trackId="f1Track" matchedPlayers={matchedPlayers} />;
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Online Multiplayer - F1 Racing
          </CardTitle>
          <CardDescription>Race against players with similar skill levels on the F1 track</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Player Info */}
          <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-card">
            <div>
              <p className="text-sm text-muted-foreground">Your Skill Rating</p>
              <p className="text-2xl font-bold">{skillRating}</p>
            </div>
            <Badge variant="default" className="text-lg px-4 py-2">
              {skillTier}
            </Badge>
          </div>

          {/* Matchmaking Status */}
          {matchmakingState === 'idle' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <Zap className="h-8 w-8 text-yellow-500" />
                      <div>
                        <p className="text-sm text-muted-foreground">Fast Matching</p>
                        <p className="font-semibold">~30 seconds</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <Target className="h-8 w-8 text-blue-500" />
                      <div>
                        <p className="text-sm text-muted-foreground">Skill-Based</p>
                        <p className="font-semibold">Fair Matches</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <Trophy className="h-8 w-8 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">F1 Track</p>
                        <p className="font-semibold">3D Racing</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Button
                onClick={handleJoinMatchmaking}
                size="lg"
                className="w-full"
              >
                <Search className="mr-2 h-5 w-5" />
                Find Match
              </Button>
            </div>
          )}

          {matchmakingState === 'searching' && (
            <div className="space-y-4">
              <Card className="border-primary/50 bg-primary/5">
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-center justify-center gap-3">
                    <Search className="h-6 w-6 text-primary animate-pulse" />
                    <p className="text-lg font-semibold">Searching for opponents...</p>
                  </div>
                  <Progress value={searchProgress} className="h-2" />
                  <p className="text-center text-sm text-muted-foreground">
                    Looking for players with {skillRating - 100} - {skillRating + 100} SR
                  </p>
                </CardContent>
              </Card>

              <Button onClick={handleCancelSearch} variant="outline" className="w-full">
                Cancel Search
              </Button>
            </div>
          )}

          {matchmakingState === 'found' && (
            <div className="space-y-4">
              <Card className="border-green-500 bg-green-500/10">
                <CardContent className="pt-6 space-y-4">
                  <div className="text-center">
                    <Trophy className="h-12 w-12 mx-auto mb-4 text-green-500" />
                    <h3 className="text-2xl font-bold mb-2">Match Found!</h3>
                    <p className="text-muted-foreground">Opponents found with similar skill level</p>
                    <p className="text-sm text-muted-foreground mt-2">Ready to race on the F1 track</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="text-center p-4 rounded-lg bg-card border border-border">
                      <p className="text-sm text-muted-foreground mb-1">You</p>
                      <p className="text-xl font-bold">{skillRating} SR</p>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-card border border-border">
                      <p className="text-sm text-muted-foreground mb-1">Opponents</p>
                      <p className="text-xl font-bold">{matchedPlayers.length} Players</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-2">
                <Button onClick={() => setMatchmakingState('idle')} variant="outline" className="flex-1">
                  Decline
                </Button>
                <Button onClick={handleAcceptMatch} className="flex-1">
                  Accept Match
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">F1 Track Features</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <div className="flex items-start gap-3">
            <Target className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-foreground">Realistic 3D Track</p>
              <p>Race on a full 3D F1 circuit with starting grid, pit lane, and finish line</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-foreground">Real-Time Racing</p>
              <p>Live position tracking and lap timing with other players</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Trophy className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-foreground">Competitive Gameplay</p>
              <p>Collision detection and skill-based matchmaking for fair competition</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
