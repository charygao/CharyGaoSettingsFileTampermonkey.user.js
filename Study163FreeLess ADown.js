// ==UserScript==
// @name              网易云已付费课堂study.163.com FreeLess ADown下载助手
// @name:en           Study163FreeLess ADown
// @namespace         https://www.cnblogs.com/Chary/
// @version           0.1
// @description       在网易云课堂的Header处添加下载助手按钮/批量下载和单个下载/，方便将视频下载到本地学习
// @description:en    add download button on study.163.com Html Header to download videos
// @author            CharyGao
// @require           https://cdn.bootcss.com/jquery/3.4.1/jquery.min.js
// @match             https://study.163.com/course/courseMain.htm?*courseId=*
// @grant             unsafeWindow
// @grant             GM_getValue
// @grant             GM_setValue
// @grant             GM_xmlhttpRequest
// @grant             GM_openInTab
// ==/UserScript==

(function() {
    'use strict';
    var $ = $ || window.$;
    var log_count = 1;
    var hasOpenAriac2Tab = false;

    var isDownFreelessCourse = true; //是否下载收费视频

    // var isSaveHtm = false;//保存htmToDownDir
    // var isSaveZip = true;//保存Code Zip
    // var isSavePpt = true;//保存ppt Pdf
    var isSaveVideo = true; //保存video 视频

    var isMarkAsLearned = true; //标记已学
    // var video_file_name; //视频文件名称

    var video_quality = 2; //视频清晰度
    var video_format = 'mp4'; //视频格式
    var aria2_url = "http://127.0.0.1:6800/jsonrpc"; //Aria2 地址
    var course_save_path = 'output'; //课程保存路径

    // var video_save_path; //每个视频保存路径
    var video_download_url = ""; //视频下载地址

    var course_info = {
        'course_id': {},
        'course_name': {},
        'chapter_info': [],
        'course_price': {}, //价格
        'course_duration': {} //课程时长
    }; //课程信息

    var cookies = document.cookie;
    var match_cookie = cookies.match(/NTESSTUDYSI=(\w+)/)[1];

    //自定义 log 函数
    function mylog(param1, param2) {
        param1 = param1 ? param1 : "";
        param2 = param2 ? param2 : "";
        console.log("#" + log_count++ + "-Study.163.com FreeLess ADown-log:", param1, param2);
    }

    setTimeout(function() {
        if (!getCourseInfo()) { //1.获取课程信息
            return;
        }
        loadSetting(); //2.加载个人设置
        addDownloadAssistant(); //3.添加下载助手按钮
        addDownloadButton(); //4. 给每个项目添加下载按钮
        showTextArea();
        $("#Study163FreeLessAdownTextDiv").hide();
        mylog("Study.163.com FreeLess ADown加载完成~ aria2c --input-file=");
    }, 5000); //页面加载完成后延时5秒执行

    function showTextArea() {
        if (document.querySelector('#Study163FreeLessAdownTextDiv') == null) {
            var container = document.createElement("div");
            container.id = "Study163FreeLessAdownTextDiv";
            container.style = "width: 100%;position: fixed; z-index: 999998;top: 20%; height: 80%; background: black; color: red;";
            container.innerHTML =
                '<textarea id="Study163FreeLessAdownTextArea" readonly="readonly" style="width: 98%; margin: 0 20px 10px 0;height: 98%; background: black; color: green; border: 1px solid red;"></textarea>'
            document.body.appendChild(container);
        } else {
            $('#Study163FreeLessAdownTextDiv').show();
        }
    }
    //1.获取课程信息
    function getCourseInfo() {
        var courseVo = unsafeWindow.courseVo;
        mylog(courseVo);
        course_info.course_id = courseVo.id; //课程 id
        course_info.course_name = courseVo.name.replace(/:|\?|\*|"|<|>|\|/g, " "); //课程名称
        course_info.course_price = courseVo.price; //课程价格
        var chapter = courseVo.chapterDtos; //课程章节
        var allSeconds = 0; //课程总时长，单位为秒
        chapter.forEach(function(chapterCourse, chapterCourseindex) {
            var chapter = {
                'chapter_id': chapterCourse.id,
                'chapter_name': chapterCourse.name.replace(/:|\?|\*|"|<|>|\|/g, " "),
                'lesson_info': []
            }; //章节信息
            var lessonDtos = chapterCourse.lessonDtos;
            lessonDtos.forEach(function(val, index) {
                var lesson = {
                    'keshi': val.ksstr,
                    'lesson_id': val.id,
                    'lesson_name': val.lessonName.replace(/:|\?|\*|"|<|>|\|/g, " "),
                    'lesson_type': val.lessonType
                }; //课时信息
                if (val.videoTime) {
                    var videoTime = val.videoTime.split(':');
                    if (videoTime.length == 3) {
                        allSeconds += parseInt(videoTime[0]) * 3600 + parseInt(videoTime[1]) * 60 + parseInt(videoTime[2]);
                    } else if (videoTime.length == 2) {
                        allSeconds += parseInt(videoTime[0]) * 60 + parseInt(videoTime[1]);
                    } else if (videoTime.length == 1) {
                        allSeconds += parseInt(videoTime[0]);
                    }
                }
                chapter.lesson_info.push(lesson);
            });
            course_info.chapter_info.push(chapter);
        });
        var formatTime = {
            'hour': 0,
            'minute': 0,
            'second': 0
        };
        formatTime.hour = parseInt(allSeconds / 3600);
        formatTime.minute = parseInt(allSeconds % 3600 / 60);
        formatTime.second = parseInt(allSeconds % 3600 % 60);
        if (formatTime.hour) {
            course_info.course_duration = formatTime.hour + "小时" + formatTime.minute + "分" + formatTime.second + "秒";
        } else if (formatTime.minute) {
            course_info.course_duration = formatTime.minute + "分" + formatTime.second + "秒";
        } else if (formatTime.second) {
            course_info.course_duration = formatTime.second + "秒";
        }
        mylog(course_info);
        if (course_info.course_price > 0 && !isDownFreelessCourse) {
            return false;
        } else {
            return true;
        }
    }
    //2.加载个人设置
    function loadSetting() {
        video_quality = GM_getValue('video_quality', 2);
        video_format = GM_getValue('video_format', 'mp4');
        aria2_url = GM_getValue('aria2_url', 'http://127.0.0.1:6800/jsonrpc');
        course_save_path = GM_getValue('course_save_path', 'output');

        // isSaveHtm = GM_getValue('isSaveHtm', false);
        // isSaveZip = GM_getValue('isSaveZip', true);
        // isSavePpt = GM_getValue('isSavePpt', true);
        isSaveVideo = GM_getValue('isSaveVideo', true);

        isMarkAsLearned = GM_getValue('isMarkAsLearned', true);
        // isDownFreelessCourse = GM_getValue('isDownFreelessCourse', false);//是否下载收费视频
    }
    //3.添加下载助手按钮
    function addDownloadAssistant() {

        //$(".u-navsearchUI").css("width", "200px");//u-navsearchUI 缩短搜索框,隐藏于左上角

        var download_assistant_div = $("<div class='m-nav_item_Adown' style='text-align: center;'></div>"); //Title
        var assistant_div = $("<div style='display:none;background-color:black;width:auto;'></div>"); //下拉列表
        var assistant_show_text = $("<span>Adown↓</span>"); //批量下载按钮
        var assistant_batch_download = $("<div><a>批量下载</a></div>"); //批量下载按钮
        var assistant_setting = $("<div><a>设置</a><div>"); //设置按钮
        assistant_div.append(assistant_batch_download).append(assistant_setting); //拼装下拉菜单
        download_assistant_div.append(assistant_show_text).append(assistant_div); //拼装下载列表按钮
        $('.mn-userinfo_download').prepend(download_assistant_div); //挂接到header上
        download_assistant_div.mouseover(function() {
            assistant_div.show();
        });
        download_assistant_div.mouseout(function() {
            assistant_div.hide();
        });
        assistant_batch_download.click(function() {
            assistant_div.hide();
            loadSetting();
            if (course_save_path == "") {
                alert("请到下载助手的设置里面填写文件保存位置");
            } else if (aria2_url == "") {
                alert("请到下载助手的设置里面填写 Aria2 地址");
            } else {
                batchDownload();
            }
        });
        assistant_setting.click(function() {
            assistant_div.hide();
            showSetting();
        });
        assistant_show_text.click(function() {
            $("#Study163FreeLessAdownTextDiv").toggle();
        });
    }


    //3.1批量下载
    function batchDownload() {
        course_info.chapter_info.forEach(function(chapter, index) {
            chapter.lesson_info.forEach(function(lesson) {
                var file_name = lesson.keshi + '_' + lesson.lesson_name;
                var save_path = course_save_path.replace(/\\/g, '\/') + '/' + course_info.course_name + '/章节' + (index + 1) + '_' + chapter.chapter_name;
                //mylog(file_name, lesson);
                if (lesson.lesson_type == '1') { //1未知
                    mylog(file_name, lesson);
                    //getVideoToken(lesson.content_type, course_info.course_id, lesson.content_id, lesson, file_name, save_path);
                } else if (lesson.lesson_type == '2' && isSaveVideo) { //1未知
                    getVideoLearnInfo(lesson, file_name, save_path);
                    //getVideoToken(lesson.content_type, course_info.course_id, lesson.content_id, lesson, file_name, save_path);
                } else if (lesson.lesson_type == "3") { //3 文档
                    getTextLearnInfo(lesson, file_name, save_path);
                }
                // else if (lesson.lesson_type == '4') {//4 html
                //     // if (isSaveHtm) {
                //     //    getHtmlContent(lesson.content_type, course_info.course_id, lesson.content_id, lesson.section_id, file_name, save_path);//lesson.json_content,
                //     // }
                //     // if (isSaveZip && lesson.json_content != null) {
                //     //    sendDownloadTaskToAria2('https://mooc.study.163.com/course/attachment.htm?fileName=' + lesson.json_content.fileName + '&nosKey=' + lesson.json_content.nosKey, file_name + '_' + lesson.json_content.fileName, save_path);
                //     // }
                //     // if (isMarkAsLearned) {
                //     //    mark_htm_as_learned(lesson);
                //     // }
                // } else if (lesson.lesson_type == '6') {//6 讨论 htm
                //     // if (isSaveHtm) {
                //     //     get_discuss_htm_content(lesson.content_type, course_info.course_id, lesson.content_id, lesson.section_id, file_name, save_path);//lesson.json_content,
                //     // }
                //     // if (isMarkAsLearned) {
                //     //     mark_htm_as_learned(lesson);
                //     // }
                // } 
                else {
                    mylog(file_name, lesson);
                }
            });
        });
    }

    /** 
     * 设置select控件选中 
     * @param selectId select的id值 
     * @param checkValue 选中option的值 
     * @author 标哥 
     */
    function set_select_checked_value(selectId, checkValue, isSetTrue) {
        var select = document.getElementById(selectId);

        for (var i = 0; i < select.options.length; i++) {
            if (select.options[i].value == checkValue) {
                select.options[i].selected = isSetTrue;
                break;
            }
        }
    }

    //3.2打开设置
    function showSetting() {
        if (document.querySelector('#dl-setting') == null) {
            var container = document.createElement("div");
            container.id = "dl-setting";
            container.style = "position: fixed; z-index: 999999; top: 20%; right: 100px; width: 250px; height: auto; background: black; padding: 10px; color: white; font-size: 14px; border: 1px solid red;";
            container.innerHTML =
                '<div style="line-height:22px;"><p style="text-align:center;font-size:16px;">下载设置</p>' +

                '<div> Aria2 地址: <input type="text" id="aria2_url" name="aria2_url" value="' + aria2_url + '"style="width:100%" /></div>' +
                '<div>文件保存位置: <input type="text" id="save_path" name="save_path" value="' + course_save_path + '" style="width:100%" /></div>' +

                '<div>下载内容:' + // </div><div style="text-align: center;">' +
                //    '<input id="is_save_htm" type="checkbox" ' + (isSaveHtm == true ? "checked" : "") + '/> htm' +
                //    '<input id="is_save_zip" type="checkbox" ' + (isSaveZip == true ? "checked" : "") + ' /> zip' +
                //    '<input id="is_save_ppt" type="checkbox" ' + (isSavePpt == true ? "checked" : "") + ' /> ppt' +
                '<input id="is_save_video" type="checkbox" ' + (isSaveVideo == true ? "checked" : "") + ' /> video</div>' +

                '<div>清晰度:' +
                '<select id="video_quality" style=" margin-right: 14px; " >' +
                '<option value="1" ' + (video_quality == 1 ? 'selected' : '') + '>1.标清</option>' +
                '<option value="2" ' + (video_quality == 2 ? 'selected' : '') + '>2.高清</option>' +
                '<option value="3" ' + (video_quality == 3 ? 'selected' : '') + '>3.超清</option>' +
                '</select>格式:<select id="video_format">' +
                '<option value="hls" ' + (video_format == 'hls' ? 'selected' : '') + '>hls(m3u8)</option>' +
                '<option value="mp4" ' + (video_format == 'mp4' ? 'selected' : '') + '>mp4</option>' +
                '<option value="flv" ' + (video_format == 'flv' ? 'selected' : '') + '>flv</option></select></div>' +

                '<div style="margin-top: 5px;">' +
                '<span> <input id="is_mark_as_learned" type="checkbox" ' + (isMarkAsLearned == true ? "checked" : "") + ' /> 标记已学过该课程 </span>' +
                '<span style="float: right;">' +
                '<input type="button" value="取消" id="cancel_button"> | ' +
                '<input type="button" value="保存" id="save_button"></span></div></div>';
            document.body.appendChild(container);
        } else {
            loadSetting();

            set_select_checked_value('video_quality', video_quality, true); //设置清晰度 显示值
            set_select_checked_value('video_format', video_format, true); //设置格式 显示值

            // switch (video_format) {
            //     case 1: $('#video_quality').prop('checked', true); break;
            //     case 2: $('#video_quality').prop('checked', true); break;
            //     case 3: $('#video_quality').prop('checked', true); break;
            // }
            // $('#is_save_htm').prop('checked', isSaveHtm);//设置htm 显示值
            // $('#is_save_zip').prop('checked', isSaveZip);//设置zip 显示值
            // $('#is_save_ppt').prop('checked', isSavePpt);//设置ppt 显示值
            $('#is_save_video').prop('checked', isSaveVideo); //设置video 显示值

            $('#is_mark_as_learned').prop('checked', isMarkAsLearned); //设置标记已完成 显示值

            $('#aria2_url').value = aria2_url;
            $('#save_path').value = course_save_path;
            $('#dl-setting').show();
        }
        $('#save_button').click(function() {
            GM_setValue('aria2_url', $('input[name="aria2_url"]').val());
            GM_setValue('course_save_path', $('input[name="save_path"]').val());

            GM_setValue('video_quality', $('#video_quality option:selected').val());
            GM_setValue('video_format', $('#video_format option:selected').val());

            // GM_setValue('isSaveHtm', $('#is_save_htm').prop('checked'));
            // GM_setValue('isSaveZip', $('#is_save_zip').prop('checked'));
            // GM_setValue('isSavePpt', $('#is_save_ppt').prop('checked'));
            GM_setValue('isSaveVideo', $('#is_save_video').prop('checked'));

            GM_setValue('isMarkAsLearned', $('#is_mark_as_learned').prop('checked'));

            $('#dl-setting').hide();
        });
        $('#cancel_button').click(function() {
            $('#dl-setting').hide();
        });
    }

    //4. 给单个项目添加下载按钮
    function addDownloadButton() {
        var ksbtn = document.getElementsByClassName('ksbtn')[0];
        var ksbtn_style = 'display:' + getStyle(ksbtn, 'display') + ';width:' + getStyle(ksbtn, 'width') + ';background-position:' + getStyle(ksbtn, 'background-position') + ';margin-top:' + getStyle(ksbtn, 'margin-top') + ';';
        var ksbtn_span = ksbtn.firstChild;
        var ksbtn_span_style = 'display:' + getStyle(ksbtn_span, 'display') + ';text-align:' + getStyle(ksbtn_span, 'text-align') + ';background:' + getStyle(ksbtn_span, 'background') +
            ';width:' + getStyle(ksbtn_span, 'width') + ';font-size:' + getStyle(ksbtn_span, 'font-size') + ';height:' + getStyle(ksbtn_span, 'height') + ';line-height:' +
            getStyle(ksbtn_span, 'line-height') + ';color:' + getStyle(ksbtn_span, 'color') + ';background-position:' + getStyle(ksbtn_span, 'background-position') + ';';
        var allNodes = document.getElementsByClassName("section");
        for (var i = 0; i < allNodes.length; i++) {
            var download_button = document.createElement("a");
            var style = 'display:block;text-align:center;padding-left:10px;width:58px;font-size:12px;height:34px;line-height:33px;color:#fff;background-position:-40px 0px;';
            download_button.innerHTML = "<span>下载</span>";
            download_button.className = "f-fr j-hovershow download-button";
            download_button.style = ksbtn_style;
            download_button.lastChild.style = ksbtn_span_style;
            allNodes[i].appendChild(download_button);
        }
        $('.download-button').each(function() { //下载按钮点击事件
            $(this).click(function(event) {
                loadSetting();
                if (course_save_path == "") {
                    alert("请到下载助手的设置里面填写文件保存位置");
                } else if (aria2_url == "") {
                    alert("请到下载助手的设置里面填写 Aria2 地址");
                } else {
                    var data_chapter = event.target.parentNode.parentNode.getAttribute("data-chapter");
                    var data_lesson = event.target.parentNode.parentNode.getAttribute("data-lesson");
                    var index = Number(data_lesson);
                    for (var i = 0; i < Number(data_chapter); i++) {
                        index = index - course_info.chapter_info[i].lesson_info.length;
                    }
                    var lesson = course_info.chapter_info[data_chapter].lesson_info[index];
                    mylog("选择的课为【lesson_name: " + lesson.lesson_name + ",lesson_id: " + lesson.lesson_id + ",lesson_type: " + lesson.lesson_type + '】');
                    var file_name = lesson.keshi + '_' + lesson.lesson_name;
                    var save_path = course_save_path.replace(/\\/g, '\/') + '/' + course_info.course_name + '/章节' + (Number(data_chapter) + 1) + '_' + course_info.chapter_info[data_chapter].chapter_name;
                    if (lesson.lesson_type == "3") {
                        getTextLearnInfo(lesson, file_name, save_path);
                    } else {
                        getVideoLearnInfo(lesson, file_name, save_path);
                    }
                }
                event.stopPropagation();
            });
        });
    }

    //5.1 获取文档下载地址
    function getTextLearnInfo(lesson, file_name, save_path) {
        var timestamp = new Date().getTime();
        var params = {
            "callCount": "1",
            "scriptSessionId": "${scriptSessionId}190",
            "httpSessionId": match_cookie,
            "c0-scriptName": "LessonLearnBean",
            "c0-methodName": "getTextLearnInfo",
            "c0-id": "0",
            "c0-param0": "string:" + lesson.lesson_id,
            "c0-param1": "string:" + course_info.course_id,
            "batchId": timestamp
        };
        var url = "https://study.163.com/dwr/call/plaincall/LessonLearnBean.getTextLearnInfo.dwr?" + timestamp;
        $.ajax({
            url: url,
            method: 'POST',
            async: true,
            data: params,
            success: function(response) {
                var pdfUrl = response.match(/pdfUrl:"(.*?)"/)[1];
                sendDownloadTaskToAria2(pdfUrl, file_name + ".pdf", save_path);
            }
        });
    }

    //5.2获取视频文件信息
    function getVideoLearnInfo(lesson, file_name, save_path) {
        var timestamp = new Date().getTime();
        var params = {
            "callCount": "1",
            "scriptSessionId": "${scriptSessionId}190",
            "httpSessionId": match_cookie,
            "c0-scriptName": "LessonLearnBean",
            "c0-methodName": "getVideoLearnInfo",
            "c0-id": "0",
            "c0-param0": "string:" + lesson.lesson_id,
            "c0-param1": "string:" + course_info.course_id,
            "batchId": timestamp
        };
        var url = "https://study.163.com/dwr/call/plaincall/LessonLearnBean.getVideoLearnInfo.dwr?" + timestamp;
        $.ajax({
            url: url,
            method: 'POST',
            async: true,
            data: params,
            success: function(response) {
                var signature = response.match(/signature="(\w+?)";/)[1];
                var videoId = response.match(/videoId=(\w+?);/)[1];
                //mylog(videoId, file_name);
                getVideoUrl(videoId, signature, file_name, save_path);
            }
        });
    }

    //5.2.1获取视频下载地址
    function getVideoUrl(videoId, signature, file_name, save_path) {
        var params = {
            'videoId': videoId,
            'signature': signature,
            'clientType': '1'
        };
        $.ajax({
            url: "https://vod.study.163.com/eds/api/v1/vod/video",
            method: 'POST',
            async: true,
            data: params,
            success: function(response) {
                var videoUrls = response.result.videos;
                var video_url_list = [];
                //mylog(file_name, videoUrls);
                var flv_Video_url_back = {};
                videoUrls.forEach(function(video) {
                    if (video.format == video_format && video.quality == video_quality) {
                        video_url_list.push({ 'video_format': video.format, 'video_quality': video.quality, 'video_url': video.videoUrl });
                    }
                    if (video.format == 'flv' && video.quality == video_quality) {
                        flv_Video_url_back = { 'video_format': video.format, 'video_quality': video.quality, 'video_url': video.videoUrl };
                    }
                });
                if (video_url_list.length < 1) {
                    video_url_list.push(flv_Video_url_back);
                    //没有MP4下flv
                    //mylog(videoUrls, '没有对应类型,flv替代：' + file_name);
                }
                video_download_url = video_url_list[0].video_url;
                var qualityString = ".";
                var this_video_format = video_url_list[0].video_format;
                switch (video_url_list[0].video_quality) {
                    case 1:
                        qualityString = ".sd";
                        break;
                    case 2:
                        qualityString = ".hd";
                        break;
                    case 3:
                        qualityString = ".shd";
                        break;
                }
                if (this_video_format == 'hls') {
                    this_video_format = 'm3u8';
                }

                sendDownloadTaskToAria2(video_download_url, file_name + qualityString + '.' + this_video_format, save_path);

                // if (video_url_list.length != 0) {
                //     if (video_quality == "2") {
                //         video_download_url = video_url_list[video_url_list.length - 1].video_url;
                //     } else {
                //         video_download_url = video_url_list[0].video_url;
                //     }
                // }
                // if (video_download_url != "") {
                //     //mylog(video_download_url);
                //     sendDownloadTaskToAria2(video_download_url, file_name + '.' + video_format, save_path);
                // }
            }
        });
    }

    //6. 将下载链接发送到 Aria2 下载
    function sendDownloadTaskToAria2(download_url, file_name, save_path) {
        //mylog(download_url + '\n\t' + save_path + '-' + file_name + '\n');
        //console.log(download_url + '\n dir=' + save_path + '\n out=' + file_name+'\n');
        $('#Study163FreeLessAdownTextArea').append(download_url + '\n dir=' + save_path + '\n out=' + file_name + '\n');
        return;
        var json_rpc = {
            id: '',
            jsonrpc: '2.0',
            method: 'aria2.addUri',
            params: [
                [download_url],
                {
                    dir: save_path,
                    out: file_name
                }
            ]
        };
        GM_xmlhttpRequest({
            url: aria2_url,
            method: 'POST',
            data: JSON.stringify(json_rpc),
            onerror: function(response) {
                mylog(response);
            },
            onload: function(response) {
                mylog(response);
                if (!hasOpenAriac2Tab) {
                    // GM_openInTab('http://aria2c.com/', {
                    //     active: true
                    // });
                    alert("done! open AriaNg to look!");
                    hasOpenAriac2Tab = true;
                }
            }
        });
    }

    //获取元素样式
    function getStyle(element, cssPropertyName) {
        if (window.getComputedStyle) { //如果支持getComputedStyle属性（IE9及以上，ie9以下不兼容）
            return window.getComputedStyle(element)[cssPropertyName];
        } else { //如果支持currentStyle（IE9以下使用），返回
            return element.currentStyle[cssPropertyName];
        }
    }

    //    //标记ppt已经完成学习
    //    function mark_ppt_as_learned(page_num, lesson) {
    //     var timestamp = new Date().getTime();
    //     var params = {
    //        "callCount": "1",
    //        "scriptSessionId": "${scriptSessionId}190",
    //        "httpSessionId": sessionId,
    //        "c0-scriptName": "CourseBean",
    //        "c0-methodName": "saveMocContentLearn",
    //        "c0-id": "0",
    //        "c0-e1": "number:" + lesson.section_id,//course_id,
    //        "c0-e2": "number:" + page_num,// + content_id, 1也行
    //        "c0-param0": "Object_Object:{unitId:reference:c0-e1,pageNum:reference:c0-e2}",// + content_type,
    //        "batchId": timestamp
    //     };
    //     $.ajax({
    //        url: 'https://mooc.study.163.com/dwr/call/plaincall/CourseBean.saveMocContentLearn.dwr?' + timestamp,
    //        method: 'POST',
    //        async: true,
    //        data: params,
    //        success: function (response) {
    //           //mylog(lesson.section_id + lesson.section_name + ' ppt mark as learned!->' + response);
    //        }
    //     });
    //  }
    //  //标记htm已经完成学习
    //  function mark_htm_as_learned(lesson) {//content_type, course_id, content_id, 
    //     var timestamp = new Date().getTime();
    //     var params = {
    //        "callCount": "1",
    //        "scriptSessionId": "${scriptSessionId}190",
    //        "httpSessionId": sessionId,
    //        "c0-scriptName": "CourseBean",
    //        "c0-methodName": "saveMocContentLearn",
    //        "c0-id": "0",
    //        "c0-e1": "number:" + lesson.section_id,//course_id,
    //        "c0-e2": "boolean:true",// + content_id,
    //        "c0-param0": "Object_Object:{unitId:reference:c0-e1,finished:reference:c0-e2}",// + content_type,
    //        "batchId": timestamp
    //     };
    //     $.ajax({
    //        url: 'https://mooc.study.163.com/dwr/call/plaincall/CourseBean.saveMocContentLearn.dwr?' + timestamp,
    //        method: 'POST',
    //        async: true,
    //        data: params,
    //        success: function (response) {
    //           //mylog(lesson.section_id + lesson.section_name + 'htm mark as learned!->' + response);
    //        }
    //     });
    //  }
    //  //标记视频已经完成学习
    //  function mark_video_as_learned(duration, lesson) {//course_id, content_id,file_name, save_path
    //     var timestamp = new Date().getTime();
    //     var params = {
    //        "callCount": "1",
    //        "scriptSessionId": "${scriptSessionId}190",
    //        "httpSessionId": sessionId,
    //        "c0-scriptName": "CourseBean",
    //        "c0-methodName": "saveMocContentLearn",
    //        "c0-id": "0",
    //        "c0-e1": "number:" + lesson.section_id,//course_id,
    //        "c0-e2": "number:" + duration,// + content_id,videoTime=545
    //        "c0-e3": "boolean:true",// + content_id,
    //        "c0-param0": "Object_Object:{unitId:reference:c0-e1,videoTime:reference:c0-e2,finished:reference:c0-e3}",// + content_type,
    //        "batchId": timestamp
    //     };
    //     $.ajax({
    //        url: 'https://mooc.study.163.com/dwr/call/plaincall/CourseBean.saveMocContentLearn.dwr?' + timestamp,
    //        method: 'POST',
    //        async: true,
    //        data: params,
    //        success: function (response) {
    //           //mylog(lesson.section_id + lesson.section_name + 'vedio mark as learned!->' + response);
    //        }
    //     });
    //  }
    //    //获取文档下载地址
    //    function get_discuss_htm_content(content_type, course_id, content_id, section_id, file_name, save_path) {//json_content,
    //     var timestamp = new Date().getTime();
    //     var params = {
    //        "callCount": "1",
    //        "scriptSessionId": "${scriptSessionId}190",
    //        "httpSessionId": sessionId,
    //        "c0-scriptName": "CourseBean",
    //        "c0-methodName": "getLessonUnitLearnVo",
    //        "c0-id": "0",
    //        "c0-param0": "number:" + course_id,
    //        "c0-param1": "number:" + content_id,
    //        "c0-param2": "number:" + content_type,
    //        "c0-param3": "number:0",
    //        "c0-param4": "number:" + section_id,
    //        "batchId": timestamp
    //     };
    //     $.ajax({
    //        url: 'https://mooc.study.163.com/dwr/call/plaincall/CourseBean.getLessonUnitLearnVo.dwr?' + timestamp,
    //        method: 'POST',
    //        async: true,
    //        data: params,
    //        success: function (response) {
    //           var htmContent = response.match(/s0\.content="(.*?)";s0/);
    //           if (htmContent != null && htmContent.length > 0) {
    //              var content = htmContent[1];
    //              //mylog(unescape(content.replace(/\\u/gi, '%u')));//.replace(/\/|:|\?|\*|"|<|>|\|/g, " ")
    //              if (isSaveHtm) {
    //                 exportRaw(save_path.replace(course_save_path, '').replace(/\/|:|\?|\*|"|<|>|\|/g, "") + file_name, unescape(content.replace(/\\"/g, '"').replace(/\\u/gi, '%u')), '.htm');
    //              }
    //           }
    //        }
    //     });
    //  }
    //  //获取文档下载地址
    //  function getHtmlContent(content_type, course_id, content_id, section_id, file_name, save_path) {//json_content,
    //     var timestamp = new Date().getTime();
    //     var params = {
    //        "callCount": "1",
    //        "scriptSessionId": "${scriptSessionId}190",
    //        "httpSessionId": sessionId,
    //        "c0-scriptName": "CourseBean",
    //        "c0-methodName": "getLessonUnitLearnVo",
    //        "c0-id": "0",
    //        "c0-param0": "number:" + course_id,
    //        "c0-param1": "number:" + content_id,
    //        "c0-param2": "number:" + content_type,
    //        "c0-param3": "number:0",
    //        "c0-param4": "number:" + section_id,
    //        "batchId": timestamp
    //     };
    //     $.ajax({
    //        url: 'https://mooc.study.163.com/dwr/call/plaincall/CourseBean.getLessonUnitLearnVo.dwr?' + timestamp,
    //        method: 'POST',
    //        async: true,
    //        data: params,
    //        success: function (response) {
    //           var htmlContent = response.match(/htmlContent:"(.*?)",/);
    //           if (htmlContent != null && htmlContent.length > 0) {
    //              var htmlContentStr = htmlContent[1];
    //              //mylog(unescape(htmlContentStr.replace(/\\u/gi, '%u')));//.replace(/\/|:|\?|\*|"|<|>|\|/g, " ")
    //              if (isSaveHtm) {
    //                 exportRaw(save_path.replace(course_save_path, '').replace(/\/|:|\?|\*|"|<|>|\|/g, "") + file_name, unescape(htmlContentStr.replace(/\\"/g, '"').replace(/\\u/gi, '%u')), '.htm');
    //              }
    //           }
    //        }
    //     });
    //  }
    //  function exportRaw(file_download_path, content, file_extension) {//调用文件下载
    //     var data = new Blob([content], { type: "text/plain;charset=UTF-8" });
    //     var downloadUrl = window.URL.createObjectURL(data);
    //     var anchor = document.createElement("a");
    //     anchor.href = downloadUrl;
    //     anchor.download = file_download_path + file_extension;
    //     //mylog(file_download_path);
    //     anchor.click();
    //     window.URL.revokeObjectURL(data);
    //  }
    //  //获取文档下载地址
    //  function getCourseContentUrl(content_type, course_id, content_id, lesson, file_name, save_path) {
    //     var timestamp = new Date().getTime();
    //     var params = {
    //        "callCount": "1",
    //        "scriptSessionId": "${scriptSessionId}190",
    //        "httpSessionId": sessionId,
    //        "c0-scriptName": "CourseBean",
    //        "c0-methodName": "getLessonUnitLearnVo",
    //        "c0-id": "0",
    //        "c0-param0": "number:" + course_id,
    //        "c0-param1": "number:" + content_id,
    //        "c0-param2": "number:" + content_type,
    //        "c0-param3": "number:0",
    //        "c0-param4": "number:" + lesson.section_id,
    //        "batchId": timestamp
    //     };
    //     $.ajax({
    //        url: 'https://mooc.study.163.com/dwr/call/plaincall/CourseBean.getLessonUnitLearnVo.dwr?' + timestamp,
    //        method: 'POST',
    //        async: true,
    //        data: params,
    //        success: function (response) {
    //           var pdfUrl = response.match(/textOrigUrl:"(.*?)",/)[1];
    //           //mylog(pdfUrl);
    //           sendDownloadTaskToAria2(pdfUrl, file_name + ".pdf", save_path);
    //           if (isMarkAsLearned) {
    //              mark_ppt_as_learned(1, lesson);
    //           }
    //        }
    //     });
    //  }
    //  //获取视频信息
    //  function getVideoToken(content_type, course_id, content_id, lesson, file_name, save_path) {
    //     var timestamp = new Date().getTime();
    //     var params = {
    //        "callCount": "1",
    //        "scriptSessionId": "${scriptSessionId}190",
    //        "httpSessionId": sessionId,
    //        "c0-scriptName": "CourseBean",
    //        "c0-methodName": "getLessonUnitLearnVo",
    //        "c0-id": "0",
    //        "c0-param0": "number:" + course_id,
    //        "c0-param1": "number:" + content_id,
    //        "c0-param2": "number:" + content_type,
    //        "c0-param3": "number:0",
    //        "c0-param4": "number:" + lesson.section_id,
    //        "batchId": timestamp
    //     };
    //     $.ajax({
    //        url: 'https://mooc.study.163.com/dwr/call/plaincall/CourseBean.getLessonUnitLearnVo.dwr?' + timestamp,
    //        method: 'POST',
    //        async: true,
    //        data: params,
    //        success: function (response) {
    //           var signature_id_info = response.match(/s0.duration=(.*?);.*?s0.signature="(.*?)";.*?s0.videoId=(.*?);/);
    //           var video_duration = signature_id_info[1];
    //           var video_signature = signature_id_info[2];
    //           var video_id = signature_id_info[3];
    //           getVideoUrl(content_id, video_signature, file_name, save_path);//video_id = content_id
    //           if (isMarkAsLearned) {
    //              mark_video_as_learned(video_duration, lesson);
    //           }
    //        }
    //     });
    //  }
    //  //获取视频下载地址
    //  function getVideoUrl(videoId, signature, file_name, save_path) {
    //     var params = {
    //        'videoId': videoId,
    //        'signature': signature,
    //        'clientType': '1'
    //     };
    //     $.ajax({
    //        url: 'https://vod.study.163.com/eds/api/v1/vod/video',
    //        method: 'POST',
    //        async: true,
    //        data: params,
    //        success: function (response) {
    //           var videoUrls = response.result.videos;
    //           var video_url_list = [];
    //           videoUrls.forEach(function (video) {
    //              if (video.format == video_format && video.quality == video_quality) {
    //                 video_url_list.push({ 'video_format': video.format, 'video_quality': video.quality, 'video_url': video.videoUrl });
    //              }
    //           });
    //           if (video_url_list.length != 0) {
    //              video_download_url = video_url_list[0].video_url;
    //              //if (video_download_url != "")
    //              var qualityString = ".";
    //              switch (video_url_list[0].video_quality) {
    //                 case 1: qualityString = ".sd"; break;
    //                 case 2: qualityString = ".hd"; break;
    //                 case 3: qualityString = ".shd"; break;
    //              }
    //              if (video_format == 'hls') {
    //                 video_format = 'm3u8';
    //              }
    //              //mylog(video_download_url);
    //              sendDownloadTaskToAria2(video_download_url, file_name + qualityString + '.' + video_format, save_path);
    //           }
    //        }
    //     });
    //  }
    function obj2str(o) //obj -> json string
    {
        var r = [];
        if (typeof o == "string" || o == null) {
            return o;
        }
        if (typeof o == "object") {
            if (!o.sort) {
                r[0] = "{"
                for (var i in o) {
                    r[r.length] = i;
                    r[r.length] = ":";
                    r[r.length] = obj2str(o[i]);
                    r[r.length] = ",";
                }
                r[r.length - 1] = "}"
            } else {
                r[0] = "["
                for (var j = 0; j < o.length; j++) {
                    r[r.length] = obj2str(o[j]);
                    r[r.length] = ",";
                }
                r[r.length - 1] = "]"
            }
            return r.join("");
        }
        return o.toString();
    }

})();