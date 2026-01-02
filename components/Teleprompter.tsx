"use client";

import { useState, useEffect, useRef, ChangeEvent } from "react";
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

    const containerRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const wakeLockRef = useRef<any>(null);

    // Calculate metrics
    const totalWords = content.split(/\s+/).filter((w) => w.length > 0).length;
    const wpm = elapsedTime > 0 ? Math.round((wordsRead / elapsedTime) * 60) : 0;
    const estimatedTotalTime = speed > 0 ? Math.round((totalWords / 120) * 60) : 0; // Assuming 120 WPM average
    const progress = contentRef.current
        ? Math.min(100, (position / (contentRef.current.scrollHeight - window.innerHeight)) * 100)
        : 0;

    // Load saved position from localStorage
    useEffect(() => {
        const savedPosition = localStorage.getItem("teleprompter_position");
        const savedTheme = localStorage.getItem("teleprompter_theme") as Theme;
        if (savedPosition) {
            setPosition(Number(savedPosition));
        }
        if (savedTheme && themes[savedTheme]) {
            setTheme(savedTheme);
        }
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

    // Auto-scroll logic
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isPlaying) {
            interval = setInterval(() => {
                setPosition((prev) => prev + 1);
            }, 1000 / speed);
        }
        return () => clearInterval(interval);
    }, [isPlaying, speed]);

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

    // Words read tracker (estimate based on position)
    useEffect(() => {
        if (contentRef.current) {
            const scrollPercentage = position / contentRef.current.scrollHeight;
            setWordsRead(Math.round(totalWords * scrollPercentage));

            // Check for completion (reached end)
            if (scrollPercentage >= 0.98 && isPlaying) {
                setIsPlaying(false);
                setShowCompletion(true);
            }
        }
    }, [position, totalWords, isPlaying]);

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
            }
        };

        window.addEventListener("keydown", handleKeyPress);
        return () => window.removeEventListener("keydown", handleKeyPress);
    }, []);

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
                                    >
                                        <RotateCcw className="w-5 h-5" />
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
                                    {onUpload && (
                                        <label className="p-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors cursor-pointer" title="Upload">
                                            <Upload className="w-5 h-5" />
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
                                            className="p-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg transition-colors"
                                            title="Save"
                                        >
                                            <Save className="w-5 h-5" />
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
                            <div className="flex items-center space-x-3">
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

            {/* Speech Content */}
            <div className={`${showControls ? "pt-24 md:pt-20" : "pt-12"} pb-24 min-h-screen`}>
                <div
                    ref={contentRef}
                    className="container mx-auto px-4 md:px-8 max-w-4xl transition-transform duration-100"
                    style={{
                        transform: `translateY(${-position}px)`,
                        paddingTop: "50vh",
                        paddingBottom: "50vh",
                    }}
                >
                    <div
                        className="leading-relaxed whitespace-pre-wrap select-none"
                        style={{
                            fontSize: `${fontSize}px`,
                            fontFamily: "system-ui, -apple-system, sans-serif",
                            lineHeight: "1.8",
                            textAlign: "left",
                        }}
                    >
                        {content}
                    </div>
                </div>
            </div>

            {/* Keyboard Shortcuts */}
            {!isPlaying && position === 0 && (
                <div className="hidden md:block fixed bottom-20 right-4 bg-gray-900/90 border border-gray-700 rounded-lg p-4 text-xs text-gray-400 z-50">
                    <div className="font-semibold text-gray-300 mb-2">Keyboard Shortcuts</div>
                    <div className="space-y-1">
                        <div><kbd className="bg-gray-800 px-2 py-1 rounded">Space</kbd> Play/Pause</div>
                        <div><kbd className="bg-gray-800 px-2 py-1 rounded">↑/↓</kbd> Speed</div>
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
                    <div className="bg-gray-900 border-2 border-gray-700 rounded-2xl p-6 md:p-12 max-w-2xl text-center">
                        <h1 className="text-3xl md:text-4xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-teal-400 to-blue-500 bg-clip-text text-transparent">
                            {title}
                        </h1>
                        <div className="space-y-3 md:space-y-4 text-left text-base md:text-lg text-gray-200">
                            <p>✅ <strong className="text-white">Progress Bar</strong> shows completion</p>
                            <p>✅ <strong className="text-white">WPM Counter</strong> tracks speaking pace</p>
                            <p>✅ <strong className="text-white">Auto-Pause</strong> at section markers</p>
                            <p>✅ <strong className="text-white">Save Position</strong> to resume later</p>
                            <p>✅ <strong className="text-white">Theme Selector</strong> for comfort</p>
                        </div>
                        <div className="mt-6 md:mt-8 p-4 bg-blue-900/40 border border-blue-700 rounded-lg">
                            <p className="text-sm text-blue-200">
                                💡 <strong>New Features:</strong> Progress tracking, WPM counter, section auto-pause, save/resume, and theme selection!
                            </p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3 mt-6 md:mt-8">
                            <button
                                onClick={() => setIsPlaying(true)}
                                className="flex-1 px-6 md:px-8 py-3 md:py-4 bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-lg font-semibold hover:shadow-2xl hover:scale-105 transition-all duration-300 flex items-center justify-center space-x-2"
                            >
                                <Play className="w-5 h-5 md:w-6 md:h-6" />
                                <span>Start Now</span>
                            </button>
                            <button
                                onClick={() => startCountdown(5)}
                                className="flex-1 px-6 md:px-8 py-3 md:py-4 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-all duration-300 flex items-center justify-center space-x-2"
                            >
                                <span>5s Countdown</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
