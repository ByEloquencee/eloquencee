import { motion } from "framer-motion";
import { Share2, Copy, Check, Camera, Sun, Moon } from "lucide-react";
import { useState, useRef, useEffect } from "react";
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

type ScreenshotTheme = "light" | "dark";

const themes = {
  light: {
    bg: "linear-gradient(145deg, hsl(40, 33%, 96%), hsl(35, 25%, 90%))",
    accent: "hsl(32, 80%, 50%)",
    partOfSpeech: "hsl(30, 8%, 50%)",
    word: "hsl(30, 10%, 15%)",
    definition: "hsl(30, 10%, 10%)",
    defBg: "hsla(32, 15%, 80%, 0.85)",
    exampleBorder: "hsl(32, 15%, 75%)",
    exampleLabel: "hsl(30, 8%, 45%)",
    exampleText: "hsl(30, 8%, 30%)",
    branding: "hsl(30, 8%, 50%)",
  },
  dark: {
    bg: "linear-gradient(145deg, hsl(30, 10%, 12%), hsl(25, 8%, 8%))",
    accent: "hsl(32, 80%, 50%)",
    partOfSpeech: "hsl(35, 15%, 55%)",
    word: "hsl(40, 30%, 92%)",
    definition: "hsl(40, 25%, 92%)",
    defBg: "hsla(30, 10%, 22%, 0.9)",
    exampleBorder: "hsl(30, 8%, 28%)",
    exampleLabel: "hsl(35, 15%, 60%)",
    exampleText: "hsl(35, 12%, 75%)",
    branding: "hsl(35, 15%, 55%)",
  },
};

export function ShareWordDialog({ word, open, onClose }: ShareWordDialogProps) {
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [screenshotTheme, setScreenshotTheme] = useState<ScreenshotTheme>("light");
  const previewRef = useRef<HTMLDivElement>(null);
  const captureRef = useRef<HTMLDivElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const { isModerator } = useModerator();

  if (!word) return null;

  const shareText = `✨ ${word.word}\n\n📖 ${word.definition}\n\n💬 '${word.example}'\n\n— Eloquencee`;
  const isDark = screenshotTheme === "dark";

  useEffect(() => {
    if (!isModerator || !open) return;

    const container = previewContainerRef.current;
    const preview = previewRef.current;
    if (!container || !preview) return;

    const updateScale = () => {
      const parentWidth = container.clientWidth || 1080;
      preview.style.setProperty("--preview-scale", String(parentWidth / 1080));
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(container);

    return () => observer.disconnect();
  }, [isModerator, open]);

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
    if (!captureRef.current || generating) return;
    setGenerating(true);
    try {
      const el = captureRef.current;
      // Temporarily reset scale so html2canvas captures at true 1080×1080
      const prevTransform = el.style.transform;
      el.style.transform = "none";

      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        backgroundColor: null,
        width: 1080,
        height: 1080,
        windowWidth: 1080,
        windowHeight: 1080,
        x: 0,
        y: 0,
        scrollX: 0,
        scrollY: 0,
      });

      // Restore preview scale
      el.style.transform = prevTransform;

      // Wrap toBlob in a Promise so we stay in the async chain —
      // iOS Safari requires navigator.share() to be called within
      // the same user-gesture context (broken by callbacks).
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/png")
      );
      if (!blob) return;

      const fileName = `eloquencee-${word.word.toLowerCase().replace(/\s+/g, "-")}${isDark ? "-dark" : ""}.png`;
      const file = new File([blob], fileName, { type: "image/png" });

      // Try Web Share API — on iOS this opens the native share sheet
      // with "Save Image" option (stays in gesture context via await)
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: word.word });
          return;
        } catch {
          // user cancelled or share failed — fall through to download
        }
      }

      // Fallback: download as file (desktop)
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Screenshot failed:", e);
    } finally {
      setGenerating(false);
    }
  };

  const examples = word.example.split("\n").filter(Boolean);
  const t = themes[screenshotTheme];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="max-w-md p-0 overflow-hidden rounded-2xl border transition-colors duration-300 bg-card border-border text-foreground"
      >
        <DialogTitle className="sr-only">Udostępnij słówko</DialogTitle>

        <div className="max-h-[85vh] overflow-y-auto">
          {/* Screenshot preview at top (moderator only) — scaled-down view of actual canvas */}
          {isModerator && (
            <div className="px-6 pt-6">
              <div
                className="w-full rounded-xl border transition-colors duration-300"
                style={{
                  borderColor: isDark ? "hsl(30,8%,22%)" : "hsl(32,18%,82%)",
                  aspectRatio: "1/1",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: 1080,
                    height: 1080,
                    transform: "scale(var(--preview-scale))",
                    transformOrigin: "top left",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "30px 70px 40px",
                    background: t.bg,
                    fontFamily: "'DM Sans', system-ui, sans-serif",
                    boxSizing: "border-box",
                    overflow: "hidden",
                    position: "absolute",
                    top: 0,
                    left: 0,
                    // --preview-scale is set via CSS calc based on container width
                  } as React.CSSProperties}
                  ref={previewRef}
                >
                  {/* Watermark favicon — top right */}
                  <img
                    src="/favicon.ico"
                    alt=""
                    style={{
                      position: "absolute",
                      top: 36,
                      right: 40,
                      width: 48,
                      height: 48,
                      opacity: isDark ? 0.4 : 0.5,
                    }}
                  />
                  <div style={{ width: 60, height: 4, borderRadius: 2, background: t.accent, marginBottom: 14, flexShrink: 0 }} />
                  <p style={{ fontSize: 22, fontWeight: 500, letterSpacing: "0.2em", textTransform: "uppercase", color: t.partOfSpeech, marginBottom: 6, flexShrink: 0 }}>
                    {word.partOfSpeech}
                  </p>
                  <h3 style={{ fontSize: word.word.length > 15 ? 58 : word.word.length > 10 ? 70 : 80, fontWeight: 600, fontFamily: "'Playfair Display', Georgia, serif", color: t.word, letterSpacing: "-0.02em", marginBottom: 40, textAlign: "center", lineHeight: 1.1, flexShrink: 0 }}>
                    {word.word}
                  </h3>
                  {word.etymology && (
                    <p style={{ fontSize: 20, fontStyle: "italic", color: t.exampleText, marginBottom: 16, textAlign: "center", flexShrink: 0 }}>
                      {word.etymology}
                    </p>
                  )}
                  <div style={{ width: "100%", background: t.defBg, borderRadius: 24, padding: "20px 40px 24px", marginBottom: 18, flexShrink: 0 }}>
                    <p style={{ fontSize: 32, lineHeight: 1.45, color: t.definition, textAlign: "center", fontWeight: 500 }}>
                      {word.definition}
                    </p>
                  </div>
                  <div style={{ width: "100%", border: `1px solid ${t.exampleBorder}`, borderRadius: 24, padding: "18px 40px 28px", marginBottom: 0, flexShrink: 1, minHeight: 0 }}>
                    <p style={{ fontSize: 18, fontWeight: 500, letterSpacing: "0.15em", textTransform: "uppercase", color: t.exampleLabel, marginBottom: 12, textAlign: "center" }}>
                      Przykład
                    </p>
                    {examples.slice(0, 2).map((ex, i) => (
                      <p key={i} style={{ fontSize: 28, lineHeight: 1.45, fontStyle: "italic", color: t.exampleText, textAlign: "center", marginBottom: i < examples.length - 1 ? 8 : 0 }}>
                        {ex}
                      </p>
                    ))}
                  </div>
                  <div style={{ flex: "1 1 20px", minHeight: 14, maxHeight: 40 }} />
                  <p style={{ fontSize: 20, letterSpacing: "0.2em", color: t.branding, opacity: 0.45, flexShrink: 0 }}>
                    ELOQUENCEE
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Non-moderator card preview */}
          {!isModerator && (
            <div className="p-8 space-y-6">
              <div className="text-center space-y-1">
                <p className="text-xs font-medium tracking-widest uppercase text-muted-foreground">{word.partOfSpeech}</p>
                <h2 className="text-3xl md:text-4xl font-semibold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>{word.word}</h2>
                {word.etymology && <p className="text-sm italic text-muted-foreground">{word.etymology}</p>}
              </div>
              <div className="p-4 rounded-xl bg-secondary/50">
                <p className="text-base leading-relaxed">{word.definition}</p>
              </div>
              <div className="p-4 rounded-xl border border-border">
                <p className="text-xs font-medium tracking-widest uppercase mb-2 text-muted-foreground">Przykład</p>
                <p className="text-sm leading-relaxed italic text-muted-foreground">'{word.example}'</p>
              </div>
              <p className="text-center text-xs tracking-wide text-muted-foreground/60">Eloquencee — ucz się nowych słów każdego dnia</p>
            </div>
          )}

          {/* Actions */}
          <div className="px-6 pb-6 pt-4 flex flex-col gap-3">
            <div className="flex gap-3">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleCopy}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-colors cursor-pointer bg-secondary text-secondary-foreground hover:bg-secondary/80"
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
              <>
                <div className="flex gap-2">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setScreenshotTheme("light")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                      !isDark ? "bg-secondary text-secondary-foreground ring-2 ring-primary" : "bg-secondary/50 text-muted-foreground"
                    }`}
                  >
                    <Sun size={14} />
                    Jasny
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setScreenshotTheme("dark")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                      isDark ? "bg-secondary text-secondary-foreground ring-2 ring-primary" : "bg-secondary/50 text-muted-foreground"
                    }`}
                  >
                    <Moon size={14} />
                    Ciemny
                  </motion.button>
                </div>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleScreenshot}
                  disabled={generating}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-accent text-accent-foreground text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
                >
                  <Camera size={16} className={generating ? "animate-pulse" : ""} />
                  {generating ? "Generowanie..." : "Pobierz screenshot (Instagram)"}
                </motion.button>
              </>
            )}
          </div>
        </div>
      </DialogContent>

    </Dialog>
  );
}
