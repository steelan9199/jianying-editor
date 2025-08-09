import { JianYingEditor } from "./JianYingEditor.js"; // 替换为你的包名
const jianYingDraftsBasePath = "F:/动漫/剪映/草稿/JianyingPro Drafts";
const jianYingEditor = new JianYingEditor(jianYingDraftsBasePath);
console.log("jianYingEditor", jianYingEditor);

/* ------------------------------ 初始化 -------------------------------------------- */
await jianYingEditor.load();
await jianYingEditor.init();

/* ------------------------------ 创建轨道 -------------------------------------------- */
// 创建视频轨道
jianYingEditor.trackManager.create({ name: "视频轨道", type: "video" });
// 创建图片轨道
// jianYingEditor.trackManager.create({ name: "图片轨道", type: "video" });
// // 创建人声轨道
// jianYingEditor.trackManager.create({ name: "人声轨道", type: "audio" });
// // 创建音效轨道
// jianYingEditor.trackManager.create({ name: "音效轨道", type: "audio" });
// // 创建背景声音轨道
// jianYingEditor.trackManager.create({ name: "背景声音轨道", type: "audio" });
// // 创建字幕轨道
// jianYingEditor.trackManager.create({ name: "字幕轨道", type: "text" });
// // 创建标题轨道
// jianYingEditor.trackManager.create({ name: "标题轨道", type: "text" });

/* ------------------------------ 视频轨道放置一个视频片段 -------------------------------------------- */
// jianYingEditor.addVideoClip({ filePath, track, start_time, duration, target_timerange });

// 素材在时间线上的起始时间和持续时长
