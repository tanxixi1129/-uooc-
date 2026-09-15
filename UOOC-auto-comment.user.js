// ==UserScript==
// @name         UOOC自动评论
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  自动在UOOC讨论区发表评论，默认每2分钟发表一次
// @author       Robin donald
// @match        https://www.uooc.net.cn/home/learn/index*
// @match        https://www.uooc.net.cn/home/course/*
// @grant        GM_addStyle
// @license      Apache License 2.0
// @downloadURL  https://raw.githubusercontent.com/tanxixi1129/-uooc-/main/UOOC-auto-comment.user.js
// @updateURL    https://raw.githubusercontent.com/tanxixi1129/-uooc-/main/UOOC-auto-comment.user.js
// ==/UserScript==

(function() {
    'use strict';

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
        return document.querySelector([
            ".w-e-text[contenteditable='true']",
            "div[contenteditable='true'][role='textbox']",
            "div[contenteditable='true']",
            "textarea[placeholder='请输入内容'][ng-model='content']"
        ].join(', '));
    }

    // 查找旧版发送按钮或新版“发布回复”按钮
    function findSendButton() {
        const oldButton = document.querySelector("button.replay-editor-btn[ng-click='handelReplay()']");
        if (oldButton) {
            return oldButton;
        }

        return Array.from(document.querySelectorAll('button')).find(button => {
            const label = button.textContent.trim();
            return label === '发布回复' || label === '发表回复' || label === '发送';
        });
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
            const sendButton = findSendButton();
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

    // 添加启动按钮
    function addStartButton() {
        const button = document.createElement('button');
        button.textContent = '开始自动评论';
        button.style.position = 'fixed';
        button.style.top = '10px';
        button.style.right = '10px';
        button.style.zIndex = '9999';
        button.style.padding = '8px 16px';
        button.style.backgroundColor = '#4CAF50';
        button.style.color = 'white';
        button.style.border = 'none';
        button.style.borderRadius = '4px';
        button.style.cursor = 'pointer';

        button.addEventListener('click', () => {
            button.disabled = true;
            button.textContent = '评论中...';
            autoComment();
        });

        document.body.appendChild(button);
    }

    // 等待页面加载完成后添加按钮
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', addStartButton);
    } else {
        addStartButton();
    }
})();
