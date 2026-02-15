import { useState, useEffect, useRef } from 'react';
import { useGetMyFriends, useGetConversationWithPeer, useSendDirectMessage, useGetCallerUserProfile } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { MessageCircle, Send, Users } from 'lucide-react';
import { Principal } from '@dfinity/principal';
import type { DirectMessage } from '../backend';

export default function Chat() {
  const { identity } = useInternetIdentity();
  const { data: friends = [], isLoading: friendsLoading } = useGetMyFriends();
  const { data: userProfile } = useGetCallerUserProfile();
  const [selectedFriend, setSelectedFriend] = useState<Principal | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const { data: messages = [], isLoading: messagesLoading } = useGetConversationWithPeer(selectedFriend);
  const sendMessage = useSendDirectMessage();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!selectedFriend || !messageInput.trim() || sendMessage.isPending) return;

    await sendMessage.mutateAsync({
      recipient: selectedFriend,
      content: messageInput.trim(),
    });

    setMessageInput('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const currentUserPrincipal = identity?.getPrincipal().toString();

  if (friendsLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">Loading friends...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (friends.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-6 w-6" />
              Chat
            </CardTitle>
          </CardHeader>
          <CardContent className="py-12">
            <div className="text-center">
              <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No Friends Yet</h3>
              <p className="text-muted-foreground mb-6">
                Add friends to start chatting! Go to your Profile to add friends by their Principal ID.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-6 w-6" />
            Chat
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-[300px_1fr] gap-4 h-[600px]">
            {/* Friends List */}
            <div className="border rounded-lg">
              <div className="p-4 border-b bg-muted/50">
                <h3 className="font-semibold flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Friends ({friends.length})
                </h3>
              </div>
              <ScrollArea className="h-[calc(600px-60px)]">
                <div className="p-2">
                  {friends.map((friend) => (
                    <button
                      key={friend.toString()}
                      onClick={() => setSelectedFriend(friend)}
                      className={`w-full text-left p-3 rounded-lg mb-2 transition-colors ${
                        selectedFriend?.toString() === friend.toString()
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-muted'
                      }`}
                    >
                      <div className="font-medium truncate">
                        {friend.toString().slice(0, 8)}...{friend.toString().slice(-6)}
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Conversation Panel */}
            <div className="border rounded-lg flex flex-col">
              {selectedFriend ? (
                <>
                  <div className="p-4 border-b bg-muted/50">
                    <h3 className="font-semibold truncate">
                      {selectedFriend.toString().slice(0, 12)}...{selectedFriend.toString().slice(-8)}
                    </h3>
                  </div>

                  <ScrollArea className="flex-1 p-4 h-[calc(600px-140px)]">
                    {messagesLoading && messages.length === 0 ? (
                      <p className="text-center text-muted-foreground">Loading messages...</p>
                    ) : messages.length === 0 ? (
                      <p className="text-center text-muted-foreground">No messages yet. Start the conversation!</p>
                    ) : (
                      <div className="space-y-4">
                        {messages.map((message: DirectMessage, index: number) => {
                          const isCurrentUser = message.sender.toString() === currentUserPrincipal;
                          return (
                            <div
                              key={index}
                              className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                            >
                              <div
                                className={`max-w-[70%] rounded-lg p-3 ${
                                  isCurrentUser
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted'
                                }`}
                              >
                                <div className="text-xs opacity-70 mb-1">
                                  {isCurrentUser ? 'You' : 'Friend'}
                                </div>
                                <div className="break-words">{message.content}</div>
                                <div className="text-xs opacity-60 mt-1">
                                  {new Date(Number(message.timestamp) / 1000000).toLocaleTimeString()}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        <div ref={messagesEndRef} />
                      </div>
                    )}
                  </ScrollArea>

                  <Separator />

                  <div className="p-4">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Type a message..."
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        disabled={sendMessage.isPending}
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={!messageInput.trim() || sendMessage.isPending}
                        size="icon"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-muted-foreground">
                    <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Select a friend to start chatting</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
