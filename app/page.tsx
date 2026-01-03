"use client";

import { useState, useEffect } from "react";
import Teleprompter from "@/components/Teleprompter";
import {
  Play,
  Upload,
  FileText,
  Sparkles,
  Zap,
  Shield,
  Monitor,
  Mic,
  ArrowRight,
  CheckCircle2,
  Home as HomeIcon,
  Save,
  FolderOpen,
  Trash2,
  Download,
  Search,
  X,
  Folder,
  Clock
} from "lucide-react";

// Types for script management
interface SavedScript {
  id: string;
  title: string;
  content: string;
  folder: string;
  createdAt: number;
  updatedAt: number;
}

export default function Home() {
  const [showTeleprompter, setShowTeleprompter] = useState(false);
  const [speechContent, setSpeechContent] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [currentScriptId, setCurrentScriptId] = useState<string | null>(null);

  // Script Library State
  const [showLibrary, setShowLibrary] = useState(false);
  const [savedScripts, setSavedScripts] = useState<SavedScript[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFolder, setSelectedFolder] = useState<string>("All");
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveTitle, setSaveTitle] = useState("");
  const [saveFolder, setSaveFolder] = useState("General");
  const [newFolderName, setNewFolderName] = useState("");
  const [showNewFolder, setShowNewFolder] = useState(false);

  // Load default content and saved scripts on mount
  useEffect(() => {
    loadDefaultContent();
    loadSavedScripts();
  }, []);

  const loadDefaultContent = () => {
    fetch("/speech-content.txt")
      .then((response) => response.text())
      .then((text) => {
        setSpeechContent(text);
        setUploadedFileName("Default Speech");
      })
      .catch((error) => {
        console.error("Error loading default content:", error);
        setSpeechContent("Welcome to MyTeleprompter! Upload or paste your speech to get started.");
      });
  };

  const loadSavedScripts = () => {
    const scripts = localStorage.getItem("savedScripts");
    if (scripts) {
      setSavedScripts(JSON.parse(scripts));
    }
  };

  const saveSavedScripts = (scripts: SavedScript[]) => {
    localStorage.setItem("savedScripts", JSON.stringify(scripts));
    setSavedScripts(scripts);
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
          setCurrentScriptId(null);
          setShowTeleprompter(true);
        };
        reader.readAsText(file);
      } else {
        alert("Please upload a .txt file");
      }
    }
  };

  const handleTextSubmit = () => {
    if (speechContent.trim()) {
      setShowTeleprompter(true);
    }
  };

  const handleSaveScript = () => {
    if (!saveTitle.trim()) {
      alert("Please enter a title for your script");
      return;
    }

    const now = Date.now();
    const script: SavedScript = {
      id: currentScriptId || `script_${now}`,
      title: saveTitle,
      content: speechContent,
      folder: saveFolder,
      createdAt: currentScriptId
        ? savedScripts.find(s => s.id === currentScriptId)?.createdAt || now
        : now,
      updatedAt: now,
    };

    const updatedScripts = currentScriptId
      ? savedScripts.map(s => s.id === currentScriptId ? script : s)
      : [...savedScripts, script];

    saveSavedScripts(updatedScripts);
    setCurrentScriptId(script.id);
    setUploadedFileName(saveTitle);
    setShowSaveDialog(false);
    setSaveTitle("");
  };

  const handleLoadScript = (script: SavedScript) => {
    setSpeechContent(script.content);
    setUploadedFileName(script.title);
    setCurrentScriptId(script.id);
    setShowLibrary(false);
    setShowTeleprompter(true);
  };

  const handleDeleteScript = (id: string) => {
    if (confirm("Are you sure you want to delete this script?")) {
      const updatedScripts = savedScripts.filter(s => s.id !== id);
      saveSavedScripts(updatedScripts);
      if (currentScriptId === id) {
        setCurrentScriptId(null);
      }
    }
  };

  const handleExportToPDF = (script: SavedScript) => {
    const blob = new Blob([script.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${script.title}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      setSaveFolder(newFolderName);
      setShowNewFolder(false);
      setNewFolderName("");
    }
  };

  const getFolders = () => {
    const folders = new Set(savedScripts.map(s => s.folder));
    return ["All", ...Array.from(folders)];
  };

  const getFilteredScripts = () => {
    let filtered = savedScripts;

    if (selectedFolder !== "All") {
      filtered = filtered.filter(s => s.folder === selectedFolder);
    }

    if (searchQuery) {
      filtered = filtered.filter(s =>
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered.sort((a, b) => b.updatedAt - a.updatedAt);
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Teleprompter View
  if (showTeleprompter) {
    return (
      <div className="relative">
        {/* Save Dialog */}
        {showSaveDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[100] p-4">
            <div className="bg-gray-900 border-2 border-gray-700 rounded-2xl p-8 max-w-md w-full">
              <h2 className="text-2xl font-bold text-white mb-4">Save Script</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Script Title
                  </label>
                  <input
                    type="text"
                    value={saveTitle}
                    onChange={(e) => setSaveTitle(e.target.value)}
                    placeholder="Enter script title"
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Folder
                  </label>
                  <select
                    value={saveFolder}
                    onChange={(e) => setSaveFolder(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  >
                    {getFolders().filter(f => f !== "All").map(folder => (
                      <option key={folder} value={folder}>{folder}</option>
                    ))}
                  </select>

                  {!showNewFolder && (
                    <button
                      onClick={() => setShowNewFolder(true)}
                      className="mt-2 text-sm text-blue-400 hover:text-blue-300"
                    >
                      + Create new folder
                    </button>
                  )}

                  {showNewFolder && (
                    <div className="mt-2 flex gap-2">
                      <input
                        type="text"
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        placeholder="Folder name"
                        className="flex-1 px-3 py-1 bg-gray-800 border border-gray-700 rounded text-white text-sm"
                      />
                      <button
                        onClick={handleCreateFolder}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
                      >
                        Add
                      </button>
                      <button
                        onClick={() => {
                          setShowNewFolder(false);
                          setNewFolderName("");
                        }}
                        className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowSaveDialog(false);
                      setSaveTitle("");
                    }}
                    className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveScript}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <Teleprompter
          content={speechContent}
          title={uploadedFileName || "My Speech"}
          defaultSpeed={30}
          defaultFontSize={24}
          onHome={() => setShowTeleprompter(false)}
          onUpload={handleFileUpload}
          onSave={() => {
            setSaveTitle(uploadedFileName || "");
            setShowSaveDialog(true);
          }}
        />
      </div>
    );
  }

  // Landing Page
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-blue-950 to-purple-950 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Monitor className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-teal-400 bg-clip-text text-transparent">
                MyTeleprompter
              </h1>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="container mx-auto px-6 py-10">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left Column - Text Content */}
              <div className="space-y-8 animate-fadeIn">
                <div className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full">
                  <Sparkles className="w-4 h-4 text-blue-400" />
                  <span className="text-sm text-blue-300 font-medium">Professional Teleprompter Solution</span>
                </div>

                <h2 className="text-5xl lg:text-6xl font-bold text-white leading-tight">
                  Deliver Your
                  <span className="block bg-gradient-to-r from-blue-400 via-purple-400 to-teal-400 bg-clip-text text-transparent">
                    Perfect Speech
                  </span>
                </h2>

                <p className="text-xl text-gray-300 leading-relaxed">
                  A powerful, easy-to-use teleprompter designed for speakers, presenters, and content creators.
                  Upload your script and deliver flawless performances every time.
                </p>

                {/* Feature Highlights */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-start space-x-3">
                    <CheckCircle2 className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-white font-semibold">Smooth Scrolling</p>
                      <p className="text-sm text-gray-400">Adjustable speed control</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle2 className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-white font-semibold">Script Library</p>
                      <p className="text-sm text-gray-400">Save & organize scripts</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle2 className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-white font-semibold">Fullscreen Mode</p>
                      <p className="text-sm text-gray-400">Distraction-free reading</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle2 className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-white font-semibold">Easy Controls</p>
                      <p className="text-sm text-gray-400">Keyboard shortcuts</p>
                    </div>
                  </div>
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-wrap gap-4">
                  <button
                    onClick={handleTextSubmit}
                    className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 hover:scale-105 flex items-center space-x-2"
                  >
                    <Play className="w-5 h-5" />
                    <span>Start Now</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>

                  <button
                    onClick={() => setShowLibrary(true)}
                    className="group px-8 py-4 bg-gray-800 hover:bg-gray-700 border-2 border-gray-700 hover:border-blue-500 text-white rounded-xl font-semibold shadow-xl transition-all duration-300 hover:scale-105 flex items-center space-x-2"
                  >
                    <FolderOpen className="w-5 h-5" />
                    <span>Script Library</span>
                    {savedScripts.length > 0 && (
                      <span className="ml-2 px-2 py-0.5 bg-blue-600 rounded-full text-xs">
                        {savedScripts.length}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Right Column - Upload Section */}
              <div className="animate-scaleIn">
                <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-700/50 rounded-3xl p-8 shadow-2xl">
                  <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4 shadow-lg">
                      <Mic className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">Start Your Speech</h3>
                    <p className="text-gray-400">Upload your script or paste your text</p>
                  </div>

                  {/* Tabs */}
                  <div className="space-y-6">
                    {/* Upload File Tab */}
                    <div className="space-y-4">
                      <label className="block">
                        <div className="border-2 border-dashed border-gray-700 rounded-xl p-8 text-center hover:border-blue-500 hover:bg-blue-500/5 transition-all duration-300 cursor-pointer group">
                          <Upload className="w-12 h-12 text-gray-400 group-hover:text-blue-400 mx-auto mb-3 transition-colors" />
                          <p className="text-white font-semibold mb-1">Upload Text File</p>
                          <p className="text-sm text-gray-400">Click to browse or drag and drop</p>
                          <p className="text-xs text-gray-500 mt-2">.TXT files supported</p>
                        </div>
                        <input
                          type="file"
                          accept=".txt,text/plain"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>

                      {uploadedFileName && !showTeleprompter && (
                        <div className="bg-green-900/20 border border-green-700 rounded-lg p-3 flex items-center space-x-2">
                          <FileText className="w-5 h-5 text-green-400" />
                          <span className="text-green-400 text-sm">{uploadedFileName}</span>
                        </div>
                      )}
                    </div>

                    {/* Divider */}
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-700"></div>
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-4 bg-gray-900 text-gray-400">or</span>
                      </div>
                    </div>

                    {/* Paste Text Tab */}
                    <div className="space-y-4">
                      <textarea
                        value={speechContent}
                        onChange={(e) => setSpeechContent(e.target.value)}
                        placeholder="Paste your speech text here..."
                        className="w-full h-40 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all resize-none"
                      />
                      <button
                        onClick={handleTextSubmit}
                        disabled={!speechContent.trim()}
                        className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center space-x-2"
                      >
                        <Play className="w-5 h-5" />
                        <span>Start Teleprompter</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="container mx-auto px-6 py-10">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h3 className="text-4xl font-bold text-white mb-4">Powerful Features</h3>
              <p className="text-xl text-gray-400">Everything you need for professional presentations</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="group bg-gray-900/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-8 hover:border-blue-500/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/20">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Zap className="w-7 h-7 text-white" />
                </div>
                <h4 className="text-xl font-bold text-white mb-3">Lightning Fast</h4>
                <p className="text-gray-400 leading-relaxed">
                  Instant loading and smooth scrolling performance. No lag, no delays - just pure efficiency.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="group bg-gray-900/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-8 hover:border-purple-500/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Shield className="w-7 h-7 text-white" />
                </div>
                <h4 className="text-xl font-bold text-white mb-3">Privacy First</h4>
                <p className="text-gray-400 leading-relaxed">
                  Your content stays on your device. No cloud uploads, no tracking, complete privacy.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="group bg-gray-900/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-8 hover:border-teal-500/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-teal-500/20">
                <div className="w-14 h-14 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <FolderOpen className="w-7 h-7 text-white" />
                </div>
                <h4 className="text-xl font-bold text-white mb-3">Script Library</h4>
                <p className="text-gray-400 leading-relaxed">
                  Save, organize, and manage all your scripts. Search, filter by folder, and export anytime.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Script Library Modal */}
        {showLibrary && (
          <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 border-2 border-gray-700 rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
              {/* Header */}
              <div className="p-6 border-b border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <FolderOpen className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-white">Script Library</h2>
                    <span className="px-3 py-1 bg-blue-600 rounded-full text-sm text-white">
                      {savedScripts.length} {savedScripts.length === 1 ? 'script' : 'scripts'}
                    </span>
                  </div>
                  <button
                    onClick={() => setShowLibrary(false)}
                    className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <X className="w-6 h-6 text-gray-400" />
                  </button>
                </div>

                {/* Search and Filters */}
                <div className="flex gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search scripts..."
                      className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <select
                    value={selectedFolder}
                    onChange={(e) => setSelectedFolder(e.target.value)}
                    className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  >
                    {getFolders().map(folder => (
                      <option key={folder} value={folder}>
                        {folder === "All" ? "All Folders" : folder}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Scripts List */}
              <div className="flex-1 overflow-y-auto p-6">
                {getFilteredScripts().length === 0 ? (
                  <div className="text-center py-16">
                    <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-400 mb-2">
                      {searchQuery || selectedFolder !== "All"
                        ? "No scripts found"
                        : "No saved scripts yet"}
                    </h3>
                    <p className="text-gray-500">
                      {searchQuery || selectedFolder !== "All"
                        ? "Try adjusting your search or filter"
                        : "Start by saving your first script"}
                    </p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-4">
                    {getFilteredScripts().map(script => (
                      <div
                        key={script.id}
                        className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 hover:border-blue-500/50 transition-all duration-300 group"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold text-white truncate mb-1">
                              {script.title}
                            </h3>
                            <div className="flex items-center space-x-3 text-sm text-gray-400">
                              <div className="flex items-center space-x-1">
                                <Folder className="w-4 h-4" />
                                <span>{script.folder}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Clock className="w-4 h-4" />
                                <span>{formatDate(script.updatedAt)}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <p className="text-gray-400 text-sm line-clamp-2 mb-4">
                          {script.content.substring(0, 150)}...
                        </p>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleLoadScript(script)}
                            className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
                          >
                            <Play className="w-4 h-4" />
                            <span>Load</span>
                          </button>
                          <button
                            onClick={() => handleExportToPDF(script)}
                            className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                            title="Export"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteScript(script.id)}
                            className="px-3 py-2 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-gray-700 bg-gray-800/50">
                <div className="flex items-center justify-between text-sm text-gray-400">
                  <span>Total: {savedScripts.length} scripts</span>
                  <button
                    onClick={() => setShowLibrary(false)}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="container mx-auto px-6 py-12 border-t border-gray-800">
          <div className="text-center text-gray-400">
            <p className="mb-2">© 2026 MyTeleprompter. Built for speakers who demand excellence.</p>
            <p className="text-sm">Perfect for presentations, speeches, videos, and more.</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
