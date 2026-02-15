import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface LeaderboardEntry {
    player: Principal;
    skill: bigint;
}
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export type Time = bigint;
export interface GroupView {
    owner: Principal;
    maxCapacity: bigint;
    name: string;
    memberCount: bigint;
    trackId?: string;
    groupType: GroupType;
}
export interface Subscription {
    status: Variant_active_canceled_expired;
    plan: Plan;
    expirationDate?: Time;
    stripeSessionId?: string;
    startDate: Time;
}
export type Season = number;
export interface AIInput {
    backward: boolean;
    forward: boolean;
}
export interface TransformationInput {
    context: Uint8Array;
    response: http_request_result;
}
export type StripeSessionStatus = {
    __kind__: "completed";
    completed: {
        userPrincipal?: string;
        response: string;
    };
} | {
    __kind__: "failed";
    failed: {
        error: string;
    };
};
export interface StripeConfiguration {
    allowedCountries: Array<string>;
    secretKey: string;
}
export interface Race {
    score: bigint;
    driver: Principal;
}
export interface DirectMessage {
    content: string;
    recipient: Principal;
    sender: Principal;
    timestamp: Time;
}
export interface CarState {
    isRacing: boolean;
    direction: number;
    velocity: number;
    laps: bigint;
    lapTimes: Array<LapTime>;
    position: Position;
}
export interface StoreData {
    userXP: bigint;
    totalPurchased: bigint;
    ownedItems: Array<string>;
    availableItems: Array<StoreItem>;
}
export interface StoreStatus {
    balance: bigint;
    ownedItems: Array<string>;
}
export interface RaceStats {
    bestTime: bigint;
    wins: bigint;
    losses: bigint;
}
export interface AIRaceResult {
    completionTime?: bigint;
    bestTime?: bigint;
    attempts: bigint;
    srProgression?: bigint;
    trackId: string;
}
export type TrackPosition = number;
export interface LapTime {
    lap: bigint;
    time: bigint;
}
export interface http_header {
    value: string;
    name: string;
}
export interface http_request_result {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface F1RacingTrack {
    textureAsset: string;
    pitLane: Array<Position>;
    checkpoints: Array<Position>;
    finishLine: Array<Position>;
    points: Array<Position>;
}
export interface StoreItem {
    costInXP: bigint;
    name: string;
    description: string;
}
export interface ShoppingItem {
    productName: string;
    currency: string;
    quantity: bigint;
    priceInCents: bigint;
    productDescription: string;
}
export interface Position {
    checkpoint: number;
    position: TrackPosition;
}
export interface TeamMember {
    principal: Principal;
    name: string;
    role: TeamRole;
}
export interface TeamRoster {
    directors: Array<TeamMember>;
    pitCrew: Array<TeamMember>;
    drivers: Array<TeamMember>;
}
export interface PlayerStats {
    totalTime: bigint;
    races: bigint;
}
export interface UserProfile {
    srLevel: bigint;
    name: string;
    skillRating: bigint;
    winRate: number;
    totalRaces: bigint;
}
export enum GroupType {
    race = "race",
    tournament = "tournament"
}
export enum Plan {
    free = "free",
    monthly = "monthly",
    yearly = "yearly"
}
export enum TeamRole {
    pitCrew = "pitCrew",
    director = "director",
    driver = "driver"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export enum Variant_active_canceled_expired {
    active = "active",
    canceled = "canceled",
    expired = "expired"
}
export enum XPCoinType {
    xp1 = "xp1",
    xp5 = "xp5",
    xp10 = "xp10",
    xp20 = "xp20"
}
export interface backendInterface {
    activatePaidPlan(plan: Plan, stripeSessionId: string): Promise<void>;
    addFriend(friend: Principal): Promise<void>;
    addRace(speed: bigint): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    cancelSubscription(): Promise<void>;
    changeRole(role: TeamRole): Promise<void>;
    collectXPCoin(coinType: XPCoinType, trackId: string): Promise<bigint>;
    completeAIRace(trackId: string, input: AIInput): Promise<bigint>;
    createCheckoutSession(items: Array<ShoppingItem>, successUrl: string, cancelUrl: string): Promise<string>;
    createGroup(name: string, groupType: GroupType, maxCapacity: bigint, trackId: string | null): Promise<void>;
    creditXP(user: Principal, amount: bigint): Promise<void>;
    finishRace(trackId: string): Promise<void>;
    getAIDrivenRaceResults(): Promise<AIRaceResult | null>;
    getAvailablePlans(): Promise<Array<Plan>>;
    getAvailableStoreItems(): Promise<Array<StoreItem>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getConversationWithPeer(peer: Principal): Promise<Array<DirectMessage>>;
    getCurrentPlan(): Promise<Plan>;
    getF1RacingTrack(): Promise<F1RacingTrack | null>;
    getFriendsLeaderboard(season: Season): Promise<Array<LeaderboardEntry>>;
    getFullStoreData(): Promise<StoreData>;
    getGlobalLeaderboard(season: Season): Promise<Array<LeaderboardEntry> | null>;
    getGroupMembers(name: string): Promise<Array<Principal>>;
    getGroups(): Promise<Array<GroupView>>;
    getLeaderboardFriends(): Promise<Array<Principal>>;
    getMyFriends(): Promise<Array<Principal>>;
    getMyOwnedItems(): Promise<Array<string>>;
    getMyPlayerStats(): Promise<PlayerStats | null>;
    getMyRaceStats(): Promise<RaceStats | null>;
    getMySubscription(): Promise<Subscription>;
    getPlanExpiration(): Promise<Time | null>;
    getPlanPricing(plan: Plan): Promise<bigint>;
    getPlayerStats(player: Principal): Promise<PlayerStats | null>;
    getRaceCarStates(trackId: string): Promise<Array<[Principal, CarState | null]>>;
    getRacePositions(trackId: string): Promise<Array<[Principal, Position | null]>>;
    getRaceStats(player: Principal): Promise<RaceStats | null>;
    getStoreStatus(): Promise<StoreStatus>;
    getStripeSessionStatus(sessionId: string): Promise<StripeSessionStatus>;
    getTeamRoster(): Promise<TeamRoster>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    isStripeConfigured(): Promise<boolean>;
    joinGroup(name: string): Promise<void>;
    joinMatchmaking(): Promise<void>;
    joinRace(trackId: string): Promise<void>;
    joinTeam(name: string, role: TeamRole): Promise<void>;
    leaveGroup(name: string): Promise<void>;
    leaveTeam(): Promise<void>;
    progressSRByAI(srIncrement: bigint): Promise<void>;
    purchaseItem(itemName: string): Promise<void>;
    registerRaceResult(raceData: Race): Promise<void>;
    removeFriend(friend: Principal): Promise<void>;
    resetSeason(season: Season): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    sendDirectMessage(recipient: Principal, content: string): Promise<void>;
    setF1RacingTrack(textureAsset: string, points: Array<Position>, checkpoints: Array<Position>, pitLane: Array<Position>, finishLine: Array<Position>): Promise<void>;
    setStripeConfiguration(config: StripeConfiguration): Promise<void>;
    setWorldRaceRecord(trackId: string, lapTime: bigint): Promise<void>;
    startAIRace(trackId: string, input: AIInput): Promise<void>;
    startRace(trackId: string): Promise<void>;
    startTournament(trackId: string): Promise<void>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
    updateCarState(position: Position, velocity: number, direction: number, laps: bigint): Promise<void>;
    updateCurrentSeason(raceCount: bigint): Promise<void>;
    updateLeaderboard(season: Season, entries: Array<LeaderboardEntry>): Promise<void>;
    updateRaceStats(wins: bigint, losses: bigint, bestTime: bigint): Promise<void>;
}
