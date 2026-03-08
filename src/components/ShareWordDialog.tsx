import { motion } from "framer-motion";
import { Share2, Copy, Check, Camera, Sun, Moon } from "lucide-react";
import { useState, useRef } from "react";
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
    definition: "hsl(30, 10%, 15%)",
    defBg: "hsla(35, 25%, 90%, 0.6)",
    exampleBorder: "hsl(35, 20%, 88%)",
    exampleLabel: "hsl(30, 8%, 50%)",
    exampleText: "hsl(30, 8%, 50%)",
    branding: "hsl(30, 8%, 50%)",
  },
  dark: {
    bg: "linear-gradient(145deg, hsl(30, 10%, 12%), hsl(25, 8%, 8%))",
    accent: "hsl(32, 80%, 50%)",
    partOfSpeech: "hsl(35, 15%, 55%)",
    word: "hsl(40, 30%, 92%)",
    definition: "hsl(40, 25%, 88%)",
    defBg: "hsla(30, 10%, 18%, 0.8)",
    exampleBorder: "hsl(30, 8%, 22%)",
    exampleLabel: "hsl(35, 15%, 55%)",
    exampleText: "hsl(35, 12%, 60%)",
    branding: "hsl(35, 15%, 55%)",
  },
};

export function ShareWordDialog({ word, open, onClose }: ShareWordDialogProps) {
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [screenshotTheme, setScreenshotTheme] = useState<ScreenshotTheme>("light");
  const screenshotRef = useRef<HTMLDivElement>(null);
  const { isModerator } = useModerator();

  if (!word) return null;

  const shareText = `✨ ${word.word}\n\n📖 ${word.definition}\n\n💬 '${word.example}'\n\n— Eloquencee`;
  const isDark = screenshotTheme === "dark";

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
        a.download = `eloquencee-${word.word.toLowerCase().replace(/\s+/g, "-")}${isDark ? "-dark" : ""}.png`;
        a.click();
        URL.revokeObjectURL(url);
      }, "image/png");
    } catch (e) {
      console.error("Screenshot failed:", e);
    } finally {
      setGenerating(false);
    }
  };

  const examples = word.example.split("\n").filter(Boolean).slice(0, 2);
  const t = themes[screenshotTheme];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className={`max-w-md p-0 overflow-hidden rounded-2xl border transition-colors duration-300 ${
          isDark
            ? "bg-[hsl(30,10%,10%)] border-[hsl(30,8%,20%)] text-[hsl(40,30%,92%)]"
            : "bg-card border-border text-foreground"
        }`}
      >
        <DialogTitle className="sr-only">Udostępnij słówko</DialogTitle>

        {/* Card preview */}
        <div className="p-8 space-y-6">
          <div className="text-center space-y-1">
            <p className={`text-xs font-medium tracking-widest uppercase ${isDark ? "text-[hsl(35,15%,55%)]" : "text-muted-foreground"}`}>
              {word.partOfSpeech}
            </p>
            <h2
              className="text-3xl md:text-4xl font-semibold tracking-tight"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {word.word}
            </h2>
            {word.etymology && (
              <p className={`text-sm italic ${isDark ? "text-[hsl(35,12%,55%)]" : "text-muted-foreground"}`}>{word.etymology}</p>
            )}
          </div>

          <div className={`p-4 rounded-xl ${isDark ? "bg-[hsl(30,10%,16%)]" : "bg-secondary/50"}`}>
            <p className="text-base leading-relaxed">
              {word.definition}
            </p>
          </div>

          <div className={`p-4 rounded-xl border ${isDark ? "border-[hsl(30,8%,22%)]" : "border-border"}`}>
            <p className={`text-xs font-medium tracking-widest uppercase mb-2 ${isDark ? "text-[hsl(35,15%,55%)]" : "text-muted-foreground"}`}>
              Przykład
            </p>
            <p className={`text-sm leading-relaxed italic ${isDark ? "text-[hsl(35,12%,60%)]" : "text-muted-foreground"}`}>
              '{word.example}'
            </p>
          </div>

          <p className={`text-center text-xs tracking-wide ${isDark ? "text-[hsl(35,15%,55%)]/50" : "text-muted-foreground/60"}`}>
            Eloquencee — ucz się nowych słów każdego dnia
          </p>
        </div>

        {/* Actions */}
        <div className="px-8 pb-8 flex flex-col gap-3">
          <div className="flex gap-3">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleCopy}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                isDark
                  ? "bg-[hsl(30,10%,18%)] text-[hsl(40,25%,88%)] hover:bg-[hsl(30,10%,22%)]"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
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
                    !isDark
                      ? "bg-secondary text-secondary-foreground ring-2 ring-primary"
                      : "bg-[hsl(30,10%,18%)] text-[hsl(35,15%,55%)]"
                  }`}
                >
                  <Sun size={14} />
                  Jasny
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setScreenshotTheme("dark")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                    isDark
                      ? "bg-[hsl(30,10%,22%)] text-[hsl(40,25%,88%)] ring-2 ring-primary"
                      : "bg-secondary/50 text-muted-foreground"
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
      </DialogContent>

      {/* Hidden screenshot canvas */}
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
              padding: "40px 70px",
              background: t.bg,
              fontFamily: "'DM Sans', system-ui, sans-serif",
              boxSizing: "border-box",
              overflow: "hidden",
              position: "relative",
            }}
          >
            {/* Watermark book icon — top right */}
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke={isDark ? "hsl(35, 15%, 25%)" : "hsl(35, 20%, 82%)"}
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                position: "absolute",
                top: 38,
                right: 42,
                width: 44,
                height: 44,
                opacity: 0.7,
              }}
            >
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
            </svg>

            {/* Decorative top accent */}
            <div
              style={{
                width: 60,
                height: 4,
                borderRadius: 2,
                background: t.accent,
                marginBottom: 14,
                flexShrink: 0,
              }}
            />

            {/* Part of speech */}
            <p
              style={{
                fontSize: 22,
                fontWeight: 500,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: t.partOfSpeech,
                marginBottom: 6,
                flexShrink: 0,
              }}
            >
              {word.partOfSpeech}
            </p>

            {/* Word */}
            <h1
              style={{
                fontSize: word.word.length > 15 ? 58 : word.word.length > 10 ? 70 : 80,
                fontWeight: 600,
                fontFamily: "'Playfair Display', Georgia, serif",
                color: t.word,
                letterSpacing: "-0.02em",
                marginBottom: 36,
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
                  fontSize: 20,
                  fontStyle: "italic",
                  color: t.exampleText,
                  marginBottom: 16,
                  textAlign: "center",
                  flexShrink: 0,
                }}
              >
                {word.etymology}
              </p>
            )}

            {/* Definition box */}
            <div
              style={{
                width: "100%",
                background: t.defBg,
                borderRadius: 24,
                padding: "30px 40px",
                marginBottom: 18,
                flexShrink: 0,
              }}
            >
              <p
                style={{
                  fontSize: 27,
                  lineHeight: 1.45,
                  color: t.definition,
                  textAlign: "center",
                  fontWeight: 400,
                }}
              >
                {word.definition}
              </p>
            </div>

            {/* Example box */}
            <div
              style={{
                width: "100%",
                border: `1px solid ${t.exampleBorder}`,
                borderRadius: 24,
                padding: "26px 40px 32px",
                marginBottom: 0,
                flexShrink: 1,
                minHeight: 0,
              }}
            >
              <p
                style={{
                  fontSize: 18,
                  fontWeight: 500,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  color: t.exampleLabel,
                  marginBottom: 12,
                  textAlign: "center",
                }}
              >
                Przykład
              </p>
              {examples.map((ex, i) => (
                <p
                  key={i}
                  style={{
                    fontSize: 24,
                    lineHeight: 1.4,
                    fontStyle: "italic",
                    color: t.exampleText,
                    textAlign: "center",
                    marginBottom: i < examples.length - 1 ? 6 : 0,
                  }}
                >
                  {ex}
                </p>
              ))}
            </div>

            {/* Branding */}
            <div style={{ flex: "1 1 20px", minHeight: 14, maxHeight: 40 }} />

            <p
              style={{
                fontSize: 20,
                letterSpacing: "0.2em",
                color: t.branding,
                opacity: 0.45,
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
