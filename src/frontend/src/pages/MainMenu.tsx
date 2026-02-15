import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Leaderboards from '../components/Leaderboards';
import PlayerProfile from '../components/PlayerProfile';
import Matchmaking from '../components/Matchmaking';
import Groups from '../components/Groups';
import Plans from './Plans';
import Team from './Team';
import { Trophy, User, Gamepad2, Users, CreditCard, Briefcase, MessageCircle, ShoppingBag } from 'lucide-react';

export default function MainMenu() {
  const [activeTab, setActiveTab] = useState('menu');
  const navigate = useNavigate();

  return (
    <div className="container mx-auto px-4 py-8">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-7 mb-8">
          <TabsTrigger value="menu" className="flex items-center gap-2">
            <Gamepad2 className="h-4 w-4" />
            <span className="hidden sm:inline">Menu</span>
          </TabsTrigger>
          <TabsTrigger value="multiplayer" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Multiplayer</span>
          </TabsTrigger>
          <TabsTrigger value="groups" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Groups</span>
          </TabsTrigger>
          <TabsTrigger value="team" className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            <span className="hidden sm:inline">Team</span>
          </TabsTrigger>
          <TabsTrigger value="leaderboards" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            <span className="hidden sm:inline">Leaderboards</span>
          </TabsTrigger>
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="plans" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Plans</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="menu">
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="hover:border-primary transition-colors cursor-pointer" onClick={() => setActiveTab('multiplayer')}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-6 w-6 text-primary" />
                  Multiplayer
                </CardTitle>
                <CardDescription>
                  Race against real players online
                </CardDescription>
              </CardHeader>
              <CardContent>
                <img 
                  src="/assets/generated/starting-grid.dim_512x512.png" 
                  alt="Multiplayer" 
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
                <p className="text-sm text-muted-foreground mb-4">
                  Join the matchmaking queue and compete against players with similar skill ratings 
                  in real-time multiplayer races.
                </p>
                <Button className="w-full" size="lg">
                  <Users className="mr-2 h-4 w-4" />
                  Find Match
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:border-primary transition-colors cursor-pointer" onClick={() => setActiveTab('groups')}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-6 w-6 text-primary" />
                  Groups
                </CardTitle>
                <CardDescription>
                  Create or join racing groups
                </CardDescription>
              </CardHeader>
              <CardContent>
                <img 
                  src="/assets/generated/f1-track-layout.dim_1024x768.png" 
                  alt="Groups" 
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
                <p className="text-sm text-muted-foreground mb-4">
                  Browse available racing groups or create your own. Choose between race and tournament modes.
                </p>
                <Button className="w-full" size="lg" variant="outline">
                  <Users className="mr-2 h-4 w-4" />
                  View Groups
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:border-primary transition-colors cursor-pointer" onClick={() => setActiveTab('team')}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-6 w-6 text-primary" />
                  Team Careers
                </CardTitle>
                <CardDescription>
                  Choose your role in the team
                </CardDescription>
              </CardHeader>
              <CardContent>
                <img 
                  src="/assets/generated/pit-crew-activity.dim_800x600.png" 
                  alt="Team" 
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
                <p className="text-sm text-muted-foreground mb-4">
                  Select from Driver, Pit Crew, or Director roles. Each career has unique responsibilities 
                  and contributes to team success.
                </p>
                <Button className="w-full" size="lg" variant="outline">
                  <Briefcase className="mr-2 h-4 w-4" />
                  View Careers
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-3 mt-6">
            <Card className="neon-card hover:border-neon-accent transition-colors cursor-pointer" onClick={() => navigate({ to: '/store' })}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingBag className="h-6 w-6 text-neon-accent" />
                  Store
                </CardTitle>
                <CardDescription>
                  Unlock neon lights with XP
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center h-24 mb-4">
                  <ShoppingBag className="h-20 w-20 text-neon-accent/50" />
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Spend your hard-earned XP on exclusive neon lights. Collect XP coins during races to unlock new items.
                </p>
                <Button className="w-full neon-button" size="lg">
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  Visit Store
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:border-primary transition-colors cursor-pointer" onClick={() => setActiveTab('leaderboards')}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-6 w-6 text-primary" />
                  Leaderboards
                </CardTitle>
                <CardDescription>
                  View global and friends rankings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <img 
                  src="/assets/generated/trophy-gold.dim_48x48.png" 
                  alt="Trophy" 
                  className="w-24 h-24 mx-auto mb-4"
                />
                <p className="text-sm text-muted-foreground mb-4">
                  Check your ranking against other players worldwide or compete with your friends 
                  for the top spot.
                </p>
                <Button className="w-full" size="lg" variant="outline">
                  <Trophy className="mr-2 h-4 w-4" />
                  View Rankings
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:border-primary transition-colors cursor-pointer" onClick={() => navigate({ to: '/chat' })}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-6 w-6 text-primary" />
                  Chat
                </CardTitle>
                <CardDescription>
                  Message your friends
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center h-24 mb-4">
                  <MessageCircle className="h-20 w-20 text-primary/50" />
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Stay connected with your racing friends. Send direct messages and coordinate races together.
                </p>
                <Button className="w-full" size="lg" variant="outline">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Open Chat
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-1 mt-6">
            <Card className="bg-gradient-to-r from-primary/10 to-blue-600/10 border-primary/50 hover:border-primary transition-colors cursor-pointer" onClick={() => setActiveTab('plans')}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-6 w-6 text-primary" />
                  Upgrade to Premium
                </CardTitle>
                <CardDescription>
                  Unlock all features with Full Throttle Premium
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Get access to realistic F1 racing, online multiplayer, enhanced graphics, and more. 
                  Choose from monthly or yearly plans starting at just $5/month.
                </p>
                <Button className="w-full" size="lg">
                  <CreditCard className="mr-2 h-4 w-4" />
                  View Plans
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="multiplayer">
          <Matchmaking />
        </TabsContent>

        <TabsContent value="groups">
          <Groups />
        </TabsContent>

        <TabsContent value="team">
          <Team />
        </TabsContent>

        <TabsContent value="leaderboards">
          <Leaderboards />
        </TabsContent>

        <TabsContent value="profile">
          <PlayerProfile />
        </TabsContent>

        <TabsContent value="plans">
          <Plans />
        </TabsContent>
      </Tabs>
    </div>
  );
}
