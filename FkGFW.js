// ==UserScript==
// @name               FkGFW富国服墙
// @namespace          https://www.cnblogs.com/chary
// @version            0.0.5
// @author             CharyGao
// @description        FkGFW only supports the latest chrome and Tm;啥都不服只扶墙;
// @icon               https://img.icons8.com/ios-filled/100/000000/firewall.png
// @match              https://io.freess.info/*
// @include            https://*.ishadowx.*
// @include            https://www.ximalaya.com/*/*/
// @include            https://space.bilibili.com/*/*
// @include            https://www.douyin.com/user/*
// @include            https://open.163.com/newview/movie/*
// @include            https://www.ixigua.com/home/*
// @require            https://bundle.run/jsqr@1.3.1
// @require            https://cdnjs.cloudflare.com/ajax/libs/axios/0.19.2/axios.min.js
// @require            https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.0.0/core.min.js
// @require            https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.0.0/md5.min.js
// @require            https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.0.0/enc-base64.min.js
// @require            https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.0.0/enc-hex.min.js
// @run-at             document-end
// @grant              GM_setValue
// @grant              GM_getValue
// @grant              GM_setClipboard
// @grant              unsafeWindow
// @grant              window.close
// @grant              window.focus
// @grant              GM_xmlhttpRequest
// @grant              GM_openInTab
// @grant              GM_registerMenuCommand
// @grant              GM_addStyle
// @grant              GM_download
// ==/UserScript==

(function () {
    'use strict'; //启用严格模式

    //<editor-fold desc="0.Log">
    const myLog = new class {
        _logCount = 0;

        log(param1, param2) {
            param1 = param1 ? param1 : "";
            param2 = param2 ? param2 : "";
            // noinspection JSUnresolvedFunction
            console.log(`#${this._logCount++}ADown:`, param1, param2);
        }
    }

    //</editor-fold>

    //<editor-fold desc="0.1.单一文件 下载@">
    function exportRaw(fileName, text) {//调用 单一文件 下载
        let anchor = addDownAHrefNode(text, fileName);
        anchor.click();
    }

    function addDownAHrefNode(text, fileName) {
        let anchor = document.createElement("a");
        let data = new Blob([text], {type: "text/plain;charset=UTF-8"});
        anchor.href = window.URL.createObjectURL(data);
        anchor.download = fileName;
        anchor.innerText = fileName;
        // noinspection JSUnresolvedFunction
        //GM_openInTab(anchor.href, "setParent");

        anchor.addEventListener("click", ev => myLog.log(fileName + "|下载-被点击！", JSON.stringify(ev)));
        //anchor.click();
        return anchor;
    }

    //</editor-fold>

    //<editor-fold desc="1.Ui">
    const floatTaiChi = new class {
        constructor() {
            //<editor-fold desc="setUi Class Style">
            // noinspection JSUnresolvedFunction,CssUnusedSymbol
            GM_addStyle(// language=CSS
                `.aside-nav {
                    position: fixed;
                    top: 50px;
                    left: 50px;
                    z-index: 9999999 !important;
                    width: 260px;
                    height: 260px;
                    filter: url(#goo);
                    user-select: none;
                    opacity: .75;
                }

                .bounceInUp {
                    animation-name: bounceInUp;
                    animation-delay: 1s;
                }

                .animated {
                    animation-duration: 1s;
                    animation-fill-mode: both;
                }

                .aside-nav .aside-menu {
                    position: absolute;
                    width: 50px;
                    height: 50px;
                    border-radius: 50%;
                    border: red 2px double;
                    background: #07A7E1;
                    left: 0;
                    top: 0;
                    right: 0;
                    bottom: 0;
                    margin: auto;
                    text-align: center;
                    line-height: 49px;
                    font-size: 20px;
                    z-index: 1;
                    /*cursor: move;*/
                }

                .aside-nav .menu-item {
                    position: absolute;
                    width: 60px;
                    height: 60px;
                    background-color: #ff7676;
                    left: 0;
                    top: 0;
                    right: 0;
                    bottom: 0;
                    margin: auto;
                    line-height: 60px;
                    text-align: center;
                    border-radius: 50%;
                    text-decoration: none;
                    color: #fff;
                    transition: background .5s, transform .6s;
                    font-size: 14px;
                    box-sizing: border-box;
                }

                .aside-nav .menu-item:hover {
                    background: #a9c734;

                }

                .aside-nav .menu-line {
                    line-height: 59px;
                }

                .aside-nav:hover {
                    opacity: 1;
                }

                .aside-nav:hover .aside-menu {
                    animation: jello 1s;
                }

                .aside-nav:hover .menu-1 {
                    transform: translate3d(0, -135%, 0) rotateZ(0deg);
                }

                .aside-nav:hover .menu-2 {
                    transform: translate3d(-100%, -100%, 10px) rotateZ(-45deg);
                }

                .aside-nav:hover .menu-3 {
                    transform: translate3d(-135%, 0, 0) rotateZ(-90deg);
                }

                .aside-nav:hover .menu-4 {
                    transform: translate3d(-100%, 100%, 10px) rotateZ(-135deg);
                }

                .aside-nav:hover .menu-5 {
                    transform: translate3d(0%, 135%, 0) rotateZ(180deg);
                }

                .aside-nav:hover .menu-6 {
                    transform: translate3d(100%, 100%, 10px) rotateZ(135deg);
                }

                .aside-nav:hover .menu-7 {
                    transform: translate3d(135%, 0, 0) rotateZ(90deg);
                }

                .aside-nav:hover .menu-8 {
                    transform: translate3d(100%, -100%, 10px) rotateZ(45deg);
                }

                @keyframes jello {
                    from, 11.1%, to {
                        transform: none;
                    }
                    22.2% {
                        transform: skewX(-12.5deg) skewY(-12.5deg);
                    }
                    33.3% {
                        transform: skewX(6.25deg) skewY(6.25deg);
                    }
                    44.4% {
                        transform: skewX(-3.125deg) skewY(-3.125deg);
                    }
                    55.5% {
                        transform: skewX(1.5625deg) skewY(1.5625deg);
                    }
                    66.6% {
                        transform: skewX(-.78125deg) skewY(-.78125deg);
                    }
                    77.7% {
                        transform: skewX(0.390625deg) skewY(0.390625deg);
                    }
                    88.8% {
                        transform: skewX(-.1953125deg) skewY(-.1953125deg);
                    }
                }

                @keyframes bounceInUp {
                    from, 60%, 75%, 90%, to {
                        animation-timing-function: cubic-bezier(0.215, .61, .355, 1);
                    }
                    from {
                        opacity: 0;
                        transform: translate3d(0, 800px, 0);
                    }
                    60% {
                        opacity: 1;
                        transform: translate3d(0, -20px, 0);
                    }
                    75% {
                        transform: translate3d(0, 10px, 0);
                    }
                    90% {
                        transform: translate3d(0, -5px, 0);
                    }
                    to {
                        transform: translate3d(0, 0, 0);
                    }
                }
                `)
            ;
            //</editor-fold>

            let sideGodDownTagNavDiv = document.createElement("div");
            sideGodDownTagNavDiv.className = "aside-nav bounceInUp animated";
            // language=HTML
            sideGodDownTagNavDiv.innerHTML =
                `<label class="aside-menu" id="god_down_label">👇</label>
                <span class="menu-item menu-line menu-1" id="god_down_span_1">①☰乾</span>
                <span class="menu-item menu-line menu-2" id="god_down_span_2">②☱兑</span>
                <span class="menu-item menu-line menu-3" id="god_down_span_3">③☲离</span>
                <span class="menu-item menu-line menu-4" id="god_down_span_4">④☳震</span>
                <span class="menu-item menu-line menu-5" id="god_down_span_5">⑤☷坤</span>
                <span class="menu-item menu-line menu-6" id="god_down_span_6">⑥☶艮</span>
                <span class="menu-item menu-line menu-7" id="god_down_span_7">⑦☵坎</span>
                <span class="menu-item menu-line menu-8" id="god_down_span_8">⑧☴巽</span>`;
            document.body.append(sideGodDownTagNavDiv);

            let drag = {
                offsetLeft: null,
                offsetTop: null,
                isDown: false,
            }
            sideGodDownTagNavDiv.addEventListener("mousedown", ev => {
                drag.offsetLeft = ev.clientX - sideGodDownTagNavDiv.offsetLeft;
                drag.offsetTop = ev.clientY - sideGodDownTagNavDiv.offsetTop;
                drag.isDown = true;
            })

            sideGodDownTagNavDiv.addEventListener("mousemove", ev => {

                if (ev.clientX < 50 || ev.clientX > window.innerWidth - 50
                    || ev.clientY < 50 || ev.clientY > window.innerHeight - 50
                    || drag.isDown === false) {
                    return;
                }

                let newOffsetLeft = ev.clientX - drag.offsetLeft;
                let newOffsetTop = ev.clientY - drag.offsetTop;

                sideGodDownTagNavDiv.style.left = `${newOffsetLeft}px`;
                sideGodDownTagNavDiv.style.top = `${newOffsetTop}px`;
            })

            sideGodDownTagNavDiv.addEventListener("mouseup", () => {
                drag.isDown = false;
            });
            // noinspection JSUnusedGlobalSymbols
            this.godDownLabel = document.getElementById("god_down_label");
            // noinspection JSUnusedGlobalSymbols
            this.godDownSpan1 = document.getElementById("god_down_span_1");
            // noinspection JSUnusedGlobalSymbols
            this.godDownSpan2 = document.getElementById("god_down_span_2");
            // noinspection JSUnusedGlobalSymbols
            this.godDownSpan3 = document.getElementById("god_down_span_3");
            // noinspection JSUnusedGlobalSymbols
            this.godDownSpan4 = document.getElementById("god_down_span_4");
            // noinspection JSUnusedGlobalSymbols
            this.godDownSpan5 = document.getElementById("god_down_span_5");
            // noinspection JSUnusedGlobalSymbols
            this.godDownSpan6 = document.getElementById("god_down_span_6");
            // noinspection JSUnusedGlobalSymbols
            this.godDownSpan7 = document.getElementById("god_down_span_7");
            // noinspection JSUnusedGlobalSymbols
            this.godDownSpan8 = document.getElementById("god_down_span_8");
        }
    };

    const subTextArea = new class {
        constructor() {
            let textContainer = document.createElement("div");
            textContainer.id = "god_down_text_div";
            // language=HTML
            textContainer.innerHTML = `
                <div style="white-space: nowrap; width: calc(100% - 10px); position: fixed; top: 50%;left: 0;
margin: 2px; height: calc(50% - 50px); background: black; color: lawngreen; resize: none; border: 3px solid green; overflow: scroll;z-index: 99;">
                    <textarea id="god_down_textarea"
                              style=" width: 100%; height: 100%;display: none;color: green; background: black; border: red 1px dashed;"></textarea>
                    <ol id="god_down_links_node" style="display: none"></ol>
                </div>`;
            document.body.appendChild(textContainer);
            this.textContainer = textContainer;
            this.textContainerTextarea = document.getElementById("god_down_textarea");
            // noinspection JSUnusedGlobalSymbols
            this.textContainerLinksNode = document.getElementById("god_down_links_node");
            this.count = 0;
            textContainer.hidden = true;
        }
    }

    const showTips = new class {
        constructor() {
            //<editor-fold desc="setUi Class Style - https://animista.net/">
            // noinspection JSUnresolvedFunction,CssUnusedSymbol
            GM_addStyle(// language=CSS
                `

                    div#god_down_show_tips {
                        top: 20px;
                        left: 20px;
                        position: fixed;
                        padding: 3px 5px;
                        background: powderblue;
                        border: red 3px groove;
                        box-shadow: 0 0 10px 10px brown;
                        border-radius: 10px;
                        opacity: 0;
                        font-size: 12px;
                        margin: 0;
                        text-align: center;
                        width: 350px;
                        height: auto;
                        color: darkblue;
                        z-index: 9999;
                    }

                    .slide-in-and-out-blurred-top {

                        animation-name: slide-in-blurred-top, slide-out-blurred-top;
                        animation-duration: 0.6s, 0.45s;
                        animation-delay: 0s, 1.6s;
                        animation-iteration-count: 1, 1;
                        animation-direction: normal, normal;
                        animation-timing-function: cubic-bezier(0.230, 1.000, 0.320, 1.000), cubic-bezier(0.755, 0.050, 0.855, 0.060);
                        animation-fill-mode: forwards, forwards; /*both, both;*/
                    }

                    .slide-in-blurred-top {
                        animation: slide-in-blurred-top 0.6s cubic-bezier(0.230, 1.000, 0.320, 1.000) both;
                    }

                    @keyframes slide-in-blurred-top {
                        0% {
                            transform: translateY(-1000px) scaleY(2.5) scaleX(0.2);
                            transform-origin: 50% 0;
                            filter: blur(40px);
                            opacity: 0;
                        }
                        100% {
                            transform: translateY(0) scaleY(1) scaleX(1);
                            transform-origin: 50% 50%;
                            filter: blur(0);
                            opacity: 1;
                        }
                    }

                    .slide-out-blurred-top {
                        animation: slide-out-blurred-top 0.45s cubic-bezier(0.755, 0.050, 0.855, 0.060) both;
                    }

                    @keyframes slide-out-blurred-top {
                        0% {
                            transform: translateY(0) scaleY(1) scaleX(1);
                            transform-origin: 50% 0;
                            filter: blur(0);
                            opacity: 1;
                        }
                        100% {
                            transform: translateY(-1000px) scaleY(2) scaleX(0.2);
                            transform-origin: 50% 0;
                            filter: blur(40px);
                            opacity: 0;
                        }
                    }
                `);
            //</editor-fold>
            this.windowWidth = window.innerWidth;
            this.windowHeight = window.innerHeight;

            this.htmlTipsDivElement = document.createElement("div");
            this.htmlTipsDivElement.id = "god_down_show_tips";
            this.htmlTipsDivElement.innerText = "god_down加载完成!";
            document.body.appendChild(this.htmlTipsDivElement);
            this.htmlTipsDivElement.style.top = ((this.windowHeight / 2) - 25) + "px";
            let halfDivWith = document.querySelector("#god_down_show_tips").offsetWidth / 2;
            this.htmlTipsDivElement.style.left = ((this.windowWidth / 2) - halfDivWith) + "px";
            this.htmlTipsDivElement.className = "slide-in-and-out-blurred-top";
            this.htmlTipsDivElement.addEventListener("animationend", (animationEvent) => {
                // myLog.log(animationEvent.animationName);
                if (animationEvent.animationName === "slide-out-blurred-top") {
                    this.htmlTipsDivElement.classList.remove("slide-in-and-out-blurred-top");
                }
            });
        }

        show(content, height, time_s) {
            this.windowWidth = window.innerWidth;
            this.windowHeight = window.innerHeight;

            this.htmlTipsDivElement.innerText = content;
            this.htmlTipsDivElement.style.animationDelay = "0s, " + (time_s + 0.6) + "s";
            let halfDivWith = document.querySelector("#god_down_show_tips").offsetWidth / 2;
            this.htmlTipsDivElement.style.top = ((this.windowHeight / 2) - (height / 2)) + "px";
            this.htmlTipsDivElement.style.left = ((this.windowWidth / 2) - halfDivWith) + "px";
            this.htmlTipsDivElement.className = "slide-in-and-out-blurred-top";
        }
    }
    //</editor-fold>

    //<editor-fold desc="2.Aria2 下载">
    const aria2Caller = new class {

        _aria2Url = "http://127.0.0.1:6800/jsonrpc"; //Aria2 地址
        windowsNameForbidCharReg = /[\\?？*"“'‘<>{}\[\]【】：:、^$!~`|#/\s]/g;
        _hasOpenAriaC2Tab = false;

        down(downloadUrl, fileName, savePath) {
            myLog.log(`mv url:${downloadUrl}...`)
            savePath = savePath.replace(this.windowsNameForbidCharReg, "").trim();
            fileName = fileName.replace(this.windowsNameForbidCharReg, "").trim();
            let jsonRpc = {
                id: '',
                jsonrpc: '2.0',
                method: 'aria2.addUri',
                params: [
                    [downloadUrl],
                    {
                        dir: savePath,
                        out: fileName
                    }
                ]
            };
            // noinspection JSUnresolvedFunction
            GM_xmlhttpRequest({
                url: this._aria2Url,
                method: 'POST',
                data: JSON.stringify(jsonRpc),
                onerror: response => myLog.log(`${this._aria2Url} error:${response}`),
                onload: response => {
                    myLog.log(`${this._aria2Url} onload:${response.statusText}`);
                    if (!this._hasOpenAriaC2Tab) {
                        // noinspection JSUnresolvedFunction
                        GM_openInTab('http://aria2c.com/', {active: true});
                        this._hasOpenAriaC2Tab = true;
                    }
                }
            });
        }

    }

    //</editor-fold>

    //<editor-fold desc="3.入口!!">
    setTimeout(function () {
        try {
            if (location.href.startsWith("https://io.freess.info")) {
                floatTaiChi.godDownLabel.addEventListener("click",//https://io.freess.info/
                    () => subTextArea.textContainer.hidden = !subTextArea.textContainer.hidden);
                floatTaiChi.godDownSpan1.innerText = "获取";
                subTextArea.textContainerTextarea.style.display = "block";
                floatTaiChi.godDownSpan1.addEventListener("click", freeSsInfoGet);
            } else if (location.href.startsWith("https://my.ishadowx.biz")) {
                floatTaiChi.godDownLabel.addEventListener("click",//https://*.ishadowx.biz
                    () => subTextArea.textContainer.hidden = !subTextArea.textContainer.hidden);
                floatTaiChi.godDownSpan1.innerText = "获取";
                subTextArea.textContainerTextarea.style.display = "block";
                floatTaiChi.godDownSpan1.addEventListener("click", iShadowXGet);
            } else if (location.href.startsWith("https://www.ximalaya.com")) {
                floatTaiChi.godDownLabel.addEventListener("click",//喜马拉雅
                    () => subTextArea.textContainer.hidden = !subTextArea.textContainer.hidden);
                floatTaiChi.godDownSpan1.innerText = "下载";
                floatTaiChi.godDownSpan1.addEventListener("click", xiMaLaYaDown);
            } else if (location.href.startsWith("https://space.bilibili.com/")) {
                floatTaiChi.godDownLabel.addEventListener("click",//bilibiliYou-get
                    () => subTextArea.textContainer.hidden = !subTextArea.textContainer.hidden);
                floatTaiChi.godDownSpan1.innerText = "下载";
                floatTaiChi.godDownSpan1.addEventListener("click", bilibiliSpace);
            } else if (location.href.startsWith("https://www.douyin.com/user/")) {
                floatTaiChi.godDownLabel.addEventListener("click",//抖音用户
                    () => subTextArea.textContainer.hidden = !subTextArea.textContainer.hidden);
                floatTaiChi.godDownSpan1.innerText = "下载";
                floatTaiChi.godDownSpan1.addEventListener("click", douYinUserSpace);
            } else if (location.href.startsWith("https://open.163.com/newview/movie/")) {
                floatTaiChi.godDownLabel.addEventListener("click",//网易公开课
                    () => subTextArea.textContainer.hidden = !subTextArea.textContainer.hidden);
                floatTaiChi.godDownSpan1.innerText = "下载";
                floatTaiChi.godDownSpan1.addEventListener("click", open163FreeSpace);
            } else if (location.href.startsWith("https://www.ixigua.com/home/")) {
                floatTaiChi.godDownLabel.addEventListener("click",//西瓜视频个人空间
                    () => subTextArea.textContainer.hidden = !subTextArea.textContainer.hidden);
                floatTaiChi.godDownSpan1.innerText = "下载";
                floatTaiChi.godDownSpan1.addEventListener("click", iXiGuaFreeSpace);
            } else {

                myLog.log("没解析成功!");
            }
            myLog.log("GodDown加载完成~");
        } catch (e) {
            myLog.log('err:', e);
        }
    }, 2000); //页面加载完成后延时2秒执行
    //</editor-fold>

    //<editor-fold desc="4.https://io.freess.info/">
    function freeSsInfoGet() {

        let freeSsInfoGetHeader = new Headers({
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
            "Accept-Language": "zh-CN,zh;q=0.9",
            "Cache-Control": "no-cache",
            "Host": "io.freess.info",
            "DNT": "1",
            "Sec-Fetch-Dest": "document",
            "Sec-Fetch-Mode": "navigate",
            "Sec-Fetch-Site": "none",
            "Sec-Fetch-User": "?1",
            "Upgrade-Insecure-Requests": "1",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.61 Safari/537.36",
        });

        // noinspection JSUnresolvedFunction
        GM_xmlhttpRequest(
            {
                method: "GET",
                headers: freeSsInfoGetHeader,
                url: "https://io.freess.info/",
                timeout: 5000,
                // responseType: "string",//one of arraybuffer, blob, json
                onload: (freeSsInfoGetResponse) => {
                    if (freeSsInfoGetResponse.status !== 200) {
                        throw `1.页面获取 error htmlResponse.status != 200:${freeSsInfoGetResponse}`;
                    }
                    // myLog.log(freeSsInfoGetResponse.responseXML);
                    let matchedGroups = freeSsInfoGetResponse.responseText.match(/href="(data:image\/png;base64,.*?)"/img);
                    for (const src of matchedGroups) {
                        let dataSrc = src.match(/href="(data:image\/png;base64,.*?)"/im)[1];
                        myLog.log(dataSrc);

                        const image = new Image();
                        image.src = dataSrc;
                        image.onload = function () {
                            const canvas = document.createElement('canvas'), context = canvas.getContext('2d');
                            canvas.width = image.width;
                            canvas.height = image.height;
                            context.drawImage(image, 0, 0);

                            document.body.prepend(canvas);

                            try {
                                const imageData = context.getImageData(0, 0, image.width, image.height);
                                // myLog.log(imageData.data);
                                // noinspection JSUnresolvedFunction
                                const qrCode = jsqr(imageData.data, imageData.width, imageData.height);
                                const {data} = qrCode;

                                myLog.log(data);
                                subTextArea.textContainerTextarea.value += data + "\n";
                                subTextArea.count++;

                                if (matchedGroups.length <= subTextArea.count) {
                                    subTextArea.textContainer.hidden = false;
                                    // noinspection JSUnresolvedFunction
                                    GM_setClipboard(subTextArea.textContainerTextarea.value, {
                                        type: 'text',
                                        mimetype: 'text/plain'
                                    });
                                    showTips.show("复制完成!", 50, 3);
                                }


                            } catch (e) {
                                myLog.log(e);
                            }
                        };

                    }


                },
                onerror: (exception) => {
                    myLog.log(`onerror:${exception}`);
                },
                ontimeout: (exception) => {
                    myLog.log(`ontimeout:${exception}`);
                },
            }
        );
    }

    //</editor-fold>

    //<editor-fold desc="5.https://*.ishadowx.biz">
    function iShadowXGet() {
        let v2Groups = document.querySelectorAll("div.v2 span.copybtn");
        for (const item of v2Groups) {
            let dataV2 = item.getAttribute("data-clipboard-text");
            myLog.log(dataV2);
            subTextArea.textContainerTextarea.value += dataV2;
            subTextArea.count++;
            // if (v2Groups.length <= subTextArea.count) {
            //     subTextArea.textContainer.hidden = false;
            //     // noinspection JSUnresolvedFunction
            //     GM_setClipboard(subTextArea.textContainerTextarea.value, {
            //         type: 'text',
            //         mimetype: 'text/plain'
            //     });
            //     showTips.show("复制完成!", 50, 3);
            // }
        }

        let protocol = "origin";//协议
        let obfuscation = "plain";//混淆
        let group = "IShadowX";
        let groupUrlEncodedBase64 = CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(group));
        let elementNodeListOfH4Groups = document.querySelectorAll("div.portfolio-items > div > div.portfolio-item > div.hover-bg > div.hover-text");
        elementNodeListOfH4Groups.forEach(divPicItem => {
            let ipNode = divPicItem.querySelector("h4 > span[id^='ip']");//服务器ip
            let portNode = divPicItem.querySelector("h4 > span[id^='port']");//服务器端口
            let passwordNode = divPicItem.querySelector("h4 > span[id^='pw']");//密码
            let methodNode = divPicItem.querySelector("h4:nth-last-child(2)");//加密
            if (ipNode && portNode && passwordNode && methodNode) {
                let ip = ipNode.innerText.trim();//服务器ip
                let port = portNode.innerText.trim();//服务器端口
                let password = passwordNode.innerText.trim();//密码
                let method = methodNode.innerText.trim().substring(7);//加密

                let passwordUrlEncodedBase64 = CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(password));
                let allString = `${ip}:${port}:${protocol}:${method}:${obfuscation}:${passwordUrlEncodedBase64}/?obfsparam=&remarks=&group=${groupUrlEncodedBase64}`;
                let allBase64 = CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(allString));

                subTextArea.textContainerTextarea.value += `ssr://${allBase64}\n`;
                subTextArea.count++;
                if (elementNodeListOfH4Groups.length <= subTextArea.count) {
                    subTextArea.textContainer.hidden = false;
                    // noinspection JSUnresolvedFunction
                    GM_setClipboard(subTextArea.textContainerTextarea.value, {
                        type: 'text',
                        mimetype: 'text/plain'
                    });
                    showTips.show("复制完成!", 50, 3);
                }
            } else {
                myLog.log("中间三个非ssr跳过!");
            }


        });

    }

    //</editor-fold>

    //<editor-fold desc="6.喜马拉雅vip下载 https://www.ximalaya.com">

    function xiMaLaYaDown() {
        let trackTotalCount = document.querySelector(
            '#anchor_sound_list > div.head._Qp > span.title.active.zH_ > span')
            .innerText.match(/（(\d+)）/)[1];

        let firstItemIdHref = document.querySelector(
            '#anchor_sound_list > div.sound-list._Qp > ul > li:nth-child(1) > div.text._Vc > a').href;
        let firstItemId = firstItemIdHref.substring(firstItemIdHref.lastIndexOf("/") + 1);

        let albumId = document.location.pathname.match(/\/(\d+)\//)[1];
        let albumTitle = document.querySelector(
            '#award > main > div.album-detail > div.clearfix > div.detail.layout-main > ' +
            'div.detail-wrapper.lO_ > div.album-info.clearfix.lO_ > div.info.lO_ > h1').innerText;

        let xiMaLaYaHeader = new Headers({
            "Accept": "*/*",
            "Accept-Encoding": "gzip, deflate, br",
            "Accept-Language": "zh-CN,zh;q=0.9",
            "Connection": "keep-alive",
            "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
            "Cookie": document.cookie,
            "DNT": "1",
            "Sec-Fetch-Dest": "empty",
            "Sec-Fetch-Mode": "cors",
            "Sec-Fetch-Site": "same-origin",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.138 Safari/537.36",
            "xm-sign": getXmSign(),//"bed39fe2cbc2c75a75eedb07a7a853ed(14)1590308034040(54)1590308034351",
        });

        fetch("https://www.ximalaya.com/revision/play/v1/show?" +
            `id=${firstItemId}&sort=0&size=${trackTotalCount}&ptype=1`,
            {
                mode: "cors",
                method: "GET",
                // cache: "no-cache",
                headers: xiMaLaYaHeader,
            }
        ).then(trackInfoResponse => {
            if (trackInfoResponse.ok) return trackInfoResponse.json();
            throw `1.全量获取 error trackInfoResponse.status != 200:${trackInfoResponse}`;
        }).catch(trackInfoResponseError => myLog.log(`1.全量获取 error:${trackInfoResponseError}`)).then(trackInfoJson => {
            // noinspection JSUnresolvedVariable
            trackInfoJson.data.tracksAudioPlay.forEach(audioItem => {
                // myLog.log(audioItem);
                // noinspection JSUnresolvedVariable
                let trackUrlPath = audioItem.trackUrl;
                let trackUrlId = trackUrlPath.substring(trackUrlPath.lastIndexOf("/") + 1);
                let timeStamp = Date.now();
                // noinspection JSUnresolvedFunction
                GM_xmlhttpRequest(
                    {
                        method: "GET",
                        headers: xiMaLaYaHeader,
                        url: "https://mpay.ximalaya.com/mobile/track/pay/" +
                            `${trackUrlId}/${timeStamp}?device=pc&isBackend=true&_=${timeStamp}`,
                        cookie: document.cookie,
                        timeout: 5000,
                        responseType: "json",
                        onload: (trackPayItemResponseBody) => {
                            if (trackPayItemResponseBody.status !== 200) {
                                throw `2.单个曲目获取Key error trackPayItemResponse.status != 200:${trackPayItemResponseBody}`;
                            }
                            let responseJson = trackPayItemResponseBody.response;
                            myLog.log(responseJson);

                            let title = responseJson.title;
                            let domain = responseJson.domain;
                            // noinspection JSUnresolvedVariable
                            let apiVersion = responseJson.apiVersion;
                            // noinspection JSUnresolvedVariable
                            let fileId = responseJson.fileId.split("*");
                            let seed = responseJson.seed;
                            // noinspection JSUnresolvedVariable
                            let buyKey = responseJson.buyKey;
                            let duration = responseJson.duration;
                            // noinspection JSUnresolvedVariable
                            let ep = responseJson.ep;

                            // group1/M06/06/45/wKgJMlkVd-ODN6yjAFxxlg-_1gk645.m4a
//https://audiofreepay.xmcdn.com/download/1.0.0/group1/M06/06/45/wKgJMlkVd9jwkuCfADotJnbTRAs619_preview_766505.m4a?sign=e87c77169a38d3aa4171c4959519ac9a&buy_key=fe4f133ccbf4b22dfa2a1e704ccbbda8&token=2325&timestamp=1590915745&duration=470
//https://audiopay.cos.xmcdn.com/download/1.0.0/group1/M04/06/45/wKgJMlkVd-bCoLyoAGZg6UuJLus163.m4a?sign=5e99eb12e1ec3348be7e118f2fb89b73&buy_key=617574686f72697a6564&token=1140&timestamp=1590315063&duration=828
//https://audiopay.cos.xmcdn.com/download/1.0.0/group1/M04/06/45/wKgJMlkVd-bCoLyoAGZg6UuJLus163.m4a?sign=08d03f4d35458d61e0d94a304e98e1b8&buy_key=617574686f72697a6564&token=9562&timestamp=1590916494&duration=828
//https://audiopay.cos.xmcdn.com/download/1.0.0/group1/M04/06/45/wKgJMlkVd-bCoLyoAGZg6UuJLus163.m4a?sign=5e99eb12e1ec3348be7e118f2fb89b73&buy_key=617574686f72697a6564&token=1140&timestamp=1590315063&duration=828
//https://audiopay.cos.xmcdn.com/download/1.0.0/group1/M04/06/45/wKgJMlkVd-bCoLyoAGZg6UuJLus163.m4a?sign=5e99eb12e1ec3348be7e118f2fb89b73&buy_key=617574686f72697a6564&token=1140&timestamp=1590315063&duration=828


                        },
                        onerror: (exception) => {
                            myLog.log(`onerror:${exception}`);
                        },
                        ontimeout: (exception) => {
                            myLog.log(`ontimeout:${exception}`);
                        },
                    });

            });
        });
    }

    /**
     *  签名解码,协同通讯拨号器,加密算法(网页js版)
     */
    function getXmSign() {
        // noinspection JSUnresolvedVariable
        let currentTimeNum = "undefined" == typeof window ? Date.now() : window.XM_SERVER_CLOCK || 0;
        let dateNow = Date.now();
        let orgString = `{ximalaya-${currentTimeNum}}(${~~(Math.random() * 100)})${currentTimeNum}(${~~(Math.random() * 100)})${dateNow}`;
        // let orgString = "{ximalaya-1564291975184}(25)1564291975184(70)1564292009912";

        // noinspection JSUnresolvedVariable
        return orgString.replace(
            /{([\w-]+)}/, (allMatchedString, subMatchedString) => CryptoJS.MD5(subMatchedString).toString(CryptoJS.enc.HEX)
        );
    }

    // document.write(getXmSign() + '</br>');
    // document.write("43639784fcd7d38e6e5934830eda07b9(25)1564291975184(70)1564292009912");
    // document.write('</br> pass? :' + (getXmSign() === "43639784fcd7d38e6e5934830eda07b9(25)1564291975184(70)1564292009912") + '</br>');

    //</editor-fold>

    //<editor-fold desc="7.B站个人空间 https://space.bilibili.com/">
    let bMvYouGetBat = "";

    function bilibiliSpace() {
        let trackTotalCount = document.querySelector("#submit-video-type-filter > a.active > span").innerText;
        let trackTotalCountInt = parseInt(trackTotalCount);
        let pageCount = Math.ceil(trackTotalCount / 30);
        for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
            // noinspection JSUnresolvedVariable
            let mid = unsafeWindow.mid;
            GM_xmlhttpRequest(
                {
                    mode: `cors`,
                    method: "GET",
                    headers: {
                        authority: 'api.bilibili.com',
                        accept: 'application/json, text/plain, */*',
                        origin: document.location.origin,
                        'sec-fetch-dest': 'empty',
                        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.163 Safari/537.36',
                        dnt: '1',
                        'sec-fetch-site': 'same-site',
                        'sec-fetch-mode': 'cors',
                        cookie: document.cookie,
                        //"sid=7jnvcbji; DedeUserID=363794650; DedeUserID__ckMd5=286931cf65684dc8; SESSDATA=084c2f85%2C1612594093%2C4185c*81; bili_jct=4d861bb953d8269b3e5b5657ed7c5a60; CURRENT_FNVAL=80; blackside_state=1; _uuid=19DE8CC0-0025-B02E-4AD4-CCF5B97043FF60540infoc; buvid3=9ABEA76E-E761-4613-8D62-BBE89D5CDCD0143081infoc; PVID=1; rpdid=|(J|)J|uY|YJ0J'uY|uYlJm)J; bfe_id=1e33d9ad1cb29251013800c68af42315"
                    },
                    url: `https://api.bilibili.com/x/space/arc/search?mid=${mid.toString()}&ps=30&tid=0&pn=${pageNum.toString()}&keyword=&order=pubdate&jsonp=jsonp`,
                    timeout: 5000,

                    // responseType: "string",//one of arraybuffer, blob, json
                    onload: (bilibiliInfoGetResponse) => {
                        if (bilibiliInfoGetResponse.status !== 200) {
                            throw `1.页面获取 error htmlResponse.status != 200:${bilibiliInfoGetResponse}-pageNum${pageNum}`;
                        }

                        // noinspection JSUnresolvedVariable
                        let trackInfoJson = JSON.parse(bilibiliInfoGetResponse.response);
                        if (trackInfoJson.code !== 0) {
                            throw `2.页面获取 error trackInfoJson.code !== 0:${bilibiliInfoGetResponse}-pageNum${pageNum}`;
                        }
                        myLog.log(trackTotalCountInt, pageCount);

                        // noinspection JSUnresolvedVariable
                        trackInfoJson.data.list.vlist.forEach(audioItem => {
                            // myLog.log(audioItem);
                            // noinspection JSUnresolvedVariable
                            let trackUrl = `https://www.bilibili.com/video/${audioItem.bvid}`;//https://www.bilibili.com/video/BV1ut4y197bG

                            let trackTitle = audioItem.title;
                            let youGetUrl = `start /w you-get.exe youtube-dl  ${trackUrl} --external-downloader aria2c --external-downloader-args "-x 16 -k 1M"`;
                            bMvYouGetBat += `::p${pageNum}-${trackTotalCountInt--}${trackTitle}\r\n${youGetUrl}\r\n`;

                            if (trackTotalCountInt <= 0) {
                                exportRaw("bSpaceYouGet.bat", bMvYouGetBat);
                            }

                        });

                    },
                    onerror: (exception) => {
                        myLog.log(`onerror:${exception}`);
                    },
                    ontimeout: (exception) => {
                        myLog.log(`ontimeout:${exception}`);
                    },
                }
            );


        }
    }


    //</editor-fold>

    //<editor-fold desc="8.抖音个人空间 https://www.douyin.com/user/">

    function douYinUserSpace() {
        let i = 0;
        let savePath = document.querySelector("#root > div > div  > div > div > div  > div  > div > h1 > span > span > span > span > span").innerText;
        document.querySelectorAll('#root > div > div > div > div > div > div > div > ul > li > a').forEach(aHref => {
            let fileName = ++i + "." + aHref.querySelector('div > div > img').alt + ".mp4";
            // myLog.log(i+"fileName:"+fileName,"aHref:" + aHref.href);
            const videoID = aHref.href.match(/video\/(\d*)/)[1];
            let fetchUrl = "https://www.douyin.com/web/api/v2/aweme/iteminfo/?item_ids=" + videoID;
            // myLog.log(i+"videoID"+videoID,"fetchUrl:"+fetchUrl);
            myLog.log(i + "fileName:" + fileName, "fetchUrl:" + fetchUrl);

            GM_xmlhttpRequest({
                url: fetchUrl,
                method: 'GET',
                dataType: 'JSON',
                onerror: function (response) {
                    myLog.log(response);
                },
                onload: function (response) {
                    //myLog.log(response);
                    let json = JSON.parse(response.responseText);
                    const videoLink = json.item_list[0].video.play_addr.url_list[0].replace("playwm", "play");
                    // myLog.log(i+"videoLink" , videoLink);
                    aria2Caller.down(videoLink, fileName, savePath);
                    //sendDownloadTaskToAria2(videoLink, fileName, savePath);
                }
            });
        });
    }


    //</editor-fold>

    //<editor-fold desc="9.网易公开课 https://open.163.com/newview/movie/">

    function open163FreeSpace() {
        let i = 0;
        let savePath = document.querySelector("#__layout > div > div.m-main > div.m-main__videobox > div.t-container > div.t-container__link > a.t-container__linkhover").innerText;
        // noinspection JSUnresolvedVariable
        unsafeWindow.__NUXT__.state.movie.moiveList.forEach(item => {

            // noinspection JSUnresolvedVariable
            let aHref = item.mp4SdUrlOrign;
            if (aHref === "" || aHref === undefined) {
                // noinspection JSUnresolvedVariable
                aHref = item.mp4ShareUrl;
            }
            // noinspection JSUnresolvedVariable
            let webUrl = item.webUrl;
            let fileName = ++i + "." + item.title;
            // noinspection JSUnresolvedVariable
            item.subList.forEach(srt => {
                // noinspection JSUnresolvedVariable
                let subName = fileName + "." + srt.subName + ".srt";
                // noinspection JSUnresolvedVariable
                let subUrl = srt.subUrl;
                myLog.log(i + ".get sub:" + subName, "subUrl:" + subUrl);
                aria2Caller.down(subUrl, subName, savePath);
            });
            let fileFullName = fileName + ".mp4"
            myLog.log(i + ",webUrl:" + webUrl + ".get aHref:" + aHref, ",fileFullName:" + fileFullName);
            aria2Caller.down(aHref, fileFullName, savePath);
        });

        // document.querySelectorAll('#__layout > div > div.m-main > div.m-main__videobox > div.video-module > div > div.video-list > div.list-content > div.course-list > div > div > div.course-link > a')
        //     .forEach(aHref => {
        //         // let htmlContentUrl = /*window.origin + */aHref;
        //         myLog.log(i + ".get page:", aHref/*htmlContentUrl*/);
        //         // if (i > 1) {
        //         //     return;//调试跳过
        //         // }
        //         fetch(/*htmlContentUrl*/aHref.toString(), {
        //             "method": "GET",
        //         }).then(response => {
        //             if (response.status >= 200 && response.status < 300) {
        //                 return response.text()
        //             }
        //             throw `${aHref} get err!`;
        //         }).then(html => {
        //             let videoLink = "https" + unescape(html.match(/mp4SdUrlOrign:"http(:.*?)\.mp4"/)[1].replace(/\\/g, "%")) + ".mp4";
        //             //let fileName = ++i + "." + document.querySelector('#__layout > div > div.m-main > div.m-main__videobox > div.t-container > div.t-container__title').innerText;
        //             let innerDiv = document.createElement("div");
        //             innerDiv.innerHTML = html;
        //             // noinspection JSCheckFunctionSignatures
        //             let fileName = ++i + "." + innerDiv.querySelector('#__layout > div > div.m-main > div.m-main__videobox > div.t-container > div.t-container__title').innerText;
        //             myLog.log(i + "fileName:" + fileName, "aHref:" + aHref.href);
        //             aria2Caller.down(videoLink, fileName, savePath);
        //         }).catch(err => {
        //             myLog.log(i + `.error:`, err);
        //         });
        //     });

    }


    //</editor-fold>

    //<editor-fold desc="10.西瓜视频 https://www.ixigua.com/home/">

    function iXiGuaFreeSpace() {
        let isDebug = false;//
        let i = 0;
        // let definition = "720p";//360p,480p,720p
        // let downDefinition = 2;
        let savePath = document.querySelector("h1 > span.user__name").innerText;

        document.querySelectorAll('#App > div > main > div > div.userDetailV3__content > div > div > div.userDetailV3__main__list > div > div.HorizontalFeedCard__contentWrapper > div > a')
            .forEach(aItem => {
                let urlId = aItem.href.substring(aItem.href.lastIndexOf('/') + 1);
                if (urlId === "" || urlId === undefined) {
                    throw "urlId 为空！";
                }
                if (urlId.lastIndexOf('?') > 0) {
                    //去尾
                    urlId = urlId.substring(0, urlId.lastIndexOf('?'));
                }

                let mvPageUrl = "https://www.ixigua.com/api/public/videov2/brief/details?group_id=" + urlId;

                if (isDebug) return;//调试跳过

                fetch(mvPageUrl, {
                    "method": "GET",
                }).then(response => {
                    if (response.status >= 200 && response.status < 300) {
                        return response.json()
                    }
                    throw i + `${mvPageUrl} get err!`;
                }).then(json => {
                    let videoUrls = json['data']['videoResource']['normal']['video_list'];
                    /*let mvCount = videoUrls.length;
                                        for (let j = 0; j < videoUrls.length; j++) {
                                            let thisDefinition = videoUrls[j]['definition'];
                                            // noinspection JSUnresolvedVariable
                                            let type = videoUrls[j].vtype;
                                            let fileName = ++i + "." + json.data.title + "." + type;
                                            let videoLink = atob(videoUrls[j]['main_url']);
                                            if (mvCount > 2) {//1.360p;2.480p;3.720p;4.1080p;
                                                downDefinition = 2;//1.360p;2.480p;3.720p;4.1080p;
                                            } else {
                                                downDefinition = mvCount - 1;
                                            }
                                            myLog.log(i + "fileName:" + fileName, `${thisDefinition}[down=${downDefinition - 1 === j}]:${videoLink}`);
                                            if (downDefinition - 1 === j) {
                                                aria2Caller.down(videoLink, fileName, savePath);
                                            }
                                        }*/
                    let mvCount = 1;
                    for (let p in videoUrls) {
                        mvCount++;
                    }

                    let mvIndex = 0;
                    for (let p in videoUrls) {//遍历json对象的每个key/value对,p为key
                        mvIndex++;
                        let thisDefinition = videoUrls[p]['definition'];
                        // noinspection JSUnresolvedVariable
                        let type = videoUrls[p].vtype;
                        let fileName = ++i + "." + json.data.title + "." + type;
                        let videoLink = atob(videoUrls[p]['main_url']);
                        //let isGoingToDown = thisDefinition === definition;
                        if (mvCount > 2) {
                            downDefinition = 1;//0.360p;1.480p;2.720p;3.1080p;
                        } else {
                            downDefinition = mvCount - 1;
                        }
                        myLog.log(i + "fileName:" + fileName, `${thisDefinition}[down=${downDefinition === mvIndex}]:${videoLink}`);
                        if (downDefinition === mvIndex) {
                            aria2Caller.down(videoLink, fileName, savePath);
                        }

                    }
                }).catch(err => {
                    myLog.log(i + `.error:`, err);
                });
                // isDebug = true;
            });
    }


    //</editor-fold>


})();