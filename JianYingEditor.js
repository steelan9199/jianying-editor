// --- 文件: JianYingEditor.js ---
/**
 * @typedef {import('./types').VideoMetadata} VideoMetadata
 * @typedef {import('./types').AudioMetadata} AudioMetadata
 * @typedef {import('./types').ImageMetadata} ImageMetadata
 * @typedef {import('./types').UnsupportedMetadata} UnsupportedMetadata
 * @typedef {import('./types').MediaMetadataResult} MediaMetadataResult
 * @typedef {import('./types').Track} Track
 */

import fs from "fs";
import path from "path";
import { styleText } from "node:util";
import { createNewProject } from "./create_jianying_project.js";

import {
  VideoManager,
  AudioManager,
  ImageManager,
  SubtitleManager,
  TitleManager,
  LyricsTaskInfoManager,
  BeatManager,
  TrackManager,
  SpeedManager,
  CanvasManager,
  SoundChannelMappingManager,
  VocalSeparationManager,
  MaterialAnimationManager,
  // ...等等，未来需要哪个就在这里加哪个名字
} from "./managers/index.js"; // 直接从总入口导入

import {
  sortObjectByKeys,
  scaleDimensions,
  getMediaMetadata,
  generateId,
  calculateJianyingTimelineMetrics,
  getRemainingFramesFromMicroseconds,
} from "./helper.js";

/**
 * @class JianYingEditor
 * @classdesc 剪映编辑器主类，用于自动化视频编辑
 *
 * @description
 * 提供完整的剪映项目操作功能，包括：
 * - 创建和加载剪映项目
 * - 管理视频、音频、图片等媒体素材
 * - 控制时间线和轨道
 * - 添加字幕和标题
 */
export class JianYingEditor {
  /**
   * 创建一个剪映编辑器实例，并同步加载和初始化项目
   * @param {string} [draftLocation] - 可选的剪映草稿基础路径
   * @throws {Error} 如果加载或初始化失败
   */
  constructor(draftLocation) {
    const projectMetaData = createNewProject(draftLocation);
    this.draftContentPath = projectMetaData.draftContentPath;
    this.projectId = projectMetaData.projectId;
    this.projectRootDir = projectMetaData.projectRootDir;
    this.projectData = null;
    console.log(
      styleText(
        "green",
        `✅ 新建剪映工程: projectId: ${this.projectId}\n✅ 工程draft_content文件路径: ${this.draftContentPath}`
      )
    );

    // --- 同步加载项目文件 ---
    try {
      const fileContent = fs.readFileSync(this.draftContentPath, "utf-8");
      this.projectData = JSON.parse(fileContent);
    } catch (error) {
      console.error("Failed to load project file (synchronously):", error);
      throw error;
    }

    // --- 同步初始化编辑器核心组件 ---
    if (!this.projectData) {
      // 理论上不会发生，因为上面失败会抛出错误
      throw new Error("Project data is not loaded after synchronous load.");
    }
    // 重置项目数据到 emptyProject.json
    try {
      const emptyProjectFilePath = "./emptyProject.json";
      const emptyProjectContent = fs.readFileSync(
        emptyProjectFilePath,
        "utf-8"
      );
      const emptyProjectData = JSON.parse(emptyProjectContent);
      emptyProjectData.id = this.projectData.id; // 保持原项目的ID
      this.projectData = emptyProjectData;
    } catch (error) {
      console.error("Failed to reset project data (synchronously):", error);
      throw error;
    }

    const projectData = this.projectData;
    projectData.color_space = 0;
    const materials = projectData.materials || {};

    // 实例化所有需要的"部门经理"
    // 注意：如果任何管理器的构造函数或其依赖涉及到异步操作，这里仍然是问题。
    this.videoManager = new VideoManager(materials.videos);
    this.audioManager = new AudioManager(materials.audios);
    this.imageManager = new ImageManager(materials.videos); // 注意：这里使用的 materials.videos 可能有误，ImageManager 可能需要 materials.images
    this.subtitleManager = new SubtitleManager(materials.texts);
    this.titleManager = new TitleManager(materials.texts);
    this.materialAnimationManager = new MaterialAnimationManager(
      materials.material_animations
    );
    this.lyricsTaskInfoManager = new LyricsTaskInfoManager(
      projectData.config.lyrics_taskinfo
    );
    this.beatManager = new BeatManager(materials.beats);
    this.trackManager = new TrackManager(projectData.tracks);
    this.speedManager = new SpeedManager(materials.speeds);
    this.canvasManager = new CanvasManager(materials.canvases);
    this.soundChannelMappingManager = new SoundChannelMappingManager(
      materials.sound_channel_mappings
    );
    this.vocalSeparationManager = new VocalSeparationManager(
      materials.vocal_separations
    );
    console.log("部门经理, 各就各位 (synchronously)");

    // 注意：getMediaMetadata 如果是异步的，在 insertVideoClip 等方法中使用时仍然需要 await
  }

  /**
   * 保存项目文件
   * @returns {Promise<void>}
   * @throws {Error} 如果没有加载项目数据或保存失败
   */
  async save() {
    if (!this.projectData) {
      throw new Error("No project data loaded. Call load() first.");
    }
    try {
      // const sortedData = sortObjectByKeys(this.projectData);
      // const jsonString = JSON.stringify(sortedData, null, 2);
      const jsonString = JSON.stringify(this.projectData);
      await fs.promises.writeFile(this.draftContentPath, jsonString, "utf-8");
      console.log("Project saved successfully.");
    } catch (error) {
      console.error("Failed to save project file:", error);
      throw error;
    }
  }

  async updateCanvasWidthAndHeight(width = 1080, height = 1920) {
    const newDimensions = scaleDimensions(width, height);

    // 正确的顺序：先展开旧对象，再用新对象的属性去覆盖它
    this.projectData.canvas_config = {
      ...this.projectData.canvas_config, // 1. 保留所有旧属性 (如 ratio)
      ...newDimensions, // 2. 用新的 width 和 height 覆盖旧的
    };
  }

  /**
   * (业务方法) 新增一条视频轨道，并返回其对象
   * @returns {Object} 新创建的视频轨道对象
   */
  addVideoTrack() {
    console.log("总指挥下令：创建一条新的视频轨道！");
    return this.trackManager.create({
      type: "video",
      name: "视频轨道",
      id: generateId(),
    });
  }

  /**
   * (业务方法) 新增一条音频轨道，并返回其对象
   * @returns {Object} 新创建的音频轨道对象
   */
  addAudioTrack() {
    console.log("总指挥下令：创建一条新的音频轨道！");
    return this.trackManager.create({
      type: "audio",
      name: "音频轨道",
      id: generateId(),
    });
  }
  /**
   * (业务方法) 新增一条字幕轨道，并返回其对象
   * @returns {Object} 新创建的字幕轨道对象
   */
  addSubtitleTrack() {
    console.log("总指挥下令：创建一条新的字幕轨道！");
    return this.trackManager.create({
      flag: 3,
      type: "text",
      name: "字幕轨道",
      id: generateId(),
    });
  }
  /**
   * (业务方法) 新增一条标题轨道，并返回其对象
   * @returns {Object} 新创建的标题轨道对象
   */
  addTitleTrack() {
    console.log("总指挥下令：创建一条新的标题轨道！");
    return this.trackManager.create({
      flag: 0,
      type: "text",
      name: "标题轨道",
      id: generateId(),
    });
  }

  /**
   * 获取指定轨道的最后一个片段
   *
   * @param {string} trackId - 轨道的ID
   * @returns {object|null} 最后一个片段对象，如果没有片段则返回null
   */
  getLastClipInTrack(trackId) {
    const allTracks = this.trackManager.get();
    // 查找指定ID的轨道
    const mainTrack = allTracks.find(
      (/** @type {{ id: string; segments: any[]; }} */ t) => t.id === trackId
    );

    // 检查轨道是否存在，以及轨道上是否有片段
    if (mainTrack && mainTrack.segments && mainTrack.segments.length > 0) {
      // 返回最后一个片段
      return mainTrack.segments[mainTrack.segments.length - 1];
    }
    return null;
  }

  /**
   * 打印格式化后的媒体元数据信息到控制台.
   *
   * @param {(
   *   {type: 'video', metadata: {hasAudio: boolean, duration: number, width: number, height: number, codecName: string, bitRate: number, frameRate: number, sampleRate: number, channels: number, channelLayout: string}} |
   *   {type: 'audio', metadata: {duration: number, sampleRate: number, channels: number, bitRate: number, codecName: string}} |
   *   {type: 'image', metadata: {width: number, height: number, codecName: string}} |
   *   {type: 'unsupported', metadata: {error: string}}
   * )} mediaMetadata - 包含媒体类型和具体元数据的对象.
   * @returns {void}
   *
   * @example
   * const videoMeta = {
   *   type: 'video',
   *   metadata: { duration: 10.5, width: 1920, height: 1080, hasAudio: true, codecName: 'h264' }
   * };
   * logMediaMetadata(videoMeta);
   * // 输出:
   * // Detected Type: Video
   * // Duration: 10.5s, Dimensions: 1920x1080, Codec: h264, Audio: Yes
   */
  logMediaMetadata(mediaMetadata) {
    switch (mediaMetadata.type) {
      case "video": {
        const { duration, width, height, codecName, hasAudio, frameRate } =
          mediaMetadata.metadata;
        console.log("媒体类型: 视频 (Video)");
        console.log(
          `  - 尺寸: ${width}x${height}`,
          `| 时长: ${duration.toFixed(2)}s`,
          `| 帧率: ${frameRate.toFixed(2)}fps`,
          `| 编码: ${codecName}`,
          `| 音频: ${hasAudio ? "是" : "否"}`
        );
        break;
      }
      case "audio": {
        const { duration, sampleRate, codecName, bitRate } =
          mediaMetadata.metadata;
        console.log("媒体类型: 音频 (Audio)");
        console.log(
          `  - 时长: ${duration.toFixed(2)}s`,
          `| 采样率: ${sampleRate}Hz`,
          `| 编码: ${codecName}`,
          `| 比特率: ${(bitRate / 1000).toFixed(0)}kbps`
        );
        break;
      }
      case "image": {
        const { width, height, codecName } = mediaMetadata.metadata;
        console.log("媒体类型: 图片 (Image)");
        console.log(`  - 尺寸: ${width}x${height}`, `| 编码: ${codecName}`);
        break;
      }
      case "unsupported": {
        console.warn("媒体类型: 不支持 (Unsupported)");
        console.warn(`  - 错误: ${mediaMetadata.metadata.error}`);
        break;
      }
      default:
        // 使用一个 never 类型来做详尽性检查，如果 mediaMetadata.type 有新的可能类型而 case 未处理，TypeScript 会报错
        // const exhaustiveCheck: never = mediaMetadata;
        console.log("未知的媒体类型");
      // return exhaustiveCheck;
    }
  }

  /**
   * (高级业务方法) 向时间轴插入一个视频片段
   * @param {string} videoPath - 视频文件的本地路径
   * @param {string} trackId - 要插入视频片段的目标轨道ID。
   * @param {{start: number, duration: number}} target_timerange - 片段在时间轴上的目标时间范围，包含起始时间和持续时间（单位：微秒）。
   */
  async insertVideoClip(videoPath, trackId, target_timerange) {
    console.log(styleText("green", `--- 开始执行高级业务：插入视频片段 ---\n`));
    if (!trackId) {
      throw new Error("未指定轨道ID");
    }
    if (!target_timerange) {
      console.log("target_timerange", target_timerange);
      throw new Error("未指定素材片段在时间轴上的位置和时长");
    }
    console.log(`获取视频元信息, 文件路径: ${videoPath}`);
    const mediaMetadata = await getMediaMetadata(videoPath);
    // 类型守卫：在处理前，先检查并确保媒体类型是 'video'
    if (mediaMetadata.type !== "video") {
      throw new Error(
        `提供的文件不是视频文件。期望 'video'，但得到 '${mediaMetadata.type}'。路径: ${videoPath}`
      );
    }
    /**
     * Logs media metadata for a video.
     * The cast is used here to specify the expected type for logging.
     * @param {MediaMetadataResult} mediaMetadata - The media metadata object.
     */
    this.logMediaMetadata(
      /** @type {{type: 'video', metadata: VideoMetadata}} */ (mediaMetadata)
    );
    const videoMetadata = /** @type {VideoMetadata} */ (mediaMetadata.metadata);
    // 视频时长duration秒 6.455011
    // 视频时长durationInMicroseconds微秒 6455011
    // 2. 在素材库中创建视频素材记录
    console.log("正在创建视频素材记录...");
    const newVideoMaterial = this.videoManager.create({
      aigc_type: "none",
      audio_fade: null,
      cartoon_path: "",
      category_id: "",
      category_name: "local",
      check_flag: 63487,
      crop: {
        lower_left_x: 0,
        lower_left_y: 1,
        lower_right_x: 1,
        lower_right_y: 1,
        upper_left_x: 0,
        upper_left_y: 0,
        upper_right_x: 1,
        upper_right_y: 0,
      },
      crop_ratio: "free",
      crop_scale: 1,
      duration: calculateJianyingTimelineMetrics(videoMetadata.duration)
        .timelineDurationInMicroseconds,
      extra_type_option: 0,
      formula_id: "",
      freeze: null,
      has_audio: false,
      height: videoMetadata.height,
      id: generateId(),
      intensifies_audio_path: "",
      intensifies_path: "",
      is_ai_generate_content: false,
      is_copyright: false,
      is_text_edit_overdub: false,
      is_unified_beauty_mode: false,
      local_id: "",
      local_material_id: generateId(),
      material_id: "",
      material_name: path.basename(videoPath),
      material_url: "",
      matting: {
        flag: 0,
        has_use_quick_brush: false,
        has_use_quick_eraser: false,
        interactiveTime: [],
        path: "",
        strokes: [],
      },
      media_path: "",
      object_locked: null,
      origin_material_id: "",
      path: videoPath.replace(/\\/g, "/"),
      picture_from: "none",
      picture_set_category_id: "",
      picture_set_category_name: "",
      request_id: "",
      reverse_intensifies_path: "",
      reverse_path: "",
      smart_motion: null,
      source: 0,
      source_platform: 0,
      stable: {
        matrix_path: "",
        stable_level: 0,
        time_range: {
          duration: 0,
          start: 0,
        },
      },
      team_id: "",
      type: "video",
      video_algorithm: {
        algorithms: [],
        complement_frame_config: null,
        deflicker: null,
        gameplay_configs: [],
        motion_blur_config: null,
        noise_reduction: null,
        path: "",
        quality_enhance: null,
        time_range: null,
      },
      width: videoMetadata.width,
    });

    const speed = this.speedManager.create({
      curve_speed: null,
      id: generateId(),
      mode: 0,
      speed: 1,
      type: "speed",
    });
    const canvas = this.canvasManager.create({
      album_image: "",
      blur: 0,
      color: "",
      id: generateId(),
      image: "",
      image_id: "",
      image_name: "",
      source_platform: 0,
      team_id: "",
      type: "canvas_color",
    });
    const sound_channel_mapping = this.soundChannelMappingManager.create({
      audio_channel_mapping: 0,
      id: generateId(),
      is_config_open: false,
      type: "",
    });

    const vocalSeparation = this.vocalSeparationManager.create({
      choice: 0,
      id: generateId(),
      production_path: "",
      time_range: null,
      type: "vocal_separation",
    });

    const extra_material_refs = [
      speed.id,
      canvas.id,
      sound_channel_mapping.id,
      vocalSeparation.id,
    ];
    // materials.speeds
    // materials.canvases
    // materials.sound_channel_mappings
    // materials.vocal_separations
    // tracks[0].segments[0].extra_material_refs

    // 3. 在轨道上添加引用该素材的片段
    console.log(`正在向轨道 ${trackId} 添加片段...`);
    const segment = {
      caption_info: null,
      cartoon: false,
      clip: {
        alpha: 1,
        flip: {
          horizontal: false,
          vertical: false,
        },
        rotation: 0,
        scale: {
          x: 1,
          y: 1,
        },
        transform: {
          x: 0,
          y: 0,
        },
      },
      common_keyframes: [],
      enable_adjust: true,
      enable_color_correct_adjust: false,
      enable_color_curves: true,
      enable_color_match_adjust: false,
      enable_color_wheels: true,
      enable_lut: true,
      enable_smart_color_adjust: false,
      extra_material_refs: extra_material_refs,
      group_id: "",
      hdr_settings: {
        intensity: 1,
        mode: 1,
        nits: 1000,
      },
      id: generateId(),
      intensifies_audio: false,
      is_placeholder: false,
      is_tone_modify: false,
      keyframe_refs: [],
      last_nonzero_volume: 1,
      material_id: newVideoMaterial.id,
      render_index: 0,
      responsive_layout: {
        enable: false,
        horizontal_pos_layout: 0,
        size_layout: 0,
        target_follow: "",
        vertical_pos_layout: 0,
      },
      reverse: false,
      source_timerange: {
        start: 0,
        duration: calculateJianyingTimelineMetrics(videoMetadata.duration)
          .timelineDurationInMicroseconds,
      },
      speed: 1,
      target_timerange: target_timerange,
      template_id: "",
      template_scene: "default",
      track_attribute: 0,
      track_render_index: 0,
      uniform_scale: {
        on: true,
        value: 1,
      },
      visible: true,
      volume: 1,
    };

    const trackRemainingFrames = getRemainingFramesFromMicroseconds(
      segment.target_timerange.start
    );
    console.log("trackRemainingFrames", trackRemainingFrames);
    const currentMaterialRemainingFrames = getRemainingFramesFromMicroseconds(
      segment.source_timerange.duration
    );
    console.log(
      "currentMaterialRemainingFrames",
      currentMaterialRemainingFrames
    );

    if (trackRemainingFrames + currentMaterialRemainingFrames >= 3) {
      segment.target_timerange.duration += 1;
    }
    const newSegment = this.trackManager.addSegment(trackId, segment);

    if (newSegment) {
      console.log(styleText("green", "--- 视频片段已成功插入！---\n"));
      return newSegment;
    } else {
      console.error(styleText("red", "--- 错误：插入视频片段失败！---\n"));
      return null;
    }
  }
  /**
   * (高级业务方法) 向时间轴插入一个音频片段
   * @param {string} audioPath - 音频文件的本地路径
   * @param {string} trackId - 要插入音频片段的目标轨道ID。
   * @param {{start: number, duration: number}} target_timerange - 片段在时间轴上的目标时间范围，包含起始时间和持续时间（单位：微秒）。
   */
  async insertAudioClip(audioPath, trackId, target_timerange) {
    console.log(styleText("green", `--- 开始执行高级业务：插入音频片段 ---\n`));
    if (!trackId) {
      throw new Error("未指定轨道ID");
    }
    if (!target_timerange) {
      console.log("target_timerange", target_timerange);
      throw new Error("未指定素材片段在时间轴上的位置和时长");
    }
    console.log(`获取音频元信息, 文件路径: ${audioPath}`);
    const mediaMetadata = await getMediaMetadata(audioPath);
    // 1. 类型守卫：在处理前，先检查并确保媒体类型是 'audio'
    if (mediaMetadata.type !== "audio") {
      throw new Error(
        `提供的文件不是音频文件。期望 'audio'，但得到 '${mediaMetadata.type}'。路径: ${audioPath}`
      );
    }

    /**
     * Logs media metadata for a video.
     * The cast is used here to specify the expected type for logging.
     * @param {import("./types").MediaMetadataResult} mediaMetadata - The media metadata object.
     */
    this.logMediaMetadata(
      /** @type {{type: 'audio', metadata: AudioMetadata}} */ (mediaMetadata)
    );
    const audioMetadata = /** @type {AudioMetadata} */ (mediaMetadata.metadata);
    // 返回一个包含关键音频信息的对象
    // return {
    //   duration: Number(duration), // 确保是数字
    //   sampleRate: parseInt(audioStream.sample_rate, 10), // 采样率 (e.g., 44100, 48000)
    //   channels: audioStream.channels, // 声道数 (e.g., 1 for mono, 2 for stereo)
    //   codecName: audioStream.codec_name, // 编码格式 (e.g., 'mp3', 'aac')
    //   // 比特率可能在 format 或 stream 中，从 stream 获取更精确，并转为数字
    //   bitRate: parseInt(audioStream.bit_rate || metadata.format.bit_rate, 10),
    // };

    // 2. 在素材库中创建音频素材记录
    console.log("正在创建音频素材记录...");
    const newAudioMaterial = this.audioManager.create({
      app_id: 0,
      category_id: "",
      category_name: "local",
      check_flag: 1,
      copyright_limit_type: "none",
      duration: calculateJianyingTimelineMetrics(audioMetadata.duration)
        .timelineDurationInMicroseconds,
      effect_id: "",
      formula_id: "",
      id: generateId(),
      intensifies_path: "",
      is_ai_clone_tone: false,
      is_text_edit_overdub: false,
      is_ugc: false,
      local_material_id: generateId(),
      music_id: generateId(),
      name: path.basename(audioPath),
      path: audioPath.replace(/\\/g, "/"),
      query: "",
      request_id: "",
      resource_id: "",
      search_id: "",
      source_from: "",
      source_platform: 0,
      team_id: "",
      text_id: "",
      tone_category_id: "",
      tone_category_name: "",
      tone_effect_id: "",
      tone_effect_name: "",
      tone_platform: "",
      tone_second_category_id: "",
      tone_second_category_name: "",
      tone_speaker: "",
      tone_type: "",
      type: "extract_music",
      video_id: "",
      wave_points: [],
    });
    if (!newAudioMaterial) {
      console.error("错误：创建音频素材失败！");
      return null;
    }

    const beat = this.beatManager.create({
      ai_beats: {
        beat_speed_infos: [],
        beats_path: "",
        beats_url: "",
        melody_path: "",
        melody_percents: [0],
        melody_url: "",
      },
      enable_ai_beats: false,
      gear: 404,
      gear_count: 0,
      id: generateId(),
      mode: 404,
      type: "beats",
      user_beats: [],
      user_delete_ai_beats: null,
    });
    if (!beat) {
      console.error("错误：创建Beat素材失败！");
      return null;
    }

    // 效果id列表
    // tracks[0].segments[0].extra_material_refs

    const speed = this.speedManager.create({
      curve_speed: null,
      id: generateId(),
      mode: 0,
      speed: 1,
      type: "speed",
    });
    const sound_channel_mapping = this.soundChannelMappingManager.create({
      audio_channel_mapping: 0,
      id: generateId(),
      is_config_open: false,
      type: "",
    });

    const vocalSeparation = this.vocalSeparationManager.create({
      choice: 0,
      id: generateId(),
      production_path: "",
      time_range: null,
      type: "vocal_separation",
    });

    const extra_material_refs = [
      speed.id,
      beat.id,
      sound_channel_mapping.id,
      vocalSeparation.id,
    ];
    // materials.speeds
    // materials.canvases
    // materials.sound_channel_mappings
    // materials.vocal_separations
    // tracks[0].segments[0].extra_material_refs

    // 3. 在轨道上添加引用该素材的片段
    console.log(`正在向轨道 ${trackId} 添加片段...`);
    const segment = {
      caption_info: null,
      cartoon: false,
      clip: null,
      common_keyframes: [],
      enable_adjust: false,
      enable_color_correct_adjust: false,
      enable_color_curves: true,
      enable_color_match_adjust: false,
      enable_color_wheels: true,
      enable_lut: false,
      enable_smart_color_adjust: false,
      extra_material_refs: extra_material_refs,
      group_id: "",
      hdr_settings: null,
      id: generateId(),
      intensifies_audio: false,
      is_placeholder: false,
      is_tone_modify: false,
      keyframe_refs: [],
      last_nonzero_volume: 1,
      material_id: newAudioMaterial.id,
      render_index: 0,
      responsive_layout: {
        enable: false,
        horizontal_pos_layout: 0,
        size_layout: 0,
        target_follow: "",
        vertical_pos_layout: 0,
      },
      reverse: false,
      source_timerange: {
        start: 0,
        duration: calculateJianyingTimelineMetrics(audioMetadata.duration)
          .timelineDurationInMicroseconds,
      },
      speed: 1,
      target_timerange,
      template_id: "",
      template_scene: "default",
      track_attribute: 0,
      track_render_index: 0,
      uniform_scale: null,
      visible: true,
      volume: 1,
    };

    const trackRemainingFrames = getRemainingFramesFromMicroseconds(
      segment.target_timerange.start
    );
    console.log("trackRemainingFrames", trackRemainingFrames);
    const currentMaterialRemainingFrames = getRemainingFramesFromMicroseconds(
      segment.source_timerange.duration
    );
    console.log(
      "currentMaterialRemainingFrames",
      currentMaterialRemainingFrames
    );

    if (trackRemainingFrames + currentMaterialRemainingFrames >= 3) {
      segment.target_timerange.duration += 1;
    }

    const newSegment = this.trackManager.addSegment(trackId, segment);

    if (newSegment) {
      console.log(styleText("green", "--- 音频片段已成功插入！---\n"));
      return newSegment;
    } else {
      console.error(styleText("red", "错误：插入音频片段失败！\n"));
      return null;
    }
  }
  /**
   * (高级业务方法) 向时间轴插入一个图片片段
   * @param {object} params - 参数对象
   * @param {string} params.mediaPath - 图片文件的本地路径
   * @param {string} params.trackId - 要插入图片片段的目标轨道ID。
   * @param {Track} params.referenceTrack - 用于确定图片片段位置和时长的参考轨道对象（通常是人声轨道）。
   * @param {number} params.index - 参考轨道中用于确定图片片段位置的片段索引。
   */
  async insertImageClip({ mediaPath, trackId, referenceTrack, index }) {
    console.log(styleText("green", `--- 开始执行高级业务：插入图片片段 ---\n`));
    if (!trackId) {
      throw new Error("未指定轨道ID");
    }

    console.log(`获取图片元信息, 文件路径: ${mediaPath}`);
    const mediaMetadata = await getMediaMetadata(mediaPath);

    /**
     * Logs media metadata for a video.
     * The cast is used here to specify the expected type for logging.
     * @param {import("./types").MediaMetadataResult} mediaMetadata - The media metadata object.
     */
    this.logMediaMetadata(
      /** @type {{type: 'image', metadata: ImageMetadata}} */ (mediaMetadata)
    );
    const metadata = /** @type {ImageMetadata} */ (mediaMetadata.metadata);

    // // 返回一个包含关键图片信息的对象
    // 从图像流中提取宽度和高度
    // return {
    //   width: imageStream.width,
    //   height: imageStream.height,
    //   codecName: imageStream.codec_name, // e.g., 'png', 'mjpeg' (for jpg), 'webp'
    // };

    // 2. 在素材库中创建图片素材记录
    console.log("正在创建图片素材记录...");
    const newImageMaterial = this.imageManager.create({
      aigc_type: "none",
      audio_fade: null,
      cartoon_path: "",
      category_id: "",
      category_name: "local",
      check_flag: 63487,
      crop: {
        lower_left_x: 0,
        lower_left_y: 1,
        lower_right_x: 1,
        lower_right_y: 1,
        upper_left_x: 0,
        upper_left_y: 0,
        upper_right_x: 1,
        upper_right_y: 0,
      },
      crop_ratio: "free",
      crop_scale: 1,
      duration: 10800000000,
      extra_type_option: 0,
      formula_id: "",
      freeze: null,
      has_audio: false,
      height: metadata.height,
      id: generateId(),
      intensifies_audio_path: "",
      intensifies_path: "",
      is_ai_generate_content: false,
      is_copyright: false,
      is_text_edit_overdub: false,
      is_unified_beauty_mode: false,
      local_id: "",
      local_material_id: "",
      material_id: "",
      material_name: path.basename(mediaPath),
      material_url: "",
      matting: {
        flag: 0,
        has_use_quick_brush: false,
        has_use_quick_eraser: false,
        interactiveTime: [],
        path: "",
        strokes: [],
      },
      media_path: "",
      object_locked: null,
      origin_material_id: "",
      path: mediaPath,
      picture_from: "none",
      picture_set_category_id: "",
      picture_set_category_name: "",
      request_id: "",
      reverse_intensifies_path: "",
      reverse_path: "",
      smart_motion: null,
      source: 0,
      source_platform: 0,
      stable: {
        matrix_path: "",
        stable_level: 0,
        time_range: {
          duration: 0,
          start: 0,
        },
      },
      team_id: "",
      type: "photo",
      video_algorithm: {
        algorithms: [],
        complement_frame_config: null,
        deflicker: null,
        gameplay_configs: [],
        motion_blur_config: null,
        noise_reduction: null,
        path: "",
        quality_enhance: null,
        time_range: null,
      },
      width: metadata.width,
    });
    if (!newImageMaterial) {
      console.error("错误：创建图片素材失败！");
      return null;
    }

    const canvas = this.canvasManager.create({
      album_image: "",
      blur: 0,
      color: "",
      id: generateId(),
      image: "",
      image_id: "",
      image_name: "",
      source_platform: 0,
      team_id: "",
      type: "canvas_color",
    });

    // 效果id列表
    // tracks[0].segments[0].extra_material_refs

    const speed = this.speedManager.create({
      curve_speed: null,
      id: generateId(),
      mode: 0,
      speed: 1,
      type: "speed",
    });
    const sound_channel_mapping = this.soundChannelMappingManager.create({
      audio_channel_mapping: 0,
      id: generateId(),
      is_config_open: false,
      type: "",
    });

    const vocalSeparation = this.vocalSeparationManager.create({
      choice: 0,
      id: generateId(),
      production_path: "",
      time_range: null,
      type: "vocal_separation",
    });

    const extra_material_refs = [
      canvas.id,
      sound_channel_mapping.id,
      speed.id,
      vocalSeparation.id,
    ];
    // materials.speeds
    // materials.canvases
    // materials.sound_channel_mappings
    // materials.vocal_separations
    // tracks[0].segments[0].extra_material_refs

    // 3. 在轨道上添加引用该素材的片段
    console.log(`正在向轨道 ${trackId} 添加片段...`);

    // source_timerange: { start: 0, duration: 10000000 },
    // speed: 1,
    // target_timerange: { start: 0, duration: 10000000 },
    const referenceSegments = referenceTrack.segments;
    const referenceSegment = referenceSegments[index];
    console.log("referenceSegment", referenceSegment);
    if (!referenceSegment) {
      throw new Error("参考轨道没有片段, 请先添加人声片段");
    }
    const target_timerange = referenceSegment.target_timerange;
    const source_timerange = { start: 0, duration: target_timerange.duration };

    const newSegment = this.trackManager.addSegment(trackId, {
      // @ts-ignore
      caption_info: null,
      cartoon: false,
      clip: {
        alpha: 1,
        flip: {
          horizontal: false,
          vertical: false,
        },
        rotation: 0,
        scale: {
          x: 1,
          y: 1,
        },
        transform: {
          x: 0,
          y: 0,
        },
      },
      common_keyframes: [],
      enable_adjust: true,
      enable_color_correct_adjust: false,
      enable_color_curves: true,
      enable_color_match_adjust: false,
      enable_color_wheels: true,
      enable_lut: true,
      enable_smart_color_adjust: false,
      extra_material_refs: extra_material_refs,
      group_id: "",
      hdr_settings: {
        intensity: 1,
        mode: 1,
        nits: 1000,
      },
      id: generateId(),
      intensifies_audio: false,
      is_placeholder: false,
      is_tone_modify: false,
      keyframe_refs: [],
      last_nonzero_volume: 1,
      material_id: newImageMaterial.id,
      render_index: 0,
      responsive_layout: {
        enable: false,
        horizontal_pos_layout: 0,
        size_layout: 0,
        target_follow: "",
        vertical_pos_layout: 0,
      },
      reverse: false,
      source_timerange,
      speed: 1,
      target_timerange,
      template_id: "",
      template_scene: "default",
      track_attribute: 0,
      track_render_index: 0,
      uniform_scale: {
        on: true,
        value: 1,
      },
      visible: true,
      volume: 1,
    });

    if (newSegment) {
      console.log(styleText("green", "--- 图片片段已成功插入！---\n"));
      return newSegment;
    } else {
      console.error(styleText("red", "--- 错误：插入图片片段失败！\n"));
      return null;
    }
  }

  /**
   * (高级业务方法) 向时间轴插入多个字幕片段。
   *
   * @param {Array<{index: number, startTime: number, endTime: number, text: string}>} subtitles - 字幕数组. 包含字幕文本和时间信息。
   * @param {string} trackId - 要插入字幕的目标轨道ID。
   * @param {Track} vocalTrack - 用于确定字幕位置和时长的参考轨道对象（通常是人声轨道）。
   * @param {number} index - 参考轨道中用于确定字幕片段位置的片段索引。
   * @param {"text" | "subtitle"} textType - 字幕的类型
   */

  async insertSubtitleClips(subtitles, trackId, vocalTrack, index, textType) {
    console.log(styleText("green", `--- 开始执行高级业务：插入字幕片段 ---\n`));
    if (!trackId) {
      throw new Error("请指定轨道ID！");
    }

    // 2. 在素材库中创建字幕素材记录
    console.log("正在创建字幕素材记录...");
    // [
    //   {
    //     index: 1,
    //     startTime: 360000,    // 00:00:00,360 转换为 360000 微秒
    //     endTime: 2980000,     // 00:00:02,980 转换为 2980000 微秒
    //     text: '它的面积堪比一座城市'
    //   },
    //   {
    //     index: 2,
    //     startTime: 3120000,   // 00:00:03,120 转换为 3120000 微秒
    //     endTime: 6220000,     // 00:00:06,220 转换为 6220000 微秒
    //     text: '并且它似乎在对我们发出回应'
    //   }
    // ]
    // 以视频为参考系, 更新时间
    // 先获取视频的时间数据
    const vocalSegments = vocalTrack.segments;
    const vocalSegment = vocalSegments[index];
    console.log("videoSegment", vocalSegment);
    if (!vocalSegment) {
      throw new Error("人声轨道没有片段, 请先添加人声片段");
    }
    const target_timerange = vocalSegment.target_timerange;
    const startTime = target_timerange.start;
    for (let i = 0; i < subtitles.length; i++) {
      const subtitle = subtitles[i];
      await this.insertSubtitleClip(subtitle, trackId, startTime, textType);
    }
  }
  /**
   * (高级业务方法) 向时间轴插入多个字幕片段。
   *
   * @param {{index: number, startTime: number, endTime: number, text: string}} subtitle - 字幕. 包含字幕文本和时间信息。
   * @param {string} trackId - 要插入字幕的目标轨道ID。
   * @param {number} startTime
   * @param {"text" | "subtitle"} textType - 字幕的类型
   */
  async insertSubtitleClip(subtitle, trackId, startTime, textType) {
    console.log(styleText("green", `--- 开始执行高级业务：插入字幕片段 ---\n`));
    if (!trackId) {
      throw new Error("请指定轨道ID！");
    }

    // 2. 在素材库中创建字幕素材记录
    console.log("正在创建字幕素材记录...");
    // [
    //   {
    //     index: 1,
    //     startTime: 360000,    // 00:00:00,360 转换为 360000 微秒
    //     endTime: 2980000,     // 00:00:02,980 转换为 2980000 微秒
    //     text: '它的面积堪比一座城市'
    //   },
    //   {
    //     index: 2,
    //     startTime: 3120000,   // 00:00:03,120 转换为 3120000 微秒
    //     endTime: 6220000,     // 00:00:06,220 转换为 6220000 微秒
    //     text: '并且它似乎在对我们发出回应'
    //   }
    // ]
    const font_path =
      "C:/Users/Administrator/AppData/Local/Microsoft/Windows/Fonts/LXGWWenKaiMonoGB-Medium.ttf";

    const originalContent = {
      text: subtitle.text,
      styles: [
        {
          fill: {
            content: {
              solid: {
                color: [1, 0.87058824300766, 0],
              },
            },
          },
          font: {
            path: font_path,
            id: "",
          },
          strokes: [
            {
              content: {
                solid: {
                  color: [0, 0, 0],
                },
              },
              width: 0.07999999821186066,
            },
          ],
          size: 5,
          useLetterColor: true,
          range: [0, subtitle.text.length],
        },
      ],
    };

    const newSubtitleMaterial = this.subtitleManager.create({
      add_type: 1,
      alignment: 1,
      background_alpha: 1,
      background_color: "#000000",
      background_height: 0.14,
      background_horizontal_offset: 0,
      background_round_radius: 0,
      background_style: 0,
      background_vertical_offset: 0,
      background_width: 0.14,
      base_content: "",
      bold_width: 0,
      border_alpha: 1,
      border_color: "#000000",
      border_width: 0.08,
      caption_template_info: {
        category_id: "",
        category_name: "",
        effect_id: "",
        is_new: false,
        path: "",
        request_id: "",
        resource_id: "",
        resource_name: "",
        source_platform: 0,
      },
      check_flag: 7,
      combo_info: {
        text_templates: [],
      },
      content: JSON.stringify(originalContent),
      fixed_height: -1,
      fixed_width: -1,
      font_category_id: "",
      font_category_name: "",
      font_id: "",
      font_name: "",
      font_path: font_path,
      font_resource_id: "",
      font_size: 5,
      font_source_platform: 0,
      font_team_id: "",
      font_title: "霞鹜文楷等宽 GB Medium",
      font_url: "",
      fonts: [],
      force_apply_line_max_width: false,
      global_alpha: 1,
      group_id: "",
      has_shadow: false,
      id: generateId(),
      initial_scale: 1,
      inner_padding: -1,
      is_rich_text: false,
      italic_degree: 0,
      ktv_color: "",
      language: "",
      layer_weight: 1,
      letter_spacing: 0,
      line_feed: 1,
      line_max_width: 0.82,
      line_spacing: 0.02,
      multi_language_current: "none",
      name: "",
      original_size: [],
      preset_category: "",
      preset_category_id: "",
      preset_has_set_alignment: false,
      preset_id: "",
      preset_index: 0,
      preset_name: "",
      recognize_task_id: "",
      recognize_type: 0,
      relevance_segment: [],
      shadow_alpha: 0.9,
      shadow_angle: -45,
      shadow_color: "",
      shadow_distance: 5,
      shadow_point: {
        x: 0.6363961030678928,
        y: -0.6363961030678928,
      },
      shadow_smoothing: 0.45,
      shape_clip_x: false,
      shape_clip_y: false,
      source_from: "",
      style_name: "",
      sub_type: 0,
      subtitle_keywords: null,
      subtitle_template_original_fontsize: 0,
      text_alpha: 1,
      text_color: "#ffde00",
      text_curve: null,
      text_preset_resource_id: "",
      text_size: 30,
      text_to_audio_ids: [],
      tts_auto_update: false,
      type: textType,
      typesetting: 0,
      underline: false,
      underline_offset: 0.22,
      underline_width: 0.05,
      use_effect_default_color: true,
      words: {
        end_time: [],
        start_time: [],
        text: [],
      },
    });
    if (!newSubtitleMaterial) {
      console.error("错误：创建字幕素材失败！");
      return null;
    }
    // MaterialAnimationManager

    const materialAnimation = this.materialAnimationManager.create({
      animations: [],
      id: generateId(),
      multi_language_current: "none",
      type: "sticker_animation",
    });

    const extra_material_refs = [materialAnimation.id];
    // materials.speeds
    // materials.canvases
    // materials.sound_channel_mappings
    // materials.vocal_separations
    // tracks[0].segments[0].extra_material_refs

    // 3. 在轨道上添加引用该素材的片段
    console.log(`正在向轨道 ${trackId} 添加片段...`);
    const newSegment = this.trackManager.addSegment(trackId, {
      // @ts-ignore
      caption_info: null,
      cartoon: false,
      clip: {
        alpha: 1,
        flip: {
          horizontal: false,
          vertical: false,
        },
        rotation: 0,
        scale: {
          x: 1,
          y: 1,
        },
        transform: {
          x: 0,
          y: -0.73,
        },
      },
      common_keyframes: [],
      enable_adjust: false,
      enable_color_correct_adjust: false,
      enable_color_curves: true,
      enable_color_match_adjust: false,
      enable_color_wheels: true,
      enable_lut: false,
      enable_smart_color_adjust: false,
      extra_material_refs: extra_material_refs,
      group_id: "",
      hdr_settings: null,
      id: generateId(),
      intensifies_audio: false,
      is_placeholder: false,
      is_tone_modify: false,
      keyframe_refs: [],
      last_nonzero_volume: 1,
      material_id: newSubtitleMaterial.id,
      render_index: 14000,
      responsive_layout: {
        enable: false,
        horizontal_pos_layout: 0,
        size_layout: 0,
        target_follow: "",
        vertical_pos_layout: 0,
      },
      reverse: false,
      source_timerange: null,
      speed: 1,
      target_timerange: {
        duration: subtitle.endTime - subtitle.startTime,
        start: subtitle.startTime + startTime,
      },
      template_id: "",
      template_scene: "default",
      track_attribute: 0,
      track_render_index: 1,
      uniform_scale: {
        on: true,
        value: 1,
      },
      visible: true,
      volume: 1,
    });

    if (newSegment) {
      console.log(styleText("green", "--- 字幕片段已成功插入！---\n"));
      return newSegment;
    } else {
      console.error(styleText("red", "--- 错误：插入字幕片段失败！---\n"));
      return null;
    }
  }
}
