// ==UserScript==
// @name         抖音ADown
// @namespace    https://github.com/hzlzh
// @version      1.0.2
// @description  下载抖音APP端禁止下载的视频
// @author       chary
// @license      MIT License
// @include      https://www.douyin.com/user/*
// @require      https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.0/jquery.min.js
// @grant           GM_getValue
// @grant           GM_setValue
// @grant           GM_xmlhttpRequest
// @grant           GM_openInTab
// @grant           GM_setClipboard
// @grant           GM_registerMenuCommand
// @grant           GM_addStyle
// @grant           GM_download
// @icon         https://lf1-cdn-tos.bytegoofy.com/goofy/ies/douyin_web/public/favicon.ico
// ==/UserScript==
(function () {
	var log_count = 1;
	function mylog(param1, param2) {
		param1 = param1 ? param1 : "";
		param2 = param2 ? param2 : "";
		console.log("#" + log_count++ + "-douyin-log:", param1, param2);
	}
	const btn = document.createElement("a");
	btn.textContent = '用户去水印下载';
	btn.target = '_blank'
	btn.style.position = 'fixed'
	btn.style.zIndex = '9999'
	btn.style.left = '8px'
	btn.style.top = '80px'
	btn.style.opacity = '0.8'
	btn.style.padding = '4px 8px'
	btn.style.color = '#ffffff'
	btn.style.background = '#fe2c55'
	document.body.appendChild(btn);
	btn.onclick = () => {
		let i = 0;
		let savePath = document.querySelector("#root > div > div  > div > div > div  > div  > div > h1 > span > span > span > span > span").innerText;
		savePath = ".\\"+savePath.replace(/\/|:|\?|\*|"|<|>|\|/g, "");
		document.querySelectorAll('#root > div > div > div > div > div > div > div > ul > li > a').forEach(aHref => {
			let fileName = ++i + "." + aHref.querySelector('div > div > img').alt;
			fileName = fileName.replace(/\/|:|\?|\*|"|<|>|\|/g, "")+".mp4";
			// mylog(i+"fileName:"+fileName,"aHref:" + aHref.href);
			const videoID = aHref.href.match(/video\/(\d*)/)[1];
			let fetchUrl = "https://www.douyin.com/web/api/v2/aweme/iteminfo/?item_ids=" + videoID;
			// mylog(i+"videoID"+videoID,"fetchUrl:"+fetchUrl);
			mylog(i+"fileName:"+fileName,"fetchUrl:"+fetchUrl);
			GM_xmlhttpRequest({
				url: fetchUrl,
				method: 'GET',
				dataType:'JSON',
				onerror: function (response) {
					mylog(response);
				},
				onload: function (response) {
					//mylog(response);
				let json =	JSON.parse(response.responseText);
				const videoLink = json.item_list[0].video.play_addr.url_list[0].replace("playwm", "play");
				// mylog(i+"videoLink" , videoLink);
				sendDownloadTaskToAria2(videoLink,fileName,savePath);
				}
			});
		});
	};
	var aria2_url = "http://127.0.0.1:6800/jsonrpc"; //Aria2 地址
	// 将下载链接发送到 Aria2 下载
	function sendDownloadTaskToAria2(download_url, file_name, save_path) {
		//mylog(download_url + '\n\t' + save_path + '-' + file_name + '\n');
		//return;
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
				mylog(file_name+" Error:"+response);
			},
			onload: function (response) {
				// mylog(response);
				// if (!hasOpenAriac2Tab) {
				// 	//GM_openInTab('http://aria2c.com/', { active: true });
				// 	alert("done! open AriaNg to look!");
				// 	hasOpenAriac2Tab = true;
				// }
			}
		});
	}
	//  save_path.replace(course_save_path, '')
})();