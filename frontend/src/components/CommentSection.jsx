import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDate } from "@/lib/helpers";
import { MessageSquare, Send } from "lucide-react";
import { toast } from "sonner";

export const CommentSection = ({ comments = [], onSubmit }) => {
  const { user } = useAuth();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!text.trim()) return;
    setBusy(true);
    try {
      await onSubmit(text.trim());
      setText("");
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Gagal menambah catatan");
    } finally {
      setBusy(false);
    }
  };

  const initials = (name) => (name || "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <Card className="p-4 md:p-5">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="h-4 w-4 text-primary" />
        <h3 className="font-semibold">Catatan / Komentar</h3>
        <span className="text-xs text-muted-foreground">({comments.length})</span>
      </div>
      <div className="space-y-4 mb-4 max-h-72 overflow-y-auto">
        {comments.length === 0 && <p className="text-sm text-muted-foreground">Belum ada catatan.</p>}
        {comments.map((c) => (
          <div key={c.id} className="flex gap-3">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarFallback className="text-xs bg-primary/10 text-primary">{initials(c.name)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium">{c.name}</span>
                <span className="text-xs text-muted-foreground">{c.role}</span>
                <span className="text-xs text-muted-foreground">- {formatDate(c.timestamp)}</span>
              </div>
              <p className="text-sm text-foreground/90 mt-0.5 whitespace-pre-wrap">{c.isi}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-end gap-2">
        <Textarea
          data-testid="comment-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={`Tulis catatan sebagai ${user?.nama_lengkap}...`}
          className="min-h-[44px] resize-none"
        />
        <Button data-testid="comment-submit" onClick={submit} disabled={busy || !text.trim()} size="icon" className="shrink-0">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
};
