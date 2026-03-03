import Set "mo:core/Set";
import Map "mo:core/Map";
import Array "mo:core/Array";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import Int8 "mo:core/Int8";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Nat8 "mo:core/Nat8";
import Float "mo:core/Float";
import Time "mo:core/Time";
import List "mo:core/List";
import Iter "mo:core/Iter";

import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import Stripe "stripe/stripe";
import OutCall "http-outcalls/outcall";

actor {
  type Season = Nat8;
  type TrackPosition = Nat16;
  type Time = Int;

  type RaceStats = {
    wins : Nat;
    losses : Nat;
    bestTime : Nat;
  };

  type PlayerStats = {
    races : Nat;
    totalTime : Nat;
  };

  type LeaderboardEntry = {
    player : Principal;
    skill : Nat;
  };

  type Race = {
    driver : Principal;
    score : Nat;
  };

  type LapTime = {
    lap : Nat;
    time : Int;
  };

  type Position = {
    checkpoint : Nat8;
    position : TrackPosition;
  };

  type CarState = {
    position : Position;
    velocity : Float;
    direction : Float;
    laps : Nat;
    lapTimes : [LapTime];
    isRacing : Bool;
  };

  type RaceSession = {
    players : Set.Set<Principal>;
    startTime : Time;
    track : TrackData;
    status : RaceStatus;
  };

  type TrackData = {
    textureAsset : Text;
    dimensions : TrackDimensions;
    points : [Position];
    checkpoints : [Position];
    pitLane : [Position];
    finishLine : [Position];
  };

  type TrackDimensions = {
    length : Nat16;
    width : Nat8;
    height : Nat8;
  };

  type RecordEntry = {
    player : Principal;
    lapTime : Int;
  };

  type RaceStatus = {
    #waiting;
    #inProgress;
    #finished;
  };

  type FriendList = Set.Set<Principal>;

  type F1RacingTrack = {
    textureAsset : Text;
    points : [Position];
    checkpoints : [Position];
    pitLane : [Position];
    finishLine : [Position];
  };

  type GroupType = {
    #race;
    #tournament;
  };

  type Group = {
    name : Text;
    groupType : GroupType;
    owner : Principal;
    members : Set.Set<Principal>;
    maxCapacity : Nat;
    trackId : ?Text;
  };

  // New enums and types for Subscription Plans
  type Plan = {
    #free;
    #monthly;
    #yearly;
  };

  type Subscription = {
    plan : Plan;
    startDate : Time.Time;
    expirationDate : ?Time.Time;
    status : {
      #active;
      #canceled;
      #expired;
    };
    stripeSessionId : ?Text;
  };

  // Team Roles New Types
  public type CareerRole = {
    #driver;
    #pitCrew;
    #director;
  };

  public type TeamMemberEntry = {
    name : Text;
    career : CareerRole;
  };

  public type UserProfile = {
    name : Text;
    skillRating : Nat;
    totalRaces : Nat;
    winRate : Float;
    srLevel : Nat;
  };

  public type GroupView = {
    name : Text;
    groupType : GroupType;
    owner : Principal;
    maxCapacity : Nat;
    trackId : ?Text;
    memberCount : Nat;
  };

  public type TeamRole = {
    #driver;
    #pitCrew;
    #director;
  };

  public type TeamMember = {
    principal : Principal;
    name : Text;
    role : TeamRole;
  };

  public type TeamRoster = {
    drivers : [TeamMember];
    pitCrew : [TeamMember];
    directors : [TeamMember];
  };

  public type AIInput = {
    forward : Bool;
    backward : Bool;
  };

  public type AIRaceResult = {
    trackId : Text;
    completionTime : ?Nat;
    attempts : Nat;
    bestTime : ?Nat;
    srProgression : ?Nat;
  };

  public type DirectMessage = {
    sender : Principal;
    recipient : Principal;
    content : Text;
    timestamp : Time.Time;
  };

  public type ConversationThread = List.List<DirectMessage>;

  public type StoreItem = {
    name : Text;
    costInXP : Nat;
    description : Text;
  };

  public type StoreData = {
    availableItems : [StoreItem];
    userXP : Nat;
    ownedItems : [Text];
    totalPurchased : Nat;
  };

  public type StoreStatus = {
    balance : Nat;
    ownedItems : [Text];
  };

  // Enum for XP coin values
  public type XPCoinType = {
    #xp1;
    #xp5;
    #xp10;
    #xp20;
  };

  // Persistent State Maps
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  let races = Map.empty<Principal, RaceStats>();
  let leaderboard = Map.empty<Season, [LeaderboardEntry]>();
  let friends = Map.empty<Principal, FriendList>();
  let currentSeason = Map.empty<Principal, [Race]>();
  let playerStats = Map.empty<Principal, PlayerStats>();
  let playerPositions = Map.empty<Principal, Position>();
  let carStates = Map.empty<Principal, CarState>();
  let activeRaces = Map.empty<Text, RaceSession>();
  let f1RacingTrack = Map.empty<Text, F1RacingTrack>();
  let worldRecords = Map.empty<Text, RecordEntry>();
  let worldRaceRecords = Map.empty<Text, [RecordEntry]>();
  let groups = Map.empty<Text, Group>();
  let subscriptions = Map.empty<Principal, Subscription>();
  let teamMembers = Map.empty<Principal, CareerRole>();
  let teamRoster = Map.empty<Principal, TeamMember>();
  let aiRaceResults = Map.empty<Principal, AIRaceResult>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let directMessages = Map.empty<Text, ConversationThread>();

  // New persistent maps for Store data
  // Persistent user XP balances
  let userXP = Map.empty<Principal, Nat>();
  // Persistent user owned items
  let userOwnedItems = Map.empty<Principal, Set.Set<Text>>();
  // Persistent available store items (for dynamic updates)
  let availableStoreItems = Map.empty<Text, StoreItem>();

  // Initialize available store items (only on first upgrade)
  let initialStoreItems = [
    { name = "neonGreen"; costInXP = 500; description = "Bright green neon light" },
    { name = "neonPink"; costInXP = 500; description = "Intense pink neon light" },
    { name = "neonBlue"; costInXP = 600; description = "Cool blue neon light" },
    { name = "neonPurple"; costInXP = 700; description = "Vivid purple neon light" },
    { name = "neonRed"; costInXP = 950; description = "Deep red neon light" },
    { name = "goldenNeon"; costInXP = 2000; description = "Rare golden neon light" },
    { name = "silverNeon"; costInXP = 1500; description = "Shiny neon silver light" },
    { name = "cosmicNeon"; costInXP = 4999; description = "Crazy rare cosmic neon" },
  ];

  for (item in initialStoreItems.values()) {
    availableStoreItems.add(item.name, item);
  };

  // Store (XP shop) entrypoint for frontend
  public query ({ caller }) func getStoreStatus() : async StoreStatus {
    verifyUser(caller);
    {
      balance = getUserXP(caller);
      ownedItems = getUserOwnedItems(caller).toArray();
    };
  };

  // Get all available store items
  public query func getAvailableStoreItems() : async [StoreItem] {
    availableStoreItems.values().toArray();
  };

  // Get user's owned items
  public query ({ caller }) func getMyOwnedItems() : async [Text] {
    verifyUser(caller);
    getUserOwnedItems(caller).toArray();
  };

  // Purchase an item using XP
  public shared ({ caller }) func purchaseItem(itemName : Text) : async () {
    verifyUser(caller);

    let userBalance = getUserXP(caller);
    if (hasUserOwnsItem(caller, itemName)) {
      Runtime.trap("You already own item: " # itemName);
    };

    let item = switch (availableStoreItems.get(itemName)) {
      case (null) { Runtime.trap("Store item not found: " # itemName) };
      case (?item) { item };
    };

    if (userBalance < item.costInXP) {
      Runtime.trap("Not enough XP to purchase " # itemName);
    };

    userXP.add(caller, userBalance - item.costInXP);
    addUserOwnedItem(caller, itemName);
  };

  // Admin-only function to credit XP (for testing or special events)
  public shared ({ caller }) func creditXP(user : Principal, amount : Nat) : async () {
    verifyAdmin(caller);
    let currentBalance = getUserXP(user);
    userXP.add(user, currentBalance + amount);
  };

  // A query to get store user data
  public query ({ caller }) func getFullStoreData() : async StoreData {
    verifyUser(caller);

    let availableItems = availableStoreItems.values().toArray();
    let ownedItems = getUserOwnedItems(caller).toArray();
    let totalPurchased = ownedItems.size();

    {
      availableItems;
      userXP = getUserXP(caller);
      ownedItems;
      totalPurchased;
    };
  };

  // Give XP for collecting coins - must be in active race
  public shared ({ caller }) func collectXPCoin(coinType : XPCoinType, trackId : Text) : async Nat {
    verifyUser(caller);

    // Verify user is in an active race
    let raceSession = switch (activeRaces.get(trackId)) {
      case (null) { Runtime.trap("No active race found for track: " # trackId) };
      case (?session) { session };
    };

    if (not raceSession.players.contains(caller)) {
      Runtime.trap("Unauthorized: You are not participating in this race");
    };

    if (raceSession.status == #finished) {
      Runtime.trap("Cannot collect coins from a finished race");
    };

    // Verify user's car is racing
    let carState = switch (carStates.get(caller)) {
      case (null) { Runtime.trap("No car state found - you must be racing") };
      case (?state) { state };
    };

    if (not carState.isRacing) {
      Runtime.trap("You must be actively racing to collect coins");
    };

    let value = switch (coinType) {
      case (#xp1) { 1 };
      case (#xp5) { 5 };
      case (#xp10) { 10 };
      case (#xp20) { 20 };
    };

    let currentBalance = getUserXP(caller);
    userXP.add(caller, currentBalance + value);
    value;
  };

  // Helper Functions for Store module
  func getUserXP(user : Principal) : Nat {
    switch (userXP.get(user)) {
      case (null) { 0 };
      case (?balance) { balance };
    };
  };

  func getUserOwnedItems(user : Principal) : Set.Set<Text> {
    switch (userOwnedItems.get(user)) {
      case (null) { Set.empty<Text>() };
      case (?items) { items };
    };
  };

  func hasUserOwnsItem(user : Principal, itemName : Text) : Bool {
    let ownedItems = getUserOwnedItems(user);
    ownedItems.contains(itemName);
  };

  func addUserOwnedItem(user : Principal, itemName : Text) {
    let ownedItems = getUserOwnedItems(user);
    ownedItems.add(itemName);
    userOwnedItems.add(user, ownedItems);
  };

  func verifyAdmin(caller : Principal) {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins are allowed to perform this action");
    };
  };

  func verifyUser(caller : Principal) {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users are allowed to perform this action");
    };
  };

  func verifyOwnershipOrAdmin(caller : Principal, owner : Principal) {
    if (caller != owner and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own data");
    };
  };
  // Direct Message Handling
  func getThreadKey(sender : Principal, recipient : Principal) : Text {
    let senderText = sender.toText();
    let recipientText = recipient.toText();
    if (senderText < recipientText) {
      senderText # "_" # recipientText;
    } else {
      recipientText # "_" # senderText;
    };
  };

  public shared ({ caller }) func sendDirectMessage(recipient : Principal, content : Text) : async () {
    verifyUser(caller);
    if (caller == recipient) { Runtime.trap("Cannot message yourself") };

    let message : DirectMessage = {
      sender = caller;
      recipient;
      content;
      timestamp = Time.now();
    };
    let threadKey = getThreadKey(caller, recipient);

    let existingThread = directMessages.get(threadKey);
    let thread = switch (existingThread) {
      case (null) { List.empty<DirectMessage>() };
      case (?t) { t };
    };
    thread.add(message);

    directMessages.add(threadKey, thread);
  };

  public query ({ caller }) func getConversationWithPeer(peer : Principal) : async [DirectMessage] {
    verifyUser(caller);
    let threadKey = getThreadKey(caller, peer);
    switch (directMessages.get(threadKey)) {
      case (null) { [] };
      case (?thread) {
        thread.toArray();
      };
    };
  };

  // Required user profile functions
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    verifyUser(caller);
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    verifyOwnershipOrAdmin(caller, user);
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    verifyUser(caller);
    userProfiles.add(caller, profile);
  };

  // Track Management
  public shared ({ caller }) func setF1RacingTrack(
    textureAsset : Text,
    points : [Position],
    checkpoints : [Position],
    pitLane : [Position],
    finishLine : [Position],
  ) : async () {
    verifyAdmin(caller);
    let track = {
      textureAsset;
      points;
      checkpoints;
      pitLane;
      finishLine;
    };
    f1RacingTrack.add("f1Track", track);
  };

  public query func getF1RacingTrack() : async ?F1RacingTrack {
    // Public access - anyone can view track data
    f1RacingTrack.get("f1Track");
  };

  public query ({ caller }) func getAIDrivenRaceResults() : async ?AIRaceResult {
    verifyUser(caller);
    aiRaceResults.get(caller);
  };

  public shared ({ caller }) func startAIRace(trackId : Text, input : AIInput) : async () {
    verifyUser(caller);

    let currentAttempt = switch (aiRaceResults.get(caller)) {
      case (null) {
        { trackId; completionTime = null; attempts = 1; bestTime = null; srProgression = null };
      };
      case (?result) {
        {
          trackId;
          completionTime = null;
          attempts = result.attempts + 1;
          bestTime = result.bestTime;
          srProgression = null;
        };
      };
    };

    aiRaceResults.add(caller, currentAttempt);
  };

  public shared ({ caller }) func completeAIRace(trackId : Text, input : AIInput) : async Nat {
    verifyUser(caller);
    let aiRecord = switch (aiRaceResults.get(caller)) {
      case (null) { Runtime.trap("No AI race found for principal: " # caller.toText()) };
      case (?race) { race };
    };

    aiRaceResults.add(
      caller,
      {
        aiRecord with
        trackId = trackId;
        completionTime = ?0;
        srProgression = ?5;
      },
    );

    5;
  };

  public shared ({ caller }) func progressSRByAI(srIncrement : Nat) : async () {
    verifyUser(caller);

    let currentProfile = switch (userProfiles.get(caller)) {
      case (null) { Runtime.trap("No user profile found for principal: " # caller.toText()) };
      case (?profile) { profile };
    };

    userProfiles.add(caller, { currentProfile with srLevel = currentProfile.srLevel + srIncrement });
  };

  // Race Management
  public shared ({ caller }) func startRace(trackId : Text) : async () {
    verifyUser(caller);
    let raceTrack = switch (f1RacingTrack.get(trackId)) {
      case (null) {
        Runtime.trap("Could not find race track for id: " # trackId);
      };
      case (?track) { track };
    };
    let trackData : TrackData = {
      textureAsset = raceTrack.textureAsset;
      dimensions = { length = 5000; width = 8; height = 8 };
      points = raceTrack.points;
      checkpoints = raceTrack.checkpoints;
      pitLane = raceTrack.pitLane;
      finishLine = raceTrack.finishLine;
    };
    let players = Set.empty<Principal>();
    players.add(caller);
    let raceSession = {
      players;
      startTime = Time.now();
      track = trackData;
      status = #waiting;
    };
    activeRaces.add(trackId, raceSession);
  };

  public shared ({ caller }) func joinRace(trackId : Text) : async () {
    verifyUser(caller);
    let raceSession = switch (activeRaces.get(trackId)) {
      case (null) {
        Runtime.trap("Race session not found for track: " # trackId);
      };
      case (?session) { session };
    };

    if (raceSession.status != #waiting) {
      Runtime.trap("Cannot join race that is already in progress or finished");
    };

    raceSession.players.add(caller);
    activeRaces.add(trackId, raceSession);
  };

  public query func getRacePositions(trackId : Text) : async [(Principal, ?Position)] {
    // Public access - anyone can view race positions for spectating
    switch (activeRaces.get(trackId)) {
      case (null) { [] };
      case (?raceSession) {
        raceSession.players.toArray().map<Principal, (Principal, ?Position)>(
          func(p) { (p, playerPositions.get(p)) }
        );
      };
    };
  };

  public query func getRaceCarStates(trackId : Text) : async [(Principal, ?CarState)] {
    // Public access - anyone can view car states for spectating
    switch (activeRaces.get(trackId)) {
      case (null) { [] };
      case (?raceSession) {
        raceSession.players.toArray().map<Principal, (Principal, ?CarState)>(
          func(p) { (p, carStates.get(p)) }
        );
      };
    };
  };

  public shared ({ caller }) func finishRace(trackId : Text) : async () {
    verifyUser(caller);
    let raceSession = switch (activeRaces.get(trackId)) {
      case (null) {
        Runtime.trap("Race session not found for track: " # trackId);
      };
      case (?session) { session };
    };

    // Only race participants or admins can finish a race
    if (not raceSession.players.contains(caller) and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only race participants or admins can finish the race");
    };

    activeRaces.remove(trackId);
  };

  // Race Stats Functions
  public shared ({ caller }) func addRace(speed : Nat) : async () {
    verifyUser(caller);
    let race = { driver = caller; score = speed };
    let existingRaces = switch (currentSeason.get(caller)) {
      case (?races) { races };
      case (null) { [] };
    };
    let updatedRaces = existingRaces.concat([race]);
    currentSeason.add(caller, updatedRaces);
  };

  public shared ({ caller }) func updateRaceStats(wins : Nat, losses : Nat, bestTime : Nat) : async () {
    verifyUser(caller);
    let raceStats = {
      wins;
      losses;
      bestTime;
    };
    races.add(caller, raceStats);
  };

  public shared ({ caller }) func updateCarState(position : Position, velocity : Float, direction : Float, laps : Nat) : async () {
    verifyUser(caller);
    let existingState = carStates.get(caller);
    let lapTimes = switch (existingState) {
      case (?state) { state.lapTimes };
      case (null) { [] };
    };
    let carState = {
      position = position;
      velocity;
      direction;
      laps;
      lapTimes;
      isRacing = true;
    };
    carStates.add(caller, carState);
  };

  public shared ({ caller }) func setWorldRaceRecord(trackId : Text, lapTime : Int) : async () {
    verifyUser(caller);
    // Users can only set their own records
    let entry = {
      player = caller;
      lapTime;
    };

    // Check if this is actually a better record
    switch (worldRecords.get(trackId)) {
      case (?existingRecord) {
        if (lapTime >= existingRecord.lapTime) {
          Runtime.trap("Lap time is not better than existing record");
        };
      };
      case (null) { };
    };

    worldRecords.add(trackId, entry);

    let existingRecords = switch (worldRaceRecords.get(trackId)) {
      case (?records) { records };
      case (null) { [] };
    };
    worldRaceRecords.add(trackId, existingRecords.concat([entry]));
  };

  // Leaderboard functions
  public query func getGlobalLeaderboard(season : Season) : async ?[LeaderboardEntry] {
    // Public access - anyone can view global leaderboard
    leaderboard.get(season);
  };

  public query ({ caller }) func getFriendsLeaderboard(season : Season) : async [LeaderboardEntry] {
    verifyUser(caller);
    let friendList = switch (friends.get(caller)) {
      case (null) { Set.empty<Principal>() };
      case (?list) { list };
    };
    let seasonLeaderboard = switch (leaderboard.get(season)) {
      case (null) { [] };
      case (?entries) { entries };
    };
    seasonLeaderboard.filter<LeaderboardEntry>(func(entry) {
      if (friendList.contains(entry.player)) { true } else { entry.player == caller };
    });
  };

  public query ({ caller }) func getLeaderboardFriends() : async [Principal] {
    verifyUser(caller);
    let friendList = switch (friends.get(caller)) {
      case (null) { Set.empty<Principal>() };
      case (?list) { list };
    };
    friendList.toArray();
  };

  // Tournament
  public shared ({ caller }) func startTournament(trackId : Text) : async () {
    verifyUser(caller);
    let raceTrack = switch (f1RacingTrack.get(trackId)) {
      case (null) {
        Runtime.trap("Could not find race track for id: " # trackId);
      };
      case (?track) { track };
    };
    let trackData : TrackData = {
      textureAsset = raceTrack.textureAsset;
      dimensions = { length = 5000; width = 8; height = 8 };
      points = raceTrack.points;
      checkpoints = raceTrack.checkpoints;
      pitLane = raceTrack.pitLane;
      finishLine = raceTrack.finishLine;
    };
    let players = Set.empty<Principal>();
    players.add(caller);
    let raceSession = {
      players;
      startTime = Time.now();
      track = trackData;
      status = #waiting;
    };
    activeRaces.add(trackId, raceSession);
  };

  // Friend Management Functions
  public shared ({ caller }) func addFriend(friend : Principal) : async () {
    verifyUser(caller);
    if (caller == friend) {
      Runtime.trap("Cannot add yourself as a friend");
    };
    let friendList = switch (friends.get(caller)) {
      case (null) { Set.empty<Principal>() };
      case (?list) { list };
    };
    friendList.add(friend);
    friends.add(caller, friendList);
  };

  public shared ({ caller }) func removeFriend(friend : Principal) : async () {
    verifyUser(caller);
    let friendList = switch (friends.get(caller)) {
      case (null) { Set.empty<Principal>() };
      case (?list) { list };
    };
    friendList.remove(friend);
    friends.add(caller, friendList);
  };

  public query ({ caller }) func getMyFriends() : async [Principal] {
    verifyUser(caller);
    let friendList = switch (friends.get(caller)) {
      case (null) { Set.empty<Principal>() };
      case (?list) { list };
    };
    friendList.toArray();
  };

  public query ({ caller }) func getRaceStats(player : Principal) : async ?RaceStats {
    verifyOwnershipOrAdmin(caller, player);
    races.get(player);
  };

  public query ({ caller }) func getMyRaceStats() : async ?RaceStats {
    verifyUser(caller);
    races.get(caller);
  };

  public shared ({ caller }) func updateLeaderboard(season : Season, entries : [LeaderboardEntry]) : async () {
    verifyAdmin(caller);
    leaderboard.add(season, entries);
  };

  public shared ({ caller }) func resetSeason(season : Season) : async () {
    verifyAdmin(caller);
    leaderboard.remove(season);
  };

  public shared ({ caller }) func registerRaceResult(raceData : Race) : async () {
    verifyUser(caller);
    // Users can only register their own race results
    if (raceData.driver != caller) {
      Runtime.trap("Unauthorized: Can only register your own race results");
    };

    let existingRaces = switch (currentSeason.get(caller)) {
      case (?races) { races };
      case (null) { [] };
    };
    let updatedRaces = existingRaces.concat([raceData]);
    currentSeason.add(caller, updatedRaces);
  };

  public shared ({ caller }) func updateCurrentSeason(raceCount : Nat) : async () {
    verifyUser(caller);
    // Users can only update their own season stats
    let stats = {
      races = raceCount;
      totalTime = 0;
    };
    playerStats.add(caller, stats);
  };

  public shared ({ caller }) func joinMatchmaking() : async () {
    verifyUser(caller);
    // Matchmaking logic would go here
  };

  public query ({ caller }) func getPlayerStats(player : Principal) : async ?PlayerStats {
    verifyOwnershipOrAdmin(caller, player);
    playerStats.get(player);
  };

  public query ({ caller }) func getMyPlayerStats() : async ?PlayerStats {
    verifyUser(caller);
    playerStats.get(caller);
  };

  // Groups Page Functionality
  public query func getGroups() : async [GroupView] {
    // Public access - anyone can browse available groups
    // Member list is NOT exposed for privacy - only member count
    groups.toArray().map<(Text, Group), GroupView>(
      func((name, group)) {
        {
          name = group.name;
          groupType = group.groupType;
          owner = group.owner;
          maxCapacity = group.maxCapacity;
          trackId = group.trackId;
          memberCount = group.members.size();
        };
      }
    );
  };

  public shared ({ caller }) func createGroup(name : Text, groupType : GroupType, maxCapacity : Nat, trackId : ?Text) : async () {
    verifyUser(caller);

    // Check if group name already exists
    switch (groups.get(name)) {
      case (?_) {
        Runtime.trap("Group with name '" # name # "' already exists");
      };
      case (null) { };
    };

    if (maxCapacity < 2) {
      Runtime.trap("Group must allow at least 2 players");
    };

    let members = Set.empty<Principal>();
    members.add(caller);

    let group = {
      name;
      groupType;
      owner = caller;
      members;
      maxCapacity;
      trackId;
    };
    groups.add(name, group);
  };

  public shared ({ caller }) func joinGroup(name : Text) : async () {
    verifyUser(caller);
    let existingGroup = switch (groups.get(name)) {
      case (null) { Runtime.trap("Group not found: " # name) };
      case (?group) { group };
    };

    // Check if already a member
    if (existingGroup.members.contains(caller)) {
      Runtime.trap("You are already a member of group: " # name);
    };

    // Check capacity
    if (existingGroup.members.size() >= existingGroup.maxCapacity) {
      Runtime.trap("Group " # name # " is full!");
    };

    existingGroup.members.add(caller);
    groups.add(name, existingGroup);
  };

  public shared ({ caller }) func leaveGroup(name : Text) : async () {
    verifyUser(caller);
    let existingGroup = switch (groups.get(name)) {
      case (null) { Runtime.trap("Group not found: " # name) };
      case (?group) { group };
    };

    // Check if member
    if (not existingGroup.members.contains(caller)) {
      Runtime.trap("You are not a member of group: " # name);
    };

    existingGroup.members.remove(caller);

    // If owner leaves and group is empty, delete the group
    if (existingGroup.owner == caller and existingGroup.members.size() == 0) {
      groups.remove(name);
    } else {
      groups.add(name, existingGroup);
    };
  };

  public query ({ caller }) func getGroupMembers(name : Text) : async [Principal] {
    verifyUser(caller);
    let group = switch (groups.get(name)) {
      case (null) { Runtime.trap("Group not found: " # name) };
      case (?g) { g };
    };

    // Only members or admins can see the member list
    if (not group.members.contains(caller) and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only group members can view the member list");
    };

    group.members.toArray();
  };

  // Subscription Plans (NEW)
  // Expose available plans
  public query func getAvailablePlans() : async [Plan] {
    [#free, #monthly, #yearly];
  };

  // Get plan pricing (could also be included in frontend)
  public query func getPlanPricing(plan : Plan) : async Nat {
    switch (plan) {
      case (#free) { 0 };
      case (#monthly) { 500 }; // IN CENTS (currently 5 USD)
      case (#yearly) { 5500 }; // 55 USD annual discount
    };
  };

  // Get user subscription
  public query ({ caller }) func getMySubscription() : async Subscription {
    getSubscriptionInternal(caller);
  };

  // Get current plan (helper function)
  public query ({ caller }) func getCurrentPlan() : async Plan {
    let subscription = getSubscriptionInternal(caller);

    switch (subscription.status) {
      case (#active) { subscription.plan };
      case (_) { #free };
    };
  };

  // Get plan expiration timestamp
  public query ({ caller }) func getPlanExpiration() : async ?Time.Time {
    let subscription = getSubscriptionInternal(caller);

    if (subscription.status == #active) {
      subscription.expirationDate;
    } else { null };
  };

  // Update subscription after payment
  public shared ({ caller }) func activatePaidPlan(plan : Plan, stripeSessionId : Text) : async () {
    verifyUser(caller);

    let now = Time.now();
    let expirationDate : ?Time.Time = switch (plan) {
      case (#monthly) { ?(now + 30 * 24 * 3600 * 1000000000) }; // 30 days
      case (#yearly) { ?(now + 365 * 24 * 3600 * 1000000000) }; // 1 year
      case (_) { null };
    };

    let subscription : Subscription = {
      plan;
      startDate = now;
      expirationDate;
      status = #active;
      stripeSessionId = ?stripeSessionId;
    };

    subscriptions.add(caller, subscription);
  };

  // Cancel user subscription (reverts to free)
  public shared ({ caller }) func cancelSubscription() : async () {
    verifyUser(caller);

    let subscription = getSubscriptionInternal(caller);

    let updatedSubscription = {
      subscription with status = #canceled;
      plan = #free;
      expirationDate = null;
    };

    subscriptions.add(caller, updatedSubscription);
  };

  // Stripe handling for premium plans
  var stripeConfiguration : ?Stripe.StripeConfiguration = null;

  public shared ({ caller }) func setStripeConfiguration(config : Stripe.StripeConfiguration) : async () {
    verifyAdmin(caller);
    stripeConfiguration := ?config;
  };

  // Stripe integration for checkout
  public shared ({ caller }) func createCheckoutSession(items : [Stripe.ShoppingItem], successUrl : Text, cancelUrl : Text) : async Text {
    verifyUser(caller);
    let configuration = switch (stripeConfiguration) {
      case (null) { Runtime.trap("Stripe needs to be first configured") };
      case (?config) { config };
    };
    await Stripe.createCheckoutSession(
      configuration,
      caller,
      items,
      successUrl,
      cancelUrl,
      transform,
    );
  };

  public shared ({ caller }) func getStripeSessionStatus(sessionId : Text) : async Stripe.StripeSessionStatus {
    verifyUser(caller);
    switch (stripeConfiguration) {
      case (?config) { await Stripe.getSessionStatus(config, sessionId, transform) };
      case (null) { Runtime.trap("Stripe needs to be first configured") };
    };
  };

  public query func isStripeConfigured() : async Bool {
    stripeConfiguration != null;
  };

  public query ({ caller }) func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  func getSubscriptionInternal(caller : Principal) : Subscription {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("You must be a user to get subscriptions");
    };
    switch (subscriptions.get(caller)) {
      case (?subscription) { subscription };
      case (null) {
        {
          plan = #free;
          startDate = Time.now();
          expirationDate = null;
          status = #active;
          stripeSessionId = null;
        };
      };
    };
  };

  // Team Career Support
  // Add new team member with role
  public shared ({ caller }) func joinTeam(name : Text, role : TeamRole) : async () {
    verifyUser(caller);
    switch (teamRoster.get(caller)) {
      case (?existing) {
        if (existing.role == role) {
          Runtime.trap("You are already in the team as this role");
        } else {
          let updatedMember = { existing with name; role };
          teamRoster.add(caller, updatedMember);
        };
      };
      case (null) {
        let member = { principal = caller; name; role };
        teamRoster.add(caller, member);
      };
    };
  };

  // Change role
  public shared ({ caller }) func changeRole(role : TeamRole) : async () {
    verifyUser(caller);
    let member = switch (teamRoster.get(caller)) {
      case (null) { Runtime.trap("Not found member for principal: " # caller.toText()) };
      case (?existing) { existing };
    };
    teamRoster.add(
      caller,
      { member with role },
    );
  };

  // Get full roster
  public query ({ caller }) func getTeamRoster() : async TeamRoster {
    verifyUser(caller);

    let allMembers = teamRoster.values().toArray();

    let drivers = Array.tabulate(
      allMembers.size(),
      func(i) { allMembers[i] },
    );

    let pitCrew = Array.tabulate(
      allMembers.size(),
      func(i) { allMembers[i] },
    );

    let directors = Array.tabulate(
      allMembers.size(),
      func(i) { allMembers[i] },
    );

    {
      drivers;
      pitCrew;
      directors;
    };
  };

  // Remove member
  public shared ({ caller }) func leaveTeam() : async () {
    verifyUser(caller);
    switch (teamRoster.get(caller)) {
      case (null) { Runtime.trap("No entries found to remove") };
      case (?_) {
        teamRoster.remove(caller);
      };
    };
  };
};
