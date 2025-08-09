import path from "path";
import { styleText } from "node:util";
import { JianYingEditor } from "./JianYingEditor.js";
import { sortObjectByKeys, getRemainingFramesFromMicroseconds, scaleDimensions, getMediaMetadata, generateId, calculateJianyingTimelineMetrics } from "./helper.js";

const PROJECT_FILE_PATH = String.raw`F:\动漫\剪映\草稿\JianyingPro Drafts\剪映yashu\draft_content.json`;

async function main() {
  // 1. Initialize the project editor with the path to your project file.
  // 1. 使用您的项目文件路径初始化项目编辑器。
  const project = new JianYingEditor(PROJECT_FILE_PATH);
  // const project = new JianYingEditor();
  // 2. Load the project data from the file.
  // 2. 从文件加载项目数据。
  await project.load();
  await project.init();
  // 插入素材之前, 应该先知道要插入哪个轨道

  console.log("总指挥下令：创建一条新的视频轨道！");
  // const trackNames = ["视频轨道", "人声轨道", "音效轨道", "背景声音轨道", "字幕轨道"];
  // 中文名称	英文翻译	小驼峰命名 (JS)
  // 视频轨道	Video Track	videoTrack
  // 人声轨道	Vocal Track	vocalTrack
  // 音效轨道	Sound Effect Track	soundEffectTrack
  // 背景声音轨道	Background Sound Track	backgroundSoundTrack
  // 字幕轨道	Subtitle Track	subtitleTrack

  const trackNames = [
    {
      name: "视频轨道",
      type: "video"
    },
    {
      name: "人声轨道",
      type: "audio"
    },
    {
      name: "音效轨道",
      type: "audio"
    },
    {
      name: "背景声音轨道",
      type: "audio"
    },
    {
      name: "字幕轨道",
      type: "text"
    }
  ].sort((a, b) => {
    const order = { video: 1, audio: 2, text: 3 };
    return order[a.type] - order[b.type];
  });
  trackNames.map((trackName) => {
    project.trackManager.create({
      id: generateId(),
      name: trackName.name,
      type: trackName.type
    });
  });
  // ! 把视频放入视频轨道
  // 先获取视频轨道
  const allTracks = project.trackManager.get();
  const videoTrack = allTracks.find((t) => t.name === "视频轨道");
  const videoTrackId = videoTrack.id;
  console.log("videoTrack", videoTrack);
  const videoDirectory = path.join(String.raw`F:\剪映一键出视频\02素材\视频`);
  const videoFileNames = [
    "001_视觉元素ID_V001.mp4",
    "002_视觉元素ID_V002.mp4",
    "003_视觉元素ID_V003.mp4"
  ];
  for (let i = 0; i < 3; i++) {
    console.log(styleText("red", `i = ${i}\n`));
    const videoPath = path.join(videoDirectory, videoFileNames[i]);
    const mediaMetadata = await getMediaMetadata(videoPath);
    project.logMediaMetadata(mediaMetadata);
    const videoMetadata = mediaMetadata.metadata;
    if (i === 0) {
      project.updateCanvasWidthAndHeight(videoMetadata.width, videoMetadata.height);
    }
    let { timelineDurationInMicroseconds: videoDuration, remainingFrames: currentRemainingFrames } = calculateJianyingTimelineMetrics(videoMetadata.duration);
    console.log("currentRemainingFrames", currentRemainingFrames);
    console.log("videoDuration", videoDuration);
    // process.exit();
    const trackDuration = project.trackManager.getTrackDuration(videoTrackId);
    console.log("trackDuration", trackDuration);
    const start = trackDuration;
    const target_timerange = {
      start: start,
      duration: videoDuration
    };
    console.log("target_timerange", target_timerange);
    console.log("videoPath", videoPath);
    // ! 插入第二个视频的时候, 要注意第二个视频放到第一个视频的结尾
    await project.insertVideoClip(videoPath, videoTrackId, target_timerange);
  }

  /* ---------------------------------人声轨道 开始----------------------------------------- */
  const vocalTrack = allTracks.find((t) => t.name === "人声轨道");
  const vocalTrackId = vocalTrack.id;
  const vocalDirectory = path.join(String.raw`F:\剪映一键出视频\02素材\人声台词`);
  const vocalFileNames = [
    "001_镜头序号_1.mp3",
    "002_镜头序号_2.mp3",
    "003_镜头序号_3.mp3"
  ];
  for (let i = 0; i < 3; i++) {
    console.log(styleText("red", `人声轨道的循环序号 i = ${i}\n`));
    const vocalPath = path.join(vocalDirectory, vocalFileNames[i]);
    const mediaMetadata = await getMediaMetadata(vocalPath);
    project.logMediaMetadata(mediaMetadata);
    const vocalMetadata = mediaMetadata.metadata;
    let { timelineDurationInMicroseconds: vocalDuration, remainingFrames: currentRemainingFrames } = calculateJianyingTimelineMetrics(vocalMetadata.duration);
    // process.exit();
    const trackDuration = project.trackManager.getTrackDuration(vocalTrackId);
    console.log("trackDuration", trackDuration);
    const start = trackDuration;
    const target_timerange = {
      start: start,
      duration: vocalDuration
    };
    console.log("target_timerange", target_timerange);
    console.log("vocalPath", vocalPath);
    // ! 插入第二个视频的时候, 要注意第二个视频放到第一个视频的结尾
    await project.insertAudioClip(vocalPath, vocalTrackId, target_timerange);
  }
  /* ---------------------------------人声轨道 结束----------------------------------------- */

  /* ---------------------------------音效轨道 开始----------------------------------------- */
  const soundEffectTrack = allTracks.find((t) => t.name === "音效轨道");
  const soundEffectTrackId = soundEffectTrack.id;
  const soundEffectDirectory = path.join(String.raw`F:\剪映一键出视频\02素材\音效`);
  const soundEffectFileNames = [
    "002_音频元素ID_SFX_风雪声_01.flac",
    "003_音频元素ID_SFX_低频嗡鸣_01.flac",
    "004_音频元素ID_SFX_雷达扫描_01.flac"
  ];
  for (let i = 0; i < 3; i++) {
    console.log(styleText("red", `音效轨道的循环序号 i = ${i}\n`));
    const soundEffectPath = path.join(soundEffectDirectory, soundEffectFileNames[i]);
    const mediaMetadata = await getMediaMetadata(soundEffectPath);
    project.logMediaMetadata(mediaMetadata);
    const soundEffectMetadata = mediaMetadata.metadata;
    let { timelineDurationInMicroseconds: soundEffectDuration, remainingFrames: currentRemainingFrames } = calculateJianyingTimelineMetrics(soundEffectMetadata.duration);
    // process.exit();
    const trackDuration = project.trackManager.getTrackDuration(soundEffectTrackId);
    console.log("trackDuration", trackDuration);
    const start = trackDuration;
    const target_timerange = {
      start: start,
      duration: soundEffectDuration
    };
    console.log("target_timerange", target_timerange);
    console.log("soundEffectPath", soundEffectPath);
    // ! 插入第二个视频的时候, 要注意第二个视频放到第一个视频的结尾
    await project.insertAudioClip(soundEffectPath, soundEffectTrackId, target_timerange);
  }
  /* ---------------------------------音效轨道 结束----------------------------------------- */

  /* ---------------------------------背景声音轨道 开始----------------------------------------- */
  const backgroundSoundTrack = allTracks.find((t) => t.name === "背景声音轨道");
  const backgroundSoundTrackId = backgroundSoundTrack.id;
  const backgroundSoundDirectory = path.join(String.raw`F:\剪映一键出视频\02素材\音效`);
  const backgroundSoundFileNames = [
    "001_音频元素ID_BGM_悬疑氛围_01.flac"
  ];
  for (let i = 0; i < 1; i++) {
    console.log(styleText("red", `背景声音轨道的循环序号 i = ${i}\n`));
    const backgroundSoundPath = path.join(backgroundSoundDirectory, backgroundSoundFileNames[i]);
    const mediaMetadata = await getMediaMetadata(backgroundSoundPath);
    project.logMediaMetadata(mediaMetadata);
    const backgroundSoundMetadata = mediaMetadata.metadata;
    let { timelineDurationInMicroseconds: backgroundSoundDuration, remainingFrames: currentRemainingFrames } = calculateJianyingTimelineMetrics(backgroundSoundMetadata.duration);
    // process.exit();
    const trackDuration = project.trackManager.getTrackDuration(backgroundSoundTrackId);
    console.log("trackDuration", trackDuration);
    const start = trackDuration;
    const target_timerange = {
      start: start,
      duration: backgroundSoundDuration
    };
    console.log("target_timerange", target_timerange);
    console.log("backgroundSoundPath", backgroundSoundPath);
    await project.insertAudioClip(backgroundSoundPath, backgroundSoundTrackId, target_timerange);
  }
  /* ---------------------------------背景声音轨道 结束----------------------------------------- */

  // 计算时长, 查看轨道上所有的素材
  const totalDuration = project.trackManager.getTotalDuration();
  console.log("totalDuration", totalDuration);
  project.projectData.duration = totalDuration;

  // project.projectFilePath = MODIFIED_PROJECT_FILE_PATH;
  await project.save();
  console.log(styleText("green", `项目修改成功，已保存至：${project.draftContentPath}`));
}

main();
