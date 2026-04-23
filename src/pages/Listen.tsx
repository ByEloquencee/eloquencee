import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, ChevronLeft, Plus, Loader2, AlertCircle, RotateCcw, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { AuthDialog } from "@/components/AuthDialog";
import { toast } from "sonner";

type Phase = "asking" | "listening" | "processing" | "result" | "error" | "denied";

interface WordCard {
  word: string;
  part_of_speech: string;
  definition: string;
  example: string;
  etymology: string;
  category: string;
}

// Web Speech API types (TS doesn't ship these by default)
type SpeechRecognitionResult = {
  isFinal: boolean;
  0: { transcript: string; confidence: number };
};
type SpeechRecognitionEvent = {
  resultIndex: number;
  results: { length: number; [index: number]: SpeechRecognitionResult };
};
type SpeechRecognitionErrorEvent = { error: string; message?: string };

interface SpeechRecognitionInstance {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

function getSpeechRecognition(): (new () => SpeechRecognitionInstance) | null {
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export default function Listen() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [phase, setPhase] = useState<Phase>("asking");
  const [transcript, setTranscript] = useState("");
  const [card, setCard] = useState<WordCard | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [showAuth, setShowAuth] = useState(false);
  const [saving, setSaving] = useState(false);
  const [typedWord, setTypedWord] = useState("");
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const stoppedRef = useRef(false);
  const silenceTimerRef = useRef<number | null>(null);

  const lookupWord = useCallback(async (rawWord: string) => {
    setPhase("processing");
    try {
      const { data, error } = await supabase.functions.invoke("lookup-word", {
        body: { word: rawWord },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setCard(data as WordCard);
      setPhase("result");
    } catch (e) {
      console.error("lookup error", e);
      setErrorMsg(e instanceof Error ? e.message : "Nie udało się pobrać definicji.");
      setPhase("error");
    }
  }, []);

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current !== null) {
      window.clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  const startListening = useCallback(() => {
    const SR = getSpeechRecognition();
    if (!SR) {
      setErrorMsg("Twoje urządzenie nie obsługuje rozpoznawania mowy.");
      setPhase("error");
      return;
    }

    stoppedRef.current = false;
    setTranscript("");
    setErrorMsg("");
    clearSilenceTimer();

    const rec = new SR();
    rec.lang = "pl-PL";
    rec.interimResults = true;
    rec.continuous = false;
    rec.maxAlternatives = 1;

    let finalText = "";
    let interimText = "";

    const finishWith = (text: string) => {
      const firstWord = text.trim().split(/\s+/)[0]?.replace(/[.,!?;:]+$/g, "") || "";
      if (!firstWord) return false;
      stoppedRef.current = true;
      clearSilenceTimer();
      try { rec.abort(); } catch { /* noop */ }
      void lookupWord(firstWord);
      return true;
    };

    rec.onstart = () => setPhase("listening");

    rec.onresult = (event) => {
      interimText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        if (res.isFinal) {
          finalText += res[0].transcript;
        } else {
          interimText += res[0].transcript;
        }
      }
      const combined = (finalText + interimText).trim();
      setTranscript(combined);

      // Got a final result — fire immediately, don't wait for natural end (~1-3s)
      if (finalText.trim()) {
        finishWith(finalText);
        return;
      }

      // Got interim text — start a short silence timer; if no new speech in 600ms, take what we have
      if (interimText.trim()) {
        clearSilenceTimer();
        silenceTimerRef.current = window.setTimeout(() => {
          if (stoppedRef.current) return;
          finishWith(interimText);
        }, 600);
      }
    };

    rec.onerror = (event) => {
      console.error("Speech error:", event.error);
      stoppedRef.current = true;
      clearSilenceTimer();
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        setPhase("denied");
      } else if (event.error === "no-speech") {
        setErrorMsg("Nie usłyszałem żadnego słowa. Spróbuj ponownie lub wpisz słowo poniżej.");
        setPhase("error");
      } else if (event.error === "aborted") {
        // ignore — handled elsewhere
      } else {
        setErrorMsg("Wystąpił błąd rozpoznawania mowy.");
        setPhase("error");
      }
    };

    rec.onend = () => {
      clearSilenceTimer();
      if (stoppedRef.current) return;
      const text = (finalText || interimText).trim();
      if (!finishWith(text)) {
        setErrorMsg("Nie usłyszałem żadnego słowa. Spróbuj ponownie lub wpisz słowo poniżej.");
        setPhase("error");
      }
    };

    try {
      rec.start();
      recognitionRef.current = rec;
    } catch (e) {
      console.error("Failed to start recognition", e);
      setErrorMsg("Nie udało się uruchomić mikrofonu.");
      setPhase("error");
    }
  }, [lookupWord, clearSilenceTimer]);

  // Auto-start on mount
  useEffect(() => {
    const t = setTimeout(() => startListening(), 250);
    return () => {
      clearTimeout(t);
      stoppedRef.current = true;
      clearSilenceTimer();
      try { recognitionRef.current?.abort(); } catch { /* noop */ }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleBack = useCallback(() => {
    stoppedRef.current = true;
    clearSilenceTimer();
    try { recognitionRef.current?.abort(); } catch { /* noop */ }
    navigate("/");
  }, [navigate, clearSilenceTimer]);

  const handleAddWord = useCallback(async () => {
    if (!card) return;
    if (!user) {
      setShowAuth(true);
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from("custom_words").insert({
        user_id: user.id,
        word: card.word,
        part_of_speech: card.part_of_speech,
        definition: card.definition,
        example: card.example,
        etymology: card.etymology || null,
        category: card.category,
      });
      if (error) throw error;
      toast.success(`Dodano „${card.word}" do Twoich słów`);
      navigate("/");
    } catch (e) {
      console.error(e);
      toast.error("Nie udało się dodać słowa.");
    } finally {
      setSaving(false);
    }
  }, [card, user, navigate]);

  const handleRetry = useCallback(() => {
    setCard(null);
    setTranscript("");
    setErrorMsg("");
    startListening();
  }, [startListening]);

  const handleSubmitTyped = useCallback(() => {
    const word = typedWord.trim().split(/\s+/)[0]?.replace(/[.,!?;:]+$/g, "") || "";
    if (!word) return;
    // stop any active recognition
    stoppedRef.current = true;
    clearSilenceTimer();
    try { recognitionRef.current?.abort(); } catch { /* noop */ }
    setTypedWord("");
    setTranscript(word);
    void lookupWord(word);
  }, [typedWord, lookupWord, clearSilenceTimer]);

  const showTypingBar = phase === "asking" || phase === "listening" || phase === "error";

  return (
    <div className="h-dvh w-full bg-background text-foreground flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0">
        <button
          onClick={handleBack}
          className="p-2 -ml-2 rounded-lg hover:bg-secondary transition-colors cursor-pointer"
          aria-label="Powrót"
        >
          <ChevronLeft size={22} />
        </button>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Słuchaj</p>
        <div className="w-9" />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 overflow-hidden">
        <AnimatePresence mode="wait">
          {(phase === "asking" || phase === "listening") && (
            <motion.div
              key="listening"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col items-center gap-8"
            >
              <div className="relative">
                <motion.div
                  className="absolute inset-0 rounded-full bg-primary/20"
                  animate={{ scale: [1, 1.6, 1], opacity: [0.6, 0, 0.6] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
                />
                <motion.div
                  className="absolute inset-0 rounded-full bg-primary/15"
                  animate={{ scale: [1, 2.2, 1], opacity: [0.4, 0, 0.4] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut", delay: 0.4 }}
                />
                <div className="relative w-32 h-32 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-xl">
                  <Mic size={48} strokeWidth={1.5} />
                </div>
              </div>

              <div className="text-center space-y-2">
                <p className="text-lg" style={{ fontFamily: "var(--font-display)" }}>
                  {phase === "listening" ? "Słucham…" : "Przygotowuję mikrofon"}
                </p>
                <p className="text-xs text-muted-foreground max-w-xs">
                  Wypowiedz pojedyncze słowo, a ja podpowiem jego znaczenie.
                </p>
                {transcript && (
                  <p className="mt-4 text-sm italic text-foreground/80">„{transcript}"</p>
                )}
              </div>
            </motion.div>
          )}

          {phase === "processing" && (
            <motion.div
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-6"
            >
              <Loader2 size={40} className="animate-spin text-primary" />
              <div className="text-center space-y-1">
                <p className="text-base" style={{ fontFamily: "var(--font-display)" }}>
                  Szukam definicji…
                </p>
                {transcript && (
                  <p className="text-sm italic text-muted-foreground">„{transcript}"</p>
                )}
              </div>
            </motion.div>
          )}

          {phase === "result" && card && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-md flex flex-col gap-5"
            >
              <div className="text-center">
                <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
                  {card.part_of_speech} • {card.category}
                </p>
                <h1 className="text-4xl sm:text-5xl leading-tight" style={{ fontFamily: "var(--font-display)" }}>
                  {card.word}
                </h1>
                {card.etymology && (
                  <p className="mt-2 text-xs italic text-muted-foreground">{card.etymology}</p>
                )}
              </div>

              <section className="rounded-xl bg-secondary/40 px-4 py-3">
                <p className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">
                  Definicja
                </p>
                <p className="mt-1 text-[14px] leading-relaxed">{card.definition}</p>
              </section>

              <section className="rounded-xl bg-secondary/40 px-4 py-3">
                <p className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">
                  Przykład
                </p>
                <p className="mt-1 text-[14px] italic leading-relaxed text-muted-foreground">
                  „{card.example}"
                </p>
              </section>
            </motion.div>
          )}

          {phase === "error" && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-5 text-center max-w-xs"
            >
              <AlertCircle size={40} className="text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{errorMsg}</p>
              <button
                onClick={handleRetry}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition cursor-pointer text-sm"
              >
                <RotateCcw size={16} />
                Spróbuj ponownie
              </button>
            </motion.div>
          )}

          {phase === "denied" && (
            <motion.div
              key="denied"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-5 text-center max-w-xs"
            >
              <AlertCircle size={40} className="text-destructive" />
              <p className="text-sm text-muted-foreground">
                Eloquencee nie ma dostępu do mikrofonu. Włącz dostęp w ustawieniach urządzenia
                (Ustawienia → Eloquencee → Mikrofon).
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom area */}
      {phase === "result" && card ? (
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex-shrink-0 px-4 pb-6 pt-3 border-t border-border/40 grid grid-cols-2 gap-3 max-w-md mx-auto w-full"
        >
          <button
            onClick={handleBack}
            className="flex items-center justify-center gap-2 py-3 rounded-xl bg-secondary text-foreground hover:bg-secondary/80 transition cursor-pointer text-sm"
          >
            <ChevronLeft size={18} />
            Powrót
          </button>
          <button
            onClick={handleAddWord}
            disabled={saving}
            className="flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition cursor-pointer text-sm disabled:opacity-60"
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
            Dodaj słowo
          </button>
        </motion.div>
      ) : showTypingBar ? (
        <div className="flex-shrink-0 px-4 pb-6 pt-3 max-w-md mx-auto w-full">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground text-center mb-2">
            lub wpisz słowo
          </p>
          <form
            onSubmit={(e) => { e.preventDefault(); handleSubmitTyped(); }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={typedWord}
              onChange={(e) => setTypedWord(e.target.value)}
              placeholder="np. eskapizm"
              className="flex-1 h-11 px-4 rounded-xl bg-secondary/60 text-foreground placeholder:text-muted-foreground text-sm border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
            />
            <button
              type="submit"
              disabled={!typedWord.trim()}
              className="h-11 w-11 flex items-center justify-center rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition cursor-pointer disabled:opacity-40"
              aria-label="Sprawdź słowo"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      ) : null}

      <AuthDialog open={showAuth} onClose={() => setShowAuth(false)} />
    </div>
  );
}
