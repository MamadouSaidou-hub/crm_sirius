"use client";

import { useRef, useState } from "react";
import { Download, Mail, MessageCircle, QrCode } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { CopyButton } from "@/components/shared/copy-button";

interface ShareLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  insurerName: string;
  url: string;
}

/** Digits-only phone for wa.me (e.g. "+221 77 123 45 67" → "221771234567"). */
function toWhatsappNumber(phone: string): string {
  return phone.replace(/\D/g, "");
}

export function ShareLinkDialog({
  open,
  onOpenChange,
  insurerName,
  url,
}: ShareLinkDialogProps) {
  const [phone, setPhone] = useState("+221 ");
  const [email, setEmail] = useState("");
  const qrRef = useRef<HTMLDivElement>(null);

  const message = `Bonjour, souscrivez votre assurance vie ${insurerName} en quelques minutes : ${url}`;

  const shareWhatsapp = () => {
    const number = toWhatsappNumber(phone);
    const target = number
      ? `https://wa.me/${number}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(target, "_blank", "noopener,noreferrer");
  };

  const shareEmail = () => {
    const subject = `Votre assurance vie ${insurerName}`;
    const mailto = `mailto:${email}?subject=${encodeURIComponent(
      subject,
    )}&body=${encodeURIComponent(message)}`;
    window.location.href = mailto;
  };

  const downloadQr = () => {
    const canvas = qrRef.current?.querySelector("canvas");
    if (!canvas) return;
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `lien-${insurerName.toLowerCase().replace(/\s+/g, "-")}.png`;
    link.click();
    toast.success("QR code téléchargé");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Partager le lien — {insurerName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current link */}
          <div className="space-y-1.5">
            <Label>Lien de souscription</Label>
            <div className="flex items-center gap-2 rounded-md border border-border bg-secondary/40 px-3 py-2">
              <p className="min-w-0 flex-1 truncate font-mono text-xs text-foreground">
                {url}
              </p>
              <CopyButton value={url} />
            </div>
          </div>

          <Separator />

          {/* WhatsApp */}
          <div className="space-y-1.5">
            <Label htmlFor="share-phone">Envoyer par WhatsApp</Label>
            <div className="flex gap-2">
              <Input
                id="share-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+221 77 123 45 67"
              />
              <Button variant="teal" onClick={shareWhatsapp} className="shrink-0">
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </Button>
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="share-email">Envoyer par email</Label>
            <div className="flex gap-2">
              <Input
                id="share-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="prospect@email.com"
              />
              <Button onClick={shareEmail} className="shrink-0">
                <Mail className="h-4 w-4" />
                Email
              </Button>
            </div>
          </div>

          <Separator />

          {/* QR code */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <QrCode className="h-4 w-4" />
              QR code
            </Label>
            <div className="flex items-center gap-4">
              <div ref={qrRef} className="rounded-md bg-white p-2">
                <QRCodeCanvas value={url} size={112} marginSize={1} />
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">
                  À scanner par le prospect pour ouvrir le formulaire de
                  souscription.
                </p>
                <Button variant="outline" size="sm" onClick={downloadQr}>
                  <Download className="h-4 w-4" />
                  Télécharger
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
