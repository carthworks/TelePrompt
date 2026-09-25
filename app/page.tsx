"use client";

import { useState, useEffect } from "react";
import Teleprompter, { SavedScript, QUICK_TEMPLATES } from "@/components/Teleprompter";

export default function Home() {
  const [speechContent, setSpeechContent] = useState<string>(QUICK_TEMPLATES[2].content);
  const [scriptTitle, setScriptTitle] = useState<string>("🎬 High-Engagement YouTube Script");
  const [currentScriptId, setCurrentScriptId] = useState<string | null>(null);
  const [savedScripts, setSavedScripts] = useState<SavedScript[]>([]);

  // Load default content and saved scripts on initial mount
  useEffect(() => {
    const timer = setTimeout(() => {
      // 1. Check if user was last editing a script
      const lastContent = localStorage.getItem("teleprompter_active_content");
      const lastTitle = localStorage.getItem("teleprompter_active_title");

      if (lastContent && lastContent.trim()) {
        setSpeechContent(lastContent);
        if (lastTitle) setScriptTitle(lastTitle);
      } else {
        // Fallback to high-engagement youtube script template (matches initial cockpit design)
        setSpeechContent(QUICK_TEMPLATES[2].content);
        setScriptTitle(QUICK_TEMPLATES[2].title);
      }

      const storedScripts = localStorage.getItem("savedScripts");
      if (storedScripts) {
        try {
          const parsed = JSON.parse(storedScripts);
          if (Array.isArray(parsed)) {
            setSavedScripts(parsed);
          }
        } catch (err) {
          console.error("Failed to parse saved scripts:", err);
        }
      }
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  // Sync active content changes to localStorage
  const handleContentChange = (newContent: string) => {
    setSpeechContent(newContent);
    try {
      localStorage.setItem("teleprompter_active_content", newContent);
    } catch {
      // Ignore quota errors
    }
  };

  const handleTitleChange = (newTitle: string) => {
    setScriptTitle(newTitle);
    try {
      localStorage.setItem("teleprompter_active_title", newTitle);
    } catch {
      // Ignore quota errors
    }
  };

  // Save or update script in library
  const handleSaveScript = (title: string, content: string, folder: string) => {
    const now = Date.now();
    const script: SavedScript = {
      id: currentScriptId || `script_${now}`,
      title: title.trim() || "Untitled Script",
      content,
      folder: folder || "General",
      createdAt: currentScriptId
        ? savedScripts.find((s) => s.id === currentScriptId)?.createdAt || now
        : now,
      updatedAt: now,
    };

    const updated = currentScriptId
      ? savedScripts.map((s) => (s.id === currentScriptId ? script : s))
      : [script, ...savedScripts];

    setSavedScripts(updated);
    setCurrentScriptId(script.id);
    setScriptTitle(script.title);

    try {
      localStorage.setItem("savedScripts", JSON.stringify(updated));
      localStorage.setItem("teleprompter_active_content", content);
      localStorage.setItem("teleprompter_active_title", script.title);
    } catch (e) {
      console.warn("Storage warning:", e);
    }
  };

  // Load a script from the library
  const handleLoadScript = (script: SavedScript) => {
    setSpeechContent(script.content);
    setScriptTitle(script.title);
    setCurrentScriptId(script.id);

    try {
      localStorage.setItem("teleprompter_active_content", script.content);
      localStorage.setItem("teleprompter_active_title", script.title);
    } catch {
      // Ignore
    }
  };

  // Delete a script from library
  const handleDeleteScript = (id: string) => {
    const updated = savedScripts.filter((s) => s.id !== id);
    setSavedScripts(updated);
    try {
      localStorage.setItem("savedScripts", JSON.stringify(updated));
    } catch {
      // Ignore
    }
    if (currentScriptId === id) {
      setCurrentScriptId(null);
    }
  };

  return (
    <main className="min-h-screen bg-gray-950 text-white" role="main">
      <Teleprompter
        content={speechContent}
        title={scriptTitle}
        defaultSpeed={30}
        defaultFontSize={28}
        savedScripts={savedScripts}
        onContentChange={handleContentChange}
        onTitleChange={handleTitleChange}
        onSaveScript={handleSaveScript}
        onLoadScript={handleLoadScript}
        onDeleteScript={handleDeleteScript}
      />
    </main>
  );
}
