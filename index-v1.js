import path from "path";
import { JianYingEditor } from "./JianYingEditor.js";
import { sortObjectByKeys, getVideoMetadata, generateId } from "./helper.js";

// --- CONFIGURATION ---
// --- 配置 ---
// IMPORTANT: Replace these with the ACTUAL, ABSOLUTE paths to your media files.
// 重要提示：请将这些替换为您的媒体文件的实际绝对路径。
const PROJECT_FILE_PATH = String.raw`F:\动漫\剪映\草稿\JianyingPro Drafts\剪映yashu\draft_content.json`;
const MODIFIED_PROJECT_FILE_PATH = path.join(import.meta.dirname, "draft_content_new.json");
// Replace with your own media files
// 替换为您自己的媒体文件
const NEW_VIDEO_FILE = path.join(import.meta.dirname, "素材/汽车尾气6秒.mp4");
const NEW_IMAGE_FILE = path.join(import.meta.dirname, "素材/小乔小雨小美女.png");
const NEW_AUDIO_FILE = path.join(import.meta.dirname, "素材/汽车尾气6秒.WAV");
const NEW_TEXT_FILE = path.join(import.meta.dirname, "素材/台词.md");
async function main() {
  // 1. Initialize the project editor with the path to your project file.
  // 1. 使用您的项目文件路径初始化项目编辑器。
  // const project = new JianYingEditor(PROJECT_FILE_PATH);
  const project = new JianYingEditor();
  // 2. Load the project data from the file.
  // 2. 从文件加载项目数据。
  await project.load();
  await project.init();
  // 插入素材之前, 应该先知道要插入哪个轨道

  console.log("总指挥下令：创建一条新的视频轨道！");
  project.trackManager.create({
    id: generateId(),
    name: "视频轨道",
    type: "video",
  });
  await project.insertVideoClip(NEW_VIDEO_FILE);
  await project.insertAudioClip(NEW_AUDIO_FILE);
  await project.insertImageClip(NEW_IMAGE_FILE);
  const subtitle = "hello world 你好, 世界!";
  await project.insertSubtitleClip(subtitle);

  const title = "**I Am the Title** \n我是标题!";
  await project.insertTitleClip(title);

  // 计算时长, 查看轨道上所有的素材
  const totalDuration = project.trackManager.getTotalDuration();
  project.projectData.duration = totalDuration;

  // project.projectFilePath = MODIFIED_PROJECT_FILE_PATH;
  await project.save();
  console.log(`
项目修改成功，已保存至：
${project.draftContentPath}`);
}

main();
