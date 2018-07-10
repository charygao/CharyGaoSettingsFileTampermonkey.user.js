// ==UserScript==
// @name         CSDN 全文阅读你大爷
// @namespace    http://www.cnblogs.com/Chary/
// @version      0.1
// @description  把阅读更多的那个啥玩意儿给干掉
// @author       CharyGao
// @match        http://blog.csdn.net/*/article/details/*
// @match        https://blog.csdn.net/*/article/details/*
// @grant        none
// @icon         https://csdnimg.cn/public/favicon.ico
// ==/UserScript==

(function() {
    'use strict';

    var ef = document.querySelector('.hide-article-box');
    if (ef) {
        ef.remove();
        document.querySelector('#article_content').style.height='auto';
    }

    var btnMore = document.getElementById("btn-readmore");
    if (btnMore != undefined) {
        btnMore.click();
    } else {
        console.log("No button found.");
    }
})();
