import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useLang } from "@/contexts/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Radio, Send, CheckCircle, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

const channels = ["COMMAND","OPERATIONS","LOGISTICS","MEDICAL","GENERAL"] as const;
const priorities = ["ROUTINE","URGENT","FLASH"] as const;

const priorityColors: Record<string, string> = {
  ROUTINE: "text-muted-foreground", URGENT: "text-orange-400", FLASH: "text-red-400",
};

const channelColors: Record<string, string> = {
  COMMAND: "text-red-400", OPERATIONS: "text-orange-400", LOGISTICS: "text-blue-400",
  MEDICAL: "text-green-400", GENERAL: "text-muted-foreground",
};

export default function Comms({ incidentId }: { incidentId?: number }) {
  const { t } = useLang();
  const { user } = useAuth();
  const [selectedIncident, setSelectedIncident] = useState<number | undefined>(incidentId);
  const [channel, setChannel] = useState<typeof channels[number]>("GENERAL");
  const [priority, setPriority] = useState<typeof priorities[number]>("ROUTINE");
  const [message, setMessage] = useState("");
  const utils = trpc.useUtils();

  const { data: incidents } = trpc.incidents.list.useQuery({ limit: 20 });
  const { data: messages, isLoading } = trpc.comms.list.useQuery(
    { incidentId: selectedIncident!, channel, limit: 50 },
    { enabled: !!selectedIncident, refetchInterval: 10000 }
  );

  const send = trpc.comms.send.useMutation({
    onSuccess: () => { utils.comms.list.invalidate(); setMessage(""); toast.success("Message sent"); },
    onError: (err) => toast.error(err.message),
  });

  const acknowledge = trpc.comms.acknowledge.useMutation({
    onSuccess: () => { utils.comms.list.invalidate(); },
  });

  const handleSend = () => {
    if (!message.trim() || !selectedIncident) return;
    send.mutate({ incidentId: selectedIncident, channel, content: message, priority });
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Communications — الاتصالات</h1>
        <p className="text-muted-foreground text-sm mt-1">Incident-scoped messaging by channel and priority</p>
      </div>

      {!incidentId && (
        <Select value={selectedIncident?.toString() ?? ""} onValueChange={v => setSelectedIncident(Number(v))}>
          <SelectTrigger className="w-80"><SelectValue placeholder="Select an incident..." /></SelectTrigger>
          <SelectContent>{incidents?.map(inc => <SelectItem key={inc.id} value={inc.id.toString()}>{inc.name}</SelectItem>)}</SelectContent>
        </Select>
      )}

      {selectedIncident && (
        <>
          {/* Channel tabs */}
          <div className="flex gap-2 flex-wrap">
            {channels.map(ch => (
              <Button key={ch} variant={channel === ch ? "default" : "outline"} size="sm" onClick={() => setChannel(ch)}>
                <span className={channelColors[ch]}>{ch}</span>
              </Button>
            ))}
          </div>

          {/* Messages */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {isLoading ? Array.from({length:4}).map((_,i) => <Skeleton key={i} className="h-16" />) :
            messages?.length === 0 ? (
              <Card><CardContent className="py-8 text-center text-muted-foreground">
                <Radio className="h-8 w-8 mx-auto mb-2 opacity-20" />
                <p className="text-sm">No messages in {channel} channel</p>
              </CardContent></Card>
            ) : messages?.map(msg => (
              <Card key={msg.id} className={`${msg.priority === "FLASH" ? "border-red-500/50" : msg.priority === "URGENT" ? "border-orange-500/30" : ""}`}>
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        {msg.priority !== "ROUTINE" && (
                          <Badge variant="outline" className={`${priorityColors[msg.priority]} border-current text-xs`}>
                            {msg.priority === "FLASH" && <AlertTriangle className="h-3 w-3 mr-1" />}
                            {msg.priority}
                          </Badge>
                        )}
                        <span className={`text-xs font-medium ${channelColors[msg.channel]}`}>{msg.channel}</span>
                        <span className="text-xs text-muted-foreground">{new Date(msg.createdAt).toLocaleTimeString()}</span>
                        {msg.acknowledgedAt && <span className="text-xs text-green-400 flex items-center gap-1"><CheckCircle className="h-3 w-3" />Ack</span>}
                      </div>
                      <p className="text-sm">{msg.content}</p>
                    </div>
                    {!msg.acknowledgedAt && msg.priority !== "ROUTINE" && (
                      <Button size="sm" variant="ghost" className="shrink-0 text-green-400" onClick={() => acknowledge.mutate({ id: msg.id })}>
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Send message */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex gap-3">
                <Select value={priority} onValueChange={v => setPriority(v as any)}>
                  <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                  <SelectContent>{priorities.map(p => <SelectItem key={p} value={p}><span className={priorityColors[p]}>{p}</span></SelectItem>)}</SelectContent>
                </Select>
                <span className="text-xs text-muted-foreground self-center">Channel: <span className={channelColors[channel]}>{channel}</span></span>
              </div>
              <div className="flex gap-3">
                <Textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Type message..."
                  rows={2}
                  className="flex-1"
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                />
                <Button onClick={handleSend} disabled={!message.trim() || send.isPending} className="self-end">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
