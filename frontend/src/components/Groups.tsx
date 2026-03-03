import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useGetGroups, useCreateGroup, useJoinGroup } from '../hooks/useQueries';
import { Users, Plus, Trophy, Flag, Loader2 } from 'lucide-react';
import { GroupType } from '../backend';
import { toast } from 'sonner';

export default function Groups() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupType, setGroupType] = useState<GroupType>(GroupType.race);
  const [maxCapacity, setMaxCapacity] = useState('4');

  const { data: groups, isLoading } = useGetGroups();
  const createGroup = useCreateGroup();
  const joinGroup = useJoinGroup();

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      toast.error('Please enter a group name');
      return;
    }

    const capacity = parseInt(maxCapacity);
    if (isNaN(capacity) || capacity < 2 || capacity > 20) {
      toast.error('Player count must be between 2 and 20');
      return;
    }

    createGroup.mutate(
      {
        name: groupName,
        groupType,
        maxCapacity: BigInt(capacity),
        trackId: 'f1Track',
      },
      {
        onSuccess: () => {
          setIsCreateDialogOpen(false);
          setGroupName('');
          setMaxCapacity('4');
          setGroupType(GroupType.race);
        },
      }
    );
  };

  const handleJoinGroup = (groupName: string) => {
    joinGroup.mutate(groupName);
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
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Racing Groups
              </CardTitle>
              <CardDescription>Browse and join racing groups or create your own</CardDescription>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Group
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Racing Group</DialogTitle>
                  <DialogDescription>
                    Set up a new racing group for you and other players to join
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="groupName">Group Name</Label>
                    <Input
                      id="groupName"
                      placeholder="Enter group name"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="groupType">Mode</Label>
                    <Select
                      value={groupType}
                      onValueChange={(value) => setGroupType(value as GroupType)}
                    >
                      <SelectTrigger id="groupType">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={GroupType.race}>
                          <div className="flex items-center gap-2">
                            <Flag className="h-4 w-4" />
                            Race
                          </div>
                        </SelectItem>
                        <SelectItem value={GroupType.tournament}>
                          <div className="flex items-center gap-2">
                            <Trophy className="h-4 w-4" />
                            Tournament
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxCapacity">Number of Players</Label>
                    <Input
                      id="maxCapacity"
                      type="number"
                      min="2"
                      max="20"
                      placeholder="4"
                      value={maxCapacity}
                      onChange={(e) => setMaxCapacity(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">Between 2 and 20 players</p>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateGroup} disabled={createGroup.isPending}>
                    {createGroup.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Group
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      {!groups || groups.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Groups Available</h3>
            <p className="text-muted-foreground mb-4">
              Be the first to create a racing group!
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Group
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => {
            const isFull = Number(group.memberCount) >= Number(group.maxCapacity);
            const fillPercentage = (Number(group.memberCount) / Number(group.maxCapacity)) * 100;

            return (
              <Card key={group.name} className="hover:border-primary transition-colors">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">{group.name}</CardTitle>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant={group.groupType === GroupType.race ? 'default' : 'secondary'}>
                          {group.groupType === GroupType.race ? (
                            <>
                              <Flag className="h-3 w-3 mr-1" />
                              Race
                            </>
                          ) : (
                            <>
                              <Trophy className="h-3 w-3 mr-1" />
                              Tournament
                            </>
                          )}
                        </Badge>
                        <Badge variant={isFull ? 'destructive' : 'outline'}>
                          {Number(group.memberCount)}/{Number(group.maxCapacity)} Players
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Capacity</span>
                      <span className="font-medium">{fillPercentage.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${fillPercentage}%` }}
                      />
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    disabled={isFull || joinGroup.isPending}
                    onClick={() => handleJoinGroup(group.name)}
                  >
                    {joinGroup.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Joining...
                      </>
                    ) : isFull ? (
                      'Full'
                    ) : (
                      <>
                        <Users className="mr-2 h-4 w-4" />
                        Join Group
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">About Groups</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <div className="flex items-start gap-3">
            <Flag className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-foreground">Race Mode</p>
              <p>Quick racing sessions with other players on the F1 track</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Trophy className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-foreground">Tournament Mode</p>
              <p>Competitive tournament-style racing with multiple rounds</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Users className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-foreground">Group Racing</p>
              <p>Create private groups or join public ones to race with specific players</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
