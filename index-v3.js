import path from "path";
import { styleText } from "node:util";
import { JianYingEditor } from "./JianYingEditor.js";
import { getMediaMetadata, generateId, calculateJianyingTimelineMetrics, parseSrtFileToMicroseconds } from "./helper.js";
import { createNewProject } from "./create_jianying_project.js";

// 配置对象，便于修改和维护
const CONFIG = {
  video: {
    directory: String.raw`F:\剪映一键出视频\02素材\视频`,
    fileNames: [
      "001_视觉元素ID_V001.mp4",
      "002_视觉元素ID_V002.mp4",
      "003_视觉元素ID_V003.mp4"
    ]
  },
  vocal: {
    directory: String.raw`F:\剪映一键出视频\02素材\人声台词`,
    fileNames: [
      "001_镜头序号_1.mp3",
      "002_镜头序号_2.mp3",
      "003_镜头序号_3.mp3"
    ]
  },
  soundEffect: {
    directory: String.raw`F:\剪映一键出视频\02素材\音效`,
    fileNames: [
      "002_音频元素ID_SFX_风雪声_01.flac",
      "003_音频元素ID_SFX_低频嗡鸣_01.flac",
      "004_音频元素ID_SFX_雷达扫描_01.flac"
    ]
  },
  backgroundSound: {
    directory: String.raw`F:\剪映一键出视频\02素材\音效`,
    fileNames: [
      "001_音频元素ID_BGM_悬疑氛围_01.flac"
    ]
  },
  subtitle: {
    directory: String.raw`F:\剪映一键出视频\02素材\字幕`,
    fileNames: [
      "001_镜头序号_1.srt",
      "002_镜头序号_2.srt",
      "003_镜头序号_3.srt"
    ]
  },
  trackDefinitions: [
    { name: "视频轨道", type: "video" },
    { name: "人声轨道", type: "audio" },
    { name: "音效轨道", type: "audio" },
    { name: "背景声音轨道", type: "audio" },
    { name: "字幕轨道", type: "text" }
  ]
};

/**
 * 插入媒体片段到指定轨道的通用函数
 * @param {JianYingEditor} project - 项目实例
 * @param {Array} mediaConfig - 媒体配置数组
 * @param {string} trackName - 轨道名称
 * @param {string} mediaType - 媒体类型 ('video' 或 'audio')
 */
async function insertMediaClips(project, mediaConfig, trackName, mediaType) {
  const track = project.trackManager.get().find((t) => t.name === trackName);
  if (!track) {
    console.error(`未找到轨道: ${trackName}`);
    return;
  }

  const { directory, fileNames } = mediaConfig;
  if ([
      "video",
      "audio"
    ].includes(mediaType)) {
    for (let i = 0; i < fileNames.length; i++) {
      console.log(styleText("red", `${trackName}的循环序号 i = ${i}\n`));

      const mediaPath = path.join(directory, fileNames[i]);
      const mediaMetadata = await getMediaMetadata(mediaPath);
      project.logMediaMetadata(mediaMetadata);

      const metadata = mediaMetadata.metadata;
      let { timelineDurationInMicroseconds: duration } = calculateJianyingTimelineMetrics(metadata.duration);

      const trackDuration = project.trackManager.getTrackDuration(track.id);
      const target_timerange = {
        start: trackDuration,
        duration: duration
      };

      console.log("target_timerange", target_timerange);
      console.log(`${mediaType}Path`, mediaPath);

      // 根据媒体类型调用相应的插入方法
      if (mediaType === "video") {
        await project.insertVideoClip(mediaPath, track.id, target_timerange);
      } else if (mediaType === "audio") {
        await project.insertAudioClip(mediaPath, track.id, target_timerange);
      }
    }
  } else if (["text"].includes(mediaType)) {
    const videoTrack = project.trackManager.getTrackByTrackName("视频轨道");

    for (let i = 0; i < fileNames.length; i++) {
      console.log(styleText("red", `${trackName}的循环序号 i = ${i}\n`));
      const srtPath = path.join(directory, fileNames[i]);
      // 根据媒体类型调用相应的插入方法
      if (mediaType === "text") {
        const subtitles = await parseSrtFileToMicroseconds(srtPath);
        await project.insertSubtitleClips(subtitles, track.id, videoTrack, i);
      }
    }
  }
}

async function main() {
  // 创建新项目而不是使用硬编码路径
  // const projectMetaData = createNewProject();
  // if (!projectMetaData) {
  //   console.error("创建新项目失败");
  //   return;
  // }
  const PROJECT_FILE_PATH = String.raw`F:\动漫\剪映\草稿\JianyingPro Drafts\剪映yashu\draft_content.json`;
  const project = new JianYingEditor(PROJECT_FILE_PATH);

  // 初始化项目编辑器
  // const project = new JianYingEditor(projectMetaData.draftContentPath);
  await project.load();
  await project.init();

  // 创建轨道
  console.log("总指挥下令：创建轨道！");
  CONFIG.trackDefinitions.forEach((trackDef) => {
    project.trackManager.create({
      id: generateId(),
      name: trackDef.name,
      type: trackDef.type
    });
  });

  // 插入视频片段
  await insertMediaClips(project, CONFIG.video, "视频轨道", "video");

  // // 插入人声片段
  // await insertMediaClips(project, CONFIG.vocal, "人声轨道", "audio");

  // // 插入音效片段
  // await insertMediaClips(project, CONFIG.soundEffect, "音效轨道", "audio");

  // // 插入背景音乐片段
  // await insertMediaClips(project, CONFIG.backgroundSound, "背景声音轨道", "audio");

  // 插入字幕片段
  await insertMediaClips(project, CONFIG.subtitle, "字幕轨道", "text");

  // 计算总时长并保存项目
  const totalDuration = project.trackManager.getTotalDuration();
  console.log("totalDuration", totalDuration);
  project.projectData.duration = totalDuration;

  await project.save();
  console.log(styleText("green", `项目修改成功，已保存至：${project.draftContentPath}`));
}

main().catch(console.error);
