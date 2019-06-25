// ==UserScript==
// @name            i-mo-oc爱摸课ADown
// @namespace       https://www.cnblogs.com/Chary/
// @version         2019.06.23
// @description     add download button on i-mo-oc Html Header to download videos
// @author          CharyGao
// @require         https://cdn.bootcss.com/crypto-js/3.1.9-1/crypto-js.min.js
// @match           https://www.imooc.com/learn/*
// @grant           unsafeWindow
// @grant           GM_getValue
// @grant           GM_setValue
// @grant           GM_xmlhttpRequest
// @grant           GM_openInTab
// @grant           GM_setClipboard
// @grant           GM_registerMenuCommand
// @grant           GM_addStyle
// @run-at              document-end
// ==/UserScript==
// noinspection JSUnresolvedFunction: GM_getValue supplied by TamperMonkey

//<editor-fold desc="Style">
// noinspection JSUnresolvedFunction：
GM_addStyle( `
        button.ADownElementTagClass:hover {
            color: green;
        }
        .ADownElementTagClass {
            position: absolute;
            float: right;
            right: 90px;
            border: 2px dashed gray;
            height: 46px;
            border-radius: 10px;
            color: #93999f;
            font-size: 12px;
            background: transparent;
            top: 1px;
            width: 50px;
        }
       .dropdown {
            z-index: 999998;
            position: relative;
            display: inline-block;
            /*line-height: 20px;*/
            margin: 13px 0px 5px 0px;
            float: right;
            /*font-weight: bold;*/
        }
        .dropdown-content {
            margin-left: -16px;
            display: none;
            position: absolute;
            background-color: black;
            min-width: 60px;
            text-align: center;
            padding: 8px;
            border: red 1px dashed;
        }
        .dropdown:hover .dropdown-content {
            display: block;
        }
        .show{display: block;}
        .hide{display: none;}
` );
//</editor-fold>

(function () {
        'use strict';//启用严格模式
        //<editor-fold desc="0.Fields">
        let windowsNameForbidReg = /[\\/?？*"“”'‘’<>{}\[\]【】：:、^$!~`|]/g;
        let logCount = 1;
        let videoQuality = 2;//hq_mq_lq:高/中/低-清晰度
        let course = {
            "courseId": "0",
            "courseName": "课名",
            "chapters": [],//章
            "cookieCount": 1,
        };

        let downTipDiv = null;
        let downLoadFileDirFullPath = "D:\\HKPath\\HK\\HkDownloads";//file:///F:/@Installed/HkTools/M3U81.4.2/k0.m3u8
        function myLog(param1, param2) {
            param1 = param1 ? param1 : "";
            param2 = param2 ? param2 : "";
            console.log( "#" + logCount++ + "ADown:", param1, param2 );
        }

        //</editor-fold>

        //<editor-fold desc="1.Enter">
        setTimeout( function () {
            try {
                if (!isLoginAndAddText()) {//0.登录检测
                    return;
                }
                getCourseInfo(); //1.获取课程信息
                loadSetting(); //2.加载个人设置
                addDownloadAssistant(); //3.添加下载助手按钮
                addDownloadButton(); //4.添加单个下载按钮
                myLog( "ADown加载完成~" );
            } catch (e) {
                myLog( 'err:', e );
            }
        }, 2000 ); //页面加载完成后延时2秒执行

        function addDownloadButton() {//4.添加下载按钮
            let aHrefsList = document.getElementsByClassName( "J-media-item" );
            if (aHrefsList === undefined || aHrefsList.length < 1) {
                myLog( "addDownloadButton Err! aHrefsList", aHrefsList );
                return;
            }
            //Array.prototype.forEach.call() or [].forEach.call(els, function (el) {...});
            [].forEach.call( aHrefsList, aHref => {
                    let aNewDownButtonNode = document.createElement( "button" );
                    aNewDownButtonNode.className = "ADownElementTagClass";
                    aNewDownButtonNode.innerText = "学习";
                    aNewDownButtonNode.addEventListener( "click", event => {
                        loadSetting();
                        let chapterName = aHref.parentElement.parentElement.parentElement.getElementsByTagName( "h3" )[0].innerText.trim();
                        let videoDirtyName = aHref.innerText.trim().replace( /\(\d+:\d+\)$/g, "" );

                        let video = {
                            "videoName": videoDirtyName.replace( windowsNameForbidReg, "" ).trim(),
                            "videoUrl": window.location.origin + aHref.getAttribute( "href" ),
                        };
                        myLog( `选择的课为【${chapterName + videoDirtyName}】`, video );

                        let m3u8FileName = (chapterName + "_" + video.videoName).replace( /\s+/g, "" );

                        downloadVideo( m3u8FileName, video );
                        event.stopPropagation();
                    } );
                    aHref.parentNode.appendChild( aNewDownButtonNode );
                }
            );
        }

        function addDownloadAssistant() {//3.添加下载助手按钮
            let downTipNode = document.getElementById( "downTip" );
            let downTipBatchDown = document.getElementById( "downTipBatchDown" );
            let downTipSettings = document.getElementById( "downTipSettings" );
            showTextArea();//组装file文本
            elementHide( "ImoocADownTextDiv" );
            downTipNode.addEventListener( "click", () => {
                toggleElementHideShow( "ImoocADownTextDiv" );
            } );

            downTipBatchDown.addEventListener( "click", () => {
                batchDownload();
            } );
            downTipSettings.addEventListener( "click", () => {
                showSetting();
            } );
        }

        function loadSetting() {/*2.加载个人设置*/
            // noinspection JSUnresolvedFunction : GM_getValue supplied by TamperMonkey
            videoQuality = GM_getValue( "video_quality", 2 );
            // noinspection JSUnresolvedFunction
            downLoadFileDirFullPath = GM_getValue( "down_load_file_dir_full_path", "D:\\HKPath\\HK\\HkDownloads" );

        }

        function getCourseInfo() {//1.获取课程信息
            course = {
                'courseUrl': window.location.href,
                'courseName': document.querySelector( '#main > div.course-infos > div.w > div.hd > h2' ).innerText.trim(),
                'chapters': [],
            };
            let chaptersList = document.querySelectorAll( '#main > div.course-info-main > div.content-wrap > div.content > div.course-chapters > div' ) || [];
            chaptersList.forEach( function (chapterItem) {
                let chapterH3Tags = chapterItem.getElementsByTagName( 'h3' );
                let thisChapterName = "";
                if (chapterH3Tags != null && chapterH3Tags.length >= 1) {
                    thisChapterName = chapterH3Tags[0].innerText.replace( windowsNameForbidReg, "" ).trim();
                }
                let chapter = {
                    "chapterName": thisChapterName,
                    "videos": [],
                };
                let videosList = chapterItem.querySelectorAll( 'ul.video li' ) || [];
                videosList.forEach( function (videoItem) {
                    let videoItemATag = videoItem.querySelector( 'a.J-media-item' );
                    let videoDirtyName = videoItemATag.innerText.trim().replace( /\(\d+:\d+\)$/g, "" );
                    let video = {
                        "videoName": videoDirtyName.replace( windowsNameForbidReg, "" ).trim(),
                        "videoUrl": window.location.origin + videoItemATag.getAttribute( "href" ),
                    };
                    chapter.videos.push( video );
                } );
                course.chapters.push( chapter );
            } );
            myLog( course );
        }

        function isLoginAndAddText() {//0.登录检测
            let navNod = document.getElementById( 'nav' );
            if (navNod == null) {//|| courseMenu.length < 1
                myLog( "isLoginAndAddText loginAreaNode err!", "妈的又改版了!" );
                return false;
            }
            let htmlLiElement = document.createElement( "div" );
            htmlLiElement.className = "dropdown";
            htmlLiElement.innerHTML = '<a id="downTip">ADown↓</a>' +
                '<div class="dropdown-content">' +
                '<p style="color: green; margin: 2px;" id="downTipBatchDown">批量下载</p>' +
                '<p style="color: green; margin: 2px;" id="downTipSettings">设置</p>' +
                '</div>';
            navNod.appendChild( htmlLiElement );
            downTipDiv = document.getElementById( 'downTip' );
            if (downTipDiv == null) {
                myLog( "isLoginAndAddText err!", "妈的 downTipDiv 不见了！" );
                return false;
            }
            // noinspection JSUnresolvedVariable : isLogin supplied by outside!
            if (!isLogin) {
                myLog( "need to login!" );
                downTipDiv.innerText = 'Login↓';
                downTipDiv.addEventListener( "click", function () {
                    let clickEvent = document.createEvent( 'MouseEvents' );
                    clickEvent.initEvent( 'click', true, true );
                    document.getElementById( 'js-signin-btn' ).dispatchEvent( clickEvent );
                } );
                return false;
            }
            return true;
        }

        //</editor-fold>

        //<editor-fold desc="2.批量下载">
        function batchDownload() {
            // noinspection JSUnresolvedFunction
            GM_setClipboard( course.courseName );//设置课程名称到剪贴板
            course.chapters.forEach( function (chapter) {
                chapter.videos.forEach( function (video) {
                    let m3u8FileName = (chapter.chapterName + "_" + video.videoName).replace( /\s+/g, "" );
                    downloadVideo( m3u8FileName, video );
                } );
            } );
        }

        function downloadVideo(m3u8FileName, video) {//Step1/4获取html内容
            fetch( video.videoUrl, {
                credentials: 'include',//For CORS requests
                method: 'GET',
            } ).then( response => {
                if (response.ok) {
                    myLog( m3u8FileName + "downloadVideo ok!" + response, response.url );
                    return response.text();
                } else {
                    myLog( m3u8FileName + "downloadVideo error!" + response, response.url );
                }
            } ).catch( error => myLog( m3u8FileName + "downloadVideo error!" + error.url, error ) ).then( body => {//body
                let matchedPageInfo = body.match( /var pageInfo = { mid : (\d+) };/ )[1];// var pageInfo = { mid : 19490 };
                let matchedVideoId = body.match( /var video_id= (\d+);/ )[1];// var video_id= 18727;
                let matchedCourseId = body.match( /var course_id = (\d+);/ )[1];// var course_id = 1130;
                let matchedChapterId = body.match( /var chapter_id = (\d+);/ )[1];// var chapter_id = 5495;
                let matchedIsPreview = body.match( /var ispreview ='(\d+)';/ )[1];// var ispreview ='0';
                let matchedVideoTitle = body.match( /var videoTitle = "(.*?)";/ )[1];// var videoTitle = "1-1 课程介绍及学习前须知";
                let matchedOpConfigMongoId = body.match( /OP_CONFIG.mongo_id="(\w+)";/ )[1];// OP_CONFIG.mongo_id="5ce28b95e420e56b038b456a";
                let matchedOpConfigPage = body.match( /OP_CONFIG.page="([\w.]+)";/ )[1];// OP_CONFIG.page="video2.4";
                myLog( m3u8FileName + " matchedPageInfo", matchedPageInfo );
                myLog( m3u8FileName + " matchedVideoId", matchedVideoId );
                myLog( m3u8FileName + " matchedCourseId", matchedCourseId );
                myLog( m3u8FileName + " matchedChapterId", matchedChapterId );
                myLog( m3u8FileName + " matchedIsPreview", matchedIsPreview );
                myLog( m3u8FileName + " matchedVideoTitle", matchedVideoTitle );
                myLog( m3u8FileName + " matchedOpConfigMongoId", matchedOpConfigMongoId );
                myLog( m3u8FileName + " matchedOpConfigPage", matchedOpConfigPage );

                getM3u8DownloadUrls( matchedPageInfo, matchedOpConfigMongoId, m3u8FileName, video );
            } );
        }

        function getM3u8DownloadUrls(pageInfo, opConfigMongoId, m3u8FileName, video) {/*step2/4获取三个M3u8下载地址*/
            //https://www.imooc.com/course/playlist/19490?t=m3u8&_id=5ce28b95e420e56b038b456a&cdn=aliyun1
            fetch( "https://www.imooc.com/course/playlist/"
                + pageInfo + "?t=m3u8&_id=" + opConfigMongoId + "&cdn=aliyun1",
                {
                    credentials: 'include',//For CORS requests
                    method: 'GET',
                } ).then( response => {
                if (response.ok) {
                    myLog( m3u8FileName + "getM3u8DownloadUrls ok!", response.url );
                    return response.json();
                } else {
                    myLog( m3u8FileName + "getM3u8DownloadUrls error!", response.url );
                }
            } ).catch( error => myLog( m3u8FileName + "getM3u8DownloadUrls error!" + error.url, error ) ).then( m3u8CipherJson => {
                if (!m3u8CipherJson.data || !m3u8CipherJson.data.info) {
                    myLog( m3u8FileName + "getM3u8DownloadUrls error!", m3u8CipherJson );
                }
                //step3getOneKindLevelM3u8ContentAndKeyUrl//获取m3u8内容
                //step4getM3u8Key//获取密钥
            } );
        }

        //</editor-fold>

        //<editor-fold desc="3.加解密">


        function decryptBase64Default(data, isPlaintext) {//原字符串，是否为明文
            let c;
            let arrayObj = {data: {info: data}};
            let s = {
                q: function (t, e) {//r
                    var r = "";
                    if ("object" == typeof t) {
                        for (var n = 0; n < t.length; n++) {
                            r += String.fromCharCode( t[n] );
                        }
                    }
                    t = r || t;
                    for (var i, o, a = new Uint8Array( t.length ), s = e.length, n = 0; n < t.length; n++) {
                        o = n % s,
                            i = t[n],
                            i = i.toString().charCodeAt( 0 ),
                            a[n] = i ^ e.charCodeAt( o );
                    }
                    return a
                },
                h: function (t) {//n
                    var e = "";
                    if ("object" == typeof t) {
                        for (var r = 0; r < t.length; r++) {
                            e += String.fromCharCode( t[r] );
                        }
                    }
                    t = e || t;
                    var n = new Uint8Array( t.length );
                    for (r = 0; r < t.length; r++) {
                        n[r] = t[r].toString().charCodeAt( 0 );
                    }
                    var i, o, r = 0;
                    for (r = 0; r < n.length; r++) {
                        0 != (i = n[r] % 3) && r + i < n.length && (o = n[r + 1],
                            n[r + 1] = n[r + i],
                            n[r + i] = o,
                            r = r + i + 1);
                    }
                    return n
                },
                m: function (t) {//i
                    var e = "";
                    if ("object" == typeof t)
                        for (var r = 0; r < t.length; r++)
                            e += String.fromCharCode( t[r] );
                    t = e || t;
                    var n = new Uint8Array( t.length );
                    for (r = 0; r < t.length; r++)
                        n[r] = t[r].toString().charCodeAt( 0 );
                    var r = 0, i = 0, o = 0, a = 0;
                    for (r = 0; r < n.length; r++) {
                        o = n[r] % 2,
                        o && r++,
                            a++;
                    }
                    var s = new Uint8Array( a );
                    for (r = 0; r < n.length; r++) {
                        o = n[r] % 2,
                            s[i++] = o ? n[r++] : n[r];
                    }
                    return s
                },
                k: function (t, e) {//o
                    var r = 0, n = 0, i = 0, o = 0, a = "";
                    if ("object" == typeof t) {
                        for (var r = 0; r < t.length; r++)
                            a += String.fromCharCode( t[r] );
                    }
                    t = a || t;
                    var s = new Uint8Array( t.length );
                    for (r = 0; r < t.length; r++) {
                        s[r] = t[r].toString().charCodeAt( 0 );
                    }
                    for (r = 0; r < t.length; r++) {
                        if (0 != (o = s[r] % 5) && 1 != o && r + o < s.length && (i = s[r + 1],
                            n = r + 2,
                            s[r + 1] = s[r + o],
                            s[o + r] = i,
                        (r = r + o + 1) - 2 > n))
                            for (; n < r - 2; n++)
                                s[n] = s[n] ^ e.charCodeAt( n % e.length );
                    }
                    for (r = 0; r < t.length; r++) {
                        s[r] = s[r] ^ e.charCodeAt( r % e.length );
                    }
                    return s
                }
            };
            let dataCopy = arrayObj.data.info;
            let user4cKey = data.substring( data.length - 4 ).split( "" );//截取后4位

            user4cKey.forEach( (item, index, theArray) => {
                theArray[index] = item.toString().charCodeAt( 0 ) % 4;//指定位置上字符的 Unicode 编码,余4;
            } );
            user4cKey.reverse();//3,1,1,0//反转//第一次取位
            document.write( "反转:" + user4cKey + "<br />" );
            document.write( "dataA:" + dataCopy + "<br />" );
            arrayObj.data.encrypt_table = [];
            user4cKey.forEach( (currentItem) => {//选定位置的字符作为密钥，并从原字符中移除（剔除4个字符）
                arrayObj.data.encrypt_table.push( dataCopy.substring( currentItem + 1, currentItem + 2 ) );
                dataCopy = dataCopy.substring( 0, currentItem + 1 ) + dataCopy.substring( currentItem + 2 );
            } );
            document.write( "dataB:" + dataCopy + "<br />" );
            //document.write( "encryptTableA:" + a.data.encrypt_table + "<br />" );
            arrayObj.data.key_table = [];
            arrayObj.data.encrypt_table.forEach( (currentItem) => {
                if ("q" !== currentItem && "k" !== currentItem) {
                    return;//for(var c in a.data.encrypt_table)("q" != a.data.encrypt_table[c] && "k" != a.data.encrypt_table[c]) || (a.data.key_table.push( l.substring( l.length - 12 ) ), l = l.substring( 0, l.length - 12 ));//短路运算
                }//4个字符中，不是q，k，跳过。
                arrayObj.data.key_table.push( dataCopy.substring( dataCopy.length - 12 ) );
                dataCopy = dataCopy.substring( 0, dataCopy.length - 12 );//有几个q，k，原串减少几个*12个字符；
            } );
            document.write( "dataC:" + dataCopy + "<br />" );
            //document.write( "encryptTableB:" + arrayObj.data.encrypt_table + "<br />" );
            arrayObj.data.key_table.reverse();
            //document.write( "encryptTableC:" + arrayObj.data.encrypt_table + "<br />" );

            // const f = [
            //     -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
            //     -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 62,
            //     -1, -1, -1, 63, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, -1, -1, -1, -1, -1, -1, -1, 0,
            //     1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
            //     25, -1, -1, -1, -1, -1, -1, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40,
            //     41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, -1, -1, -1, -1, -1
            // ];

            arrayObj.data.info =  CryptoJS.enc.Utf8.stringify( CryptoJS.enc.Base64.parse( dataCopy ) );

            for (c in arrayObj.data.encrypt_table) {
                let h = arrayObj.data.encrypt_table[c];
                if ("q" === h || "k" === h) {
                    let p = arrayObj.data.key_table.pop();
                    arrayObj.data.info = s[arrayObj.data.encrypt_table[c]]( arrayObj.data.info, p )
                } else
                    arrayObj.data.info = s[arrayObj.data.encrypt_table[c]]( arrayObj.data.info )
            }
            if (isPlaintext) return arrayObj.data.info;
            let gotPlaintext = "";
            arrayObj.data.info.forEach( function (itemChar) {
                gotPlaintext += String.fromCharCode( itemChar );
            } );
            return gotPlaintext;
        }


        //</editor-fold>

        //<editor-fold desc="4.UtilitiesFunction">
        function exportRaw(toDownloadedFileName, content) {//调用文件下载
            toDownloadedFileName = toDownloadedFileName.replace( windowsNameForbidReg, "" ).trim();
            let data = new Blob( [content], {type: "text/plain;charset=UTF-8"} );
            let downloadUrl = window.URL.createObjectURL( data );
            let anchor = document.createElement( "a" );
            anchor.href = downloadUrl;
            anchor.download = toDownloadedFileName;
            myLog( toDownloadedFileName );
            anchor.click();
            window.URL.revokeObjectURL( downloadUrl );
        }

        function showTextArea() {
            if (document.querySelector( '#ImoocADownTextDiv' ) == null) {
                let container = document.createElement( "div" );
                container.id = "ImoocADownTextDiv";
                container.style = "width: 100%;position: fixed; z-index: 999998;top: 20%; height: 80%; background: black; color: red;";
                container.innerHTML = '<textarea id="ImoocADownTextArea" readonly="readonly" style="width:98%;margin:0 20px 10px 0;height: 98%; background: black; color: green; border: 1px solid red;"></textarea>';
                document.body.appendChild( container );
            } else {
                elementShow( 'ImoocADownTextDiv' );
            }
        }

        function showSetting() {//打开设置
            if (document.getElementById( "ADownSettings" ) != null) {
                loadSetting();
                setSelectCheckedOptionsValue( 'videoQualityId', videoQuality, true ); //设置清晰度 显示值
                document.getElementById( "ADownSavePath" ).value = downLoadFileDirFullPath;
                elementShow( "ADownSettings" );
            } else {
                let container = document.createElement( "div" );
                container.id = "ADownSettings";
                container.style = "position: fixed; z-index: 999999; top: 20px; right: 450px; width: 190px; height: auto; background: black; padding: 10px; color: white; font-size: 14px; border: 1px solid red;";
                container.innerHTML =
                    '<div style="line-height:22px;"><h3 style="text-align: center;font-weight: bolder;">下载设置</h3>' +
                    '<div>文件保存位置: <input type="text" id="ADownSavePath" value="' + downLoadFileDirFullPath + '" style="width:100%" /></div>' +
                    '<div>清晰度:' +
                    '<select id="videoQualityId">' +
                    '<option value="1" ' + (videoQuality === 1 ? 'selected' : '') + '>1.标清</option>' +
                    '<option value="2" ' + (videoQuality === 2 ? 'selected' : '') + '>2.高清</option>' +
                    '<option value="3" ' + (videoQuality === 3 ? 'selected' : '') + '>3.超清</option>' +
                    '</select></div>' +
                    '<div style="margin-top:5px;float: right;">' +
                    '<span><input type="button" value="取消" id="SettingsCancelButton"> | ' +
                    '<input type="button" value="保存" id="SettingsSaveButton"></span>' +
                    '</div>' +
                    '</div>';
                document.body.appendChild( container );
            }
            document.getElementById( "SettingsSaveButton" ).addEventListener( "click", function () {
                let videoQualityNode = document.getElementById( 'videoQualityId' );
                let videoQualityNodeSelectedIndex = videoQualityNode.selectedIndex; // 选中索引
                let videoQualityNodeValue = videoQualityNode.options[videoQualityNodeSelectedIndex].value; // 选中值
                let aDownSavePathValue = document.getElementById( "ADownSavePath" ).value;
                saveSetting( videoQualityNodeValue, aDownSavePathValue );//$('input[name="save_path"]').val()
                elementHide( "ADownSettings" );
            } );
            document.getElementById( "SettingsCancelButton" ).addEventListener( "click", function () {
                elementHide( "ADownSettings" );
            } );
        }

        function saveSetting(thisVideoQuality, thisDownLoadFileDirFullPath) {
            // noinspection JSUnresolvedFunction : GM_getValue supplied by TamperMonkey
            GM_setValue( "video_quality", thisVideoQuality );
            // noinspection JSUnresolvedFunction
            GM_setValue( "down_load_file_dir_full_path", thisDownLoadFileDirFullPath );
            videoQuality = thisVideoQuality;
            downLoadFileDirFullPath = thisDownLoadFileDirFullPath;
        }

        /**
         * 设置select控件选中
         * @param selectId select的id值
         * @param checkValue 选中option的值
         * @param isSetTrue
         */
        function setSelectCheckedOptionsValue(selectId, checkValue, isSetTrue) {
            let select = document.getElementById( selectId );

            for (let i = 0; i < select.options.length; i++) {
                if (select.options[i].value === checkValue) {
                    select.options[i].selected = isSetTrue;
                    break;
                }
            }
        }

        function toggleElementHideShow(elementId) {
            let element = document.getElementById( elementId );
            if (element == null) {
                alert( "toggleElementHideShow：妈的，" + elementId + " 没找到！" );
            }
            let show = element.classList.contains( 'show' );
            if (show) {
                element.classList.remove( 'show' );
                element.classList.add( 'hide' );
            } else {
                element.classList.remove( 'hide' );
                element.classList.add( 'show' );
            }
        }

        function elementHide(elementId) {
            let element = document.getElementById( elementId );
            if (element == null) {
                alert( "toggleElementHideShow：妈的，" + elementId + " 没找到！" );
            }
            element.classList.remove( 'show' );
            element.classList.add( 'hide' );
        }

        function elementShow(elementId) {
            let element = document.getElementById( elementId );
            if (element == null) {
                alert( "toggleElementHideShow：妈的，" + elementId + " 没找到！" );
            }
            element.classList.remove( 'hide' );
            element.classList.add( 'show' );

        }

        //</editor-fold>
    }

)
();
