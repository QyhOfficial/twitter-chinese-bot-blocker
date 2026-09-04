// ==UserScript==
// @name         Twitter Chinese Bot Blocker
// @name:zh-CN   推特中文机器人屏蔽器
// @namespace    https://github.com/QyhOfficial/twitter-chinese-bot-blocker
// @version      0.0.3
// @description  Block spam replies on Twitter/X that contain common Chinese bot phrases
// @description:zh-CN 屏蔽推特评论区中的中文机器人垃圾回复
// @author       QyhOfficial
// @match        https://x.com/*
// @match        https://twitter.com/*
// @grant        none
// @run-at       document-start
// @license      MIT
// @homepageURL  https://github.com/QyhOfficial/twitter-chinese-bot-blocker
// @supportURL   https://github.com/QyhOfficial/twitter-chinese-bot-blocker/issues
// @updateURL    https://raw.githubusercontent.com/QyhOfficial/twitter-chinese-bot-blocker/main/twitter-chinese-bot-blocker.user.js
// @downloadURL  https://raw.githubusercontent.com/QyhOfficial/twitter-chinese-bot-blocker/main/twitter-chinese-bot-blocker.user.js
// ==/UserScript==

(function () {
    "use strict";

    // ========== Configuration ==========

    // Phrases to block (case-insensitive, whitespace-insensitive)
    const BLOCKED_PHRASES = [
        "比她好看的没她骚比她骚的没她好看",
        "比我好看的没我骚比我骚的没我好看",
        "应该没人比我玩的开了吧",
        "我福不黑不信你看",
    ];

    // ========== CSS Pre-hide ==========
    // Hide unchecked tweet cells by default so spam never flashes on screen.
    // Clean tweets are revealed almost instantly after the check.

    const CHECKED_ATTR = "data-bot-checked";
    const style = document.createElement("style");
    style.textContent =
        '[data-testid="cellInnerDiv"]:not([' + CHECKED_ATTR + ']) { opacity: 0; }';
    (document.head || document.documentElement).appendChild(style);

    // ========== Core Logic ==========

    // Strip whitespace, zero-width chars, variation selectors, and emoji
    const JUNK_RE = new RegExp(
        "[\\s\\u200B-\\u200F\\u2028-\\u202F\\u2060\\uFEFF\\uFE0E\\uFE0F]"
        + "|\\p{Emoji_Presentation}|\\p{Emoji}\\uFE0F?",
        "gu"
    );
    function normalize(text) {
        return text.replace(JUNK_RE, "").toLowerCase();
    }

    // Build normalized patterns once
    const normalizedPatterns = BLOCKED_PHRASES.map(normalize);

    // Check if a text matches any blocked phrase
    function containsBlockedPhrase(text) {
        const normalizedText = normalize(text);
        return normalizedPatterns.some((pattern) => normalizedText.includes(pattern));
    }

    // Find and hide tweets that contain blocked phrases
    function hideBotReplies() {
        const cells = document.querySelectorAll(
            '[data-testid="cellInnerDiv"]:not([' + CHECKED_ATTR + '])'
        );

        cells.forEach((cell) => {
            const tweet = cell.querySelector('article[data-testid="tweet"]');

            // If tweet article hasn't rendered inside the cell yet, skip for now
            if (!tweet) return;

            const tweetText = tweet.querySelector('[data-testid="tweetText"]');
            const textContent = tweetText?.textContent || "";

            if (containsBlockedPhrase(textContent)) {
                // Spam: hide permanently
                cell.style.display = "none";
                console.log("[Bot Blocker] Hid a spam reply:", textContent.slice(0, 60));
            }

            // Mark as checked so CSS reveals it (or keeps it hidden if display:none)
            cell.setAttribute(CHECKED_ATTR, "true");
        });
    }

    // ========== Observer ==========

    const observer = new MutationObserver(hideBotReplies);

    function startObserver() {
        observer.observe(document.body, { childList: true, subtree: true });
        hideBotReplies();
        console.log("[Bot Blocker] Twitter Chinese Bot Blocker is active.");
    }

    // document-start means body may not exist yet
    if (document.body) {
        startObserver();
    } else {
        document.addEventListener("DOMContentLoaded", startObserver);
    }
})();
