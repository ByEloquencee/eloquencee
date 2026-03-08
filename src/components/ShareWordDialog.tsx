import { motion } from "framer-motion";
import { Share2, Copy, Check, Camera } from "lucide-react";
import { useState, useRef, useCallback } from "react";
import html2canvas from "html2canvas";
import type { PolishWord } from "@/data/words";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { useModerator } from "@/hooks/use-moderator";

interface ShareWordDialogProps {
  word: PolishWord | null;
  open: boolean;
  onClose: () => void;
}

export function ShareWordDialog({ word, open, onClose }: ShareWordDialogProps) {
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const screenshotRef = useRef<HTMLDivElement>(null);
  const { isModerator } = useModerator();

  if (!word) return null;

  const shareText = `✨ ${word.word}\n\n📖 ${word.definition}\n\n💬 '${word.example}'\n\n— Eloquencee`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: word.word, text: shareText });
      } catch {
        // user cancelled
      }
    } else {
      handleCopy();
    }
  };

  const handleScreenshot = async () => {
    if (!screenshotRef.current || generating) return;
    setGenerating(true);
    try {
      const canvas = await html2canvas(screenshotRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: null,
        width: 1080,
        height: 1080,
        windowWidth: 1080,
        windowHeight: 1080,
      });
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `eloquencee-${word.word.toLowerCase().replace(/\s+/g, "-")}.png`;
        a.click();
        URL.revokeObjectURL(url);
      }, "image/png");
    } catch (e) {
      console.error("Screenshot failed:", e);
    } finally {
      setGenerating(false);
    }
  };

  // Split examples for the screenshot card
  const examples = word.example.split("\n").filter(Boolean).slice(0, 2);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md p-0 overflow-hidden rounded-2xl border-border">
        <DialogTitle className="sr-only">Udostępnij słówko</DialogTitle>

        {/* Card preview */}
        <div className="p-8 space-y-6">
          {/* Word */}
          <div className="text-center space-y-1">
            <p className="text-xs font-medium tracking-widest uppercase text-muted-foreground">
              {word.partOfSpeech}
            </p>
            <h2
              className="text-3xl md:text-4xl font-semibold tracking-tight"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {word.word}
            </h2>
            {word.etymology && (
              <p className="text-sm text-muted-foreground italic">{word.etymology}</p>
            )}
          </div>

          {/* Definition */}
          <div className="p-4 rounded-xl bg-secondary/50">
            <p className="text-base leading-relaxed text-foreground">
              {word.definition}
            </p>
          </div>

          {/* Example */}
          <div className="p-4 rounded-xl border border-border">
            <p className="text-xs font-medium tracking-widest uppercase text-muted-foreground mb-2">
              Przykład
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground italic">
              '{word.example}'
            </p>
          </div>

          {/* Branding */}
          <p className="text-center text-xs text-muted-foreground/60 tracking-wide">
            Eloquencee — ucz się nowych słów każdego dnia
          </p>
        </div>

        {/* Actions */}
        <div className="px-8 pb-8 flex flex-col gap-3">
          <div className="flex gap-3">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleCopy}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80 transition-colors cursor-pointer"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? "Skopiowano!" : "Kopiuj tekst"}
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleNativeShare}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer"
            >
              <Share2 size={16} />
              Udostępnij
            </motion.button>
          </div>

          {isModerator && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleScreenshot}
              disabled={generating}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-accent text-accent-foreground text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
            >
              <Camera size={16} className={generating ? "animate-pulse" : ""} />
              {generating ? "Generowanie..." : "Pobierz screenshot (Instagram)"}
            </motion.button>
          )}
        </div>
      </DialogContent>

      {/* Hidden screenshot canvas — always rendered off-screen at 1080x1080 */}
      {isModerator && (
        <div
          style={{
            position: "fixed",
            left: "-9999px",
            top: 0,
            width: 1080,
            height: 1080,
            zIndex: -1,
            pointerEvents: "none",
          }}
        >
          <div
            ref={screenshotRef}
            style={{
              width: 1080,
              height: 1080,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "50px 70px",
              background: "linear-gradient(145deg, hsl(40, 33%, 96%), hsl(35, 25%, 90%))",
              fontFamily: "'DM Sans', system-ui, sans-serif",
              boxSizing: "border-box",
              overflow: "hidden",
            }}
          >
            {/* Decorative top accent */}
            <div
              style={{
                width: 60,
                height: 4,
                borderRadius: 2,
                background: "hsl(32, 80%, 50%)",
                marginBottom: 18,
                flexShrink: 0,
              }}
            />

            {/* Part of speech */}
            <p
              style={{
                fontSize: 23,
                fontWeight: 500,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "hsl(30, 8%, 50%)",
                marginBottom: 10,
                flexShrink: 0,
              }}
            >
              {word.partOfSpeech}
            </p>

            {/* Word */}
            <h1
              style={{
                fontSize: word.word.length > 15 ? 64 : 84,
                fontWeight: 600,
                fontFamily: "'Playfair Display', Georgia, serif",
                color: "hsl(30, 10%, 15%)",
                letterSpacing: "-0.02em",
                marginBottom: 8,
                textAlign: "center",
                lineHeight: 1.1,
                flexShrink: 0,
              }}
            >
              {word.word}
            </h1>

            {/* Etymology */}
            {word.etymology && (
              <p
                style={{
                  fontSize: 23,
                  fontStyle: "italic",
                  color: "hsl(30, 8%, 50%)",
                  marginBottom: 18,
                  textAlign: "center",
                  flexShrink: 0,
                }}
              >
                {word.etymology.length > 80 ? word.etymology.slice(0, 80) + "…" : word.etymology}
              </p>
            )}

            {/* Definition box */}
            <div
              style={{
                width: "100%",
                background: "hsla(35, 25%, 90%, 0.6)",
                borderRadius: 20,
                padding: "22px 30px",
                marginBottom: 16,
                flexShrink: 1,
                minHeight: 0,
                overflow: "hidden",
              }}
            >
              <p
                style={{
                  fontSize: 28,
                  lineHeight: 1.45,
                  color: "hsl(30, 10%, 15%)",
                  textAlign: "center",
                }}
              >
                {word.definition.length > 150
                  ? word.definition.slice(0, 150) + "…"
                  : word.definition}
              </p>
            </div>

            {/* Example box */}
            <div
              style={{
                width: "100%",
                border: "1px solid hsl(35, 20%, 88%)",
                borderRadius: 20,
                padding: "18px 30px",
                marginBottom: 22,
                flexShrink: 1,
                minHeight: 0,
                overflow: "hidden",
              }}
            >
              <p
                style={{
                  fontSize: 19,
                  fontWeight: 500,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  color: "hsl(30, 8%, 50%)",
                  marginBottom: 8,
                  textAlign: "center",
                }}
              >
                Przykład
              </p>
              {examples.map((ex, i) => (
                <p
                  key={i}
                  style={{
                    fontSize: 25,
                    lineHeight: 1.45,
                    fontStyle: "italic",
                    color: "hsl(30, 8%, 50%)",
                    textAlign: "center",
                    marginBottom: i < examples.length - 1 ? 6 : 0,
                  }}
                >
                  {ex.length > 85 ? ex.slice(0, 85) + "…" : ex}
                </p>
              ))}
            </div>

            {/* Branding */}
            <p
              style={{
                fontSize: 21,
                letterSpacing: "0.2em",
                color: "hsl(30, 8%, 50%)",
                opacity: 0.5,
                flexShrink: 0,
              }}
            >
              ELOQUENCEE
            </p>
          </div>
        </div>
      )}
    </Dialog>
  );
}
