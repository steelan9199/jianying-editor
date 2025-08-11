# 剪映编辑器 (JianYing Editor)
一个用于自动化剪映项目编辑的工具库。  

本地给剪映轨道上添加视频, 音频, 图片, 文本  
适用于剪映5.9.0  

剪映5.9.0版本下载  
https://pan.quark.cn/s/ab06d169eff0  

[![NPM Version](https://img.shields.io/npm/v/jianying-editor.svg)](https://www.npmjs.com/package/jianying-editor)
[![License](https://img.shields.io/npm/l/jianying-editor.svg)](https://github.com/steelan9199/jianying-editor/blob/main/LICENSE)



## 安装

```bash
npm install jianying-editor
```

## 使用示例
```js
import { JianYingEditor } from 'jianying-editor';

// 创建一个新的剪映项目
const jianYingDraftsBasePath = "D:\剪映\草稿\JianyingPro Drafts";
const editor = new JianYingEditor(jianYingDraftsBasePath);

// 创建轨道
editor.trackManager.create({ name: "视频轨道", type: "video" });
editor.trackManager.create({ name: "人声轨道", type: "audio" });
editor.trackManager.create({ name: "字幕轨道", type: "text" });

// 插入视频片段
await editor.insertVideoClip({
  videoPath: "path/to/your/video.mp4",
  trackName: "视频轨道"
});

// 插入音频片段
await editor.insertAudioClip({
  audioPath: "path/to/your/audio.wav",
  trackName: "人声轨道"
});

// 保存项目
await editor.save();
```

