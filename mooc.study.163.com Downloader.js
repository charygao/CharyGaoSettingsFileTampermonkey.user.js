
// ==UserScript==
// @name              网易云课堂mooc.study.163.com下载助手（需配合Aria2使用）
// @name:en           mooc.study.163.com Downloader
// @namespace         https://www.cnblogs.com/Chary/
// @version           0.2
// @description       在mooc.study.163.com的课程学习页面添加批量下载按钮，方便将视频下载到本地学习
// @description:en    add download button on mooc.study.163.com to download videos
// @author            charyGao
// @require           https://cdn.bootcss.com/jquery/1.12.4/jquery.min.js
// @match             *://mooc.study.163.com/learn/*
// @grant             unsafeWindow
// @grant             GM_getValue
// @grant             GM_setValue
// @grant             GM_xmlhttpRequest
// @grant             GM_openInTab
// ==/UserScript==

(function () {
    'use strict';
    var $ = $ || window.$;
    var log_count = 1;
    var hasOpenAriac2Tab = false;
    var isSaveHtmToDownDir = 'false';
    var video_quality = 2; //视频清晰度
    var video_format = 'mp4'; //视频格式
    var aria2_url = "http://127.0.0.1:6800/jsonrpc"; //Aria2 地址
    var course_save_path = 'output'; //课程保存路径
    var video_save_path; //每个视频保存路径
    var video_download_url = ""; //视频下载地址
    var course_info = { 'course_id': {}, 'course_name': {}, 'units_info': [] }; //课程信息
    var cookies = document.cookie;
    var sessionId = cookies.match(/NTESSTUDYSI=(\w+)/)[1];

    //自定义 log 函数
    function mylog(param1, param2) {
        param1 = param1 ? param1 : "";
        param2 = param2 ? param2 : "";
        console.log("#" + log_count++ + "-mooc.study.163.comDownloader-log:", param1, param2);
    }

    setTimeout(function () {
        getCourseIdAndName();
        getCourseContentInfo();
        loadSetting();
        addDownloadAssistant();
        mylog("mooc.study.163.com下载助手加载完成~");
    }, 2000); //页面加载完成后延时2秒执行

    //获取课程名称
    function getCourseIdAndName() {
        var courseDto = unsafeWindow.courseDto;
        course_info.course_name = courseDto.name.replace(/\/|:|\?|\*|"|<|>|\|/g, " ");
        if (location.href.match(/tid=(\d+)/)[1]) {
            course_info.course_id = location.href.match(/tid=(\d+)/)[1];
        } else {
            course_info.course_id = courseDto.currentTermId;
        }
    }

    //获取课程信息
    function getCourseContentInfo() {
        var timestamp = new Date().getTime();
        var params = {
            "callCount": "1",
            "scriptSessionId": "${scriptSessionId}190",
            "httpSessionId": sessionId,
            "c0-scriptName": "CourseBean",
            "c0-methodName": "getLastLearnedMocTermDto",
            "c0-id": "0",
            "c0-param0": "number:" + course_info.course_id,
            "batchId": timestamp
        };
        $.ajax({
            url: 'https://mooc.study.163.com/dwr/call/plaincall/CourseBean.getLastLearnedMocTermDto.dwr',
            method: 'POST',
            async: true,
            data: params,
            success: function (response) {
                var root_key = response.match(/s0\.chapters=(.*?);/)[1]; //保存全部章节的变量 root s1
                var unit_reg = new RegExp(root_key + '\\[\\d+\\]=(.*?);', 'g');
                var units_key_expression = response.match(unit_reg); //保存各章节的变量 root->units s3-s10
                units_key_expression.forEach(function (value) {
                    var unit_info_key = value.match(/=(.*?);/)[1]; //保存各章节的变量名字 root->units s3
                    var unit_info_reg = new RegExp(unit_info_key + '.id=(.*?);' + unit_info_key + '.lessons=(.*?);' + unit_info_key + '.name="(.*?)";');
                    var unit_info = response.match(unit_info_reg); //保存章节 id，lessons，name 的变量 root->units s3(s12)
                    var unit_id_key_reg = new RegExp(unit_info[2] + '\\[\\d+\\]=(.*?);', 'g');
                    var chapter_key_expression = response.match(unit_id_key_reg); // root->units s3(s12)->chapters s14-s16
                    var unit = { 'chapter_id': unit_info[1], 'chapter_name': unescape(unit_info[3].replace(/\\u/gi, '%u').replace(/\/|:|\?|\*|"|<|>|\|/g, " ")), 'chapters_info': [] }; //id+第1单元 让一切并行起来
                    chapter_key_expression.forEach(function (value) {
                        var chapter_info_key = value.match(/=(.*?);/)[1]; //保存各小节的变量名字 root->units s3(s12)->chapters s14
                        var chapter_info_reg = new RegExp(chapter_info_key + '.chapterId=(.*?);.*?' + chapter_info_key + '.id=(.*?);.*?' + chapter_info_key + '.name="(.*?)";.*?' + chapter_info_key + '.units=(.*?);');
                        var chapter_info = response.match(chapter_info_reg);//保存各小节的变量名字 root->units s3(s12)->chapter s14(s17)
                        var chapter_id_key_reg = new RegExp(chapter_info[4] + '\\[\\d+\\]=(.*?);', 'g');//
                        var lessons_key_expression = response.match(chapter_id_key_reg);//root->units s3(s12)->chapter s14(s17)->lessons s18-s35
                        var chapter = { 'chapter_id': chapter_info[1], 'lesson_id': chapter_info[2], 'lesson_name': unescape(chapter_info[3].replace(/\\u/gi, '%u').replace(/\/|:|\?|\*|"|<|>|\|/g, " ")), 'lessons_info': [] };
                        lessons_key_expression.forEach(function (value) {
                            var lesson_info_key = value.match(/=(.*?);/)[1];//root->units s3(s12)->chapter s14(s17)->lessons s18
                            var lesson_info_reg = new RegExp(lesson_info_key + '.chapterId=(.*?);.*?' + lesson_info_key + '.contentId=(.*?);.*?' + lesson_info_key + '.contentType=(.*?);.*?' + lesson_info_key + '.id=(.*?);.*?'
                                + lesson_info_key + '.jsonContent=(.*?);.*?' + lesson_info_key + '.lessonId=(.*?);.*?' + lesson_info_key + '.name="(.*?)";.*?');
                            var lesson_info = response.match(lesson_info_reg);
                            var jsonContent = null;
                            if (lesson_info[5] != 'null') {

                                var json_Content_info = lesson_info[5].match(/\{\\"nosKey\\":\\"(.*?)\\",\\"fileName\\":\\"(.*?)\\"\}/);
                                jsonContent = { 'nosKey': json_Content_info[1], 'fileName': json_Content_info[2] };
                            }
                            var lesson = {
                                'chapter_id': lesson_info[1], 'content_id': lesson_info[2], 'content_type': lesson_info[3], 'section_id': lesson_info[4],
                                'json_content': jsonContent,
                                'lesson_id': lesson_info[6], 'section_name': unescape(lesson_info[7].replace(/\\u/gi, '%u').replace(/\/|:|\?|\*|"|<|>|\|/g, " ")), 'content_type': lesson_info[3]
                            };
                            chapter.lessons_info.push(lesson);//section
                        });
                        unit.chapters_info.push(chapter);
                    });
                    course_info.units_info.push(unit);
                });
                mylog(course_info);
            }
        });
    }

    //加载个人设置
    function loadSetting() {
        video_quality = GM_getValue('video_quality', 2);
        video_format = GM_getValue('video_format', 'mp4');
        aria2_url = GM_getValue('aria2_url', 'http://127.0.0.1:6800/jsonrpc');
        course_save_path = GM_getValue('course_save_path', 'output');
        isSaveHtmToDownDir = GM_getValue('isSaveHtmToDownDir', 'false');
    }

    //添加批量下载和下载设置按钮
    function addDownloadAssistant() {
        var batch_download_li = $("<li class='u-greentab'></li>");
        var batch_download = $("<a>批量下载</a>");
        batch_download_li.append(batch_download);
        var assistant_setting_li = $("<li class='u-greentab'></li>");
        var assistant_setting = $("<a>下载设置</a>");
        assistant_setting_li.append(assistant_setting);
        $('#j-courseTabList ul.tab').append(batch_download_li).append(assistant_setting_li);
        batch_download_li.click(function () {
            loadSetting();
            if (course_save_path == "") {
                alert("请点击下载设置去填写文件保存位置");
            } else if (aria2_url == "") {
                alert("请点击下载设置去填写 Aria2 地址");
            } else {
                batchDownload();
            }
        });
        assistant_setting_li.click(function () {
            showSetting();
        });
    }

    //打开设置
    function showSetting() {
        if (document.querySelector('#dl-setting') == null) {
            var container = document.createElement("div");
            container.id = "dl-setting";
            container.style = "position:fixed;z-index:999999;bottom:10%;right:40px;width:220px;height:auto;background-color:#f8f8f8;padding:5px 10px;font-size:14px;border:1px solid #ccc;";
            container.innerHTML =
                "<div style='line-height:25px;'>" +
                "<legend style='text-align:center;font-size:16px;'>下载设置</legend>" +
                "<ul>" +
                "<li>Aria2 地址：</li>" +
                "<li><input type='text' id='aria2_url' name='aria2_url' value='" + aria2_url + "' style='width:100%;background:#ffffff;'></input></li>" +
                "<li>文件保存位置：</li>\n" +
                "<li><input type='text' id='save_path' name='save_path' value='" + course_save_path + "' style='width:100%;background:#ffffff;'></input></li>" +
                "<li>清晰度：<label title='超清'><input id='video-quality-3' name='video-quality' value='3' type='radio' style='margin:0 5px;'" + (video_quality == 3 ? "checked" : "") + "></input>超清</label>" +
                "<label title='高清'><input id='video-quality-2' name='video-quality' value='2' type='radio' style='margin:0 5px;'" + (video_quality == 2 ? "checked" : "") + "></input>高清</label>\n" +
                "<label title='标清' style='padding:0 5px;'><input id='video-quality-1' name='video-quality' value='1' type='radio' style='margin:0 5px;'" + (video_quality == 1 ? "checked" : "") + "></input>标清</label></li>\n" +
                "<li>格式：<label title='mp4' style='padding:0 0 0 14px;'><input id='video-format-mp4' name='video-format' value='mp4' type='radio' style='margin:0 5px;'" + (video_format == 'mp4' ? "checked" : "") + "></input>mp4</label>" +
                "<label title='flv' style='padding:0 5px;'><input id='video-format-flv' name='video-format' value='flv' type='radio' style='margin:0 5px 0 10px;'" + (video_format == 'flv' ? "checked" : "") + "></input>flv</label></li>" +
                "<li>下载htm：<label title='是' style='padding:0 0 0 14px;'><input id='is_save_htm_to_down_dir_true' name='is_save_htm_to_down' value=true type='radio' style='margin:0 5px;'" + (isSaveHtmToDownDir == 'true' ? "checked" : "") + "></input>是</label>" +
                "<label title='否' style='padding:0 5px;'><input id='is_save_htm_to_down_dir_false' name='is_save_htm_to_down' value=false type='radio' style='margin:0 5px 0 10px;'" + (isSaveHtmToDownDir == 'false' ? "checked" : "") + "></input>否</label></li>" +
                "</ul>\n" +
                "<input type='button' value='取消' id='cancel_button' style='position:relative;float:left;border:1px solid #ccc;padding:0 2px;background:#ffffff;'></input>\n" +
                "<input type='button' value='保存' id='save_button' style='position:relative;float:right;border:1px solid #ccc;padding:0 2px;background:#ffffff;'></input>\n" +
                "</div>";
            document.body.appendChild(container);
        } else {
            loadSetting();
            if (video_quality == 3) {
                $('#video-quality-3').prop('checked', true);
            } else if (video_quality == 2) {
                $('#video-quality-2').prop('checked', true);
            } else if (video_quality == 1) {
                $('#video-quality-1').prop('checked', true);
            }
            if (video_format == 'mp4') {
                $('#video-format-mp4').prop('checked', true);
            } else {
                $('#video-format-flv').prop('checked', true);
            }
            if (isSaveHtmToDownDir == 'true') {
                $('#is_save_htm_to_down_dir_true').prop('checked', true);
            } else {
                $('#is_save_htm_to_down_dir_false').prop('checked', true);
            }
            $('#aria2_url').value = aria2_url;
            $('#save_path').value = course_save_path;
            $('#dl-setting').show();
        }
        $('#save_button').click(function () {
            GM_setValue('video_quality', $('input[name="video-quality"]:checked').val());
            GM_setValue('video_format', $('input[name="video-format"]:checked').val());
            GM_setValue('isSaveHtmToDownDir', $('input[name="is_save_htm_to_down"]:checked').val());
            GM_setValue('aria2_url', $('input[name="aria2_url"]').val());
            GM_setValue('course_save_path', $('input[name="save_path"]').val());
            $('#dl-setting').hide();
        });
        $('#cancel_button').click(function () {
            $('#dl-setting').hide();
        });
    }

    //批量下载
    function batchDownload() {
        course_info.units_info.forEach(function (unit, index_unit) {
            unit.chapters_info.forEach(function (chapter, index_chapter) {
                chapter.lessons_info.forEach(function (lesson, index_lesson) {
                    var file_name = '第' + (index_lesson + 1) + '节_' + lesson.section_name;
                    var save_path = course_save_path.replace(/\\/g, '\/') + '/' + course_info.course_name + '/第' + (index_unit + 1) + '单元_' + unit.chapter_name + '/第' + (index_chapter + 1) + '章_' + chapter.lesson_name;
                    if (lesson.content_type == '1') {//1视频
                        getVideoToken(lesson.content_type, course_info.course_id, lesson.content_id, lesson.section_id, file_name, save_path);
                    } else if (lesson.content_type == '3') {//3 ppt
                        getCourseContentUrl(lesson.content_type, course_info.course_id, lesson.content_id, lesson.section_id, file_name, save_path);
                    } else if (lesson.content_type == '4') {//4 html
                        getHtmlContent(lesson.content_type, course_info.course_id, lesson.content_id, lesson.json_content, lesson.section_id, file_name, save_path);
                        if (lesson.json_content != null) {
                            sendDownloadTaskToAria2('https://mooc.study.163.com/course/attachment.htm?fileName=' + lesson.json_content.fileName + '&nosKey=' + lesson.json_content.nosKey, file_name + '_' + lesson.json_content.fileName, save_path);
                        }
                    }
                });
            });
        });
    }

    //获取文档下载地址
    function getHtmlContent(content_type, course_id, content_id, json_content, section_id, file_name, save_path) {
        var timestamp = new Date().getTime();
        var params = {
            "callCount": "1",
            "scriptSessionId": "${scriptSessionId}190",
            "httpSessionId": sessionId,
            "c0-scriptName": "CourseBean",
            "c0-methodName": "getLessonUnitLearnVo",
            "c0-id": "0",
            "c0-param0": "number:" + course_id,
            "c0-param1": "number:" + content_id,
            "c0-param2": "number:" + content_type,
            "c0-param3": "number:0",
            "c0-param4": "number:" + section_id,
            "batchId": timestamp
        };
        $.ajax({
            url: 'https://mooc.study.163.com/dwr/call/plaincall/CourseBean.getLessonUnitLearnVo.dwr?' + timestamp,
            method: 'POST',
            async: true,
            data: params,
            success: function (response) {
                var htmlContent = response.match(/htmlContent:"(.*?)",/)[1];
                //mylog(unescape(htmlContent.replace(/\\u/gi, '%u')));//.replace(/\/|:|\?|\*|"|<|>|\|/g, " ")
                if (isSaveHtmToDownDir == 'true') {
                    exportRaw(save_path.replace(course_save_path, '').replace(/\/|:|\?|\*|"|<|>|\|/g, "") + file_name, unescape(htmlContent.replace(/\\"/g, '"').replace(/\\u/gi, '%u')), '.htm');
                }
            }
        });
    }

    function exportRaw(file_download_path, content, file_extension) {//调用文件下载
        var data = new Blob([content], { type: "text/plain;charset=UTF-8" });
        var downloadUrl = window.URL.createObjectURL(data);
        var anchor = document.createElement("a");
        anchor.href = downloadUrl;
        anchor.download = file_download_path + file_extension;
        anchor.click();
        window.URL.revokeObjectURL(data);
    }

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

    //获取文档下载地址
    function getCourseContentUrl(content_type, course_id, content_id, section_id, file_name, save_path) {
        var timestamp = new Date().getTime();
        var params = {
            "callCount": "1",
            "scriptSessionId": "${scriptSessionId}190",
            "httpSessionId": sessionId,
            "c0-scriptName": "CourseBean",
            "c0-methodName": "getLessonUnitLearnVo",
            "c0-id": "0",
            "c0-param0": "number:" + course_id,
            "c0-param1": "number:" + content_id,
            "c0-param2": "number:" + content_type,
            "c0-param3": "number:0",
            "c0-param4": "number:" + section_id,
            "batchId": timestamp
        };
        $.ajax({
            url: 'https://mooc.study.163.com/dwr/call/plaincall/CourseBean.getLessonUnitLearnVo.dwr?' + timestamp,
            method: 'POST',
            async: true,
            data: params,
            success: function (response) {
                var pdfUrl = response.match(/textOrigUrl:"(.*?)",/)[1];
                //mylog(pdfUrl);
                sendDownloadTaskToAria2(pdfUrl, file_name + ".pdf", save_path);
            }
        });
    }

    //获取视频信息
    function getVideoToken(content_type, course_id, content_id, section_id, file_name, save_path) {
        var timestamp = new Date().getTime();
        var params = {
            "callCount": "1",
            "scriptSessionId": "${scriptSessionId}190",
            "httpSessionId": sessionId,
            "c0-scriptName": "CourseBean",
            "c0-methodName": "getLessonUnitLearnVo",
            "c0-id": "0",
            "c0-param0": "number:" + course_id,
            "c0-param1": "number:" + content_id,
            "c0-param2": "number:" + content_type,
            "c0-param3": "number:0",
            "c0-param4": "number:" + section_id,
            "batchId": timestamp
        };
        $.ajax({
            url: 'https://mooc.study.163.com/dwr/call/plaincall/CourseBean.getLessonUnitLearnVo.dwr?' + timestamp,
            method: 'POST',
            async: true,
            data: params,
            success: function (response) {
                var signature_id_info = response.match(/s0.signature="(.*?)";.*?s0.videoId=(.*?);/);
                var video_signature = signature_id_info[1];
                var video_id = signature_id_info[2];
                getVideoUrl(content_id, video_signature, file_name, save_path);//video_id = content_id
            }
        });
    }

    //获取视频下载地址
    function getVideoUrl(videoId, signature, file_name, save_path) {
        var params = {
            'videoId': videoId,
            'signature': signature,
            'clientType': '1'
        };
        $.ajax({
            url: 'https://vod.study.163.com/eds/api/v1/vod/video',
            method: 'POST',
            async: true,
            data: params,
            success: function (response) {
                var videoUrls = response.result.videos;
                var video_url_list = [];
                videoUrls.forEach(function (video) {
                    if (video.format == video_format && video.quality == video_quality) {
                        video_url_list.push({ 'video_format': video.format, 'video_quality': video.quality, 'video_url': video.videoUrl });
                    }
                });
                if (video_url_list.length != 0) {
                    video_download_url = video_url_list[0].video_url;
                    //if (video_download_url != "")
                    var qualityString = ".";
                    switch (video_url_list[0].video_quality) {
                        case 1: qualityString = ".sd"; break;
                        case 2: qualityString = ".hd"; break;
                        case 3: qualityString = ".shd"; break;
                    }
                    //mylog(video_download_url);
                    sendDownloadTaskToAria2(video_download_url, file_name + qualityString + '.' + video_format, save_path);
                }
            }
        });
    }

    // 将下载链接发送到 Aria2 下载
    function sendDownloadTaskToAria2(download_url, file_name, save_path) {
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
            onerror: function (response) {
                mylog(response);
            },
            onload: function (response) {
                mylog(response);
                if (!hasOpenAriac2Tab) {
                    GM_openInTab('http://aria2c.com/', { active: true });
                    hasOpenAriac2Tab = true;
                }
            }
        });
    }

})();