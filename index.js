
import { argv } from 'process';
import { readdir, lstat } from 'fs/promises'; // node version 16.13.0 rename 经常出现不报错直接退出的 bug
import { renameSync } from 'fs';
import { spawn } from 'child_process';

// node index.js "/path/to/something"
const dir = argv[2]; // /path/to/something
// mediainfo CLI 程序路径
const MediaInfo = 'mediainfo'; // 本机配置了环境变量，帮无需全路径

const files = await readdir(dir);
var index = 0;
for (let file of files) {
  index++;
  let path = `${dir}\\${file}`;
  let stats = await lstat(path);
  console.log(`\n正在处理：${index}/${files.length}`, path);
  // 子目录不处理
  if (!stats.isFile()) continue;
  let mediainfo = spawn(MediaInfo, ['--Output=JSON', path]);
  await new Promise(rs => {
    var str = '';
    // 数据偶尔出现分片，这里做数据拼接
    mediainfo.stdout.on('data', chunk => {
      str += chunk.toString();
    });
    mediainfo.stdout.on('end', () => {
      let type = JSON.parse(str).media.track[0].Format;
      if (type === 'FLAC') {
        // 将任意扩展名或无扩展名改为 flac 扩展名
        let newPath = path.replace(/\.[^.]*$|$/, '.flac');
        console.log(`重命名：${path} => ${newPath}`);
        renameSync(path, newPath);
      }
      rs();
    });
  });
}

console.log('完成');
