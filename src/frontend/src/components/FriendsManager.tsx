import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Principal } from "@dfinity/principal";
import { Loader2, UserMinus, UserPlus, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  useAddFriend,
  useGetMyFriends,
  useRemoveFriend,
} from "../hooks/useQueries";

export default function FriendsManager() {
  const [friendInput, setFriendInput] = useState("");
  const { data: friends, isLoading } = useGetMyFriends();
  const addFriend = useAddFriend();
  const removeFriend = useRemoveFriend();

  const handleAddFriend = () => {
    try {
      const principal = Principal.fromText(friendInput.trim());
      addFriend.mutate(principal);
      setFriendInput("");
    } catch (_error) {
      toast.error("Invalid principal ID format");
    }
  };

  const handleRemoveFriend = (friendPrincipal: Principal) => {
    removeFriend.mutate(friendPrincipal);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Friends Management
        </CardTitle>
        <CardDescription>
          Add friends to compete on the friends leaderboard
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Friend */}
        <div className="flex gap-2">
          <Input
            placeholder="Enter friend's Principal ID"
            value={friendInput}
            onChange={(e) => setFriendInput(e.target.value)}
            className="flex-1"
          />
          <Button
            onClick={handleAddFriend}
            disabled={!friendInput.trim() || addFriend.isPending}
          >
            {addFriend.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <UserPlus className="h-4 w-4 mr-2" />
                Add
              </>
            )}
          </Button>
        </div>

        {/* Friends List */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">
            Your Friends ({friends?.length || 0})
          </h4>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : friends && friends.length > 0 ? (
            <div className="space-y-2">
              {friends.map((friend) => (
                <div
                  key={friend.toString()}
                  className="flex items-center justify-between p-3 rounded-lg border border-border bg-card"
                >
                  <span className="font-mono text-sm truncate flex-1">
                    {friend.toString().slice(0, 12)}...
                    {friend.toString().slice(-8)}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveFriend(friend)}
                    disabled={removeFriend.isPending}
                  >
                    <UserMinus className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No friends added yet</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
