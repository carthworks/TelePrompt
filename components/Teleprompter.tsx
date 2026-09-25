"use client";

import { useState, useEffect, useRef, useMemo, ChangeEvent } from "react";
import {
    Play,
    Pause,
    RotateCcw,
    Settings,
    Maximize,
    Minimize,
    ChevronUp,
    ChevronDown,
    Monitor,
    Palette,
    Bookmark,
    ArrowRight,
    Home,
    Upload,
    Save,
    Volume2,
    VolumeX,
    Megaphone,
    Headphones,
    Sparkles,
    X,
} from "lucide-react";

interface TeleprompterProps {
    content: string;
    title?: string;
    defaultSpeed?: number;
    defaultFontSize?: number;
    onHome?: () => void;
    onUpload?: (e: ChangeEvent<HTMLInputElement>) => void;
    onSave?: () => void;
}

type Theme = "dark" | "light" | "sepia" | "blue";

const themes = {
    dark: { bg: "bg-gray-950", text: "text-white", line: "bg-green-500" },
    light: { bg: "bg-gray-100", text: "text-gray-900", line: "bg-blue-500" },
    sepia: { bg: "bg-[#f4ecd8]", text: "text-[#5c4b37]", line: "bg-orange-500" },
    blue: { bg: "bg-blue-950", text: "text-blue-50", line: "bg-cyan-400" },
};

// Types for script sentences & speech coach guidance
interface ScriptSentence {
    id: number;
    text: string;
    paragraphIndex: number;
    isSection: boolean;
    sectionTitle?: string;
    tip: string;
}

interface ScriptParagraph {
    id: number;
    sentences: ScriptSentence[];
    rawText: string;
}

type AudioPreset = "loud_stage" | "natural_studio" | "energetic" | "steady_practice";

function parseScriptContent(rawText: string): { paragraphs: ScriptParagraph[]; allSentences: ScriptSentence[] } {
    if (!rawText || !rawText.trim()) {
        return { paragraphs: [], allSentences: [] };
    }

    const rawParagraphs = rawText.split(/\n+/);
    let globalId = 0;
    const paragraphs: ScriptParagraph[] = [];
    const allSentences: ScriptSentence[] = [];

    rawParagraphs.forEach((para, pIdx) => {
        const trimmed = para.trim();
        if (!trimmed) return;

        // Check if section marker like [Intro] or # Intro
        if (/^\[[^\]]+\]$/.test(trimmed) || /^#+\s+.+$/.test(trimmed)) {
            const sectionTitle = trimmed.replace(/^[#\s\[]+|[\]]+$/g, "");
            const sentObj: ScriptSentence = {
                id: globalId++,
                text: trimmed,
                paragraphIndex: pIdx,
                isSection: true,
                sectionTitle,
                tip: "🎯 Section Transition: Breathe and set the stage",
            };
            paragraphs.push({
                id: pIdx,
                sentences: [sentObj],
                rawText: trimmed,
            });
            allSentences.push(sentObj);
            return;
        }

        // Split sentences on terminal punctuation (. ! ?) followed by space
        const sentenceTexts = trimmed
            .replace(/([.!?])\s+(?=[A-Z0-9"“'\[])/g, "$1|===|")
            .split("|===|")
            .map((s) => s.trim())
            .filter(Boolean);

        const paraSentences: ScriptSentence[] = [];

        (sentenceTexts.length > 0 ? sentenceTexts : [trimmed]).forEach((st) => {
            const sTrim = st.trim();
            if (!sTrim) return;

            let tip = "🗣️ Speak with confident, forward projection";
            if (sTrim.endsWith("?")) {
                tip = "↗️ Rising inflection: Engage listener with curiosity";
            } else if (sTrim.endsWith("!")) {
                tip = "⚡ High energy: Project with passion & emphasis";
            } else if (sTrim.includes(",") || sTrim.includes(";")) {
                tip = "⏸️ Micro-pause: Breathe at punctuation for rhythm";
            } else if (sTrim.length > 110) {
                tip = "🌊 Steady cadence: Don't rush; articulate each word";
            }

            const sentObj: ScriptSentence = {
                id: globalId++,
                text: sTrim,
                paragraphIndex: pIdx,
                isSection: false,
                tip,
            };
            paraSentences.push(sentObj);
            allSentences.push(sentObj);
        });

        if (paraSentences.length > 0) {
            paragraphs.push({
                id: pIdx,
                sentences: paraSentences,
                rawText: trimmed,
            });
        }
    });

    return { paragraphs, allSentences };
}

export default function Teleprompter({
    content,
    title = "Teleprompter",
    defaultSpeed = 30,
    defaultFontSize = 24,
    onHome,
    onUpload,
    onSave,
}: TeleprompterProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [speed, setSpeed] = useState(defaultSpeed);
    const [fontSize, setFontSize] = useState(defaultFontSize);
    const [position, setPosition] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [isMirrored, setIsMirrored] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [countdown, setCountdown] = useState<number | null>(null);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [theme, setTheme] = useState<Theme>("dark");
    const [wordsRead, setWordsRead] = useState(0);
    const [currentSection, setCurrentSection] = useState("");
    const [showSectionPause, setShowSectionPause] = useState(false);
    const [showCompletion, setShowCompletion] = useState(false);

    // Audio Speaker & Best Loud Audio Mode State
    const [audioSpeakerEnabled, setAudioSpeakerEnabled] = useState(false);
    const [loudAudioMode, setLoudAudioMode] = useState(true);
    const [showAudioSettings, setShowAudioSettings] = useState(false);
    const [audioSettingsTab, setAudioSettingsTab] = useState<"voice" | "coach">("voice");
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
    const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>("");
    const [speechVolume, setSpeechVolume] = useState<number>(1.0);
    const [speechRate, setSpeechRate] = useState<number>(1.0);
    const [speechPitch, setSpeechPitch] = useState<number>(1.08);
    const [autoScrollWithAudio, setAutoScrollWithAudio] = useState(true);
    const [showVoiceTips, setShowVoiceTips] = useState(true);
    const [currentSentenceIndex, setCurrentSentenceIndex] = useState<number>(0);
    const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
    const [audioTestPlaying, setAudioTestPlaying] = useState<boolean>(false);

    const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
    const speechTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const containerRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const wakeLockRef = useRef<any>(null);

    // Parse script into structured sentences
    const scriptData = useMemo(() => parseScriptContent(content), [content]);

    // Calculate metrics
    const totalWords = content.split(/\s+/).filter((w) => w.length > 0).length;
    const wpm = elapsedTime > 0 ? Math.round((wordsRead / elapsedTime) * 60) : 0;
    const estimatedTotalTime = speed > 0 ? Math.round((totalWords / 120) * 60) : 0; // Assuming 120 WPM average
    const progress = contentRef.current
        ? Math.min(100, (position / (contentRef.current.scrollHeight - window.innerHeight)) * 100)
        : 0;

    // Helper: Select best loud & clear voice
    const selectBestLoudVoice = (voiceList: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null => {
        if (!voiceList || voiceList.length === 0) return null;

        const priorityNames = [
            "Microsoft Natural", "Microsoft Jenny", "Microsoft Guy", "Microsoft Aria",
            "Google US English", "Google UK English", "Samantha", "Daniel",
            "Alex", "Karen", "Victoria", "David", "Zira"
        ];

        for (const name of priorityNames) {
            const match = voiceList.find((v) => v.name.toLowerCase().includes(name.toLowerCase()));
            if (match) return match;
        }

        const enVoice = voiceList.find((v) => v.lang.startsWith("en"));
        if (enVoice) return enVoice;

        return voiceList.find((v) => v.default) || voiceList[0];
    };

    // Helper: Web Audio stage acoustic chime
    const playAudioChime = (loud: boolean = true) => {
        try {
            if (typeof window === "undefined") return;
            const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioCtx) return;
            const ctx = new AudioCtx();
            const now = ctx.currentTime;

            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = "sine";
            // Two-tone chime: D5 (587.33Hz) up to A5 (880Hz)
            osc.frequency.setValueAtTime(587.33, now);
            osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);

            const volume = loud ? 0.35 : 0.15;
            gain.gain.setValueAtTime(0.001, now);
            gain.gain.linearRampToValueAtTime(volume, now + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(now);
            osc.stop(now + 0.5);
        } catch (e) {
            console.warn("Audio chime error:", e);
        }
    };

    // Helper: Scroll to specific sentence
    const scrollToSentence = (sentenceId: number) => {
        const el = document.getElementById(`sentence-${sentenceId}`);
        if (el && contentRef.current) {
            const firstEl = document.getElementById("sentence-0");
            const baseOffset = firstEl ? firstEl.offsetTop : 0;
            const targetOffset = el.offsetTop - baseOffset;
            setPosition(Math.max(0, targetOffset));
        }
    };

    // Helper: Test Audio Speaker
    const testAudioSpeaker = () => {
        if (typeof window === "undefined" || !("speechSynthesis" in window)) {
            alert("Speech synthesis is not supported on this browser.");
            return;
        }
        setAudioTestPlaying(true);
        playAudioChime(loudAudioMode);

        setTimeout(() => {
            window.speechSynthesis.cancel();
            const testText = loudAudioMode
                ? "Testing Best Loud Audio Mode! This is maximum volume projection. Your speech will be clear and powerful."
                : "Testing Audio Speaker. This is how your voice guide will sound.";
            const utterance = new SpeechSynthesisUtterance(testText);
            const currentVoice = voices.find((v) => v.voiceURI === selectedVoiceURI);
            if (currentVoice) utterance.voice = currentVoice;
            utterance.volume = loudAudioMode ? 1.0 : speechVolume;
            utterance.pitch = speechPitch;
            utterance.rate = speechRate;
            utterance.onend = () => setAudioTestPlaying(false);
            utterance.onerror = () => setAudioTestPlaying(false);
            window.speechSynthesis.speak(utterance);
        }, 350);
    };

    // Helper: Apply Preset
    const applyAudioPreset = (preset: AudioPreset) => {
        if (preset === "loud_stage") {
            setLoudAudioMode(true);
            setSpeechVolume(1.0);
            setSpeechPitch(1.08);
            setSpeechRate(0.95);
            playAudioChime(true);
        } else if (preset === "natural_studio") {
            setLoudAudioMode(false);
            setSpeechVolume(0.95);
            setSpeechPitch(1.0);
            setSpeechRate(1.0);
        } else if (preset === "energetic") {
            setLoudAudioMode(true);
            setSpeechVolume(1.0);
            setSpeechPitch(1.05);
            setSpeechRate(1.15);
        } else if (preset === "steady_practice") {
            setLoudAudioMode(false);
            setSpeechVolume(0.9);
            setSpeechPitch(0.95);
            setSpeechRate(0.85);
        }
    };

    // Load saved settings from localStorage on mount
    useEffect(() => {
        const savedTheme = localStorage.getItem("teleprompter_theme") as Theme;
        if (savedTheme && themes[savedTheme]) {
            setTheme(savedTheme);
        }

        const savedSpeaker = localStorage.getItem("teleprompter_audio_speaker");
        if (savedSpeaker !== null) {
            setAudioSpeakerEnabled(savedSpeaker === "true");
        }

        const savedLoud = localStorage.getItem("teleprompter_loud_mode");
        if (savedLoud !== null) {
            setLoudAudioMode(savedLoud === "true");
        }

        const savedVoice = localStorage.getItem("teleprompter_voice_uri");
        if (savedVoice) {
            setSelectedVoiceURI(savedVoice);
        }

        const savedRate = localStorage.getItem("teleprompter_speech_rate");
        if (savedRate) {
            setSpeechRate(parseFloat(savedRate));
        }
    }, []);

    // Load voices
    useEffect(() => {
        if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

        const updateVoices = () => {
            const availableVoices = window.speechSynthesis.getVoices();
            if (availableVoices && availableVoices.length > 0) {
                setVoices(availableVoices);
                setSelectedVoiceURI((prev) => {
                    if (prev && availableVoices.some((v) => v.voiceURI === prev)) {
                        return prev;
                    }
                    const best = selectBestLoudVoice(availableVoices);
                    return best ? best.voiceURI : availableVoices[0].voiceURI;
                });
            }
        };

        updateVoices();
        window.speechSynthesis.onvoiceschanged = updateVoices;

        return () => {
            if (typeof window !== "undefined" && "speechSynthesis" in window) {
                window.speechSynthesis.onvoiceschanged = null;
            }
        };
    }, []);

    // Save position to localStorage
    useEffect(() => {
        if (position > 0) {
            localStorage.setItem("teleprompter_position", position.toString());
        }
    }, [position]);

    // Save theme to localStorage
    useEffect(() => {
        localStorage.setItem("teleprompter_theme", theme);
    }, [theme]);

    // Auto-scroll logic (pauses continuous scroll when audio speaker auto-scroll is driving)
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isPlaying && (!audioSpeakerEnabled || !autoScrollWithAudio)) {
            interval = setInterval(() => {
                setPosition((prev) => prev + 1);
            }, 1000 / speed);
        }
        return () => clearInterval(interval);
    }, [isPlaying, speed, audioSpeakerEnabled, autoScrollWithAudio]);

    // Speech Synthesis Effect: Speaks sentences sequentially when playing
    useEffect(() => {
        if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

        if (!isPlaying || !audioSpeakerEnabled) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
            if (speechTimeoutRef.current) {
                clearTimeout(speechTimeoutRef.current);
                speechTimeoutRef.current = null;
            }
            return;
        }

        const allSentences = scriptData.allSentences;
        if (allSentences.length === 0) return;

        if (currentSentenceIndex >= allSentences.length) {
            setIsPlaying(false);
            setShowCompletion(true);
            return;
        }

        const currentSentence = allSentences[currentSentenceIndex];
        if (!currentSentence) return;

        // Auto-scroll to sentence
        if (autoScrollWithAudio) {
            scrollToSentence(currentSentence.id);
        }

        // Section handling:
        if (currentSentence.isSection) {
            setCurrentSection(currentSentence.text);
            if (currentSentenceIndex > 0) {
                setIsPlaying(false);
                setShowSectionPause(true);
                return;
            }
        }

        let cleanText = currentSentence.text.replace(/\[([^\]]+)\]/g, "").trim();
        if (!cleanText) {
            speechTimeoutRef.current = setTimeout(() => {
                setCurrentSentenceIndex((prev) => prev + 1);
            }, 500);
            return;
        }

        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(cleanText);
        activeUtteranceRef.current = utterance;

        const currentVoice = voices.find((v) => v.voiceURI === selectedVoiceURI);
        if (currentVoice) {
            utterance.voice = currentVoice;
        }

        if (loudAudioMode) {
            utterance.volume = 1.0;
            utterance.pitch = speechPitch;
            utterance.rate = speechRate;
        } else {
            utterance.volume = speechVolume;
            utterance.pitch = speechPitch;
            utterance.rate = speechRate;
        }

        utterance.onstart = () => {
            setIsSpeaking(true);
        };

        utterance.onend = () => {
            activeUtteranceRef.current = null;
            setIsSpeaking(false);
            speechTimeoutRef.current = setTimeout(() => {
                setCurrentSentenceIndex((prev) => prev + 1);
            }, 180);
        };

        utterance.onerror = (e) => {
            activeUtteranceRef.current = null;
            setIsSpeaking(false);
            if (e.error !== "interrupted" && e.error !== "canceled") {
                speechTimeoutRef.current = setTimeout(() => {
                    setCurrentSentenceIndex((prev) => prev + 1);
                }, 200);
            }
        };

        window.speechSynthesis.speak(utterance);

        return () => {
            if (speechTimeoutRef.current) {
                clearTimeout(speechTimeoutRef.current);
            }
        };
    }, [
        isPlaying,
        audioSpeakerEnabled,
        currentSentenceIndex,
        selectedVoiceURI,
        loudAudioMode,
        speechPitch,
        speechRate,
        speechVolume,
        autoScrollWithAudio,
        scriptData,
    ]);

    // Elapsed time tracker
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isPlaying) {
            interval = setInterval(() => {
                setElapsedTime((prev) => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isPlaying]);

    // Words read tracker (estimate based on position or speech)
    useEffect(() => {
        if (contentRef.current) {
            const scrollPercentage = position / contentRef.current.scrollHeight;
            if (audioSpeakerEnabled && scriptData.allSentences.length > 0) {
                const wordsSpoken = scriptData.allSentences
                    .slice(0, currentSentenceIndex + 1)
                    .reduce((acc, s) => acc + s.text.split(/\s+/).filter(Boolean).length, 0);
                setWordsRead(Math.min(totalWords, wordsSpoken));
            } else {
                setWordsRead(Math.round(totalWords * scrollPercentage));
            }

            // Check for completion (reached end)
            if (scrollPercentage >= 0.98 && isPlaying && !audioSpeakerEnabled) {
                setIsPlaying(false);
                setShowCompletion(true);
            }
        }
    }, [position, totalWords, isPlaying, audioSpeakerEnabled, currentSentenceIndex, scriptData]);

    // Section detection and auto-pause
    useEffect(() => {
        const sections = content.match(/\[([^\]]+)\]/g);
        if (sections && contentRef.current) {
            const currentScrollPercentage = position / contentRef.current.scrollHeight;
            const sectionIndex = Math.floor(currentScrollPercentage * sections.length);
            const section = sections[sectionIndex];

            if (section && section !== currentSection) {
                setCurrentSection(section);
                if (isPlaying && sectionIndex > 0) {
                    setIsPlaying(false);
                    setShowSectionPause(true);
                }
            }
        }
    }, [position, content, currentSection, isPlaying]);

    // Countdown timer
    useEffect(() => {
        if (countdown !== null && countdown > 0) {
            const timer = setTimeout(() => {
                setCountdown(countdown - 1);
            }, 1000);
            return () => clearTimeout(timer);
        } else if (countdown === 0) {
            setCountdown(null);
            setIsPlaying(true);
        }
    }, [countdown]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            if (e.code === "Space") {
                e.preventDefault();
                setIsPlaying((prev) => !prev);
                setShowSectionPause(false);
            } else if (e.code === "ArrowUp") {
                e.preventDefault();
                setSpeed((prev) => Math.min(prev + 5, 100));
            } else if (e.code === "ArrowDown") {
                e.preventDefault();
                setSpeed((prev) => Math.max(prev - 5, 5));
            } else if (e.code === "KeyR") {
                e.preventDefault();
                resetPosition();
            } else if (e.code === "KeyF") {
                e.preventDefault();
                toggleFullscreen();
            } else if (e.code === "KeyM") {
                e.preventDefault();
                setIsMirrored((prev) => !prev);
            } else if (e.code === "KeyC") {
                e.preventDefault();
                setShowControls((prev) => !prev);
            } else if (e.code === "KeyS") {
                e.preventDefault();
                savePosition();
            } else if (e.code === "KeyA") {
                e.preventDefault();
                setAudioSpeakerEnabled((prev) => {
                    const next = !prev;
                    localStorage.setItem("teleprompter_audio_speaker", String(next));
                    if (next && loudAudioMode) playAudioChime(true);
                    return next;
                });
            } else if (e.code === "KeyL") {
                e.preventDefault();
                setLoudAudioMode((prev) => {
                    const next = !prev;
                    localStorage.setItem("teleprompter_loud_mode", String(next));
                    if (next) playAudioChime(true);
                    return next;
                });
            }
        };

        window.addEventListener("keydown", handleKeyPress);
        return () => window.removeEventListener("keydown", handleKeyPress);
    }, [loudAudioMode]);

    // Wake Lock API
    useEffect(() => {
        const requestWakeLock = async () => {
            if ("wakeLock" in navigator) {
                try {
                    wakeLockRef.current = await (navigator as any).wakeLock.request("screen");
                } catch (err) {
                    console.log("Wake Lock error:", err);
                }
            }
        };

        requestWakeLock();

        return () => {
            if (wakeLockRef.current) {
                wakeLockRef.current.release();
            }
        };
    }, []);

    const resetPosition = () => {
        setPosition(0);
        setIsPlaying(false);
        setElapsedTime(0);
        setWordsRead(0);
        setCurrentSection("");
        setShowSectionPause(false);
        setShowCompletion(false);
        setCurrentSentenceIndex(0);
        setIsSpeaking(false);
        if (typeof window !== "undefined" && "speechSynthesis" in window) {
            window.speechSynthesis.cancel();
        }
        localStorage.removeItem("teleprompter_position");
    };

    const savePosition = () => {
        localStorage.setItem("teleprompter_position", position.toString());
        // Show brief confirmation
        const notification = document.createElement("div");
        notification.className = "fixed top-24 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50";
        notification.textContent = "Position saved!";
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 2000);
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    const startCountdown = (seconds: number) => {
        setCountdown(seconds);
        setIsPlaying(false);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    const adjustSpeed = (delta: number) => {
        setSpeed((prev) => Math.max(5, Math.min(100, prev + delta)));
    };

    const adjustFontSize = (delta: number) => {
        setFontSize((prev) => Math.max(12, Math.min(72, prev + delta)));
    };

    const continueToNextSection = () => {
        setShowSectionPause(false);
        setIsPlaying(true);
    };

    const currentTheme = themes[theme];

    return (
        <div
            ref={containerRef}
            className={`min-h-screen ${currentTheme.bg} ${currentTheme.text} relative transition-colors duration-300`}
            style={{ transform: isMirrored ? "scaleX(-1)" : "none" }}
        >
            {/* Countdown Overlay */}
            {countdown !== null && (
                <div className="fixed inset-0 bg-gray-950 bg-opacity-95 flex items-center justify-center z-[100]">
                    <div className="text-center">
                        <div className="text-9xl font-bold text-blue-400 mb-4 animate-pulse">
                            {countdown}
                        </div>
                        <div className="text-2xl text-gray-400">Get ready...</div>
                    </div>
                </div>
            )}

            {/* Section Pause Overlay */}
            {showSectionPause && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[90]">
                    <div className="bg-gray-900 border-2 border-blue-500 rounded-2xl p-8 max-w-md text-center">
                        <h3 className="text-2xl font-bold text-white mb-4">Section Complete</h3>
                        <p className="text-gray-300 mb-6">{currentSection}</p>
                        <button
                            onClick={continueToNextSection}
                            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-lg font-semibold hover:shadow-2xl hover:scale-105 transition-all duration-300 flex items-center justify-center space-x-2 mx-auto"
                        >
                            <span>Continue to Next Section</span>
                            <ArrowRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}

            {/* Completion Celebration Overlay */}
            {showCompletion && (
                <div className="fixed inset-0 bg-gradient-to-br from-blue-950 via-purple-950 to-teal-950 bg-opacity-95 flex items-center justify-center z-[100] p-4">
                    <div className="bg-gray-900 border-2 border-green-500 rounded-3xl p-8 md:p-12 max-w-2xl text-center animate-scaleIn">
                        {/* Success Icon */}
                        <div className="mb-6">
                            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-green-500 to-teal-500 rounded-full flex items-center justify-center animate-pulse">
                                <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                        </div>

                        {/* Congratulations Message */}
                        <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-green-400 via-teal-400 to-blue-400 bg-clip-text text-transparent">
                            🎉 Excellent Work!
                        </h2>
                        <p className="text-xl text-gray-300 mb-8">
                            You've completed your speech!
                        </p>

                        {/* Statistics */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
                                <div className="text-3xl font-bold text-green-400 mb-1">{totalWords}</div>
                                <div className="text-sm text-gray-400">Total Words</div>
                            </div>
                            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
                                <div className="text-3xl font-bold text-blue-400 mb-1">{formatTime(elapsedTime)}</div>
                                <div className="text-sm text-gray-400">Time Taken</div>
                            </div>
                            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
                                <div className="text-3xl font-bold text-purple-400 mb-1">{wpm}</div>
                                <div className="text-sm text-gray-400">Avg WPM</div>
                            </div>
                            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
                                <div className="text-3xl font-bold text-teal-400 mb-1">100%</div>
                                <div className="text-sm text-gray-400">Completed</div>
                            </div>
                        </div>

                        {/* Performance Message */}
                        <div className="mb-8 p-4 bg-green-900/20 border border-green-700 rounded-lg">
                            <p className="text-green-300">
                                {wpm >= 150 ? "⚡ Outstanding pace! You're a natural speaker." :
                                    wpm >= 120 ? "🎯 Great job! Perfect speaking pace." :
                                        wpm >= 90 ? "👍 Well done! Nice and steady." :
                                            "🌟 Excellent! Taking your time shows confidence."}
                            </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4">
                            <button
                                onClick={resetPosition}
                                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-2xl hover:scale-105 transition-all duration-300 flex items-center justify-center space-x-2"
                            >
                                <RotateCcw className="w-5 h-5" />
                                <span>Practice Again</span>
                            </button>
                            {onSave && (
                                <button
                                    onClick={() => {
                                        setShowCompletion(false);
                                        onSave();
                                    }}
                                    className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg font-semibold hover:shadow-2xl hover:scale-105 transition-all duration-300 flex items-center justify-center space-x-2"
                                >
                                    <Save className="w-5 h-5" />
                                    <span>Save Script</span>
                                </button>
                            )}
                            {onHome && (
                                <button
                                    onClick={onHome}
                                    className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-all duration-300 flex items-center justify-center space-x-2"
                                >
                                    <Home className="w-5 h-5" />
                                    <span>Go Home</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Progress Bar */}
            <div className="fixed bottom-0 left-0 right-0 h-2 bg-gray-800 z-40">
                <div
                    className="h-full bg-gradient-to-r from-blue-500 to-teal-500 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                />
            </div>

            {/* Stats Bar (Bottom) */}
            <div className="fixed bottom-2 left-0 right-0 z-40 pointer-events-none">
                <div className="container mx-auto px-4 flex justify-center">
                    <div className="bg-gray-900/90 backdrop-blur-sm border border-gray-700 rounded-lg px-4 py-2 flex items-center space-x-6 text-sm">
                        <div className="flex items-center space-x-2">
                            <span className="text-gray-400">Progress:</span>
                            <span className="font-mono text-white">{progress.toFixed(1)}%</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <span className="text-gray-400">WPM:</span>
                            <span className="font-mono text-white">{wpm}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <span className="text-gray-400">Words:</span>
                            <span className="font-mono text-white">{wordsRead}/{totalWords}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <span className="text-gray-400">Est. Total:</span>
                            <span className="font-mono text-white">{formatTime(estimatedTotalTime)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Control Panel */}
            {showControls && (
                <div className="fixed top-0 left-0 right-0 bg-gray-900/95 backdrop-blur-sm border-b border-gray-700 p-3 md:p-4 z-50 transition-all duration-300">
                    <div className="container mx-auto">
                        {/* Mobile Layout */}
                        {/* Mobile Layout */}
                        <div className="md:hidden space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={() => {
                                            setIsPlaying(!isPlaying);
                                            setShowSectionPause(false);
                                        }}
                                        className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                                    >
                                        {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                                    </button>
                                    <button
                                        onClick={resetPosition}
                                        className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                                        title="Reset"
                                    >
                                        <RotateCcw className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => {
                                            const next = !audioSpeakerEnabled;
                                            setAudioSpeakerEnabled(next);
                                            localStorage.setItem("teleprompter_audio_speaker", String(next));
                                            if (next && loudAudioMode) playAudioChime(true);
                                        }}
                                        className={`p-2 rounded-lg transition-all ${
                                            audioSpeakerEnabled
                                                ? "bg-cyan-600 text-white shadow-md shadow-cyan-500/30 ring-2 ring-cyan-400"
                                                : "bg-gray-700 text-gray-400"
                                        }`}
                                        title="Audio Speaker (A)"
                                    >
                                        {audioSpeakerEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                                    </button>
                                    <button
                                        onClick={() => {
                                            const next = !loudAudioMode;
                                            setLoudAudioMode(next);
                                            localStorage.setItem("teleprompter_loud_mode", String(next));
                                            if (next) playAudioChime(true);
                                        }}
                                        className={`px-2 py-1.5 rounded text-xs font-bold transition-all flex items-center space-x-1 ${
                                            loudAudioMode
                                                ? "bg-gradient-to-r from-amber-500 to-orange-500 text-black font-extrabold"
                                                : "bg-gray-800 text-gray-400 border border-gray-700"
                                        }`}
                                        title="Best Loud Audio Mode (L)"
                                    >
                                        <Megaphone className="w-3.5 h-3.5" />
                                        <span>{loudAudioMode ? "LOUD" : "OFF"}</span>
                                    </button>
                                    <button
                                        onClick={() => setShowAudioSettings(true)}
                                        className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-cyan-300"
                                        title="Audio Settings"
                                    >
                                        <Headphones className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={savePosition}
                                        className="p-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                                        title="Save position"
                                    >
                                        <Bookmark className="w-5 h-5" />
                                    </button>
                                    {onHome && (
                                        <button
                                            onClick={onHome}
                                            className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                                            title="Home"
                                        >
                                            <Home className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>

                                <div className="text-sm text-gray-300 font-mono">
                                    {formatTime(elapsedTime)}
                                </div>

                                <button
                                    onClick={() => setShowSettings(!showSettings)}
                                    className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                                >
                                    <Settings className="w-5 h-5" />
                                </button>
                            </div>

                            {showSettings && (
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="bg-gray-800 rounded-lg p-2">
                                        <div className="text-xs text-gray-400 mb-1">Speed</div>
                                        <div className="flex items-center justify-between">
                                            <button onClick={() => adjustSpeed(-5)} className="p-1 bg-gray-700 rounded">
                                                <ChevronDown className="w-4 h-4" />
                                            </button>
                                            <span className="text-sm font-mono">{speed}</span>
                                            <button onClick={() => adjustSpeed(5)} className="p-1 bg-gray-700 rounded">
                                                <ChevronUp className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="bg-gray-800 rounded-lg p-2">
                                        <div className="text-xs text-gray-400 mb-1">Font</div>
                                        <div className="flex items-center justify-between">
                                            <button onClick={() => adjustFontSize(-2)} className="p-1 bg-gray-700 rounded">
                                                <ChevronDown className="w-4 h-4" />
                                            </button>
                                            <span className="text-sm font-mono">{fontSize}</span>
                                            <button onClick={() => adjustFontSize(2)} className="p-1 bg-gray-700 rounded">
                                                <ChevronUp className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Desktop Layout */}
                        <div className="hidden md:flex items-center justify-between">
                            <div className="flex items-center space-x-2.5">
                                <button
                                    onClick={() => {
                                        setIsPlaying(!isPlaying);
                                        setShowSectionPause(false);
                                    }}
                                    className="p-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                                >
                                    {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                                </button>
                                <button
                                    onClick={resetPosition}
                                    className="p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                                    title="Reset (R)"
                                >
                                    <RotateCcw className="w-6 h-6" />
                                </button>
                                <button
                                    onClick={savePosition}
                                    className="p-3 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                                    title="Save position (S)"
                                >
                                    <Bookmark className="w-6 h-6" />
                                </button>
                                {onHome && (
                                    <button
                                        onClick={onHome}
                                        className="p-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                                        title="Home"
                                    >
                                        <Home className="w-6 h-6" />
                                    </button>
                                )}
                                {onUpload && (
                                    <label className="p-3 bg-green-600 hover:bg-green-700 rounded-lg transition-colors cursor-pointer" title="Upload">
                                        <Upload className="w-6 h-6" />
                                        <input
                                            type="file"
                                            accept=".txt,text/plain"
                                            onChange={onUpload}
                                            className="hidden"
                                        />
                                    </label>
                                )}
                                {onSave && (
                                    <button
                                        onClick={onSave}
                                        className="p-3 bg-yellow-600 hover:bg-yellow-700 rounded-lg transition-colors"
                                        title="Save"
                                    >
                                        <Save className="w-6 h-6" />
                                    </button>
                                )}

                                {/* Audio Speaker & Loud Mode Controls */}
                                <div className="h-8 w-px bg-gray-700 mx-1" />

                                <button
                                    onClick={() => {
                                        const next = !audioSpeakerEnabled;
                                        setAudioSpeakerEnabled(next);
                                        localStorage.setItem("teleprompter_audio_speaker", String(next));
                                        if (next && loudAudioMode) playAudioChime(true);
                                    }}
                                    className={`px-3.5 py-2.5 rounded-lg transition-all flex items-center space-x-2 ${
                                        audioSpeakerEnabled
                                            ? "bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-500/30 ring-2 ring-cyan-400"
                                            : "bg-gray-800 hover:bg-gray-700 text-gray-400 border border-gray-700"
                                    }`}
                                    title="Audio Speaker / Voice Guide (A)"
                                >
                                    {audioSpeakerEnabled ? (
                                        <Volume2 className="w-5 h-5 text-white" />
                                    ) : (
                                        <VolumeX className="w-5 h-5 text-gray-400" />
                                    )}
                                    <span className="text-sm font-semibold">
                                        {audioSpeakerEnabled ? "Speaker ON" : "Speaker OFF"}
                                    </span>
                                    {audioSpeakerEnabled && isSpeaking && isPlaying && (
                                        <span className="flex items-center space-x-0.5 ml-1">
                                            <span className="w-1 h-3 bg-white animate-soundwave-1 rounded-full" />
                                            <span className="w-1 h-4 bg-white animate-soundwave-2 rounded-full" />
                                            <span className="w-1 h-2 bg-white animate-soundwave-3 rounded-full" />
                                        </span>
                                    )}
                                </button>

                                <button
                                    onClick={() => {
                                        const next = !loudAudioMode;
                                        setLoudAudioMode(next);
                                        localStorage.setItem("teleprompter_loud_mode", String(next));
                                        if (next) playAudioChime(true);
                                    }}
                                    className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                                        loudAudioMode
                                            ? "bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-black shadow-lg shadow-orange-500/30 ring-2 ring-amber-300"
                                            : "bg-gray-800 hover:bg-gray-700 text-gray-400 border border-gray-700"
                                    }`}
                                    title="Best Loud Audio Mode (L)"
                                >
                                    <Megaphone className={`w-4 h-4 ${loudAudioMode ? "text-black" : "text-gray-400"}`} />
                                    <span>{loudAudioMode ? "LOUD MODE" : "LOUD OFF"}</span>
                                </button>

                                <button
                                    onClick={() => setShowAudioSettings(true)}
                                    className="p-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-cyan-300 hover:text-white transition-colors relative"
                                    title="Audio Speaker & Voice Settings"
                                >
                                    <Headphones className="w-5 h-5" />
                                    {audioSpeakerEnabled && (
                                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-cyan-400 rounded-full animate-ping" />
                                    )}
                                </button>

                                <div className="h-8 w-px bg-gray-700 mx-1" />

                                <div className="flex space-x-1">
                                    <button
                                        onClick={() => startCountdown(3)}
                                        className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors"
                                    >
                                        3s
                                    </button>
                                    <button
                                        onClick={() => startCountdown(5)}
                                        className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors"
                                    >
                                        5s
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center space-x-6">
                                <div className="flex items-center space-x-2">
                                    <Settings className="w-5 h-5 text-gray-300" />
                                    <label className="text-sm text-gray-300">Speed:</label>
                                    <input
                                        type="range"
                                        min="5"
                                        max="100"
                                        value={speed}
                                        onChange={(e) => setSpeed(Number(e.target.value))}
                                        className="w-32"
                                    />
                                    <span className="text-sm text-gray-300 w-12 font-mono">{speed}</span>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <label className="text-sm text-gray-300">Font:</label>
                                    <input
                                        type="range"
                                        min="12"
                                        max="72"
                                        value={fontSize}
                                        onChange={(e) => setFontSize(Number(e.target.value))}
                                        className="w-32"
                                    />
                                    <span className="text-sm text-gray-300 w-12 font-mono">{fontSize}px</span>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Palette className="w-5 h-5 text-gray-300" />
                                    <select
                                        value={theme}
                                        onChange={(e) => setTheme(e.target.value as Theme)}
                                        className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1 text-sm text-gray-300"
                                    >
                                        <option value="dark">Dark</option>
                                        <option value="light">Light</option>
                                        <option value="sepia">Sepia</option>
                                        <option value="blue">Blue</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex items-center space-x-2">
                                <div className="text-sm text-gray-300 font-mono mr-2">
                                    {formatTime(elapsedTime)}
                                </div>
                                <button
                                    onClick={() => setIsMirrored(!isMirrored)}
                                    className={`p-2 rounded-lg transition-colors ${isMirrored ? "bg-blue-600" : "bg-gray-700 hover:bg-gray-600"
                                        }`}
                                    title="Mirror (M)"
                                >
                                    <Monitor className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={toggleFullscreen}
                                    className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                                    title="Fullscreen (F)"
                                >
                                    {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                                </button>
                                <button
                                    onClick={() => setShowControls(false)}
                                    className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                                    title="Hide controls (C)"
                                >
                                    <ChevronUp className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Show Controls Button */}
            {!showControls && (
                <button
                    onClick={() => setShowControls(true)}
                    className="fixed top-4 right-4 p-3 bg-gray-900/80 hover:bg-gray-800 rounded-lg transition-colors z-50"
                >
                    <ChevronDown className="w-6 h-6" />
                </button>
            )}

            {/* Reading Line */}
            <div className={`fixed top-1/2 left-0 right-0 h-1 ${currentTheme.line} opacity-70 z-40 pointer-events-none`} />

            {/* Dimming Overlay for Read Text (above the green line) */}
            <div
                className="fixed top-0 left-0 right-0 z-30 pointer-events-none"
                style={{
                    height: '50%',
                    background: `linear-gradient(to bottom, ${theme === 'dark' ? 'rgba(0, 0, 0, 0.6)' :
                            theme === 'light' ? 'rgba(255, 255, 255, 0.6)' :
                                theme === 'sepia' ? 'rgba(244, 236, 216, 0.6)' :
                                    'rgba(23, 37, 84, 0.6)'
                        } 0%, transparent 100%)`
                }}
            />

            {/* Speech Content */}
            <div className={`${showControls ? "pt-24 md:pt-20" : "pt-12"} pb-24 min-h-screen`}>
                <div
                    ref={contentRef}
                    className="container mx-auto px-4 md:px-8 max-w-4xl transition-transform duration-300 ease-out"
                    style={{
                        transform: `translateY(${-position}px)`,
                        paddingTop: "50vh",
                        paddingBottom: "50vh",
                    }}
                >
                    <div
                        className="leading-relaxed select-none space-y-6"
                        style={{
                            fontSize: `${fontSize}px`,
                            fontFamily: "system-ui, -apple-system, sans-serif",
                            lineHeight: "1.8",
                            textAlign: "left",
                        }}
                    >
                        {scriptData.paragraphs.length > 0 ? (
                            scriptData.paragraphs.map((para) => (
                                <p key={para.id} className="paragraph-block leading-relaxed">
                                    {para.sentences.map((sentence) => {
                                        const isCurrent = sentence.id === currentSentenceIndex;
                                        const isSpeakingCurrent = isCurrent && isSpeaking && audioSpeakerEnabled;

                                        if (sentence.isSection) {
                                            return (
                                                <span
                                                    key={sentence.id}
                                                    id={`sentence-${sentence.id}`}
                                                    onClick={() => {
                                                        setCurrentSentenceIndex(sentence.id);
                                                        scrollToSentence(sentence.id);
                                                    }}
                                                    className={`block my-6 px-4 py-2.5 rounded-xl cursor-pointer transition-all duration-300 font-bold border ${
                                                        isCurrent
                                                            ? "bg-blue-600/30 border-blue-400 text-blue-300 shadow-lg shadow-blue-500/20 scale-[1.01]"
                                                            : "bg-gray-800/40 border-gray-700/60 text-gray-400 hover:border-gray-500"
                                                    }`}
                                                >
                                                    <span className="flex items-center space-x-2">
                                                        <Bookmark className="w-5 h-5 text-blue-400 inline" />
                                                        <span>{sentence.text}</span>
                                                        {isSpeakingCurrent && (
                                                            <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full font-normal ml-2">
                                                                Section
                                                            </span>
                                                        )}
                                                    </span>
                                                </span>
                                            );
                                        }

                                        return (
                                            <span
                                                key={sentence.id}
                                                id={`sentence-${sentence.id}`}
                                                onClick={() => {
                                                    setCurrentSentenceIndex(sentence.id);
                                                    scrollToSentence(sentence.id);
                                                }}
                                                title="Click to speak from this sentence"
                                                className={`inline relative cursor-pointer transition-all duration-200 rounded px-1.5 py-0.5 mx-0.5 ${
                                                    isCurrent && audioSpeakerEnabled
                                                        ? "bg-cyan-500/25 text-white font-semibold shadow-md shadow-cyan-500/20 ring-2 ring-cyan-400/60 rounded-lg"
                                                        : "hover:bg-white/10"
                                                }`}
                                            >
                                                {isSpeakingCurrent && (
                                                    <span className="inline-flex items-center space-x-0.5 mr-1.5 align-middle text-cyan-400">
                                                        <span className="w-1.5 h-3 bg-cyan-400 animate-soundwave-1 rounded-full" />
                                                        <span className="w-1.5 h-4 bg-teal-300 animate-soundwave-2 rounded-full" />
                                                        <span className="w-1.5 h-2 bg-blue-400 animate-soundwave-3 rounded-full" />
                                                    </span>
                                                )}
                                                {sentence.text}{" "}
                                            </span>
                                        );
                                    })}
                                </p>
                            ))
                        ) : (
                            <div className="whitespace-pre-wrap">{content}</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Real-time Voice Coach Delivery Tip Bar */}
            {audioSpeakerEnabled && showVoiceTips && isPlaying && (
                <div className="fixed bottom-14 left-0 right-0 z-40 pointer-events-none flex justify-center px-4">
                    <div className="bg-gray-900/95 backdrop-blur-md border border-cyan-500/40 shadow-2xl rounded-full px-5 py-2 flex items-center space-x-3 text-xs md:text-sm animate-fadeIn">
                        <span className="flex items-center space-x-1.5 text-cyan-400 font-semibold">
                            <Volume2 className="w-4 h-4 animate-pulse text-cyan-400" />
                            <span>Voice Coach:</span>
                        </span>
                        <span className="text-gray-200 max-w-md truncate">
                            {scriptData.allSentences[currentSentenceIndex]?.tip || "🗣️ Speak with confident, forward projection"}
                        </span>
                        {loudAudioMode && (
                            <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-black text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center space-x-1">
                                <Megaphone className="w-3 h-3" />
                                <span>Loud Mode</span>
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* Keyboard Shortcuts */}
            {!isPlaying && position === 0 && (
                <div className="hidden md:block fixed bottom-20 right-4 bg-gray-900/90 border border-gray-700 rounded-lg p-4 text-xs text-gray-400 z-50">
                    <div className="font-semibold text-gray-300 mb-2">Keyboard Shortcuts</div>
                    <div className="space-y-1">
                        <div><kbd className="bg-gray-800 px-2 py-1 rounded">Space</kbd> Play/Pause</div>
                        <div><kbd className="bg-gray-800 px-2 py-1 rounded">↑/↓</kbd> Speed</div>
                        <div><kbd className="bg-gray-800 px-2 py-1 rounded">A</kbd> Audio Speaker</div>
                        <div><kbd className="bg-gray-800 px-2 py-1 rounded">L</kbd> Loud Audio Mode</div>
                        <div><kbd className="bg-gray-800 px-2 py-1 rounded">R</kbd> Reset</div>
                        <div><kbd className="bg-gray-800 px-2 py-1 rounded">S</kbd> Save Position</div>
                        <div><kbd className="bg-gray-800 px-2 py-1 rounded">F</kbd> Fullscreen</div>
                        <div><kbd className="bg-gray-800 px-2 py-1 rounded">M</kbd> Mirror</div>
                        <div><kbd className="bg-gray-800 px-2 py-1 rounded">C</kbd> Hide Controls</div>
                    </div>
                </div>
            )}

            {/* Instructions Overlay */}
            {!isPlaying && position === 0 && (
                <div className="fixed inset-0 bg-gray-950 bg-opacity-95 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-900 border-2 border-gray-700 rounded-2xl p-6 md:p-10 max-w-2xl text-center space-y-6 max-h-[90vh] overflow-y-auto">
                        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 via-teal-400 to-blue-500 bg-clip-text text-transparent">
                            {title}
                        </h1>

                        {/* Audio Speaker & Loud Audio Mode Card */}
                        <div className="bg-gradient-to-r from-cyan-950/60 via-blue-950/60 to-purple-950/60 border-2 border-cyan-500/40 rounded-2xl p-5 text-left shadow-xl">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center space-x-2.5">
                                    <div className="w-10 h-10 bg-cyan-500/20 border border-cyan-500/40 rounded-xl flex items-center justify-center">
                                        <Volume2 className="w-5 h-5 text-cyan-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-bold text-white flex items-center space-x-2">
                                            <span>Audio Speaker & Voice Guide</span>
                                            {loudAudioMode && (
                                                <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-black text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase">
                                                    Loud Audio Mode
                                                </span>
                                            )}
                                        </h3>
                                        <p className="text-xs text-gray-300">
                                            Hear how to speak your script with real-time text-to-speech narration
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        const next = !audioSpeakerEnabled;
                                        setAudioSpeakerEnabled(next);
                                        localStorage.setItem("teleprompter_audio_speaker", String(next));
                                        if (next && loudAudioMode) playAudioChime(true);
                                    }}
                                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all shadow-lg ${
                                        audioSpeakerEnabled
                                            ? "bg-cyan-500 text-black hover:bg-cyan-400"
                                            : "bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700"
                                    }`}
                                >
                                    {audioSpeakerEnabled ? "ENABLED" : "ENABLE"}
                                </button>
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-cyan-500/20 text-xs">
                                <div className="flex items-center space-x-2">
                                    <Megaphone className="w-4 h-4 text-amber-400" />
                                    <span className="text-gray-300">Loud Mode:</span>
                                    <button
                                        onClick={() => {
                                            const next = !loudAudioMode;
                                            setLoudAudioMode(next);
                                            localStorage.setItem("teleprompter_loud_mode", String(next));
                                            if (next) playAudioChime(true);
                                        }}
                                        className={`font-bold transition-colors ${
                                            loudAudioMode ? "text-amber-400 underline" : "text-gray-400"
                                        }`}
                                    >
                                        {loudAudioMode ? "100% MAX BOOST (ON)" : "STANDARD (OFF)"}
                                    </button>
                                </div>
                                <button
                                    onClick={testAudioSpeaker}
                                    disabled={audioTestPlaying}
                                    className="px-3 py-1 bg-cyan-600/30 hover:bg-cyan-600/50 border border-cyan-500/40 text-cyan-300 rounded-lg font-semibold flex items-center space-x-1.5 transition-colors"
                                >
                                    <span>{audioTestPlaying ? "Testing Voice..." : "🔊 Test Loud Speaker"}</span>
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2.5 text-left text-sm md:text-base text-gray-200">
                            <p>✅ <strong className="text-white">Audio Speaker:</strong> Hear pronunciation & pacing as it scrolls</p>
                            <p>✅ <strong className="text-white">Best Loud Audio Mode:</strong> 100% volume boost for clear projection</p>
                            <p>✅ <strong className="text-white">Interactive Practice:</strong> Click any line to hear how to speak it</p>
                            <p>✅ <strong className="text-white">WPM Pace Counter & Auto-Pause:</strong> Delivers confident pacing</p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 pt-2">
                            <button
                                onClick={() => {
                                    setPosition(0);
                                    setElapsedTime(0);
                                    setWordsRead(0);
                                    setCurrentSentenceIndex(0);
                                    setIsPlaying(true);
                                    if (audioSpeakerEnabled && loudAudioMode) playAudioChime(true);
                                }}
                                className="flex-1 px-6 md:px-8 py-3.5 bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 text-white rounded-xl font-bold shadow-xl hover:shadow-cyan-500/30 hover:scale-105 transition-all duration-300 flex items-center justify-center space-x-2"
                            >
                                <Play className="w-5 h-5" />
                                <span>{audioSpeakerEnabled ? "Start with Audio Speaker" : "Start Teleprompter"}</span>
                            </button>
                            <button
                                onClick={() => startCountdown(5)}
                                className="flex-1 px-6 md:px-8 py-3.5 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-semibold transition-all duration-300 flex items-center justify-center space-x-2"
                            >
                                <span>5s Countdown</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Audio Speaker & Loud Mode Settings Modal */}
            {showAudioSettings && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[110] p-4">
                    <div className="bg-gray-900 border-2 border-cyan-500/40 rounded-3xl p-6 md:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-6 animate-scaleIn">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between border-b border-gray-800 pb-4">
                            <div className="flex items-center space-x-3">
                                <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                                    <Headphones className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-white">Audio Speaker & Loud Mode</h2>
                                    <p className="text-sm text-gray-400">Voice guidance, pronunciation, and acoustic volume projection</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowAudioSettings(false)}
                                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Modal Tabs */}
                        <div className="flex border-b border-gray-800">
                            <button
                                onClick={() => setAudioSettingsTab("voice")}
                                className={`flex-1 py-3 font-semibold text-sm border-b-2 transition-colors flex items-center justify-center space-x-2 ${
                                    audioSettingsTab === "voice"
                                        ? "border-cyan-400 text-cyan-400 bg-cyan-500/5"
                                        : "border-transparent text-gray-400 hover:text-gray-300"
                                }`}
                            >
                                <Volume2 className="w-4 h-4" />
                                <span>Voice & Loud Settings</span>
                            </button>
                            <button
                                onClick={() => setAudioSettingsTab("coach")}
                                className={`flex-1 py-3 font-semibold text-sm border-b-2 transition-colors flex items-center justify-center space-x-2 ${
                                    audioSettingsTab === "coach"
                                        ? "border-cyan-400 text-cyan-400 bg-cyan-500/5"
                                        : "border-transparent text-gray-400 hover:text-gray-300"
                                }`}
                            >
                                <Sparkles className="w-4 h-4" />
                                <span>How to Speak (Coach Guide)</span>
                            </button>
                        </div>

                        {/* Tab 1: Voice & Loud Mode Controls */}
                        {audioSettingsTab === "voice" && (
                            <div className="space-y-6">
                                {/* Master Audio Speaker Switch */}
                                <div className="flex items-center justify-between p-4 bg-gray-800/60 rounded-2xl border border-gray-700">
                                    <div>
                                        <div className="font-semibold text-white">Audio Speaker (Voice Guide)</div>
                                        <div className="text-xs text-gray-400">Reads text aloud during playback so you know how to speak and pace</div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            const next = !audioSpeakerEnabled;
                                            setAudioSpeakerEnabled(next);
                                            localStorage.setItem("teleprompter_audio_speaker", String(next));
                                            if (next && loudAudioMode) playAudioChime(true);
                                        }}
                                        className={`w-14 h-8 flex items-center rounded-full p-1 transition-colors ${
                                            audioSpeakerEnabled ? "bg-cyan-500" : "bg-gray-700"
                                        }`}
                                    >
                                        <div
                                            className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform ${
                                                audioSpeakerEnabled ? "translate-x-6" : "translate-x-0"
                                            }`}
                                        />
                                    </button>
                                </div>

                                {/* Best Loud Audio Mode Card */}
                                <div className="p-5 bg-gradient-to-r from-amber-950/40 via-orange-950/30 to-amber-950/40 rounded-2xl border-2 border-amber-500/50 shadow-xl space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2.5">
                                            <div className="w-10 h-10 bg-amber-500/20 border border-amber-500/50 rounded-xl flex items-center justify-center">
                                                <Megaphone className="w-5 h-5 text-amber-400" />
                                            </div>
                                            <div>
                                                <div className="font-bold text-white flex items-center space-x-2">
                                                    <span>Best Loud Audio Mode</span>
                                                    <span className="bg-amber-500 text-black text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                                        Max Projection
                                                    </span>
                                                </div>
                                                <div className="text-xs text-amber-200/80">
                                                    100% volume gain, enhanced stage frequencies, and high-clarity voice
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => {
                                                const next = !loudAudioMode;
                                                setLoudAudioMode(next);
                                                localStorage.setItem("teleprompter_loud_mode", String(next));
                                                if (next) playAudioChime(true);
                                            }}
                                            className={`w-14 h-8 flex items-center rounded-full p-1 transition-colors ${
                                                loudAudioMode ? "bg-amber-500" : "bg-gray-700"
                                            }`}
                                        >
                                            <div
                                                className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform ${
                                                    loudAudioMode ? "translate-x-6" : "translate-x-0"
                                                }`}
                                            />
                                        </button>
                                    </div>
                                </div>

                                {/* Preset Mode Buttons */}
                                <div>
                                    <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                                        Quick Audio Presets
                                    </label>
                                    <div className="grid grid-cols-2 gap-2.5">
                                        <button
                                            onClick={() => applyAudioPreset("loud_stage")}
                                            className={`p-3 rounded-xl border text-left transition-all ${
                                                loudAudioMode && speechVolume === 1.0
                                                    ? "bg-amber-500/20 border-amber-400 text-white shadow-lg"
                                                    : "bg-gray-800/60 border-gray-700 text-gray-300 hover:border-gray-600"
                                            }`}
                                        >
                                            <div className="font-bold text-sm text-amber-400">📢 Loud Stage</div>
                                            <div className="text-xs text-gray-400">Max volume & crisp projection</div>
                                        </button>
                                        <button
                                            onClick={() => applyAudioPreset("natural_studio")}
                                            className={`p-3 rounded-xl border text-left transition-all ${
                                                !loudAudioMode && speechRate === 1.0
                                                    ? "bg-cyan-500/20 border-cyan-400 text-white shadow-lg"
                                                    : "bg-gray-800/60 border-gray-700 text-gray-300 hover:border-gray-600"
                                            }`}
                                        >
                                            <div className="font-bold text-sm text-cyan-400">🎙️ Natural Studio</div>
                                            <div className="text-xs text-gray-400">Balanced, warm tone</div>
                                        </button>
                                        <button
                                            onClick={() => applyAudioPreset("energetic")}
                                            className="p-3 rounded-xl border bg-gray-800/60 border-gray-700 text-gray-300 hover:border-gray-600 text-left transition-all"
                                        >
                                            <div className="font-bold text-sm text-purple-400">⚡ Dynamic & Fast</div>
                                            <div className="text-xs text-gray-400">Upbeat 1.15x pace</div>
                                        </button>
                                        <button
                                            onClick={() => applyAudioPreset("steady_practice")}
                                            className="p-3 rounded-xl border bg-gray-800/60 border-gray-700 text-gray-300 hover:border-gray-600 text-left transition-all"
                                        >
                                            <div className="font-bold text-sm text-teal-400">🧘 Steady Practice</div>
                                            <div className="text-xs text-gray-400">Deliberate 0.85x articulation</div>
                                        </button>
                                    </div>
                                </div>

                                {/* Voice Selector */}
                                <div>
                                    <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                                        Speaker Voice ({voices.length} Available)
                                    </label>
                                    <select
                                        value={selectedVoiceURI}
                                        onChange={(e) => {
                                            setSelectedVoiceURI(e.target.value);
                                            localStorage.setItem("teleprompter_voice_uri", e.target.value);
                                        }}
                                        className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-cyan-500 text-sm"
                                    >
                                        {voices.map((v) => (
                                            <option key={v.voiceURI} value={v.voiceURI}>
                                                {v.name} ({v.lang}) {v.name.includes("Natural") || v.name.includes("Google") ? "⭐ High Clarity" : ""}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Controls: Volume, Rate, Pitch */}
                                <div className="grid sm:grid-cols-3 gap-4">
                                    <div className="bg-gray-800/40 p-3.5 rounded-xl border border-gray-700/60">
                                        <div className="flex justify-between text-xs text-gray-300 mb-1">
                                            <span>Volume</span>
                                            <span className="font-mono text-cyan-400">{Math.round((loudAudioMode ? 1.0 : speechVolume) * 100)}%</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0.2"
                                            max="1"
                                            step="0.05"
                                            value={loudAudioMode ? 1.0 : speechVolume}
                                            disabled={loudAudioMode}
                                            onChange={(e) => setSpeechVolume(Number(e.target.value))}
                                            className="w-full"
                                        />
                                        {loudAudioMode && (
                                            <div className="text-[10px] text-amber-400 font-semibold mt-1">Locked at 100% in Loud Mode</div>
                                        )}
                                    </div>

                                    <div className="bg-gray-800/40 p-3.5 rounded-xl border border-gray-700/60">
                                        <div className="flex justify-between text-xs text-gray-300 mb-1">
                                            <span>Speaking Rate</span>
                                            <span className="font-mono text-cyan-400">{speechRate.toFixed(2)}x</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0.5"
                                            max="2.0"
                                            step="0.05"
                                            value={speechRate}
                                            onChange={(e) => {
                                                const val = Number(e.target.value);
                                                setSpeechRate(val);
                                                localStorage.setItem("teleprompter_speech_rate", val.toString());
                                            }}
                                            className="w-full"
                                        />
                                    </div>

                                    <div className="bg-gray-800/40 p-3.5 rounded-xl border border-gray-700/60">
                                        <div className="flex justify-between text-xs text-gray-300 mb-1">
                                            <span>Pitch / Clarity</span>
                                            <span className="font-mono text-cyan-400">{speechPitch.toFixed(2)}</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0.6"
                                            max="1.4"
                                            step="0.05"
                                            value={speechPitch}
                                            onChange={(e) => setSpeechPitch(Number(e.target.value))}
                                            className="w-full"
                                        />
                                    </div>
                                </div>

                                {/* Feature Toggles */}
                                <div className="space-y-3 pt-2">
                                    <label className="flex items-center space-x-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={autoScrollWithAudio}
                                            onChange={(e) => setAutoScrollWithAudio(e.target.checked)}
                                            className="w-4 h-4 rounded text-cyan-500 focus:ring-cyan-500 bg-gray-800 border-gray-700"
                                        />
                                        <span className="text-sm text-gray-200">
                                            Auto-scroll teleprompter smoothly to each spoken sentence
                                        </span>
                                    </label>
                                    <label className="flex items-center space-x-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={showVoiceTips}
                                            onChange={(e) => setShowVoiceTips(e.target.checked)}
                                            className="w-4 h-4 rounded text-cyan-500 focus:ring-cyan-500 bg-gray-800 border-gray-700"
                                        />
                                        <span className="text-sm text-gray-200">
                                            Show real-time voice delivery cues (pauses, energy, inflection) while playing
                                        </span>
                                    </label>
                                </div>

                                {/* Test Speaker Button */}
                                <div className="pt-2">
                                    <button
                                        onClick={testAudioSpeaker}
                                        disabled={audioTestPlaying}
                                        className="w-full py-3.5 bg-gradient-to-r from-cyan-600 via-blue-600 to-cyan-600 text-white rounded-xl font-bold shadow-lg hover:shadow-cyan-500/30 hover:scale-[1.02] transition-all flex items-center justify-center space-x-2"
                                    >
                                        <Volume2 className="w-5 h-5" />
                                        <span>{audioTestPlaying ? "Speaking Test Audio..." : "▶️ Test Loud Audio Speaker"}</span>
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Tab 2: How to Speak Guide */}
                        {audioSettingsTab === "coach" && (
                            <div className="space-y-4 text-sm text-gray-300">
                                <div className="p-4 bg-blue-900/20 border border-blue-700/50 rounded-2xl space-y-2">
                                    <div className="font-bold text-white flex items-center space-x-2">
                                        <Sparkles className="w-5 h-5 text-cyan-400" />
                                        <span>The 5 Secrets to Confident Speech Delivery</span>
                                    </div>
                                    <p className="text-xs text-gray-300 leading-relaxed">
                                        Use your teleprompter not just to read, but to command the room. Here is how professional speakers deliver impact:
                                    </p>
                                </div>

                                <div className="grid gap-3">
                                    <div className="p-3.5 bg-gray-800/50 border border-gray-700/60 rounded-xl">
                                        <div className="font-bold text-white mb-1">📢 1. Diaphragmatic Projection (Best Loud Mode)</div>
                                        <p className="text-xs text-gray-400">
                                            Speak from your belly, not your throat. When Loud Audio Mode is on, match its resonance by projecting your voice towards the back row of your audience.
                                        </p>
                                    </div>
                                    <div className="p-3.5 bg-gray-800/50 border border-gray-700/60 rounded-xl">
                                        <div className="font-bold text-white mb-1">⏱️ 2. The Golden Pace (120 - 140 WPM)</div>
                                        <p className="text-xs text-gray-400">
                                            Nervous speakers rush at 180+ WPM. Keep your eyes on the WPM meter and let the audio speaker set a confident, relaxed cadence.
                                        </p>
                                    </div>
                                    <div className="p-3.5 bg-gray-800/50 border border-gray-700/60 rounded-xl">
                                        <div className="font-bold text-white mb-1">⏸️ 3. The Power of the 2-Second Silence</div>
                                        <p className="text-xs text-gray-400">
                                            Whenever you finish a big point, stop for 2 full seconds. Silence builds suspense and signals undeniable authority.
                                        </p>
                                    </div>
                                    <div className="p-3.5 bg-gray-800/50 border border-gray-700/60 rounded-xl">
                                        <div className="font-bold text-white mb-1">↗️ 4. Inflection and Energy Shifts</div>
                                        <p className="text-xs text-gray-400">
                                            End declarative statements with a downward, firm tone. Save upward inflection exclusively for genuine questions.
                                        </p>
                                    </div>
                                    <div className="p-3.5 bg-gray-800/50 border border-gray-700/60 rounded-xl">
                                        <div className="font-bold text-white mb-1">💡 5. Click-to-Practice Any Line</div>
                                        <p className="text-xs text-gray-400">
                                            You can click directly on any sentence in the teleprompter text at any time to hear how to speak that exact line aloud!
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
