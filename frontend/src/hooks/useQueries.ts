import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { UserProfile, RaceStats, LeaderboardEntry, PlayerStats, Season, F1RacingTrack, Position, CarState, GroupView, GroupType, ShoppingItem, TeamRoster, TeamRole, AIInput, AIRaceResult, DirectMessage, StoreStatus, XPCoinType } from '../backend';
import { Plan } from '../backend';
import { Principal } from '@dfinity/principal';
import { toast } from 'sonner';

// User Profile Queries
export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      toast.success('Profile saved successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to save profile: ${error.message}`);
    },
  });
}

// Race Stats Queries
export function useGetMyRaceStats() {
  const { actor, isFetching } = useActor();

  return useQuery<RaceStats | null>({
    queryKey: ['myRaceStats'],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getMyRaceStats();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUpdateRaceStats() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ wins, losses, bestTime }: { wins: bigint; losses: bigint; bestTime: bigint }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateRaceStats(wins, losses, bestTime);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myRaceStats'] });
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

// Leaderboard Queries
export function useGetGlobalLeaderboard(season: Season) {
  const { actor, isFetching } = useActor();

  return useQuery<LeaderboardEntry[] | null>({
    queryKey: ['globalLeaderboard', season],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getGlobalLeaderboard(season);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetFriendsLeaderboard(season: Season) {
  const { actor, isFetching } = useActor();

  return useQuery<LeaderboardEntry[]>({
    queryKey: ['friendsLeaderboard', season],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getFriendsLeaderboard(season);
    },
    enabled: !!actor && !isFetching,
  });
}

// Friend Management
export function useGetMyFriends() {
  const { actor, isFetching } = useActor();

  return useQuery<Principal[]>({
    queryKey: ['myFriends'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMyFriends();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddFriend() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (friendPrincipal: Principal) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addFriend(friendPrincipal);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myFriends'] });
      queryClient.invalidateQueries({ queryKey: ['friendsLeaderboard'] });
      toast.success('Friend added successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add friend: ${error.message}`);
    },
  });
}

export function useRemoveFriend() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (friendPrincipal: Principal) => {
      if (!actor) throw new Error('Actor not available');
      return actor.removeFriend(friendPrincipal);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myFriends'] });
      queryClient.invalidateQueries({ queryKey: ['friendsLeaderboard'] });
      toast.success('Friend removed successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to remove friend: ${error.message}`);
    },
  });
}

// Player Stats
export function useGetMyPlayerStats() {
  const { actor, isFetching } = useActor();

  return useQuery<PlayerStats | null>({
    queryKey: ['myPlayerStats'],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getMyPlayerStats();
    },
    enabled: !!actor && !isFetching,
  });
}

// Track Management
export function useGetF1RacingTrack() {
  const { actor, isFetching } = useActor();

  return useQuery<F1RacingTrack | null>({
    queryKey: ['f1RacingTrack'],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getF1RacingTrack();
    },
    enabled: !!actor && !isFetching,
  });
}

// Race Management
export function useStartRace() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (trackId: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.startRace(trackId);
    },
    onError: (error: Error) => {
      toast.error(`Failed to start race: ${error.message}`);
    },
  });
}

export function useJoinRace() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (trackId: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.joinRace(trackId);
    },
    onError: (error: Error) => {
      toast.error(`Failed to join race: ${error.message}`);
    },
  });
}

export function useFinishRace() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (trackId: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.finishRace(trackId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myRaceStats'] });
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to finish race: ${error.message}`);
    },
  });
}

export function useUpdateCarState() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async ({ position, velocity, direction, laps }: { position: Position; velocity: number; direction: number; laps: bigint }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateCarState(position, velocity, direction, laps);
    },
  });
}

// Groups
export function useGetGroups() {
  const { actor, isFetching } = useActor();

  return useQuery<GroupView[]>({
    queryKey: ['groups'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getGroups();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateGroup() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, groupType, maxCapacity, trackId }: { name: string; groupType: GroupType; maxCapacity: bigint; trackId: string | null }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createGroup(name, groupType, maxCapacity, trackId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      toast.success('Group created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create group: ${error.message}`);
    },
  });
}

export function useJoinGroup() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.joinGroup(name);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      toast.success('Joined group successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to join group: ${error.message}`);
    },
  });
}

export function useLeaveGroup() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.leaveGroup(name);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      toast.success('Left group successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to leave group: ${error.message}`);
    },
  });
}

// Subscriptions
export function useGetCurrentPlan() {
  const { actor, isFetching } = useActor();

  return useQuery<Plan>({
    queryKey: ['currentPlan'],
    queryFn: async () => {
      if (!actor) return Plan.free;
      return actor.getCurrentPlan();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateCheckoutSession() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (items: ShoppingItem[]): Promise<{ id: string; url: string }> => {
      if (!actor) throw new Error('Actor not available');
      const baseUrl = `${window.location.protocol}//${window.location.host}`;
      const successUrl = `${baseUrl}/payment-success`;
      const cancelUrl = `${baseUrl}/payment-failure`;
      const result = await actor.createCheckoutSession(items, successUrl, cancelUrl);
      const session = JSON.parse(result) as { id: string; url: string };
      if (!session?.url) {
        throw new Error('Stripe session missing url');
      }
      return session;
    },
    onError: (error: Error) => {
      toast.error(`Failed to create checkout session: ${error.message}`);
    },
  });
}

// Team Management
export function useGetTeamRoster() {
  const { actor, isFetching } = useActor();

  return useQuery<TeamRoster>({
    queryKey: ['teamRoster'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getTeamRoster();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useJoinTeam() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, role }: { name: string; role: TeamRole }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.joinTeam(name, role);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamRoster'] });
      toast.success('Joined team successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to join team: ${error.message}`);
    },
  });
}

export function useChangeRole() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (role: TeamRole) => {
      if (!actor) throw new Error('Actor not available');
      return actor.changeRole(role);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamRoster'] });
      toast.success('Role changed successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to change role: ${error.message}`);
    },
  });
}

export function useLeaveTeam() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.leaveTeam();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamRoster'] });
      toast.success('Left team successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to leave team: ${error.message}`);
    },
  });
}

// AI Race
export function useGetAIDrivenRaceResults() {
  const { actor, isFetching } = useActor();

  return useQuery<AIRaceResult | null>({
    queryKey: ['aiRaceResults'],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getAIDrivenRaceResults();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useStartAIRace() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async ({ trackId, input }: { trackId: string; input: AIInput }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.startAIRace(trackId, input);
    },
    onError: (error: Error) => {
      toast.error(`Failed to start AI race: ${error.message}`);
    },
  });
}

export function useCompleteAIRace() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ trackId, input }: { trackId: string; input: AIInput }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.completeAIRace(trackId, input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aiRaceResults'] });
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to complete AI race: ${error.message}`);
    },
  });
}

export function useProgressSRByAI() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (srIncrement: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.progressSRByAI(srIncrement);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to progress SR: ${error.message}`);
    },
  });
}

// Direct Messaging
export function useGetConversationWithPeer(peer: Principal | null) {
  const { actor, isFetching } = useActor();

  return useQuery<DirectMessage[]>({
    queryKey: ['conversation', peer?.toString()],
    queryFn: async () => {
      if (!actor || !peer) return [];
      return actor.getConversationWithPeer(peer);
    },
    enabled: !!actor && !isFetching && !!peer,
    refetchInterval: 3000,
  });
}

export function useSendDirectMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ recipient, content }: { recipient: Principal; content: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.sendDirectMessage(recipient, content);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['conversation', variables.recipient.toString()] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to send message: ${error.message}`);
    },
  });
}

// Store Queries
export function useGetStoreStatus() {
  const { actor, isFetching } = useActor();

  return useQuery<StoreStatus>({
    queryKey: ['storeStatus'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getStoreStatus();
    },
    enabled: !!actor && !isFetching,
  });
}

export function usePurchaseItem() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (itemName: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.purchaseItem(itemName);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storeStatus'] });
      toast.success('Item purchased successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Purchase failed: ${error.message}`);
    },
  });
}

export function useCollectXPCoin() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ coinType, trackId }: { coinType: XPCoinType; trackId: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.collectXPCoin(coinType, trackId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storeStatus'] });
    },
    onError: (error: Error) => {
      console.error('Failed to collect XP coin:', error.message);
    },
  });
}
