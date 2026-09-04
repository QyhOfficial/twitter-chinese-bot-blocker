// ==UserScript==
// @name         Twitter Chinese Bot Blocker
// @name:zh-CN   推特中文机器人屏蔽器
// @namespace    https://github.com/QyhOfficial/twitter-chinese-bot-blocker
// @version      0.0.1
// @description  Block spam replies on Twitter/X that contain common Chinese bot phrases
// @description:zh-CN 屏蔽推特评论区中的中文机器人垃圾回复
// @author       QyhOfficial
// @match        https://x.com/*
// @match        https://twitter.com/*
// @grant        none
// @run-at       document-idle
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
    ];

    // Check interval in milliseconds (Twitter loads content dynamically)
    const OBSERVE_THROTTLE_MS = 500;

    // ========== Core Logic ==========

    // Normalize text: remove all whitespace and convert to lowercase
    function normalize(text) {
        return text.replace(/\s+/g, "").toLowerCase();
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
        // Each tweet/reply is rendered inside an article element
        const tweets = document.querySelectorAll('article[data-testid="tweet"]');

        tweets.forEach((tweet) => {
            // Skip already-processed tweets
            if (tweet.dataset.botChecked) return;
            tweet.dataset.botChecked = "true";

            const tweetText = tweet.querySelector('[data-testid="tweetText"]');
            if (!tweetText) return;

            const textContent = tweetText.textContent || "";
            if (!containsBlockedPhrase(textContent)) return;

            // The tweet article is nested inside a wrapper cell;
            // hide the nearest ancestor that forms the visible row
            const wrapper = tweet.closest('[data-testid="cellInnerDiv"]') || tweet;
            wrapper.style.display = "none";

            console.log("[Bot Blocker] Hid a spam reply:", textContent.slice(0, 60));
        });
    }

    // ========== Observer ==========

    let throttleTimer = null;

    function scheduleCheck() {
        if (throttleTimer) return;
        throttleTimer = setTimeout(() => {
            throttleTimer = null;
            hideBotReplies();
        }, OBSERVE_THROTTLE_MS);
    }

    // Watch for dynamically loaded tweets (infinite scroll, navigation)
    const observer = new MutationObserver(scheduleCheck);
    observer.observe(document.body, { childList: true, subtree: true });

    // Initial scan
    hideBotReplies();

    console.log("[Bot Blocker] Twitter Chinese Bot Blocker is active.");
})();
