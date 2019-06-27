const express = require( 'express' );
const bodyParser = require( 'body-parser' );
const fs = require( 'fs' );
const path = require( "path" );

let windowsNameForbidReg = /[\\/?？*"“”'‘’<>{}\[\]【】：:、^$!~`|]/g;
const app = express();
// bodyParser.urlencoded解析form表单提交的数据
app.use( bodyParser.urlencoded( {extended: false} ) );
// bodyParser.json解析json数据格式的
app.use( bodyParser.json() );

app.all( '*', function (req, res, next) {
    //let origin = req.headers.origin;
    res.setHeader( 'Access-Control-Allow-Origin', "*" );
    res.setHeader( 'Access-Control-Allow-Headers', 'Content-Type' );
    next();
} );

function makeDirs(dirname, callback) {
    fs.exists( dirname, exists => {
        if (exists) callback();
        else makeDirs( path.dirname( dirname ), () => fs.mkdir( dirname, callback ) );
    } );//console.log(path.dirname(dirname));
}

function buildM3u8DownBunchFile(m3u8FileName, saveDirPath) {//"D:\HKPath\HK\HkDownloads\k0.m3u8";
    //let downLoadFileDirFullPath = "D:\\HKPath\\HK\\HkDownloads";//file:///F:/@Installed/HkTools/M3U81.4.2/k0.m3u8
    let fileFullPath = saveDirPath.replace( /\\/g, "/" ).replace( /\/$/g, "" ).trim();
    fileFullPath += `/${m3u8FileName}`;//file:///D:/HKPath/HK/HkDesktop/1.html
    return `${m3u8FileName.replace( /\.m3u8$/ig, "" )},file:///${fileFullPath}\r\n`;
}

app.post( '/saveM3u8Files', function (req, res) {
    let video = req.body;
    let checkedCourseName = video.CourseName.replace( windowsNameForbidReg, "" ).trim();
    let saveDirFullPath = process.cwd() + "/" + checkedCourseName;

    makeDirs( `./${checkedCourseName}`, error => {
        if (error) {//创建目录失败
            res.send( `创建目录失败:${error.message}` );
            throw error;
        }//创建成功！
        let bunchFileRelativePath = `./${checkedCourseName}/${checkedCourseName}ADownBunchFile.txt`;
        let responseText = buildM3u8DownBunchFile( video.DownLoadM3u8FileName, saveDirFullPath );
        fs.appendFile( bunchFileRelativePath, responseText, 'utf8', (error) => {// 保存完成后的回调函数
            if (error) {
                res.send( `追加文件失败:${error.message}` );
                throw error;
            }
            let m3u8FileRelativePath = `./${checkedCourseName}/${video.DownLoadM3u8FileName}`;
            fs.writeFile( m3u8FileRelativePath, video.FinalDecodeContent, 'utf8', (error) => {
                if (error) {
                    res.send( `保存文件失败:${error.message}` );
                    throw error;
                }
                console.log( `${m3u8FileRelativePath}SAveD!` );
                res.send( responseText );
            } );
        } );

    } );
} );

app.listen( 3000 );
