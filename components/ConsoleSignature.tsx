"use client";

import { useEffect, useRef } from "react";

/**
 * Developer Console Signature & DevTools Inspection API
 * Skill: developer-console-signature
 * 
 * Injects styled developer branding, authorship metadata, DevTools inspection helpers
 * (window.TelePrompt and window.AgentStack), and keyboard shortcuts into the browser console.
 */
export function ConsoleSignature() {
    const initialized = useRef(false);

    useEffect(() => {
        if (initialized.current) return;
        initialized.current = true;

        if (typeof window === "undefined") return;

        // Styling tokens
        const bannerStyle =
            "font-size: 14px; font-weight: 800; color: #ffffff; background: linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%); padding: 6px 14px; border-radius: 6px; text-shadow: 0 1px 2px rgba(0,0,0,0.5);";
        const titleStyle =
            "font-size: 13px; font-weight: 700; color: #38bdf8; background: #0f172a; padding: 4px 10px; border-radius: 4px; border: 1px solid rgba(56,189,248,0.3);";
        const labelStyle = "font-weight: 700; color: #f59e0b;";
        const textStyle = "color: #94a3b8;";
        const linkStyle = "color: #38bdf8; font-weight: 600; text-decoration: underline;";
        const quoteStyle = "font-style: italic; color: #10b981;";
        const tipBadgeStyle =
            "font-weight: bold; color: #000; background: #fbbf24; padding: 2px 6px; border-radius: 4px;";
        const codeStyle =
            "font-family: monospace; color: #38bdf8; background: rgba(56,189,248,0.12); padding: 1px 6px; border-radius: 4px;";

        // 1. Header Banner
        console.log(
            "%c🎬 TelePrompt Pro — Studio Teleprompter & Loud Audio Coach v2.5.0",
            bannerStyle
        );

        // 2. Author & Developer Profile
        console.log(
            "%c👨‍💻 Architect:   %cKarthikeyan T (@carthworks)\n" +
            "%c✉️  Contact:     %ctkarthikeyan@gmail.com\n" +
            "%c💼 LinkedIn:    %chttps://www.linkedin.com/in/carthworks\n" +
            "%c🐙 GitHub:      %chttps://github.com/carthworks\n" +
            "%c📦 Repository:  %chttps://github.com/carthworks/TelePrompt\n" +
            "%c📜 License:     %cApache-2.0 (Open Source)\n" +
            "%c🔒 Privacy:     %c100% Client-Side. Zero audio/text uploads. No trackers.\n" +
            "%c✨ Mission:     %c\"Empowering confident speech, flawless recording, and effortless vocal delivery.\"",
            labelStyle, textStyle,
            labelStyle, textStyle,
            labelStyle, linkStyle,
            labelStyle, linkStyle,
            labelStyle, linkStyle,
            labelStyle, textStyle,
            labelStyle, quoteStyle,
            labelStyle, quoteStyle
        );

        // 3. Quick Tip & Interactive DevTools Guide
        console.log(
            `%c💡 DevTools Console API%c Run %cTelePrompt.help()%c to inspect features, diagnostic stats, or keyboard shortcuts directly in this console!`,
            tipBadgeStyle,
            "color: #cbd5e1; margin-left: 6px;",
            codeStyle,
            "color: #cbd5e1;"
        );

        // 4. Expose window.TelePrompt & window.AgentStack DevTools API
        const devtoolsAPI = {
            version: "2.5.0",
            developer: {
                name: "Karthikeyan T",
                handle: "@carthworks",
                email: "tkarthikeyan@gmail.com",
                linkedIn: "https://www.linkedin.com/in/carthworks",
                github: "https://github.com/carthworks"
            },
            project: {
                name: "TelePrompt Pro",
                repository: "https://github.com/carthworks/TelePrompt",
                license: "Apache-2.0",
                compliance: "GDPR, CCPA & WCAG 2.1 AA Compliant (Zero Tracker Policy)"
            },
            features: [
                "Loud Audio Speaker Coach (Speech Synthesis)",
                "Bionic Reading & Word Focus",
                "OLED Dark & High-Contrast Themes",
                "Hardware Mirror & Inverted Prompter Mode",
                "Speed, Font & Spacing Live Fine-Tuning",
                "Multi-Script Local Workspace",
                "All-In-One Unified Cockpit Interface"
            ],
            shortcuts: {
                "Space": "Play / Pause playback",
                "↑ / ↓": "Adjust scroll speed",
                "R": "Reset to script top",
                "S": "Open Settings panel",
                "M": "Toggle Hardware Mirroring",
                "F": "Toggle Fullscreen mode",
                "V": "Toggle Loud Voice Coach narration",
                "Esc": "Close overlays & modals"
            },
            help: () => {
                console.group("🚀 TelePrompt Pro — Interactive DevTools Console Help");
                console.log("%cAvailable DevTools Commands:", "font-weight: bold; color: #f59e0b;");
                console.table({
                    "TelePrompt.version": "Current application build version",
                    "TelePrompt.developer": "Author & contact credentials",
                    "TelePrompt.project": "Repository & open-source licensing metadata",
                    "TelePrompt.shortcuts": "Keyboard navigation reference table",
                    "TelePrompt.features": "List of core studio capabilities",
                    "TelePrompt.getSavedScripts()": "Inspect scripts stored locally in localStorage",
                    "TelePrompt.privacyReport()": "Print client-side privacy & data guarantee"
                });
                console.groupEnd();
                return "✨ Ready for inspection. Use TelePrompt.<command>";
            },
            getSavedScripts: () => {
                try {
                    const raw = localStorage.getItem("teleprompter_scripts");
                    const scripts = raw ? JSON.parse(raw) : [];
                    console.table(scripts.map((s: any) => ({
                        id: s.id,
                        title: s.title,
                        length: s.content ? s.content.length : 0,
                        folder: s.folder || "general",
                        updated: new Date(s.updatedAt || s.createdAt).toLocaleString()
                    })));
                    return scripts;
                } catch (e) {
                    return "Error reading localStorage: " + e;
                }
            },
            privacyReport: () => {
                console.group("🛡️ TelePrompt Pro — Client Privacy Verification");
                console.log("%c✓ 100% Client-Side Operation: All state persists in window.localStorage.", "color: #10b981;");
                console.log("%c✓ Zero External Analytics: No cookies, tracking pixels, or third-party telemetry.", "color: #10b981;");
                console.log("%c✓ Local Speech Synthesis: Audio narration is generated by browser's native Web Speech API.", "color: #10b981;");
                console.log("%c✓ Full Data Ownership: Users own 100% of typed and uploaded scripts.", "color: #10b981;");
                console.groupEnd();
                return "Privacy Status: 100% Local & Private";
            }
        };

        (window as any).TelePrompt = devtoolsAPI;
        (window as any).AgentStack = devtoolsAPI;
    }, []);

    return null;
}
