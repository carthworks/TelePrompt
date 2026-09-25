"use client";

import { useState, useEffect, useRef, useMemo, useCallback, ChangeEvent } from "react";
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
    Edit3,
    BookOpen,
    Eye,
    HelpCircle,
    FileText,
    Check,
    Plus,
    Trash2,
    Download,
    Search,
    Folder,
    AlignLeft,
    AlignCenter,
    Shield,
    ExternalLink,
    Lock,
    Info,
    Clock,
    Zap,
    Rocket,
    Mic,
    Video,
    Heart,
    Keyboard,
} from "lucide-react";

export interface SavedScript {
    id: string;
    title: string;
    content: string;
    folder: string;
    createdAt: number;
    updatedAt: number;
}

export type Theme = "dark" | "light" | "sepia" | "blue" | "contrast";

export const themes: Record<Theme, { bg: string; text: string; line: string; name: string }> = {
    dark: { bg: "bg-gray-950", text: "text-white", line: "bg-emerald-500", name: "Pro Dark (OLED)" },
    light: { bg: "bg-slate-100", text: "text-slate-900", line: "bg-blue-600", name: "Studio Clean Light" },
    sepia: { bg: "bg-[#f4ecd8]", text: "text-[#3e2e1e]", line: "bg-amber-600", name: "Warm Sepia (Reading)" },
    blue: { bg: "bg-blue-950", text: "text-blue-50", line: "bg-cyan-400", name: "Cyber Blue" },
    contrast: { bg: "bg-black", text: "text-[#ffff00]", line: "bg-[#ffff00]", name: "WCAG AAA High Contrast (Yellow/Black)" },
};

export const QUICK_TEMPLATES = [
    {
        id: "investor_pitch",
        title: "🚀 Investor Pitch Deck",
        category: "Business",
        description: "Hook investors, prove traction, and ask for capital in 2 minutes",
        content: `[Opening Hook]
Hello everyone. Today, over 85% of presenters report acute stage anxiety and irregular pacing during high-stakes presentations.

[The Problem]
Current teleprompters are dumb scrolling screens. They don't guide your voice, they don't teach you where to pause, and they fail in noisy acoustic halls.

[Our Breakthrough Solution]
We created TelePrompt Pro—the world's first AI-assisted teleprompter with Best Loud Audio Mode, natural cadence cueing, and interactive sentence guidance.

[Traction & Metrics]
In the last 90 days alone, we reached over 45,000 active keynoters, podcasters, and YouTube creators across 32 countries.

[The Vision & Ask]
We are currently raising our seed round to expand real-time speech intelligence across all platforms. Join us on this journey. Thank you!`,
    },
    {
        id: "keynote_speech",
        title: "🎤 Inspiring Keynote",
        category: "Keynote",
        description: "Engage large auditoriums with rhythm, visionary storytelling, and confidence",
        content: `[Welcome & Context]
Good morning honored guests, colleagues, and visionary leaders.

[The Turning Point]
We gather today at an unprecedented moment in human history. The tools we build today will determine the trajectory of tomorrow.

[The Core Message]
True leadership is not about having all the answers—it is about having the courage to ask the boldest questions.

[Real-World Impact]
When we empower individuals with accessible, human-centric technology, we unleash innovation in every corner of the world.

[Closing Call to Action]
Let us build that future together—not with hesitation, but with bold, unwavering optimism. Thank you!`,
    },
    {
        id: "youtube_video",
        title: "🎬 High-Engagement YouTube Script",
        category: "Content creation",
        description: "Capture attention in the first 5 seconds and maintain viewer retention",
        content: `[Hook - First 5 Seconds]
Wait! Don't scroll away. If you speak on camera or present to clients, this one trick will instantly make you 10x more persuasive!

[Introduction]
Welcome back to the channel, friends! Today we are breaking down the exact vocal delivery techniques used by the world's highest-paid keynote speakers.

[Step 1: The Tactical Pause]
Notice what happens when you pause right before a key takeaway. The audience leans in immediately.

[Step 2: Pitch Inflection]
Next, ensure your pitch rises with curious questions and lands with steady conviction on statements.

[Outro & Engagement]
If you found this valuable, smash that like button, subscribe to the channel, and drop your thoughts in the comments below!`,
    },
    {
        id: "wedding_toast",
        title: "🥂 Heartfelt Celebration Toast",
        category: "Personal",
        description: "Warm, memorable, and emotional toast for weddings and milestones",
        content: `[Welcome & Attention]
Good evening everyone! Could I please have everyone's attention for just two short minutes?

[The Friendship & Origin]
For those who don't know me, I have had the incredible joy of being best friends with our newlywed for more than ten years.

[The Turning Point]
I still remember the day they met. Within five minutes of hearing the story, I knew something truly special had just begun.

[The Blessing]
They complement each other in every possible way—bringing kindness, spontaneous laughter, and deep empathy into every room they enter.

[The Toast]
Please raise your glasses high with me. To a lifetime of boundless adventure, deep joy, and everlasting love. To our wonderful couple! Cheers!`,
    },
];

export interface TeleprompterProps {
    content: string;
    title?: string;
    defaultSpeed?: number;
    defaultFontSize?: number;
    savedScripts?: SavedScript[];
    onContentChange?: (newContent: string) => void;
    onTitleChange?: (newTitle: string) => void;
    onSaveScript?: (title: string, content: string, folder: string) => void;
    onLoadScript?: (script: SavedScript) => void;
    onDeleteScript?: (id: string) => void;
    onUpload?: (e: ChangeEvent<HTMLInputElement>) => void;
    onSave?: () => void;
    onHome?: () => void;
}

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
    savedScripts = [],
    onContentChange,
    onTitleChange,
    onSaveScript,
    onLoadScript,
    onDeleteScript,
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
    const [scrollHeight, setScrollHeight] = useState<number>(1000);
    const [currentSection, setCurrentSection] = useState("");
    const [showSectionPause, setShowSectionPause] = useState(false);
    const [autoPauseAtSections, setAutoPauseAtSections] = useState<boolean>(false);
    const [showCompletion, setShowCompletion] = useState(false);

    // Accessibility & Typography State
    const [fontFamily, setFontFamily] = useState<"sans" | "mono" | "serif">("sans");
    const [textAlign, setTextAlign] = useState<"left" | "center">("left");
    const [lineSpacing, setLineSpacing] = useState<"relaxed" | "loose">("relaxed");
    const [showReadingGuide, setShowReadingGuide] = useState<boolean>(true);
    const [guideOpacity, setGuideOpacity] = useState<number>(0.6);
    const [showAccessibilityModal, setShowAccessibilityModal] = useState<boolean>(false);
    const [showShortcutsModal, setShowShortcutsModal] = useState<boolean>(false);
    const [liveAnnouncement, setLiveAnnouncement] = useState<string>("");

    // In-Place Script Editor & Library State
    const [showScriptEditor, setShowScriptEditor] = useState<boolean>(false);
    const [editorText, setEditorText] = useState<string>(content);
    const [editorScriptTitle, setEditorScriptTitle] = useState<string>(title);
    const [showLibrary, setShowLibrary] = useState<boolean>(false);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [selectedFolder, setSelectedFolder] = useState<string>("All");
    const [showSaveModal, setShowSaveModal] = useState<boolean>(false);
    const [saveTitleInput, setSaveTitleInput] = useState<string>(title);
    const [saveFolderInput, setSaveFolderInput] = useState<string>("General");
    const [newFolderName, setNewFolderName] = useState<string>("");
    const [showNewFolder, setShowNewFolder] = useState<boolean>(false);

    // Web Trust & Legal Compliance State (Skill: web-trust-and-compliance)
    const [showTrustModal, setShowTrustModal] = useState<boolean>(false);
    const [trustTab, setTrustTab] = useState<"privacy" | "terms" | "about" | "support">("privacy");

    // Audio Speaker & Best Loud Audio Mode State
    const [audioSpeakerEnabled, setAudioSpeakerEnabled] = useState(false);
    const [loudAudioMode, setLoudAudioMode] = useState(false);
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

    // Keep editor in sync when external content or title updates
    useEffect(() => {
        setEditorText(content);
    }, [content]);

    useEffect(() => {
        setEditorScriptTitle(title);
        setSaveTitleInput(title);
    }, [title]);

    const announce = useCallback((msg: string) => {
        setLiveAnnouncement(msg);
        const timer = setTimeout(() => setLiveAnnouncement(""), 2500);
        return () => clearTimeout(timer);
    }, []);

    const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
    const speechTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const showSectionPauseRef = useRef(showSectionPause);
    useEffect(() => {
        showSectionPauseRef.current = showSectionPause;
    }, [showSectionPause]);

    const containerRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const wakeLockRef = useRef<{ release: () => Promise<void> } | null>(null);

    // Parse script into structured sentences
    const scriptData = useMemo(() => parseScriptContent(content), [content]);

    // Calculate metrics
    const totalWords = useMemo(() => content.split(/\s+/).filter((w) => w.length > 0).length, [content]);
    const scrollableDistance = typeof window !== "undefined" ? Math.max(1, scrollHeight - window.innerHeight) : 1000;
    const progress = Math.min(100, Math.max(0, (position / scrollableDistance) * 100));
    const scrollPercentage = scrollHeight > 0 ? position / scrollHeight : 0;
    const wordsRead = audioSpeakerEnabled && scriptData.allSentences.length > 0
        ? Math.min(totalWords, scriptData.allSentences.slice(0, currentSentenceIndex + 1).reduce((acc, s) => acc + s.text.split(/\s+/).filter(Boolean).length, 0))
        : Math.round(totalWords * scrollPercentage);
    const wpm = elapsedTime > 0 ? Math.round((wordsRead / elapsedTime) * 60) : 0;
    const estimatedTotalTime = Math.round((totalWords / 130) * 60); // 130 WPM standard studio target pace

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
            const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
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
            requestAnimationFrame(() => {
                setPosition(Math.max(0, targetOffset));
            });
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
        const timer = setTimeout(() => {
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

            const savedAutoPause = localStorage.getItem("teleprompter_auto_pause_sections");
            if (savedAutoPause !== null) {
                setAutoPauseAtSections(savedAutoPause === "true");
            }
        }, 0);
        return () => clearTimeout(timer);
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
            if (speechTimeoutRef.current) {
                clearTimeout(speechTimeoutRef.current);
                speechTimeoutRef.current = null;
            }
            const timer = setTimeout(() => setIsSpeaking(false), 0);
            return () => clearTimeout(timer);
        }

        const allSentences = scriptData.allSentences;
        if (allSentences.length === 0) return;

        if (currentSentenceIndex >= allSentences.length) {
            const timer = setTimeout(() => {
                setIsPlaying(false);
                setShowCompletion(true);
            }, 0);
            return () => clearTimeout(timer);
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
            if (autoPauseAtSections && currentSentenceIndex > 0) {
                const timer = setTimeout(() => {
                    setIsPlaying(false);
                    setShowSectionPause(true);
                }, 0);
                return () => clearTimeout(timer);
            } else {
                // Smooth breath transition through section cue without freezing prompter
                speechTimeoutRef.current = setTimeout(() => {
                    setCurrentSentenceIndex((prev) => prev + 1);
                }, 350);
                return;
            }
        }

        const cleanText = currentSentence.text.replace(/\[([^\]]+)\]/g, "").trim();
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
        voices,
        autoPauseAtSections,
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

    // Scroll height tracker
    useEffect(() => {
        const updateHeight = () => {
            if (contentRef.current) {
                setScrollHeight(contentRef.current.scrollHeight);
            }
        };
        const timer = setTimeout(updateHeight, 100);
        window.addEventListener("resize", updateHeight);
        return () => {
            clearTimeout(timer);
            window.removeEventListener("resize", updateHeight);
        };
    }, [content, fontSize]);

    // Check for completion when reaching end
    useEffect(() => {
        if (progress >= 99 && isPlaying && !audioSpeakerEnabled) {
            const timer = setTimeout(() => {
                setIsPlaying(false);
                setShowCompletion(true);
            }, 0);
            return () => clearTimeout(timer);
        }
    }, [progress, isPlaying, audioSpeakerEnabled]);

    // Section detection and auto-pause for silent scrolling mode
    useEffect(() => {
        if (!autoPauseAtSections || audioSpeakerEnabled) return;
        const sections = content.match(/\[([^\]]+)\]/g);
        if (sections && scrollHeight > 0) {
            const currentScrollPercentage = position / scrollHeight;
            const sectionIndex = Math.floor(currentScrollPercentage * sections.length);
            const section = sections[sectionIndex];

            if (section && section !== currentSection) {
                const timer = setTimeout(() => {
                    setCurrentSection(section);
                    if (isPlaying && sectionIndex > 0) {
                        setIsPlaying(false);
                        setShowSectionPause(true);
                    }
                }, 0);
                return () => clearTimeout(timer);
            }
        }
    }, [position, content, currentSection, isPlaying, scrollHeight, autoPauseAtSections, audioSpeakerEnabled]);

    // Countdown timer
    useEffect(() => {
        if (countdown !== null && countdown > 0) {
            const timer = setTimeout(() => {
                setCountdown(countdown - 1);
            }, 1000);
            return () => clearTimeout(timer);
        } else if (countdown === 0) {
            const timer = setTimeout(() => {
                setCountdown(null);
                setIsPlaying(true);
            }, 0);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    const positionRef = useRef(position);
    useEffect(() => {
        positionRef.current = position;
    }, [position]);

    const resetPosition = useCallback(() => {
        setPosition(0);
        setIsPlaying(false);
        setElapsedTime(0);
        setCurrentSection("");
        setShowSectionPause(false);
        setShowCompletion(false);
        setCurrentSentenceIndex(0);
        setIsSpeaking(false);
        if (typeof window !== "undefined" && "speechSynthesis" in window) {
            window.speechSynthesis.cancel();
        }
        localStorage.removeItem("teleprompter_position");
    }, []);

    const savePosition = useCallback(() => {
        localStorage.setItem("teleprompter_position", positionRef.current.toString());
        // Show brief confirmation
        const notification = document.createElement("div");
        notification.className = "fixed top-24 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50";
        notification.textContent = "Position saved!";
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 2000);
    }, []);

    const toggleFullscreen = useCallback(() => {
        if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    }, []);

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

    const continueToNextSection = useCallback(() => {
        setShowSectionPause(false);
        setCurrentSentenceIndex((prev) => {
            const allSentences = scriptData.allSentences;
            if (allSentences[prev]?.isSection && prev + 1 < allSentences.length) {
                return prev + 1;
            }
            return prev;
        });
        setPosition((prev) => prev + 15);
        setIsPlaying(true);
    }, [scriptData]);

    const dismissSectionPause = (disableFuture: boolean = false) => {
        setShowSectionPause(false);
        if (disableFuture) {
            setAutoPauseAtSections(false);
            localStorage.setItem("teleprompter_auto_pause_sections", "false");
            announce("Auto-pause at sections turned off");
        }
        setCurrentSentenceIndex((prev) => {
            const allSentences = scriptData.allSentences;
            if (allSentences[prev]?.isSection && prev + 1 < allSentences.length) {
                return prev + 1;
            }
            return prev;
        });
        setPosition((prev) => prev + 15);
        setIsPlaying(true);
    };

    const handleInsertSectionTag = (tag: string) => {
        setEditorText((prev) => `${prev.trim()}\n\n[${tag}]\n`);
    };

    const handleApplyEditor = () => {
        if (onContentChange) {
            onContentChange(editorText);
        }
        if (onTitleChange && editorScriptTitle !== title) {
            onTitleChange(editorScriptTitle);
        }
        resetPosition();
        setShowScriptEditor(false);
        announce("Script updated and ready in teleprompter");
    };

    const handleSelectTemplate = (templateId: string) => {
        const tmpl = QUICK_TEMPLATES.find((t) => t.id === templateId);
        if (tmpl) {
            if (onContentChange) onContentChange(tmpl.content);
            if (onTitleChange) onTitleChange(tmpl.title);
            setEditorText(tmpl.content);
            setEditorScriptTitle(tmpl.title);
            resetPosition();
            announce(`Loaded template: ${tmpl.title}`);
        }
    };

    const handleExportTxt = (scriptToExport?: { title: string; content: string }) => {
        const exportTitle = scriptToExport?.title || title || "speech";
        const exportContent = scriptToExport?.content || content;
        const blob = new Blob([exportContent], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${exportTitle.replace(/[^a-z0-9_-]/gi, "_")}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        announce("Script downloaded as text file");
    };

    const handleSaveCurrentScript = () => {
        if (!saveTitleInput.trim()) {
            alert("Please enter a title for your script");
            return;
        }
        if (onSaveScript) {
            onSaveScript(saveTitleInput, content, saveFolderInput);
        }
        setShowSaveModal(false);
        announce(`Script saved to library under ${saveFolderInput}`);
    };

    const folders = useMemo(() => {
        const set = new Set<string>(["General", "Pitches", "Keynotes", "Videos", "Personal"]);
        savedScripts.forEach((s) => {
            if (s.folder) set.add(s.folder);
        });
        return ["All", ...Array.from(set)];
    }, [savedScripts]);

    const filteredSavedScripts = useMemo(() => {
        let list = savedScripts;
        if (selectedFolder !== "All") {
            list = list.filter((s) => s.folder === selectedFolder);
        }
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            list = list.filter((s) => s.title.toLowerCase().includes(q) || s.content.toLowerCase().includes(q));
        }
        return list;
    }, [savedScripts, selectedFolder, searchQuery]);

    // Keyboard shortcuts using stable ref callback
    const handleKeyPressRef = useRef<(e: KeyboardEvent) => void>(() => {});
    useEffect(() => {
        handleKeyPressRef.current = (e: KeyboardEvent) => {
            // Guard: Don't hijack keyboard shortcuts when user is typing in inputs/textareas
            if (["INPUT", "TEXTAREA", "SELECT"].includes((e.target as HTMLElement)?.tagName)) {
                return;
            }

            if (e.code === "Space" || e.code === "Enter") {
                e.preventDefault();
                if (showSectionPauseRef.current) {
                    continueToNextSection();
                    return;
                }
                setIsPlaying((prev) => {
                    const next = !prev;
                    announce(next ? `Teleprompter playing at ${speed} WPM` : "Teleprompter paused");
                    return next;
                });
                setShowSectionPause(false);
            } else if (e.code === "ArrowUp") {
                e.preventDefault();
                setSpeed((prev) => Math.min(prev + 5, 100));
            } else if (e.code === "ArrowDown") {
                e.preventDefault();
                setSpeed((prev) => Math.max(prev - 5, 5));
            } else if (e.code === "ArrowRight") {
                e.preventDefault();
                setFontSize((prev) => Math.min(prev + 2, 72));
            } else if (e.code === "ArrowLeft") {
                e.preventDefault();
                setFontSize((prev) => Math.max(prev - 2, 14));
            } else if (e.code === "KeyR") {
                e.preventDefault();
                resetPosition();
                announce("Reset position to top");
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
                    announce(next ? "Audio Speaker enabled" : "Audio Speaker disabled");
                    return next;
                });
            } else if (e.code === "KeyL") {
                e.preventDefault();
                setLoudAudioMode((prev) => {
                    const next = !prev;
                    localStorage.setItem("teleprompter_loud_mode", String(next));
                    if (next) playAudioChime(true);
                    announce(next ? "Best Loud Audio Mode 100% Boost ON" : "Loud Audio Mode OFF");
                    return next;
                });
            } else if (e.code === "KeyE") {
                e.preventDefault();
                setShowScriptEditor((prev) => !prev);
            } else if (e.code === "KeyB") {
                e.preventDefault();
                setShowLibrary((prev) => !prev);
            } else if (e.code === "KeyG") {
                e.preventDefault();
                setShowReadingGuide((prev) => {
                    const next = !prev;
                    announce(next ? "Reading focus line guide enabled" : "Reading guide hidden");
                    return next;
                });
            } else if (e.code === "Slash" || e.code === "KeyH") {
                e.preventDefault();
                setShowShortcutsModal((prev) => !prev);
            } else if (e.code === "KeyT") {
                e.preventDefault();
                setShowTrustModal((prev) => !prev);
            } else if (e.code === "Escape") {
                setShowTrustModal(false);
                setShowShortcutsModal(false);
                setShowAccessibilityModal(false);
                setShowAudioSettings(false);
                setShowSettings(false);
                setShowSaveModal(false);
            }
        };
    });

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (handleKeyPressRef.current) {
                handleKeyPressRef.current(e);
            }
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, []);

    // Wake Lock API
    useEffect(() => {
        const requestWakeLock = async () => {
            if ("wakeLock" in navigator) {
                try {
                    const nav = navigator as unknown as {
                        wakeLock: {
                            request: (type: string) => Promise<{ release: () => Promise<void> }>;
                        };
                    };
                    wakeLockRef.current = await nav.wakeLock.request("screen");
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

    const currentTheme = themes[theme] || themes.dark;
    const fontClass = fontFamily === "mono" ? "font-mono" : fontFamily === "serif" ? "font-serif" : "font-sans";
    const alignClass = textAlign === "center" ? "text-center" : "text-left";
    const leadingClass = lineSpacing === "loose" ? "leading-loose" : "leading-relaxed";

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
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
                    <div className="bg-gray-900 border-2 border-cyan-500/50 rounded-3xl p-6 md:p-8 max-w-md w-full text-center space-y-5 shadow-2xl relative animate-scaleIn">
                        <button
                            onClick={() => dismissSectionPause(false)}
                            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white rounded-lg transition-colors"
                            aria-label="Dismiss section pause"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="w-12 h-12 bg-cyan-500/20 border border-cyan-500/40 rounded-2xl flex items-center justify-center mx-auto text-cyan-400">
                            <Bookmark className="w-6 h-6" />
                        </div>

                        <div>
                            <h3 className="text-2xl font-bold text-white mb-1">Section Cue Reached</h3>
                            <p className="text-cyan-300 font-semibold text-lg">{currentSection}</p>
                            <p className="text-xs text-gray-400 mt-1">Take a breath, reset your pacing, and command the room.</p>
                        </div>

                        <div className="space-y-2 pt-2">
                            <button
                                onClick={continueToNextSection}
                                className="w-full py-3.5 bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-cyan-500/30 hover:scale-[1.02] transition-all flex items-center justify-center space-x-2"
                            >
                                <span>Continue Speech</span>
                                <ArrowRight className="w-5 h-5" />
                            </button>
                            <div className="text-[11px] text-gray-400">or press <kbd className="px-1.5 py-0.5 bg-gray-800 rounded text-gray-300">Space</kbd> or <kbd className="px-1.5 py-0.5 bg-gray-800 rounded text-gray-300">Enter</kbd></div>
                        </div>

                        <div className="pt-2 border-t border-gray-800">
                            <button
                                onClick={() => dismissSectionPause(true)}
                                className="text-xs text-gray-400 hover:text-amber-300 transition-colors"
                            >
                                ⚡ Don&apos;t pause at sections anymore (Continuous Scroll)
                            </button>
                        </div>
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
                            You&apos;ve completed your speech!
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
                <div className="fixed top-0 left-0 right-0 bg-gray-950/92 backdrop-blur-md border-b border-white/[0.08] px-3 py-2.5 md:px-5 md:py-2.5 z-50 transition-all duration-300 shadow-xl">
                    <div className="max-w-[1600px] mx-auto">
                        {/* Mobile Layout */}
                        <div className="md:hidden space-y-2">
                            {/* Mobile Row 1: Brand, Transport & Clock */}
                            <div className="flex items-center justify-between gap-2">
                                <button
                                    onClick={onHome || resetPosition}
                                    className="flex items-center space-x-1.5 px-2.5 py-1 bg-white/5 border border-white/10 rounded-full text-xs font-bold text-gray-200 shrink-0"
                                    title="TelePrompt Studio"
                                >
                                    <span className="w-4 h-4 rounded-full bg-gradient-to-tr from-cyan-400 to-sky-400 flex items-center justify-center text-gray-950 font-black text-[9px]">
                                        TP
                                    </span>
                                    <span>TelePrompt</span>
                                </button>

                                {/* Center Play & Reset */}
                                <div className="flex items-center space-x-1.5 bg-gray-900/90 border border-white/10 rounded-full px-2.5 py-1">
                                    <button
                                        onClick={resetPosition}
                                        className="p-1.5 bg-white/5 hover:bg-white/10 rounded-full text-gray-300 transition-colors"
                                        title="Reset"
                                        aria-label="Reset position"
                                    >
                                        <RotateCcw className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => {
                                            setIsPlaying(!isPlaying);
                                            setShowSectionPause(false);
                                        }}
                                        className={`w-8 h-8 rounded-full flex items-center justify-center text-gray-950 font-bold transition-all shadow-md ${
                                            isPlaying
                                                ? "bg-gradient-to-tr from-amber-400 to-orange-400"
                                                : "bg-gradient-to-tr from-cyan-400 to-sky-400"
                                        }`}
                                        aria-label={isPlaying ? "Pause teleprompter" : "Play teleprompter"}
                                    >
                                        {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                                    </button>
                                    <button
                                        onClick={savePosition}
                                        className="p-1.5 bg-white/5 hover:bg-white/10 rounded-full text-gray-300 transition-colors"
                                        title="Save Bookmark"
                                        aria-label="Save bookmark position"
                                    >
                                        <Bookmark className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* Clock & Settings Button */}
                                <div className="flex items-center space-x-1.5 shrink-0">
                                    <div className="flex items-center space-x-1.5 px-2 py-1 bg-black/40 border border-white/5 rounded-full text-xs font-mono font-bold text-gray-200">
                                        <span className={`w-1.5 h-1.5 rounded-full ${isPlaying ? "bg-emerald-400 animate-pulse" : "bg-gray-600"}`} />
                                        <span>{formatTime(elapsedTime)}</span>
                                    </div>
                                    <button
                                        onClick={() => setShowSettings(!showSettings)}
                                        className={`p-1.5 rounded-lg border transition-colors ${
                                            showSettings ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-300" : "bg-gray-800 border-gray-700 text-gray-300"
                                        }`}
                                        aria-label="Toggle mobile settings"
                                    >
                                        <Settings className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Mobile Row 2: Script Quick Card & Audio Guide */}
                            <div className="flex items-center justify-between gap-1.5 text-xs">
                                <div className="flex items-center space-x-1 px-2.5 py-1 bg-gray-900 border border-gray-800 rounded-lg min-w-0 flex-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                                    <button
                                        onClick={() => {
                                            setEditorText(content);
                                            setEditorScriptTitle(title);
                                            setShowScriptEditor(true);
                                        }}
                                        className="font-semibold text-gray-200 truncate text-left flex-1"
                                    >
                                        {title}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setEditorText(content);
                                            setEditorScriptTitle(title);
                                            setShowScriptEditor(true);
                                        }}
                                        className="p-1 text-gray-400 hover:text-cyan-300 shrink-0"
                                        title="Edit Script"
                                    >
                                        <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        onClick={() => setShowLibrary(true)}
                                        className="p-1 text-gray-400 hover:text-purple-300 shrink-0"
                                        title="Library"
                                    >
                                        <BookOpen className="w-3.5 h-3.5" />
                                    </button>
                                </div>

                                <button
                                    onClick={() => {
                                        const next = !audioSpeakerEnabled;
                                        setAudioSpeakerEnabled(next);
                                        localStorage.setItem("teleprompter_audio_speaker", String(next));
                                        if (next && loudAudioMode) playAudioChime(true);
                                    }}
                                    className={`px-2.5 py-1 rounded-lg font-semibold flex items-center space-x-1 shrink-0 transition-colors ${
                                        audioSpeakerEnabled
                                            ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                                            : "bg-gray-800 text-gray-400 border border-gray-700"
                                    }`}
                                >
                                    {audioSpeakerEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                                    <span>{audioSpeakerEnabled ? "Voice ON" : "Voice OFF"}</span>
                                </button>
                            </div>

                            {/* Mobile Settings Drawer */}
                            {showSettings && (
                                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-gray-800 text-xs">
                                    <div className="bg-gray-900 border border-gray-800 rounded-lg p-2">
                                        <div className="text-[10px] text-gray-400 font-semibold uppercase mb-1 flex items-center justify-between">
                                            <span>Speed</span>
                                            <span className="font-mono text-cyan-400">{speed}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <button onClick={() => adjustSpeed(-5)} className="px-2 py-1 bg-gray-800 hover:bg-gray-700 rounded font-bold">−5</button>
                                            <button onClick={() => adjustSpeed(5)} className="px-2 py-1 bg-gray-800 hover:bg-gray-700 rounded font-bold">+5</button>
                                        </div>
                                    </div>

                                    <div className="bg-gray-900 border border-gray-800 rounded-lg p-2">
                                        <div className="text-[10px] text-gray-400 font-semibold uppercase mb-1 flex items-center justify-between">
                                            <span>Font Size</span>
                                            <span className="font-mono text-purple-400">{fontSize}px</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <button onClick={() => adjustFontSize(-2)} className="px-2 py-1 bg-gray-800 hover:bg-gray-700 rounded font-bold">−2</button>
                                            <button onClick={() => adjustFontSize(2)} className="px-2 py-1 bg-gray-800 hover:bg-gray-700 rounded font-bold">+2</button>
                                        </div>
                                    </div>

                                    <div className="col-span-2 flex items-center justify-between gap-1.5 pt-1">
                                        <button
                                            onClick={() => setIsMirrored(!isMirrored)}
                                            className={`flex-1 py-1.5 rounded-lg border text-center font-medium ${
                                                isMirrored ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-300" : "bg-gray-800 border-gray-700 text-gray-300"
                                            }`}
                                        >
                                            Mirror
                                        </button>
                                        <button
                                            onClick={() => setShowAccessibilityModal(true)}
                                            className="flex-1 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-amber-300 font-medium text-center"
                                        >
                                            A11y
                                        </button>
                                        <button
                                            onClick={() => setShowShortcutsModal(true)}
                                            className="flex-1 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-gray-300 font-medium text-center"
                                        >
                                            Keys
                                        </button>
                                        <button
                                            onClick={toggleFullscreen}
                                            className="flex-1 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-gray-300 font-medium text-center"
                                        >
                                            {isFullscreen ? "Exit" : "Full"}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Desktop Layout - Broadcast Studio Pro 3-Zone Architecture */}
                        <div className="hidden md:flex items-center justify-between gap-3">
                            {/* ZONE 1: LEFT - Studio Brand & Active Script Hub */}
                            <div className="flex items-center space-x-2.5 min-w-0">
                                {/* Brand / Home Badge */}
                                <button
                                    onClick={onHome || resetPosition}
                                    className="flex items-center space-x-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-xs font-semibold text-gray-200 transition-all hover:border-cyan-500/30 shrink-0"
                                    title={onHome ? "Go Home" : "TelePrompt Studio Pro"}
                                >
                                    <span className="w-5 h-5 rounded-full bg-gradient-to-tr from-cyan-400 to-sky-400 flex items-center justify-center text-gray-950 font-black text-[10px]">
                                        TP
                                    </span>
                                    <span className="font-bold tracking-tight text-white hidden lg:inline">TelePrompt</span>
                                </button>

                                <div className="h-6 w-px bg-white/10 shrink-0" />

                                {/* Active Script Card with Edit & Library quick actions */}
                                <div className="flex items-center space-x-1.5 px-3 py-1 bg-gray-900/90 border border-gray-800 hover:border-gray-700 rounded-xl transition-all min-w-0 max-w-[280px]">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] shrink-0" />
                                    <button
                                        onClick={() => {
                                            setEditorText(content);
                                            setEditorScriptTitle(title);
                                            setShowScriptEditor(true);
                                        }}
                                        className="text-xs font-semibold text-gray-200 hover:text-cyan-300 truncate text-left transition-colors"
                                        title={`Active Script: ${title} (Click to Edit)`}
                                    >
                                        {title}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setEditorText(content);
                                            setEditorScriptTitle(title);
                                            setShowScriptEditor(true);
                                        }}
                                        className="p-1 hover:bg-cyan-500/10 text-gray-400 hover:text-cyan-300 rounded transition-colors shrink-0"
                                        title="Edit Script (E)"
                                        aria-label="Edit script content"
                                    >
                                        <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        onClick={() => setShowLibrary(true)}
                                        className="p-1 hover:bg-purple-500/10 text-gray-400 hover:text-purple-300 rounded transition-colors shrink-0"
                                        title="Open Script Library (B)"
                                        aria-label="Open script library"
                                    >
                                        <BookOpen className="w-3.5 h-3.5" />
                                    </button>
                                    {onUpload && (
                                        <label className="p-1 hover:bg-emerald-500/10 text-gray-400 hover:text-emerald-300 rounded transition-colors cursor-pointer shrink-0" title="Upload .txt">
                                            <Upload className="w-3.5 h-3.5" />
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
                                            className="p-1 hover:bg-amber-500/10 text-gray-400 hover:text-amber-300 rounded transition-colors shrink-0"
                                            title="Save Script"
                                        >
                                            <Save className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* ZONE 2: CENTER - Master Broadcast Transport Deck */}
                            <div className="flex items-center justify-center shrink-0">
                                <div className="flex items-center space-x-2 bg-gray-900/90 backdrop-blur-md border border-white/10 rounded-full px-3 py-1 shadow-2xl">
                                    {/* Restart */}
                                    <button
                                        onClick={resetPosition}
                                        className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                                        title="Restart to Beginning (R)"
                                        aria-label="Reset position"
                                    >
                                        <RotateCcw className="w-4 h-4" />
                                    </button>

                                    {/* 3s Countdown Delay */}
                                    <button
                                        onClick={() => startCountdown(3)}
                                        className="flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/5 hover:bg-cyan-500/15 text-gray-300 hover:text-cyan-300 border border-white/5 hover:border-cyan-500/30 transition-all hover:scale-105"
                                        title="Start with 3-second countdown delay"
                                    >
                                        <Clock className="w-3.5 h-3.5 text-cyan-400" />
                                        <span>3s Delay</span>
                                    </button>

                                    {/* HERO PLAY/PAUSE BUTTON */}
                                    <button
                                        onClick={() => {
                                            setIsPlaying(!isPlaying);
                                            setShowSectionPause(false);
                                        }}
                                        className={`relative w-11 h-11 rounded-full flex items-center justify-center font-bold transition-all duration-200 shadow-lg ${
                                            isPlaying
                                                ? "bg-gradient-to-tr from-amber-500 to-orange-500 text-gray-950 shadow-orange-500/30 hover:scale-105 active:scale-95"
                                                : "bg-gradient-to-tr from-cyan-400 via-teal-400 to-sky-400 text-gray-950 shadow-cyan-400/40 hover:scale-108 active:scale-95"
                                        }`}
                                        title={isPlaying ? "Pause (Space)" : "Play (Space)"}
                                        aria-label={isPlaying ? "Pause teleprompter" : "Play teleprompter"}
                                    >
                                        {isPlaying ? (
                                            <Pause className="w-5 h-5 fill-current" />
                                        ) : (
                                            <Play className="w-5 h-5 fill-current ml-0.5" />
                                        )}
                                    </button>

                                    {/* Save Bookmark */}
                                    <button
                                        onClick={savePosition}
                                        className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                                        title="Bookmark Current Spot (S)"
                                        aria-label="Save bookmark position"
                                    >
                                        <Bookmark className="w-4 h-4" />
                                    </button>

                                    <div className="h-5 w-px bg-white/10" />

                                    {/* Monospace Digital Broadcast Clock */}
                                    <div className="flex items-center space-x-2 px-2.5 py-1 bg-black/40 border border-white/5 rounded-full" title="Elapsed Time">
                                        <span
                                            className={`w-2 h-2 rounded-full transition-all duration-300 ${
                                                isPlaying
                                                    ? "bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse"
                                                    : "bg-gray-600"
                                            }`}
                                        />
                                        <span className="font-mono text-xs font-bold text-gray-200 tracking-wider">
                                            {formatTime(elapsedTime)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* ZONE 3: RIGHT - Precision Tuning & Studio Tools */}
                            <div className="flex items-center space-x-2 justify-end shrink-0">
                                {/* Speed Stepper */}
                                <div className="flex items-center space-x-1 px-2.5 py-1 bg-gray-900/90 border border-gray-800 hover:border-gray-700 rounded-xl" title="Prompter Scroll Speed (WPM)">
                                    <Zap className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                                    <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider hidden xl:inline">Speed</span>
                                    <button
                                        onClick={() => adjustSpeed(-5)}
                                        className="w-5 h-5 rounded bg-white/5 hover:bg-cyan-500/20 text-gray-300 hover:text-cyan-300 flex items-center justify-center text-xs font-bold transition-colors"
                                        title="Decrease speed"
                                        aria-label="Decrease speed"
                                    >
                                        −
                                    </button>
                                    <span className="font-mono text-xs font-bold text-gray-200 w-6 text-center">{speed}</span>
                                    <button
                                        onClick={() => adjustSpeed(5)}
                                        className="w-5 h-5 rounded bg-white/5 hover:bg-cyan-500/20 text-gray-300 hover:text-cyan-300 flex items-center justify-center text-xs font-bold transition-colors"
                                        title="Increase speed"
                                        aria-label="Increase speed"
                                    >
                                        +
                                    </button>
                                </div>

                                {/* Font Size Stepper */}
                                <div className="flex items-center space-x-1 px-2.5 py-1 bg-gray-900/90 border border-gray-800 hover:border-gray-700 rounded-xl" title="Text Font Size">
                                    <span className="text-xs font-bold text-purple-400 mr-0.5">Aa</span>
                                    <button
                                        onClick={() => adjustFontSize(-2)}
                                        className="w-5 h-5 rounded bg-white/5 hover:bg-purple-500/20 text-gray-300 hover:text-purple-300 flex items-center justify-center text-xs font-bold transition-colors"
                                        title="Decrease font size"
                                        aria-label="Decrease font size"
                                    >
                                        −
                                    </button>
                                    <span className="font-mono text-xs font-bold text-gray-200 w-8 text-center">{fontSize}px</span>
                                    <button
                                        onClick={() => adjustFontSize(2)}
                                        className="w-5 h-5 rounded bg-white/5 hover:bg-purple-500/20 text-gray-300 hover:text-purple-300 flex items-center justify-center text-xs font-bold transition-colors"
                                        title="Increase font size"
                                        aria-label="Increase font size"
                                    >
                                        +
                                    </button>
                                </div>

                                {/* Audio Speaker & Voice Guide Toggle */}
                                <div className="flex items-center space-x-1">
                                    <button
                                        onClick={() => {
                                            const next = !audioSpeakerEnabled;
                                            setAudioSpeakerEnabled(next);
                                            localStorage.setItem("teleprompter_audio_speaker", String(next));
                                            if (next && loudAudioMode) playAudioChime(true);
                                        }}
                                        className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                                            audioSpeakerEnabled
                                                ? "bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.2)]"
                                                : "bg-gray-900/90 border border-gray-800 text-gray-400 hover:text-gray-200 hover:border-gray-700"
                                        }`}
                                        title="Voice Guide / Audio Speaker (A)"
                                    >
                                        {audioSpeakerEnabled ? (
                                            <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                                        ) : (
                                            <VolumeX className="w-3.5 h-3.5 text-gray-400" />
                                        )}
                                        <span className="hidden xl:inline">{audioSpeakerEnabled ? "Voice ON" : "Voice OFF"}</span>
                                        {audioSpeakerEnabled && isSpeaking && isPlaying && (
                                            <span className="flex items-center space-x-0.5 ml-0.5">
                                                <span className="w-1 h-2 bg-cyan-400 animate-soundwave-1 rounded-full" />
                                                <span className="w-1 h-3 bg-cyan-400 animate-soundwave-2 rounded-full" />
                                                <span className="w-1 h-1.5 bg-cyan-400 animate-soundwave-3 rounded-full" />
                                            </span>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => setShowAudioSettings(true)}
                                        className="p-2 bg-gray-900/90 border border-gray-800 hover:border-gray-700 rounded-xl text-cyan-400 hover:text-white transition-colors"
                                        title="Voice & Loud Mode Settings"
                                        aria-label="Open voice settings"
                                    >
                                        <Headphones className="w-3.5 h-3.5" />
                                    </button>
                                </div>

                                {/* Quick Toggles: Mirror, Theme, A11y, Fullscreen, Collapse */}
                                <div className="flex items-center space-x-1 border-l border-white/10 pl-2">
                                    <button
                                        onClick={() => setIsMirrored(!isMirrored)}
                                        className={`p-2 rounded-xl transition-all ${
                                            isMirrored
                                                ? "bg-cyan-500/20 border border-cyan-500/40 text-cyan-300"
                                                : "bg-gray-900/90 border border-gray-800 hover:border-gray-700 text-gray-400 hover:text-white"
                                        }`}
                                        title="Mirror Horizontal Flip (M) - For Beam Splitter Glass"
                                        aria-label="Mirror text horizontally"
                                    >
                                        <Monitor className="w-3.5 h-3.5" />
                                    </button>

                                    <select
                                        value={theme}
                                        onChange={(e) => setTheme(e.target.value as Theme)}
                                        className="bg-gray-900/90 border border-gray-800 hover:border-gray-700 rounded-xl px-2 py-1.5 text-xs text-gray-300 outline-none cursor-pointer hidden lg:block"
                                        aria-label="Color theme"
                                    >
                                        <option value="dark">⚫ Dark OLED</option>
                                        <option value="light">⚪ Light</option>
                                        <option value="sepia">📜 Sepia</option>
                                        <option value="blue">🔵 Studio Blue</option>
                                        <option value="contrast">🟡 WCAG AAA</option>
                                    </select>

                                    <button
                                        onClick={() => setShowAccessibilityModal(true)}
                                        className="p-2 bg-gray-900/90 border border-gray-800 hover:border-gray-700 rounded-xl text-amber-400 hover:text-amber-300 transition-colors"
                                        title="Accessibility, Font & Reading Guide"
                                        aria-label="Open accessibility settings"
                                    >
                                        <Eye className="w-3.5 h-3.5" />
                                    </button>

                                    <button
                                        onClick={() => setShowShortcutsModal(true)}
                                        className="p-2 bg-gray-900/90 border border-gray-800 hover:border-gray-700 rounded-xl text-gray-400 hover:text-white transition-colors"
                                        title="Keyboard Shortcuts (? or H)"
                                        aria-label="Open keyboard shortcuts"
                                    >
                                        <HelpCircle className="w-3.5 h-3.5" />
                                    </button>

                                    <button
                                        onClick={() => setShowTrustModal(true)}
                                        className="p-2 bg-gray-900/90 border border-gray-800 hover:border-gray-700 rounded-xl text-emerald-400 hover:text-emerald-300 transition-colors"
                                        title="Web Trust, Privacy & Legal Compliance (T)"
                                        aria-label="Open trust and compliance center"
                                    >
                                        <Shield className="w-3.5 h-3.5" />
                                    </button>

                                    <button
                                        onClick={toggleFullscreen}
                                        className="p-2 bg-gray-900/90 border border-gray-800 hover:border-gray-700 rounded-xl text-gray-400 hover:text-white transition-colors"
                                        title="Fullscreen (F)"
                                        aria-label="Toggle fullscreen"
                                    >
                                        {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
                                    </button>

                                    <button
                                        onClick={() => setShowControls(false)}
                                        className="p-2 bg-gray-900/90 border border-gray-800 hover:border-gray-700 rounded-xl text-gray-400 hover:text-white transition-colors"
                                        title="Hide Controls (C)"
                                        aria-label="Hide controls"
                                    >
                                        <ChevronUp className="w-3.5 h-3.5" />
                                    </button>
                                </div>
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

            {/* Reading Focus Guide Ruler (WCAG AAA reading aid) */}
            {showReadingGuide && (
                <div 
                    className="fixed top-1/2 left-0 right-0 -translate-y-1/2 pointer-events-none z-30 transition-all duration-200"
                    style={{
                        height: `${Math.max(48, fontSize * 2.2)}px`,
                        backgroundColor: theme === 'contrast' ? 'rgba(255, 230, 0, 0.16)' : 'rgba(56, 189, 248, 0.12)',
                        borderTop: theme === 'contrast' ? '2px solid rgba(255, 230, 0, 0.8)' : '2px solid rgba(56, 189, 248, 0.6)',
                        borderBottom: theme === 'contrast' ? '2px solid rgba(255, 230, 0, 0.8)' : '2px solid rgba(56, 189, 248, 0.6)',
                        boxShadow: theme === 'contrast' ? '0 0 25px rgba(255, 230, 0, 0.3)' : '0 0 25px rgba(56, 189, 248, 0.25)',
                        opacity: guideOpacity,
                    }}
                />
            )}

            {/* Dimming Overlay for Read Text (above the green line) */}
            <div
                className="fixed top-0 left-0 right-0 z-30 pointer-events-none"
                style={{
                    height: '50%',
                    background: `linear-gradient(to bottom, ${theme === 'dark' ? 'rgba(0, 0, 0, 0.6)' :
                            theme === 'light' ? 'rgba(255, 255, 255, 0.6)' :
                                theme === 'sepia' ? 'rgba(244, 236, 216, 0.6)' :
                                    theme === 'contrast' ? 'rgba(0, 0, 0, 0.75)' :
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
                        className={`${fontClass} ${alignClass} ${leadingClass} select-none space-y-6`}
                        style={{
                            fontSize: `${fontSize}px`,
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

            {/* All-In-One Opening Page Workspace Cockpit - First Fold / No Unnecessary Space / No Scroll */}
            {!isPlaying && position === 0 && (
                <div className="fixed inset-0 bg-[#070c18]/95 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4 select-none">
                    <div className="bg-[#0b1322] border border-[#1e2c45] rounded-3xl p-4 sm:p-5 md:p-6 max-w-4xl w-full shadow-[0_25px_80px_rgba(0,0,0,0.85)] animate-scaleIn flex flex-col gap-3.5 sm:gap-4 overflow-hidden">
                        {/* 1. Header Row (Title, Dynamic Stats & 3-Step Flow Pill) */}
                        <div className="flex items-center justify-between gap-3 border-b border-[#1e2c45]/80 pb-3 shrink-0">
                            <div className="flex flex-col space-y-1 min-w-0">
                                <div className="flex items-center space-x-2.5 min-w-0">
                                    <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 bg-cyan-950/60 border border-cyan-500/40 rounded-full text-cyan-300 text-[10px] font-extrabold uppercase tracking-wider shrink-0">
                                        <Sparkles className="w-2.5 h-2.5 text-cyan-400" />
                                        <span>Studio Pro</span>
                                    </span>
                                    <h1 className="text-base sm:text-lg md:text-xl font-black text-white truncate">
                                        {title.replace(/^[\p{Emoji}\s]+/u, '').trim() || title}
                                    </h1>
                                </div>
                                <div className="flex items-center space-x-2 text-[11px] text-gray-400">
                                    <span className="flex items-center space-x-1 text-gray-300">
                                        <FileText className="w-3 h-3 text-cyan-400" />
                                        <span>{totalWords} words</span>
                                    </span>
                                    <span className="text-gray-600">•</span>
                                    <span className="flex items-center space-x-1 text-gray-300">
                                        <Clock className="w-3 h-3 text-cyan-400" />
                                        <span>~{formatTime(estimatedTotalTime)}</span>
                                    </span>
                                    <span className="text-gray-600">•</span>
                                    <span className="flex items-center space-x-1 text-amber-300 font-medium">
                                        <Zap className="w-3 h-3 text-amber-400" />
                                        <span>130 WPM</span>
                                    </span>
                                </div>
                            </div>

                            {/* 3-Step Workflow Pill (Header Right, Matching Screenshot) */}
                            <div className="hidden sm:flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#070e1c] border border-cyan-500/20 text-xs font-semibold text-cyan-300 shrink-0 shadow-sm">
                                <span className="font-bold text-cyan-300">1. Select Script</span>
                                <span className="text-gray-600">→</span>
                                <span className="font-bold text-cyan-300">2. Voice Guide</span>
                                <span className="text-gray-600">→</span>
                                <span className="font-bold text-emerald-400">3. Space to Play</span>
                            </div>
                        </div>

                        {/* 3. Middle 2-Column Section */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 min-h-0">
                            {/* LEFT COLUMN: STARTER TEMPLATES + TOOLS (7 cols) */}
                            <div className="md:col-span-7 flex flex-col justify-between space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center space-x-1.5">
                                        <Rocket className="w-3 h-3 text-cyan-400" />
                                        <span>STARTER TEMPLATES</span>
                                    </span>
                                    <span className="text-[10px] text-gray-500 font-medium">Click to load instantly</span>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    {QUICK_TEMPLATES.map((tmpl) => {
                                        const isSelected = 
                                            (tmpl.id === "youtube_video" && (title.includes("YouTube") || title.includes("High-Engagement"))) ||
                                            (tmpl.id === "investor_pitch" && (title.includes("Investor") || title.includes("Pitch"))) ||
                                            (tmpl.id === "keynote_speech" && (title.includes("Keynote") || title.includes("Inspiring"))) ||
                                            (tmpl.id === "wedding_toast" && (title.includes("Toast") || title.includes("Heartfelt")));
                                        
                                        let IconComponent = Rocket;
                                        let iconBg = "bg-teal-500/10 border-teal-500/20 text-teal-400";
                                        if (tmpl.id === "keynote_speech") {
                                            IconComponent = Mic;
                                            iconBg = "bg-purple-500/10 border-purple-500/20 text-purple-400";
                                        } else if (tmpl.id === "youtube_video") {
                                            IconComponent = Video;
                                            iconBg = "bg-rose-500/10 border-rose-500/20 text-rose-400";
                                        } else if (tmpl.id === "wedding_toast") {
                                            IconComponent = Heart;
                                            iconBg = "bg-amber-500/10 border-amber-500/20 text-amber-400";
                                        }

                                        return (
                                            <button
                                                key={tmpl.id}
                                                onClick={() => handleSelectTemplate(tmpl.id)}
                                                className={`p-2 rounded-xl text-left transition-all flex items-center space-x-2.5 group cursor-pointer ${
                                                    isSelected
                                                        ? "bg-cyan-950/40 border-2 border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.25)]"
                                                        : "bg-[#0e1726] hover:bg-[#142036] border border-[#1e2c45]"
                                                }`}
                                            >
                                                <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${iconBg}`}>
                                                    <IconComponent className="w-3.5 h-3.5" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="text-xs font-bold text-white group-hover:text-cyan-300 truncate">
                                                        {tmpl.title.replace(/^[\p{Emoji}\s]+/u, '').trim()}
                                                    </div>
                                                    <div className="text-[10px] text-gray-400 truncate">
                                                        {tmpl.category}
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Quick Tools 4-Grid in Left Column */}
                                <div className="grid grid-cols-4 gap-2 pt-0.5">
                                    <button
                                        onClick={() => {
                                            setEditorText(content);
                                            setEditorScriptTitle(title);
                                            setShowScriptEditor(true);
                                        }}
                                        className="p-1.5 bg-[#0e1726] hover:bg-[#142036] border border-[#1e2c45] rounded-xl flex flex-col items-center justify-center text-center transition-all group cursor-pointer"
                                    >
                                        <Edit3 className="w-3.5 h-3.5 text-cyan-400 mb-0.5" />
                                        <span className="text-[10px] font-bold text-white group-hover:text-cyan-300">Edit</span>
                                        <span className="text-[9px] text-gray-500 font-mono">E</span>
                                    </button>

                                    <button
                                        onClick={() => setShowLibrary(true)}
                                        className="p-1.5 bg-[#0e1726] hover:bg-[#142036] border border-[#1e2c45] rounded-xl flex flex-col items-center justify-center text-center transition-all group cursor-pointer"
                                    >
                                        <BookOpen className="w-3.5 h-3.5 text-purple-400 mb-0.5" />
                                        <span className="text-[10px] font-bold text-white group-hover:text-purple-300">Library</span>
                                        <span className="text-[9px] text-gray-500 font-mono">B</span>
                                    </button>

                                    <button
                                        onClick={() => setShowAccessibilityModal(true)}
                                        className="p-1.5 bg-[#0e1726] hover:bg-[#142036] border border-[#1e2c45] rounded-xl flex flex-col items-center justify-center text-center transition-all group cursor-pointer"
                                    >
                                        <Eye className="w-3.5 h-3.5 text-amber-400 mb-0.5" />
                                        <span className="text-[10px] font-bold text-white group-hover:text-amber-300">Contrast</span>
                                        <span className="text-[9px] text-gray-500 font-mono">{theme === 'contrast' ? 'AAA' : 'OLED'}</span>
                                    </button>

                                    <button
                                        onClick={() => setShowShortcutsModal(true)}
                                        className="p-1.5 bg-[#0e1726] hover:bg-[#142036] border border-[#1e2c45] rounded-xl flex flex-col items-center justify-center text-center transition-all group cursor-pointer"
                                    >
                                        <Keyboard className="w-3.5 h-3.5 text-blue-400 mb-0.5" />
                                        <span className="text-[10px] font-bold text-white group-hover:text-blue-300">Shortcuts</span>
                                        <span className="text-[9px] text-gray-500 font-mono">?</span>
                                    </button>
                                </div>
                            </div>

                            {/* RIGHT COLUMN: VOICE GUIDE CARD (5 cols) */}
                            <div className="md:col-span-5 bg-[#0c1628] border border-cyan-500/30 rounded-2xl p-3 flex flex-col justify-between shadow-lg space-y-2">
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center space-x-2">
                                        <div className="w-8 h-8 bg-cyan-500/10 border border-cyan-500/30 rounded-lg flex items-center justify-center text-cyan-400 shrink-0">
                                            <Volume2 className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h3 className="text-xs font-bold text-white">Voice Guide</h3>
                                            <p className="text-[10px] text-gray-300">Cadence coaching & pauses</p>
                                        </div>
                                    </div>

                                    {/* Custom Switch Toggle */}
                                    <button
                                        onClick={() => {
                                            const next = !audioSpeakerEnabled;
                                            setAudioSpeakerEnabled(next);
                                            localStorage.setItem("teleprompter_audio_speaker", String(next));
                                            if (next && loudAudioMode) playAudioChime(true);
                                        }}
                                        className="flex items-center space-x-1.5 shrink-0 cursor-pointer"
                                        aria-label="Toggle voice guide"
                                    >
                                        <div className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors duration-200 ${
                                            audioSpeakerEnabled ? "bg-cyan-500 justify-end" : "bg-gray-800 border border-gray-700 justify-start"
                                        }`}>
                                            <div className={`w-3.5 h-3.5 rounded-full transition-transform duration-200 ${
                                                audioSpeakerEnabled ? "bg-gray-950" : "bg-white"
                                            }`} />
                                        </div>
                                        <span className={`text-[11px] font-bold ${audioSpeakerEnabled ? "text-cyan-300" : "text-gray-400"}`}>
                                            {audioSpeakerEnabled ? "On" : "Off"}
                                        </span>
                                    </button>
                                </div>

                                {/* Volume Mode (Normal vs Best Loud Audio Mode) */}
                                <div className="space-y-1 bg-[#080d18] border border-gray-800 rounded-xl p-2">
                                    <div className="flex items-center justify-between text-[11px]">
                                        <span className="flex items-center space-x-1 text-gray-300 font-medium">
                                            <Megaphone className="w-3 h-3 text-amber-400" />
                                            <span>Volume mode:</span>
                                        </span>
                                        <div className="bg-[#0b1322] border border-gray-700/80 rounded-lg p-0.5 flex items-center">
                                            <button
                                                onClick={() => {
                                                    setLoudAudioMode(false);
                                                    localStorage.setItem("teleprompter_loud_mode", "false");
                                                }}
                                                className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                                                    !loudAudioMode ? "bg-cyan-900/60 text-cyan-300 border border-cyan-500/40" : "text-gray-400 hover:text-white"
                                                }`}
                                            >
                                                Normal
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setLoudAudioMode(true);
                                                    localStorage.setItem("teleprompter_loud_mode", "true");
                                                    playAudioChime(true);
                                                }}
                                                className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                                                    loudAudioMode ? "bg-gradient-to-r from-amber-500 to-orange-500 text-black font-extrabold" : "text-gray-400 hover:text-white"
                                                }`}
                                            >
                                                Loud Boost
                                            </button>
                                        </div>
                                    </div>
                                    {loudAudioMode && (
                                        <div className="text-[10px] text-amber-300/90 font-medium">
                                            ⚡ High-projection vocal audio active for noisy halls
                                        </div>
                                    )}
                                </div>

                                {/* Test Speaker & Settings Action Row (Fixed Voice Settings typo) */}
                                <div className="flex items-center gap-2 pt-1 border-t border-[#1e2c45]">
                                    <button
                                        onClick={() => setShowAudioSettings(true)}
                                        className="flex-1 py-1.5 px-2 rounded-xl bg-[#131d2e] hover:bg-[#1c2a42] border border-gray-700/80 text-[11px] font-semibold text-gray-300 flex items-center justify-center space-x-1 transition-colors cursor-pointer"
                                    >
                                        <Headphones className="w-3 h-3 text-cyan-400" />
                                        <span>Voice Settings</span>
                                    </button>
                                    <button
                                        onClick={testAudioSpeaker}
                                        disabled={audioTestPlaying}
                                        className="flex-1 py-1.5 px-2 rounded-xl bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-500/50 text-[11px] font-bold text-cyan-300 flex items-center justify-center space-x-1 transition-colors cursor-pointer"
                                    >
                                        <Volume2 className="w-3 h-3 text-cyan-400" />
                                        <span>{audioTestPlaying ? "Testing..." : "Test Audio"}</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* 4. Bottom Action Row + Trust Footer */}
                        <div className="space-y-2 shrink-0 pt-2 border-t border-[#1e2c45]/80">
                            <div className="flex flex-col sm:flex-row gap-2">
                                <button
                                    onClick={() => {
                                        setPosition(0);
                                        setElapsedTime(0);
                                        setCurrentSentenceIndex(0);
                                        setIsPlaying(true);
                                        if (audioSpeakerEnabled && loudAudioMode) playAudioChime(true);
                                    }}
                                    className="flex-1 py-3 px-5 bg-gradient-to-r from-[#2563eb] via-[#0284c7] to-[#10b981] hover:brightness-110 text-white font-black text-sm rounded-xl shadow-lg shadow-cyan-500/20 flex items-center justify-center space-x-2 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                                >
                                    <Play className="w-4 h-4 fill-current" />
                                    <span>Start teleprompter</span>
                                    <span className="px-1.5 py-0.2 bg-white/20 rounded text-[10px] font-mono font-bold text-white">
                                        Space
                                    </span>
                                </button>
                                <button
                                    onClick={() => startCountdown(3)}
                                    className="py-3 px-4 rounded-xl bg-[#111927] hover:bg-[#182336] border border-[#1e2c45] text-gray-200 font-bold text-xs flex items-center justify-center space-x-1.5 transition-all hover:scale-[1.01] cursor-pointer"
                                >
                                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                                    <span>3s countdown</span>
                                </button>
                                <button
                                    onClick={() => startCountdown(5)}
                                    className="py-3 px-4 rounded-xl bg-[#111927] hover:bg-[#182336] border border-[#1e2c45] text-gray-200 font-bold text-xs flex items-center justify-center space-x-1.5 transition-all hover:scale-[1.01] cursor-pointer"
                                >
                                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                                    <span>5s countdown</span>
                                </button>
                            </div>

                            {/* Trust, Privacy & Developer Signature Footer (web-trust-and-compliance skill) */}
                            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-gray-400 pt-0.5">
                                <div className="flex items-center space-x-2">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                                    <span className="text-gray-300 font-medium">100% Client-Side Prompter</span>
                                    <span className="text-gray-600">•</span>
                                    <span className="text-gray-400">Zero data leaves browser</span>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <button
                                        onClick={() => setShowTrustModal(true)}
                                        className="flex items-center space-x-1.5 text-cyan-400 hover:text-cyan-300 font-semibold transition-colors cursor-pointer"
                                        aria-label="Open Trust and Compliance Center"
                                    >
                                        <Shield className="w-3.5 h-3.5 text-emerald-400" />
                                        <span>Trust &amp; Legal Center</span>
                                    </button>
                                    <span className="text-gray-600">•</span>
                                    <span className="text-gray-400">
                                        By <a href="https://github.com/carthworks" target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:underline">@carthworks</a>
                                    </span>
                                </div>
                            </div>
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
            {/* Script Editor Modal (E) */}
            {showScriptEditor && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[115] p-4">
                    <div className="bg-gray-900 border-2 border-cyan-500/40 rounded-3xl p-6 md:p-8 max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl space-y-4 animate-scaleIn">
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-cyan-500/20 border border-cyan-500/40 rounded-xl flex items-center justify-center text-cyan-400">
                                    <Edit3 className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white">In-Place Script Editor</h2>
                                    <p className="text-xs text-gray-400">Edit, format, and structure your prompter script with cues</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowScriptEditor(false)}
                                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                                aria-label="Close editor"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Title & Template Selector */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="sm:col-span-2">
                                <label className="text-xs text-gray-400 font-semibold mb-1 block">Script Title</label>
                                <input
                                    type="text"
                                    value={editorScriptTitle}
                                    onChange={(e) => setEditorScriptTitle(e.target.value)}
                                    placeholder="Enter speech or presentation title..."
                                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-400 font-semibold mb-1 block">Load Template</label>
                                <select
                                    onChange={(e) => {
                                        if (e.target.value) handleSelectTemplate(e.target.value);
                                    }}
                                    defaultValue=""
                                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-cyan-500"
                                >
                                    <option value="" disabled>Choose template...</option>
                                    {QUICK_TEMPLATES.map((t) => (
                                        <option key={t.id} value={t.id}>{t.title}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Quick Section Insertion Pills */}
                        <div className="flex items-center space-x-1.5 overflow-x-auto py-1 text-xs text-gray-300">
                            <span className="text-gray-400 font-semibold shrink-0">Insert Cue:</span>
                            {["Intro", "The Problem", "Solution", "Key Takeaway", "Pause", "Conclusion"].map((cue) => (
                                <button
                                    key={cue}
                                    onClick={() => handleInsertSectionTag(cue)}
                                    className="px-2.5 py-1 bg-gray-800 hover:bg-cyan-950/60 border border-gray-700 hover:border-cyan-500/50 rounded-lg shrink-0 flex items-center space-x-1 transition-colors"
                                >
                                    <Plus className="w-3 h-3 text-cyan-400" />
                                    <span>[{cue}]</span>
                                </button>
                            ))}
                        </div>

                        {/* Main Textarea */}
                        <div className="flex-1 min-h-[260px] relative">
                            <textarea
                                value={editorText}
                                onChange={(e) => setEditorText(e.target.value)}
                                placeholder="Paste or type your script here... Use [Square Brackets] for auto-pausing section headers."
                                className="w-full h-full min-h-[260px] bg-gray-950 border border-gray-800 rounded-2xl p-4 text-sm md:text-base text-gray-100 font-sans leading-relaxed resize-none focus:outline-none focus:border-cyan-500"
                            />
                        </div>

                        {/* Footer Stats & Actions */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-800">
                            <div className="flex items-center space-x-4 text-xs text-gray-400">
                                <span>Words: <strong className="text-white">{editorText.split(/\s+/).filter(Boolean).length}</strong></span>
                                <span>Chars: <strong className="text-white">{editorText.length}</strong></span>
                                <span>Est. Duration: <strong className="text-white">{formatTime(Math.round((editorText.split(/\s+/).filter(Boolean).length / 120) * 60))}</strong></span>
                            </div>

                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => {
                                        setSaveTitleInput(editorScriptTitle);
                                        setShowSaveModal(true);
                                    }}
                                    className="px-3.5 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors"
                                >
                                    <Bookmark className="w-3.5 h-3.5 text-purple-400" />
                                    <span>Save to Library</span>
                                </button>
                                <button
                                    onClick={() => handleExportTxt({ title: editorScriptTitle, content: editorText })}
                                    className="px-3.5 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors"
                                >
                                    <Download className="w-3.5 h-3.5 text-green-400" />
                                    <span>Export .txt</span>
                                </button>
                                <button
                                    onClick={handleApplyEditor}
                                    className="px-5 py-2 bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 text-white rounded-xl text-xs font-bold shadow-lg hover:shadow-cyan-500/30 hover:scale-105 transition-all flex items-center space-x-1.5"
                                >
                                    <Check className="w-4 h-4" />
                                    <span>Apply to Prompter</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Script Library Modal (B) */}
            {showLibrary && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[115] p-4">
                    <div className="bg-gray-900 border-2 border-purple-500/40 rounded-3xl p-6 md:p-8 max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl space-y-4 animate-scaleIn">
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-purple-500/20 border border-purple-500/40 rounded-xl flex items-center justify-center text-purple-400">
                                    <BookOpen className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white">Script Library & Templates</h2>
                                    <p className="text-xs text-gray-400">Manage saved speeches, categorized folders, and starter templates</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowLibrary(false)}
                                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                                aria-label="Close library"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Search & Actions Bar */}
                        <div className="flex flex-col sm:flex-row gap-2">
                            <div className="relative flex-1">
                                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search saved scripts..."
                                    className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                                />
                            </div>
                            <div className="flex items-center space-x-2">
                                {onUpload && (
                                    <label className="px-3.5 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl text-xs font-semibold text-gray-300 cursor-pointer flex items-center space-x-1.5 transition-colors">
                                        <Upload className="w-3.5 h-3.5 text-cyan-400" />
                                        <span>Upload .txt</span>
                                        <input
                                            type="file"
                                            accept=".txt,text/plain"
                                            onChange={(e) => {
                                                onUpload(e);
                                                setShowLibrary(false);
                                            }}
                                            className="hidden"
                                        />
                                    </label>
                                )}
                                <button
                                    onClick={() => {
                                        setEditorText("");
                                        setEditorScriptTitle("Untitled Speech");
                                        setShowLibrary(false);
                                        setShowScriptEditor(true);
                                    }}
                                    className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>New Script</span>
                                </button>
                            </div>
                        </div>

                        {/* Folder Filter Tabs */}
                        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs">
                            {folders.map((folder) => (
                                <button
                                    key={folder}
                                    onClick={() => setSelectedFolder(folder)}
                                    className={`px-3 py-1.5 rounded-xl font-medium shrink-0 transition-colors flex items-center space-x-1.5 ${
                                        selectedFolder === folder
                                            ? "bg-purple-600 text-white"
                                            : "bg-gray-800 hover:bg-gray-700 text-gray-400 border border-gray-700"
                                    }`}
                                >
                                    <Folder className="w-3 h-3" />
                                    <span>{folder}</span>
                                </button>
                            ))}
                        </div>

                        {/* Scripts List */}
                        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 max-h-[360px]">
                            {filteredSavedScripts.length > 0 ? (
                                filteredSavedScripts.map((script) => (
                                    <div
                                        key={script.id}
                                        className="p-4 bg-gray-800/60 hover:bg-gray-800 border border-gray-700 rounded-2xl flex items-center justify-between transition-all group"
                                    >
                                        <div className="space-y-1 max-w-[65%]">
                                            <div className="flex items-center space-x-2">
                                                <h4 className="text-sm font-bold text-white truncate">{script.title}</h4>
                                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-medium">
                                                    {script.folder || "General"}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-400 line-clamp-1">{script.content}</p>
                                            <div className="text-[10px] text-gray-500">
                                                {script.content.split(/\s+/).filter(Boolean).length} words • {new Date(script.updatedAt || script.createdAt).toLocaleDateString()}
                                            </div>
                                        </div>

                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={() => {
                                                    if (onLoadScript) onLoadScript(script);
                                                    setShowLibrary(false);
                                                    resetPosition();
                                                }}
                                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors"
                                            >
                                                Load
                                            </button>
                                            <button
                                                onClick={() => handleExportTxt({ title: script.title, content: script.content })}
                                                className="p-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors"
                                                title="Download .txt"
                                            >
                                                <Download className="w-4 h-4" />
                                            </button>
                                            {onDeleteScript && (
                                                <button
                                                    onClick={() => onDeleteScript(script.id)}
                                                    className="p-1.5 bg-red-900/40 hover:bg-red-900/70 border border-red-700/50 text-red-300 rounded-lg transition-colors"
                                                    title="Delete script"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-gray-400 space-y-2">
                                    <FileText className="w-8 h-8 mx-auto text-gray-600" />
                                    <p className="text-sm">No saved scripts found in this category.</p>
                                    <p className="text-xs text-gray-500">Click &ldquo;New Script&rdquo; or save your current text to build your library.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Accessibility & Typography Modal (A11y) */}
            {showAccessibilityModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[115] p-4">
                    <div className="bg-gray-900 border-2 border-amber-500/40 rounded-3xl p-6 md:p-8 max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-5 animate-scaleIn">
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-amber-500/20 border border-amber-500/40 rounded-xl flex items-center justify-center text-amber-400">
                                    <Eye className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white">Accessibility & Focus Suite</h2>
                                    <p className="text-xs text-gray-400">WCAG AAA contrast, dyslexia-friendly fonts, and reading focus ruler</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowAccessibilityModal(false)}
                                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                                aria-label="Close accessibility modal"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Themes (Including WCAG AAA Yellow/Black) */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block">
                                Visual Theme & Contrast
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {(Object.keys(themes) as Theme[]).map((tKey) => {
                                    const tObj = themes[tKey];
                                    const isSelected = theme === tKey;
                                    return (
                                        <button
                                            key={tKey}
                                            onClick={() => {
                                                setTheme(tKey);
                                                announce(`Switched theme to ${tObj.name}`);
                                            }}
                                            className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                                                isSelected
                                                    ? "border-amber-400 bg-amber-500/10 ring-2 ring-amber-400"
                                                    : "border-gray-700 bg-gray-800/60 hover:bg-gray-800"
                                            }`}
                                        >
                                            <div>
                                                <div className="text-xs font-bold text-white">{tObj.name}</div>
                                                <div className="text-[10px] text-gray-400 mt-0.5">
                                                    {tKey === "contrast" ? "Maximum Visibility (WCAG AAA)" : `${tKey} background`}
                                                </div>
                                            </div>
                                            {isSelected && <Check className="w-4 h-4 text-amber-400 shrink-0" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Font Family Selection */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block">
                                Typography & Reading Comfort
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { id: "sans", name: "Modern Sans", desc: "Inter / System" },
                                    { id: "mono", name: "Clean Mono", desc: "Dyslexia-Friendly" },
                                    { id: "serif", name: "Editorial Serif", desc: "Classic Cadence" },
                                ].map((font) => (
                                    <button
                                        key={font.id}
                                        onClick={() => setFontFamily(font.id as "sans" | "mono" | "serif")}
                                        className={`p-2.5 rounded-xl border text-center transition-all ${
                                            fontFamily === font.id
                                                ? "border-amber-400 bg-amber-500/10 ring-2 ring-amber-400"
                                                : "border-gray-700 bg-gray-800/60 hover:bg-gray-800"
                                        }`}
                                    >
                                        <div className={`text-xs font-bold text-white ${font.id === "mono" ? "font-mono" : font.id === "serif" ? "font-serif" : "font-sans"}`}>
                                            {font.name}
                                        </div>
                                        <div className="text-[10px] text-gray-400 mt-0.5">{font.desc}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Horizontal Focus Guide Ruler */}
                        <div className="p-4 bg-gray-800/60 border border-gray-700 rounded-2xl space-y-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="font-semibold text-white text-sm">Eye-Level Reading Focus Guide</div>
                                    <div className="text-xs text-gray-400">High-visibility highlighted band at prompter center (G)</div>
                                </div>
                                <button
                                    onClick={() => setShowReadingGuide(!showReadingGuide)}
                                    className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                                        showReadingGuide ? "bg-amber-500" : "bg-gray-700"
                                    }`}
                                >
                                    <div
                                        className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                                            showReadingGuide ? "translate-x-6" : "translate-x-0"
                                        }`}
                                    />
                                </button>
                            </div>

                            {showReadingGuide && (
                                <div className="space-y-1 pt-1 border-t border-gray-700">
                                    <div className="flex justify-between text-xs text-gray-400">
                                        <span>Guide Opacity</span>
                                        <span>{Math.round(guideOpacity * 100)}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0.2"
                                        max="1.0"
                                        step="0.05"
                                        value={guideOpacity}
                                        onChange={(e) => setGuideOpacity(parseFloat(e.target.value))}
                                        className="w-full"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Text Alignment & Line Spacing */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block">Alignment</label>
                                <div className="flex space-x-1 bg-gray-800 p-1 rounded-xl border border-gray-700">
                                    <button
                                        onClick={() => setTextAlign("left")}
                                        className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1 transition-colors ${
                                            textAlign === "left" ? "bg-amber-500 text-black" : "text-gray-400 hover:text-white"
                                        }`}
                                    >
                                        <AlignLeft className="w-3.5 h-3.5" />
                                        <span>Left</span>
                                    </button>
                                    <button
                                        onClick={() => setTextAlign("center")}
                                        className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1 transition-colors ${
                                            textAlign === "center" ? "bg-amber-500 text-black" : "text-gray-400 hover:text-white"
                                        }`}
                                    >
                                        <AlignCenter className="w-3.5 h-3.5" />
                                        <span>Center</span>
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block">Line Spacing</label>
                                <div className="flex space-x-1 bg-gray-800 p-1 rounded-xl border border-gray-700">
                                    <button
                                        onClick={() => setLineSpacing("relaxed")}
                                        className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                                            lineSpacing === "relaxed" ? "bg-amber-500 text-black" : "text-gray-400 hover:text-white"
                                        }`}
                                    >
                                        Relaxed (1.8x)
                                    </button>
                                    <button
                                        onClick={() => setLineSpacing("loose")}
                                        className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                                            lineSpacing === "loose" ? "bg-amber-500 text-black" : "text-gray-400 hover:text-white"
                                        }`}
                                    >
                                        Loose (2.2x)
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Keyboard Shortcuts Cheat Sheet Modal (? or H) */}
            {showShortcutsModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[115] p-4">
                    <div className="bg-gray-900 border-2 border-gray-700 rounded-3xl p-6 md:p-8 max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-5 animate-scaleIn">
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-blue-500/20 border border-blue-500/40 rounded-xl flex items-center justify-center text-blue-400">
                                    <HelpCircle className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white">Keyboard Shortcuts</h2>
                                    <p className="text-xs text-gray-400">Quick, hands-free control during presentations</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowShortcutsModal(false)}
                                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                                aria-label="Close shortcuts"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Shortcuts Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                            <div className="space-y-2">
                                <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Playback & Voice</div>
                                <div className="p-2.5 bg-gray-800/60 rounded-xl flex items-center justify-between">
                                    <span className="text-gray-300">Play / Pause</span>
                                    <kbd className="px-2 py-1 bg-gray-700 rounded text-xs font-mono text-white">Space</kbd>
                                </div>
                                <div className="p-2.5 bg-gray-800/60 rounded-xl flex items-center justify-between">
                                    <span className="text-gray-300">Audio Speaker</span>
                                    <kbd className="px-2 py-1 bg-gray-700 rounded text-xs font-mono text-white">A</kbd>
                                </div>
                                <div className="p-2.5 bg-gray-800/60 rounded-xl flex items-center justify-between">
                                    <span className="text-gray-300">Loud Audio Mode</span>
                                    <kbd className="px-2 py-1 bg-gray-700 rounded text-xs font-mono text-white">L</kbd>
                                </div>
                                <div className="p-2.5 bg-gray-800/60 rounded-xl flex items-center justify-between">
                                    <span className="text-gray-300">Reset to Start</span>
                                    <kbd className="px-2 py-1 bg-gray-700 rounded text-xs font-mono text-white">R</kbd>
                                </div>
                                <div className="p-2.5 bg-gray-800/60 rounded-xl flex items-center justify-between">
                                    <span className="text-gray-300">Save Bookmark</span>
                                    <kbd className="px-2 py-1 bg-gray-700 rounded text-xs font-mono text-white">S</kbd>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="text-xs font-bold text-amber-400 uppercase tracking-wider">Navigation & Tools</div>
                                <div className="p-2.5 bg-gray-800/60 rounded-xl flex items-center justify-between">
                                    <span className="text-gray-300">Speed (Faster/Slower)</span>
                                    <kbd className="px-2 py-1 bg-gray-700 rounded text-xs font-mono text-white">↑ / ↓</kbd>
                                </div>
                                <div className="p-2.5 bg-gray-800/60 rounded-xl flex items-center justify-between">
                                    <span className="text-gray-300">Font Size (+ / -)</span>
                                    <kbd className="px-2 py-1 bg-gray-700 rounded text-xs font-mono text-white">→ / ←</kbd>
                                </div>
                                <div className="p-2.5 bg-gray-800/60 rounded-xl flex items-center justify-between">
                                    <span className="text-gray-300">Edit Script</span>
                                    <kbd className="px-2 py-1 bg-gray-700 rounded text-xs font-mono text-white">E</kbd>
                                </div>
                                <div className="p-2.5 bg-gray-800/60 rounded-xl flex items-center justify-between">
                                    <span className="text-gray-300">Script Library</span>
                                    <kbd className="px-2 py-1 bg-gray-700 rounded text-xs font-mono text-white">B</kbd>
                                </div>
                                <div className="p-2.5 bg-gray-800/60 rounded-xl flex items-center justify-between">
                                    <span className="text-gray-300">Focus Ruler</span>
                                    <kbd className="px-2 py-1 bg-gray-700 rounded text-xs font-mono text-white">G</kbd>
                                </div>
                                <div className="p-2.5 bg-gray-800/60 rounded-xl flex items-center justify-between">
                                    <span className="text-gray-300">Fullscreen / Mirror</span>
                                    <kbd className="px-2 py-1 bg-gray-700 rounded text-xs font-mono text-white">F / M</kbd>
                                </div>
                                <div className="p-2.5 bg-gray-800/60 rounded-xl flex items-center justify-between">
                                    <span className="text-gray-300">Trust &amp; Legal Center</span>
                                    <kbd className="px-2 py-1 bg-gray-700 rounded text-xs font-mono text-emerald-400">T</kbd>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Web Trust, Privacy & Legal Compliance Modal (Skill: web-trust-and-compliance) */}
            {showTrustModal && (
                <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-[125] p-3 sm:p-4 animate-fadeIn">
                    <div className="bg-gray-900 border-2 border-emerald-500/40 rounded-3xl p-5 sm:p-7 max-w-2xl w-full max-h-[88vh] flex flex-col shadow-2xl space-y-4 animate-scaleIn overflow-hidden">
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-gray-800 pb-3 shrink-0">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-emerald-500/20 border border-emerald-500/40 rounded-xl flex items-center justify-center text-emerald-400">
                                    <Shield className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="flex items-center space-x-2">
                                        <h2 className="text-lg font-bold text-white">Trust, Privacy &amp; Legal Center</h2>
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                            100% Client-Side
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-400">Compliance disclosure, privacy guarantee &amp; open source licensing</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowTrustModal(false)}
                                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
                                aria-label="Close Trust Modal"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Navigation Tabs */}
                        <div className="flex space-x-1 bg-gray-800/80 p-1 rounded-xl border border-gray-700/60 shrink-0 text-xs">
                            <button
                                onClick={() => setTrustTab("privacy")}
                                className={`flex-1 py-1.5 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-1.5 cursor-pointer ${
                                    trustTab === "privacy" ? "bg-emerald-600 text-white shadow" : "text-gray-400 hover:text-white"
                                }`}
                            >
                                <Lock className="w-3.5 h-3.5" />
                                <span>Privacy Guarantee</span>
                            </button>
                            <button
                                onClick={() => setTrustTab("terms")}
                                className={`flex-1 py-1.5 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-1.5 cursor-pointer ${
                                    trustTab === "terms" ? "bg-emerald-600 text-white shadow" : "text-gray-400 hover:text-white"
                                }`}
                            >
                                <FileText className="w-3.5 h-3.5" />
                                <span>Terms &amp; IP</span>
                            </button>
                            <button
                                onClick={() => setTrustTab("about")}
                                className={`flex-1 py-1.5 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-1.5 cursor-pointer ${
                                    trustTab === "about" ? "bg-emerald-600 text-white shadow" : "text-gray-400 hover:text-white"
                                }`}
                            >
                                <Info className="w-3.5 h-3.5" />
                                <span>About &amp; Author</span>
                            </button>
                            <button
                                onClick={() => setTrustTab("support")}
                                className={`flex-1 py-1.5 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-1.5 cursor-pointer ${
                                    trustTab === "support" ? "bg-emerald-600 text-white shadow" : "text-gray-400 hover:text-white"
                                }`}
                            >
                                <HelpCircle className="w-3.5 h-3.5" />
                                <span>Support SLA</span>
                            </button>
                        </div>

                        {/* Tab Content (Scrollable inside modal) */}
                        <div className="overflow-y-auto space-y-4 pr-1 text-xs text-gray-300 flex-1">
                            {trustTab === "privacy" && (
                                <div className="space-y-3.5">
                                    <div className="p-3.5 bg-emerald-950/30 border border-emerald-500/30 rounded-2xl space-y-1.5">
                                        <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm">
                                            <Lock className="w-4 h-4" />
                                            <span>Zero-Data Transmission Policy</span>
                                        </div>
                                        <p className="leading-relaxed text-gray-300">
                                            TelePrompt Pro is engineered with a strict <strong>100% Client-Side Architecture</strong>. All scripts, bookmarks, scroll velocities, and settings are saved only in your browser&apos;s local memory (<code className="text-cyan-300">localStorage</code>). No text, microphone audio, or speech synthesis is ever sent to external cloud servers.
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                        <div className="p-3 bg-gray-800/60 rounded-xl border border-gray-700/50 space-y-1">
                                            <strong className="text-white block font-semibold">🎙️ Local Speech Synthesis</strong>
                                            <p className="text-gray-400 leading-snug">
                                                Voice coaching uses your device&apos;s built-in Web Speech API (<code className="text-cyan-300">speechSynthesis</code>). Audio never leaves your physical machine.
                                            </p>
                                        </div>
                                        <div className="p-3 bg-gray-800/60 rounded-xl border border-gray-700/50 space-y-1">
                                            <strong className="text-white block font-semibold">🚫 Zero Trackers &amp; No Cookies</strong>
                                            <p className="text-gray-400 leading-snug">
                                                Zero analytics SDKs, zero Meta pixels, zero third-party advertising cookies, and zero fingerprinting.
                                            </p>
                                        </div>
                                        <div className="p-3 bg-gray-800/60 rounded-xl border border-gray-700/50 space-y-1">
                                            <strong className="text-white block font-semibold">🛡️ GDPR &amp; CCPA Built-In</strong>
                                            <p className="text-gray-400 leading-snug">
                                                Complies with GDPR Article 5 (Data Minimisation) and CCPA/CPRA because no personal data is collected or stored remotely.
                                            </p>
                                        </div>
                                        <div className="p-3 bg-gray-800/60 rounded-xl border border-gray-700/50 space-y-1">
                                            <strong className="text-white block font-semibold">💾 Instant Data Control</strong>
                                            <p className="text-gray-400 leading-snug">
                                                Export your script as plain text at any time, or clear local storage to wipe all cached data with zero residual traces.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {trustTab === "terms" && (
                                <div className="space-y-3">
                                    <div className="p-3.5 bg-blue-950/30 border border-blue-500/30 rounded-2xl space-y-1.5">
                                        <div className="flex items-center space-x-2 text-cyan-400 font-bold text-sm">
                                            <FileText className="w-4 h-4" />
                                            <span>Full User Intellectual Property Ownership</span>
                                        </div>
                                        <p className="leading-relaxed text-gray-300">
                                            You retain <strong>100% intellectual property, copyright, and distribution rights</strong> for all speeches, texts, presentations, and video recordings created with TelePrompt Pro.
                                        </p>
                                    </div>

                                    <div className="p-3.5 bg-gray-800/60 border border-gray-700/50 rounded-2xl space-y-2">
                                        <div className="text-white font-bold">📜 Apache-2.0 Open Source License</div>
                                        <p className="text-gray-300 leading-relaxed">
                                            Free to use for commercial broadcast television, YouTube creators, corporate conferences, academic institutions, and personal rehearsals. No royalties, no forced licensing attribution in your video credits, and no paywalls.
                                        </p>
                                        <div className="text-[11px] text-gray-400 pt-1 border-t border-gray-700">
                                            Warranty Disclaimer: Provided &quot;as-is&quot; without warranties of any kind under standard Apache-2.0 terms.
                                        </div>
                                    </div>
                                </div>
                            )}

                            {trustTab === "about" && (
                                <div className="space-y-3">
                                    <div className="p-3.5 bg-purple-950/30 border border-purple-500/30 rounded-2xl space-y-2">
                                        <div className="flex items-center space-x-2 text-purple-300 font-bold text-sm">
                                            <Info className="w-4 h-4" />
                                            <span>About TelePrompt Pro</span>
                                        </div>
                                        <p className="text-gray-300 leading-relaxed">
                                            TelePrompt Pro is an open-source, studio-grade teleprompter and vocal cadence training suite engineered by <strong>Karthikeyan T (@carthworks)</strong>.
                                        </p>
                                        <p className="text-gray-400 italic">
                                            &quot;Empowering confident speech, flawless recording, and effortless vocal delivery with accessible web engineering.&quot;
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        <a
                                            href="https://github.com/carthworks/TelePrompt"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-3 bg-gray-800/80 hover:bg-gray-700 rounded-xl border border-gray-700 flex items-center justify-between text-white transition-colors"
                                        >
                                            <span>GitHub Repository</span>
                                            <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
                                        </a>
                                        <a
                                            href="https://www.linkedin.com/in/carthworks"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-3 bg-gray-800/80 hover:bg-gray-700 rounded-xl border border-gray-700 flex items-center justify-between text-white transition-colors"
                                        >
                                            <span>LinkedIn Profile</span>
                                            <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
                                        </a>
                                    </div>
                                </div>
                            )}

                            {trustTab === "support" && (
                                <div className="space-y-3">
                                    <div className="p-3.5 bg-amber-950/30 border border-amber-500/30 rounded-2xl space-y-1.5">
                                        <div className="flex items-center space-x-2 text-amber-400 font-bold text-sm">
                                            <HelpCircle className="w-4 h-4" />
                                            <span>Support SLA &amp; Consumer Trust Commitments</span>
                                        </div>
                                        <p className="text-gray-300 leading-relaxed">
                                            Support inquiries and bug reports are responded to within <strong>24 to 48 business hours</strong> via GitHub Issues or direct email (<code className="text-amber-300">tkarthikeyan@gmail.com</code>).
                                        </p>
                                    </div>

                                    <div className="space-y-2 p-3 bg-gray-800/60 rounded-2xl border border-gray-700/50">
                                        <strong className="text-white block font-semibold">🕊️ Anti-Dark Patterns Guarantee (FTC Compliant)</strong>
                                        <ul className="space-y-1 text-gray-400 pl-4 list-disc text-[11px]">
                                            <li>Zero hidden pricing, drip charges, or recurring trial billing traps.</li>
                                            <li>No fake urgency timers or fabricated scarcity counters.</li>
                                            <li>No confirm-shaming copy or pre-selected marketing checkboxes.</li>
                                            <li>WCAG 2.1 AAA high-contrast and keyboard accessible by design.</li>
                                        </ul>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="flex items-center justify-between pt-2 border-t border-gray-800 shrink-0 text-xs">
                            <span className="text-gray-500">TelePrompt Pro v2.5.0 • Apache-2.0</span>
                            <button
                                onClick={() => setShowTrustModal(false)}
                                className="px-4 py-1.5 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-semibold transition-colors cursor-pointer"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Save Script Modal */}
            {showSaveModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[120] p-4">
                    <div className="bg-gray-900 border-2 border-purple-500/40 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl space-y-4 animate-scaleIn">
                        <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                                <Bookmark className="w-5 h-5 text-purple-400" />
                                <span>Save Script to Library</span>
                            </h3>
                            <button
                                onClick={() => setShowSaveModal(false)}
                                className="p-1.5 text-gray-400 hover:text-white rounded-lg"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label className="text-xs font-semibold text-gray-400 mb-1 block">Script Title</label>
                                <input
                                    type="text"
                                    value={saveTitleInput}
                                    onChange={(e) => setSaveTitleInput(e.target.value)}
                                    placeholder="Enter script title..."
                                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-gray-400 mb-1 block">Folder</label>
                                <select
                                    value={saveFolderInput}
                                    onChange={(e) => {
                                        if (e.target.value === "__NEW__") {
                                            setShowNewFolder(true);
                                        } else {
                                            setSaveFolderInput(e.target.value);
                                            setShowNewFolder(false);
                                        }
                                    }}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                                >
                                    {folders.filter((f) => f !== "All").map((f) => (
                                        <option key={f} value={f}>{f}</option>
                                    ))}
                                    <option value="__NEW__">+ Create New Folder...</option>
                                </select>
                            </div>

                            {showNewFolder && (
                                <div>
                                    <input
                                        type="text"
                                        value={newFolderName}
                                        onChange={(e) => setNewFolderName(e.target.value)}
                                        placeholder="New folder name..."
                                        className="w-full bg-gray-800 border border-purple-500 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none"
                                        onBlur={() => {
                                            if (newFolderName.trim()) {
                                                setSaveFolderInput(newFolderName.trim());
                                            }
                                        }}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end space-x-2 pt-2 border-t border-gray-800">
                            <button
                                onClick={() => setShowSaveModal(false)}
                                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-semibold"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveCurrentScript}
                                className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-lg"
                            >
                                Save Script
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Accessible Screen Reader Live Announcements */}
            <div aria-live="polite" aria-atomic="true" className="sr-only">
                {liveAnnouncement}
            </div>
        </div>
    );
}
