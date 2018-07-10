// ==UserScript==
// @name         获取微信公众号历史消息链接
// @version      0.1
// @description  Get History Msg Links for WeChat
// @namespace    http://www.cnblogs.com/Chary/
// @author       CharyGao
// @match        http://mp.weixin.qq.com/s?*
// @match        https://mp.weixin.qq.com/s?*
// @match        https://mp.weixin.qq.com/s?*
// @match        http://mp.weixin.qq.com/s/*
// @match        file:///*
// @grant        GM_addStyle
// @run-at       document-start
// @require     https://cdn.bootcss.com/jquery/3.3.1/jquery.js
// @icon         https://res.wx.qq.com/zh_CN/htmledition/v2/images/favicon31e225.ico
// ==/UserScript==

GM_addStyle('span.weui_media_hd{width:100px !important;float:left !important;} #down_url_links{white-space:nowrap!important;background-color: orange!important;}');
(function ($) {
    'use strict';
    $(function () {
        if ($('#down_url')) {
            $('#down_url').remove();
        };
        $(document.body).prepend('<div id="down_url" ></div>');
        $('#down_url').append('links count: , ' + $('h4.weui_media_title').length + '<br>');

        $('#js_view_source').href = window.msg_source_url;
        $('#js_view_source').target = '_blank';

        $('h4.weui_media_title').each(function (i) {
            var link_href = $(this).attr('hrefs');

            if (link_href) {
                var down_link = '<div id="down_url_links">' + i + ' , ' + link_href + ' , ' + $(this).text() + '</div>';
                $('#down_url').append(down_link);
            }
        }

        );
        //$('#down_url').append('</table>');
    });
})(window.jQuery.noConflict(true));



