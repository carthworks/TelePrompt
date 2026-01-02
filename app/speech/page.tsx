"use client";

import { useEffect, useState } from "react";
import Teleprompter from "@/components/Teleprompter";
import { Lock, Upload, FileText, Eye, EyeOff } from "lucide-react";

export default function SpeechPage() {
    const [speechContent, setSpeechContent] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [uploadedFileName, setUploadedFileName] = useState("");
    const [showUploadModal, setShowUploadModal] = useState(false);

    // Password for accessing the teleprompter (change this to your desired password)
    const CORRECT_PASSWORD = "investorpitch2026";

    useEffect(() => {
        // Check if already authenticated in session
        const authenticated = sessionStorage.getItem("teleprompter_auth");
        if (authenticated === "true") {
            setIsAuthenticated(true);
            loadDefaultContent();
        } else {
            setLoading(false);
        }
    }, []);

    const loadDefaultContent = () => {
        setLoading(true);
        fetch("/speech-content.txt")
            .then((response) => response.text())
            .then((text) => {
                setSpeechContent(text);
                setLoading(false);
            })
            .catch((error) => {
                console.error("Error loading speech content:", error);
                setSpeechContent("Error loading speech content. Please upload a file.");
                setLoading(false);
            });
    };

    const handlePasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === CORRECT_PASSWORD) {
            setIsAuthenticated(true);
            sessionStorage.setItem("teleprompter_auth", "true");
            setError("");
            loadDefaultContent();
        } else {
            setError("Incorrect password. Please try again.");
            setPassword("");
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.type === "text/plain" || file.name.endsWith(".txt")) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const content = event.target?.result as string;
                    setSpeechContent(content);
                    setUploadedFileName(file.name);
                    setShowUploadModal(false);
                };
                reader.readAsText(file);
            } else {
                alert("Please upload a .txt file");
            }
        }
    };

    const handleLogout = () => {
        setIsAuthenticated(false);
        sessionStorage.removeItem("teleprompter_auth");
        setPassword("");
        setSpeechContent("");
        setUploadedFileName("");
    };

    // Password Entry Screen
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-950 via-blue-950 to-gray-950 flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    <div className="bg-gray-900 border-2 border-gray-700 rounded-2xl p-8 shadow-2xl">
                        {/* Logo */}
                        <div className="flex justify-center mb-6">
                            <div className="relative">
                                {/* Gradient Background Circle */}
                                <div className="w-24 h-24 bg-gradient-to-br from-blue-600 via-teal-500 to-blue-700 rounded-2xl flex items-center justify-center shadow-2xl transform rotate-6 hover:rotate-0 transition-transform duration-300">
                                    <div className="text-5xl">🎓</div>
                                </div>
                                {/* Lock Badge */}
                                <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-gradient-to-r from-blue-600 to-teal-600 rounded-full flex items-center justify-center border-4 border-gray-900 shadow-lg">
                                    <Lock className="w-5 h-5 text-white" />
                                </div>
                            </div>
                        </div>

                        {/* Brand Name */}
                        <div className="text-center mb-6">
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-teal-400 to-blue-500 bg-clip-text text-transparent mb-1">
                                PaperPublishIQ
                            </h1>
                            <p className="text-lg font-semibold text-gray-300">Investor Pitch</p>
                        </div>

                        {/* Subtitle */}
                        <p className="text-center text-gray-400 mb-8 text-sm">
                            🔒 Secure teleprompter access
                        </p>

                        {/* Password Form */}
                        <form onSubmit={handlePasswordSubmit} className="space-y-4">
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter password"
                                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors pr-12"
                                    autoFocus
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
                                >
                                    {showPassword ? (
                                        <EyeOff className="w-5 h-5" />
                                    ) : (
                                        <Eye className="w-5 h-5" />
                                    )}
                                </button>
                            </div>

                            {error && (
                                <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 text-red-400 text-sm">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-lg font-semibold hover:shadow-2xl hover:scale-105 transition-all duration-300"
                            >
                                Access Teleprompter
                            </button>
                        </form>

                        {/* Info */}
                        <div className="mt-6 p-4 bg-blue-900/20 border border-blue-800 rounded-lg">
                            <p className="text-xs text-blue-300 text-center">
                                🔒 Secure access for authorized users only
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Loading Screen
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <div className="text-white text-xl">Loading speech content...</div>
                </div>
            </div>
        );
    }

    // Upload Modal
    const UploadModal = () => (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[100] p-4">
            <div className="bg-gray-900 border-2 border-gray-700 rounded-2xl p-8 max-w-md w-full">
                <h2 className="text-2xl font-bold text-white mb-4">Upload Speech Content</h2>
                <p className="text-gray-400 mb-6">
                    Upload a .txt file with your speech content
                </p>

                <div className="space-y-4">
                    {/* File Input */}
                    <label className="block">
                        <div className="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center hover:border-blue-500 transition-colors cursor-pointer">
                            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                            <p className="text-white font-semibold mb-1">Click to upload</p>
                            <p className="text-sm text-gray-400">or drag and drop</p>
                            <p className="text-xs text-gray-500 mt-2">TXT files only</p>
                        </div>
                        <input
                            type="file"
                            accept=".txt,text/plain"
                            onChange={handleFileUpload}
                            className="hidden"
                        />
                    </label>

                    {/* Current File */}
                    {uploadedFileName && (
                        <div className="bg-green-900/20 border border-green-700 rounded-lg p-3 flex items-center space-x-2">
                            <FileText className="w-5 h-5 text-green-400" />
                            <span className="text-green-400 text-sm">{uploadedFileName}</span>
                        </div>
                    )}

                    {/* Buttons */}
                    <div className="flex space-x-3">
                        <button
                            onClick={() => setShowUploadModal(false)}
                            className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => {
                                loadDefaultContent();
                                setShowUploadModal(false);
                                setUploadedFileName("");
                            }}
                            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                        >
                            Load Default
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    // Main Teleprompter with Upload Button
    return (
        <div className="relative">
            {/* Upload & Logout Buttons */}
            <div className="fixed top-20 right-4 z-50 flex flex-col space-y-2">
                <button
                    onClick={() => setShowUploadModal(true)}
                    className="p-3 bg-blue-600 hover:bg-blue-700 rounded-lg shadow-lg transition-colors group"
                    title="Upload speech file"
                >
                    <Upload className="w-5 h-5 text-white" />
                </button>
                <button
                    onClick={handleLogout}
                    className="p-3 bg-red-600 hover:bg-red-700 rounded-lg shadow-lg transition-colors"
                    title="Logout"
                >
                    <Lock className="w-5 h-5 text-white" />
                </button>
            </div>

            {/* Upload Modal */}
            {showUploadModal && <UploadModal />}

            {/* Teleprompter */}
            <Teleprompter
                content={speechContent}
                title="Investor Pitch Teleprompter"
                defaultSpeed={30}
                defaultFontSize={24}
            />
        </div>
    );
}
