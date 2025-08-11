import fs from "fs";
import { JianYingEditor } from "./JianYingEditor.js"; // 替换为你的包名
const jianYingDraftsBasePath = "F:/动漫/剪映/草稿/JianyingPro Drafts";
const jianYingEditor = new JianYingEditor(jianYingDraftsBasePath);
// console.log("jianYingEditor", jianYingEditor);

/* ------------------------------ 创建轨道 -------------------------------------------- */
// 创建视频轨道
jianYingEditor.trackManager.create({ name: "视频轨道", type: "video" });
// 创建图片轨道
jianYingEditor.trackManager.create({ name: "图片轨道", type: "video" });
// 创建人声轨道
jianYingEditor.trackManager.create({ name: "人声轨道", type: "audio" });
// 创建音效轨道
jianYingEditor.trackManager.create({ name: "音效轨道", type: "audio" });
// 创建背景声音轨道
jianYingEditor.trackManager.create({ name: "背景声音轨道", type: "audio" });
// 创建字幕轨道
jianYingEditor.trackManager.create({ name: "字幕轨道", type: "text" });
// 创建标题轨道
jianYingEditor.trackManager.create({ name: "标题轨道", type: "text" });

/* ------------------------------ 视频轨道放视频 -------------------------------------------- */
await jianYingEditor.insertVideoClip({
  videoPath: "素材/汽车尾气6秒.mp4",
  trackName: "视频轨道"
});
// await jianYingEditor.insertVideoClip({
//   videoPath: "素材/汽车尾气6秒.mp4",
//   trackName: "视频轨道",
//   target_timerange: {
//     start: 0,
//     duration: 1000000
//   }
// });
/* ------------------------------ 音频轨道放音频 -------------------------------------------- */
await jianYingEditor.insertAudioClip({
  audioPath: "素材/汽车尾气6秒.WAV",
  trackName: "人声轨道"
});
// await jianYingEditor.insertAudioClip({
//   audioPath: "素材/汽车尾气6秒.WAV",
//   trackName: "背景声音轨道"
// });
// await jianYingEditor.insertAudioClip({
//   audioPath: "素材/汽车尾气6秒.WAV",
//   trackName: "音效轨道"
// });
// await jianYingEditor.insertAudioClip({
//   audioPath: "素材/汽车尾气6秒.WAV",
//   trackName: "音效轨道",
//   target_timerange: {
//     start: 0,
//     duration: 1000000
//   }
// });
/* ------------------------------ 图片轨道放图片 -------------------------------------------- */
await jianYingEditor.insertImageClip({
  imagePath: "素材/小乔小雨小美女.png",
  trackName: "图片轨道",
  index: 0,
  referenceTrackName: "视频轨道"
});
/* ------------------------------ 文本轨道放文本 -------------------------------------------- */
await jianYingEditor.insertTextClip({
  srtPath: "F:/剪映一键出视频/02素材/字幕/001_镜头序号_1.srt",
  trackName: "字幕轨道",
  vocalTrackName: "人声轨道",
  index: 0,
  textType: "subtitle"
});

// 计算总时长
const totalDuration = jianYingEditor.trackManager.getTotalDuration();
console.log("totalDuration", totalDuration);
jianYingEditor.projectData.duration = totalDuration;
await jianYingEditor.save();
