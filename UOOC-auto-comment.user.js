// ==UserScript==
// @name         UOOC自动评论
// @namespace    http://tampermonkey.net/
// @version      1.3
// @description  自动在UOOC讨论区发表评论，默认每2分钟发表一次
// @author       Robin donald
// @match        https://www.uooc.net.cn/home/learn/index*
// @match        *://www.uooc.net.cn/home/course/*
// @run-at       document-idle
// @grant        GM_addStyle
// @grant        GM_registerMenuCommand
// @noframes
// @license      Apache License 2.0
// @downloadURL  https://raw.githubusercontent.com/tanxixi1129/-uooc-/main/UOOC-auto-comment.user.js
// @updateURL    https://raw.githubusercontent.com/tanxixi1129/-uooc-/main/UOOC-auto-comment.user.js
// ==/UserScript==

(function() {
    'use strict';

    const START_BUTTON_ID = 'uooc-auto-comment-start';
    let autoCommentRunning = false;

    // 预设评论内容
    const COMMENTS = [
        '这个观点很有见地，学到了很多。',
        '感谢分享，让我对这个问题有了新的认识。',
        '确实，这个问题值得深入思考。',
        '同意这个观点，也想分享一下我的想法...',
        '这个讨论很有意义，希望能有更多交流。'
    ];

    // 随机获取评论内容
    function getRandomComment() {
        return COMMENTS[Math.floor(Math.random() * COMMENTS.length)];
    }

    // 查找普通文本框或新版富文本编辑器
    function findCommentEditor() {
        const selectors = [
            "textarea[placeholder='请输入内容']",
            ".w-e-text[contenteditable='true']",
            "div[contenteditable='true'][role='textbox']",
            "div[contenteditable='true']",
            "textarea[ng-model='content']"
        ];

        for (const selector of selectors) {
            const editor = document.querySelector(selector);
            if (editor) {
                return editor;
            }
        }

        return null;
    }

    // 查找旧版发送按钮或新版回复按钮
    function findSendButton(editor) {
        const oldButton = document.querySelector("button.replay-editor-btn[ng-click='handelReplay()']");
        if (oldButton) {
            return oldButton;
        }

        const labels = new Set(['回复', '发布回复', '发表回复', '发送']);
        const findByLabel = root => Array.from(root.querySelectorAll('button')).find(button => {
            return labels.has(button.textContent.trim());
        });

        const nearbyButton = editor && editor.parentElement
            ? findByLabel(editor.parentElement)
            : null;

        return nearbyButton || findByLabel(document);
    }

    // 同时兼容 textarea 与 contenteditable 富文本编辑器
    function fillCommentEditor(editor, content) {
        editor.focus();

        if ('value' in editor) {
            editor.value = content;
        } else {
            editor.innerHTML = '';
            const paragraph = document.createElement('p');
            paragraph.textContent = content;
            editor.appendChild(paragraph);
        }

        ['input', 'change', 'keyup'].forEach(type => {
            editor.dispatchEvent(new Event(type, { bubbles: true }));
        });

        editor.blur();
    }

    // 发表评论
    async function postComment(content) {
        try {
            // 查找评论文本框
            const commentBox = findCommentEditor();
            if (!commentBox) {
                console.log('未找到评论框');
                return false;
            }

            // 填写评论内容
            fillCommentEditor(commentBox, content);

            // 查找发送按钮
            const sendButton = findSendButton(commentBox);
            if (!sendButton) {
                console.log('未找到发送按钮');
                return false;
            }

            // 点击发送按钮
            sendButton.click();
            console.log(`成功发表评论: ${content.substring(0, 30)}...`);
            return true;
        } catch (error) {
            console.error('发表评论失败:', error);
            return false;
        }
    }

    // 自动评论主函数
    async function autoComment() {
        while (true) {
            try {
                const comment = getRandomComment();
                if (await postComment(comment)) {
                    console.log('等待120秒后发送下一条评论...');
                    await new Promise(resolve => setTimeout(resolve, 120000)); // 2分钟间隔
                } else {
                    console.log('发表失败，等待30秒后重试...');
                    await new Promise(resolve => setTimeout(resolve, 30000));
                }
            } catch (error) {
                console.error('发生错误:', error);
                await new Promise(resolve => setTimeout(resolve, 30000));
            }
        }
    }

    function startAutoComment(button) {
        if (autoCommentRunning) {
            return;
        }

        autoCommentRunning = true;
        if (button) {
            button.disabled = true;
            button.textContent = '评论中...';
        }
        autoComment();
    }

    // 添加启动按钮；页面路由重绘后会自动补回
    function ensureStartButton() {
        if (!document.body || document.getElementById(START_BUTTON_ID)) {
            return;
        }

        const button = document.createElement('button');
        button.id = START_BUTTON_ID;
        button.type = 'button';
        button.textContent = autoCommentRunning ? '评论中...' : '开始自动评论 v1.3';
        button.style.position = 'fixed';
        button.style.top = '80px';
        button.style.right = '24px';
        button.style.zIndex = '2147483647';
        button.style.padding = '8px 16px';
        button.style.backgroundColor = '#4CAF50';
        button.style.color = 'white';
        button.style.border = 'none';
        button.style.borderRadius = '4px';
        button.style.cursor = 'pointer';

        button.addEventListener('click', () => {
            startAutoComment(button);
        });

        document.body.appendChild(button);
    }

    if (typeof GM_addStyle === 'function') {
        GM_addStyle(`
            #${START_BUTTON_ID} {
                display: block !important;
                visibility: visible !important;
                opacity: 1 !important;
                position: fixed !important;
                top: 80px !important;
                right: 24px !important;
                z-index: 2147483647 !important;
            }
        `);
    }

    if (typeof GM_registerMenuCommand === 'function') {
        GM_registerMenuCommand('开始自动评论', () => {
            startAutoComment(document.getElementById(START_BUTTON_ID));
        });
    }

    // 等待页面加载，并持续处理 Angular 路由重绘
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', ensureStartButton);
    } else {
        ensureStartButton();
    }

    new MutationObserver(ensureStartButton).observe(document.documentElement, {
        childList: true,
        subtree: true
    });
    setInterval(ensureStartButton, 2000);
    console.info(`[UOOC自动评论] v1.3 已加载：${location.href}`);
})();
