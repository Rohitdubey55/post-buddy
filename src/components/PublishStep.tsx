import { useState, useEffect } from "react";
import { Send, Clock, Loader2, Users, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface TelegramChat {
  id: number;
  title: string;
  type: string;
}

interface PublishStepProps {
  onPost: (chatId: string) => void;
  fetchGroups: () => Promise<TelegramChat[]>;
  isLoading: boolean;
}

export function PublishStep({ onPost, fetchGroups, isLoading }: PublishStepProps) {
  const [groups, setGroups] = useState<TelegramChat[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [manualChatId, setManualChatId] = useState("");
  const [loadingGroups, setLoadingGroups] = useState(false);

  const loadGroups = async () => {
    setLoadingGroups(true);
    const chats = await fetchGroups();
    setGroups(chats);
    setLoadingGroups(false);
  };

  useEffect(() => {
    loadGroups();
  }, []);

  const chatId = selectedGroup || manualChatId;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-display font-bold tracking-tight">
          Publish to Telegram
        </h2>
        <p className="text-muted-foreground">
          Choose a group/channel to post, or enter a chat ID manually.
        </p>
      </div>

      <div className="glass-card rounded-lg p-6 space-y-5">
        {/* Groups list */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Users className="h-4 w-4 text-primary" />
              Available Groups
            </div>
            <Button variant="ghost" size="sm" onClick={loadGroups} disabled={loadingGroups}>
              <RefreshCw className={`h-3 w-3 ${loadingGroups ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {groups.length > 0 ? (
            <div className="grid gap-2">
              {groups.map((group) => (
                <button
                  key={group.id}
                  onClick={() => { setSelectedGroup(String(group.id)); setManualChatId(""); }}
                  className={`text-left p-3 rounded-md border transition-all ${
                    selectedGroup === String(group.id)
                      ? 'border-primary bg-accent glow-primary'
                      : 'border-border/50 hover:border-primary/30 bg-background/50'
                  }`}
                >
                  <div className="font-medium text-sm">{group.title}</div>
                  <div className="text-xs text-muted-foreground capitalize">{group.type}</div>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-2">
              {loadingGroups ? "Loading groups..." : "No groups found. Make sure the bot is added to a group, then refresh."}
            </p>
          )}
        </div>

        {/* Manual chat ID */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Or enter Chat ID manually</label>
          <Input
            placeholder="-1001234567890"
            value={manualChatId}
            onChange={(e) => { setManualChatId(e.target.value); setSelectedGroup(""); }}
            className="bg-background/50"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button
            onClick={() => onPost(chatId)}
            disabled={isLoading || !chatId}
            className="gap-2 flex-1 font-display font-semibold"
            size="lg"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Post Now
          </Button>
        </div>
      </div>
    </div>
  );
}
