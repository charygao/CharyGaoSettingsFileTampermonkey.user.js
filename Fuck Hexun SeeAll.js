// ==UserScript==
// @name         和讯理财看全文你大爷
// @namespace    http://www.cnblogs.com/Chary/
// @version      0.4
// @description  把看全文的那个啥玩意儿给干掉
// @author       CharyGao
// @match        http://money.hexun.com/*
// @grant        GM_addStyle
// @icon         http://www.hexun.com/favicon.ico

// ==/UserScript==
GM_addStyle(
	'.art_contextBox{height:auto!important;}'
	+'.aImgDl, .fttBox, .showAll ,.showAllImg ,.appDl{display: none!important;}'
	+' .layout{width: auto!important;}' 
	+' .w600{width: auto!important; margin: 0px 5%!important;}'
	+' body{background-color: #CCE8CF!important;}'
	+' table{margin: 0 auto;}'
);//直接下载所有图片
(function() {
    'use strict';
})();
