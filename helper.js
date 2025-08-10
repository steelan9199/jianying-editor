import ffmpeg from "fluent-ffmpeg";
import { path as ffmpegPath } from "@ffmpeg-installer/ffmpeg";
import { path as ffprobePath } from "@ffprobe-installer/ffprobe";
import path from "path";
import fs from "fs";
import crypto from "crypto";

/**
 * @file 剪映编辑器工具函数集合
 * @description 提供各种实用工具函数，包括媒体处理、时间计算等
 */

// 设置 fluent-ffmpeg 的路径，指向我们通过 npm 安装的可执行文件
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

// 定义各类文件的扩展名集合，便于管理和扩展
const VIDEO_EXTENSIONS = new Set([
  ".mp4",
  ".mov",
  ".avi",
  ".mkv",
  ".webm",
  ".flv",
]);
const AUDIO_EXTENSIONS = new Set([
  ".mp3",
  ".wav",
  ".aac",
  ".flac",
  ".ogg",
  ".m4a",
]);
const IMAGE_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".bmp",
  ".tiff",
]);

/**
 * 将SRT时间格式转换为微秒
 * @param {string} srtTime - SRT时间字符串，格式为 HH:MM:SS,mmm
 * @returns {number} 时间对应的微秒数
 */
export function srtTimeToMicroseconds(srtTime) {
  const timeMatch = srtTime.match(/(\d{2}):(\d{2}):(\d{2}),(\d{3})/);

  if (!timeMatch) {
    throw new Error(`Invalid SRT time format: ${srtTime}`);
  }

  const hours = parseInt(timeMatch[1]);
  const minutes = parseInt(timeMatch[2]);
  const seconds = parseInt(timeMatch[3]);
  const milliseconds = parseInt(timeMatch[4]);

  // 转换为微秒 (1秒 = 1,000,000微秒)
  return (
    (hours * 3600 + minutes * 60 + seconds) * 1000000 + milliseconds * 1000
  );
}

/**
 * 解析SRT文件并转换为微秒时间格式
 * @param {string} srtFilePath - SRT文件路径
 * @returns {Array<object>} 字幕对象数组，包含索引、开始时间、结束时间和文本
 */
export function parseSrtFileToMicroseconds(srtFilePath) {
  const data = fs.readFileSync(srtFilePath, "utf-8");
  const blocks = data.split(/\n\s*\n/); // 用空行分割字幕块

  const subtitles = blocks
    .map((block) => {
      const lines = block.trim().split("\n");
      if (lines.length < 3) return null; // 至少需要索引、时间轴和文本

      const index = parseInt(lines[0]);
      if (isNaN(index)) return null;

      // 解析时间轴行，例如: "00:00:01,234 --> 00:00:05,678"
      const timeMatch = lines[1].match(
        /(\d{2}:\d{2}:\d{2},\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2},\d{3})/
      );
      if (!timeMatch) return null;

      const startTime = srtTimeToMicroseconds(timeMatch[1]);
      const endTime = srtTimeToMicroseconds(timeMatch[2]);

      // 剩余行是字幕文本
      const text = lines.slice(2).join("\n");

      return {
        index,
        startTime,
        endTime,
        text,
      };
    })
    .filter((item) => item !== null && !isNaN(item.index)); // 过滤掉无效的块

  return subtitles;
}

/**
 * 使用 ffprobe 获取媒体文件的元数据。
 *
 * @param {string} filePath - 媒体文件的路径。
 * @returns {Promise<(
 *   {type: 'video', metadata: {hasAudio: boolean, duration: number, width: number, height: number, codecName: string, formatName: string, bitRate: number, frameRate: number, sampleRate: number, channels: number, channelLayout: string}} |
 *   {type: 'audio', metadata: {duration: number, sampleRate: number, channels: number, bitRate: number, codecName: string, formatName: string}} |
 *   {type: 'image', metadata: {width: number, height: number, codecName: string, formatName: string}} |
 *   {type: 'unsupported', metadata: {error: string}}
 * )>} 返回一个包含媒体类型和元数据的对象。
 */
export async function getMediaMetadata(filePath) {
  try {
    // 1. 获取文件扩展名并转为小写，以便匹配
    const ext = path.extname(filePath).toLowerCase();

    // 2. 根据扩展名，分发到对应的处理函数
    if (VIDEO_EXTENSIONS.has(ext)) {
      const metadata = await getVideoMetadata(filePath);
      return { type: "video", metadata };
    } else if (AUDIO_EXTENSIONS.has(ext)) {
      const metadata = await getAudioMetadata(filePath);
      return { type: "audio", metadata };
    } else if (IMAGE_EXTENSIONS.has(ext)) {
      const metadata = await getImageMetadata(filePath);
      return { type: "image", metadata };
    } else {
      // 3. 如果扩展名不认识，则标记为不支持
      throw new Error(`Unsupported file type: ${ext}`);
    }
  } catch (err) {
    console.error(`Error processing file ${filePath}:`, err);
    // 重新抛出错误，让调用者可以捕获
    throw err;
  }
}

/**
 * Generates a new uppercase UUID for materials and segments.
 * 为素材和片段生成一个新的大写 UUID。
 * @returns {string}
 */
export function generateId() {
  return crypto.randomUUID().toUpperCase();
}

/**
 * Converts milliseconds to microseconds, which is the unit used by Jianying.
 * 将毫秒转换为微秒，这是剪映使用的单位。
 * @param {number} ms - 持续时间（毫秒）。
 * @returns {number} 持续时间（微秒）。
 */
export function msToMicroseconds(ms) {
  return ms * 1000;
}

/**
 * 对对象按键进行排序
 * @param {object} obj - 需要排序的对象
 * @returns {object} 排序后的对象
 */
export function sortObjectByKeys(obj) {
  // 递归排序所有层级
  function replacer(key, value) {
    if (Array.isArray(value)) {
      return value.map(sortObjectByKeys);
    }
    if (value && typeof value === "object" && !Array.isArray(value)) {
      return Object.keys(value)
        .sort()
        .reduce((acc, k) => {
          acc[k] = sortObjectByKeys(value[k]);
          return acc;
        }, {});
    }
    return value;
  }
  return JSON.parse(JSON.stringify(obj, replacer));
}

/**
 * 获取视频元数据
 * @param {string} filePath - 视频文件绝对路径
 * @returns {Promise<{hasAudio: boolean, duration: number, width: number, height: number, codecName: string, formatName: string, bitRate: number, frameRate: number, sampleRate: number, channels: number, channelLayout: string}>} 视频元数据
 */
export async function getVideoMetadata(filePath) {
  try {
    const metadata = await new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, data) => {
        if (err) return reject(err);
        resolve(data);
      });
    });

    const videoStream = metadata.streams.find(
      (/** @type {{ codec_type: string }} */ s) => s.codec_type === "video"
    );
    if (!videoStream) {
      throw new Error("文件中未找到视频流");
    }

    const audioStream = metadata.streams.find(
      (/** @type {{ codec_type: string }} */ s) => s.codec_type === "audio"
    );

    // 从 "30/1" 这样的字符串计算帧率
    const [num, den] = videoStream.r_frame_rate.split("/").map(Number);
    const frameRate = den > 0 ? num / den : 0;

    return {
      hasAudio: !!audioStream,
      duration: Number(metadata.format.duration),
      width: videoStream.width,
      height: videoStream.height,
      codecName: videoStream.codec_name,
      formatName: metadata.format.format_name,
      bitRate: Number(metadata.format.bit_rate),
      frameRate: frameRate,
      sampleRate: audioStream ? Number(audioStream.sample_rate) : 0,
      channels: audioStream ? audioStream.channels : 0,
      channelLayout: audioStream ? audioStream.channel_layout : "unknown",
    };
  } catch (err) {
    console.error("获取视频元数据时出错:", err);
    throw err;
  }
}

/**
 * 获取图片元数据。
 * ffprobe 将某些图片（如 jpg）的流类型识别为 'video'，因此需要同时检查 'image' 和 'video'。
 *
 * @param {string} filePath - 图片文件的绝对路径。
 * @returns {Promise<{width: number, height: number, codecName: string}>} 一个包含图片宽度、高度和编解码器名称的对象。
 */
async function getImageMetadata(filePath) {
  try {
    const metadata = await new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, data) => {
        if (err) return reject(err);
        resolve(data);
      });
    });

    // 提取关键信息
    // 使用 JSDoc 为 stream 参数提供明确类型，避免 noImplicitAny 错误
    const imageStream = metadata.streams.find(
      (/** @type {{ codec_type: string; }} */ stream) =>
        stream.codec_type === "video" || stream.codec_type === "image"
    );

    if (!imageStream) {
      throw new Error("在文件中未找到图像流");
    }

    return {
      width: imageStream.width,
      height: imageStream.height,
      codecName: imageStream.codec_name, // 例如: 'png', 'mjpeg' (用于jpg), 'webp'
    };
  } catch (err) {
    console.error("获取图片元数据时出错:", err);
    throw err;
  }
}

/**
 * 获取音频元数据
 * @param {string} filePath - 音频文件的绝对路径
 * @returns {Promise<{duration: number, sampleRate: number, channels: number, codecName: string, bitRate: number}>} 一个包含音频时长、采样率、声道数、编解码器和比特率的对象。
 */
async function getAudioMetadata(filePath) {
  try {
    const metadata = await new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, data) => {
        if (err) return reject(err);
        resolve(data);
      });
    });

    // Bug修复：必须先从元数据中查找音频流
    const audioStream = metadata.streams.find(
      (/** @type {{ codec_type: string; }} */ stream) =>
        stream.codec_type === "audio"
    );

    // 增加健壮性检查
    if (!audioStream) {
      throw new Error("在文件中未找到音频流");
    }

    const duration = metadata.format.duration;

    return {
      duration: Number(duration), // 确保是数字
      sampleRate: parseInt(audioStream.sample_rate, 10), // 采样率 (e.g., 44100, 48000)
      channels: audioStream.channels, // 声道数 (e.g., 1 for mono, 2 for stereo)
      codecName: audioStream.codec_name, // 编码格式 (e.g., 'mp3', 'aac')
      // 比特率可能在 format 或 stream 中，从 stream 获取更精确，并转为数字
      bitRate: parseInt(audioStream.bit_rate || metadata.format.bit_rate, 10),
    };
  } catch (err) {
    console.error("获取音频元数据时出错:", err);
    throw err;
  }
}

/**
 * 计算剪映时间线指标
 * @param {number} realDurationInSeconds - 真实持续时间（秒）
 * @param {number} [fps=30] - 帧率
 * @returns {object} 时间线指标
 */
export function calculateJianyingTimelineMetrics(
  realDurationInSeconds,
  fps = 30
) {
  // --- 参数校验 ---
  if (typeof realDurationInSeconds !== "number" || realDurationInSeconds < 0) {
    console.error("输入错误: 时长必须是一个非负数字。");
    return {
      totalFrames: 0,
      timelineDurationInMicroseconds: 0,
      remainingFrames: 0,
    };
  }

  if (realDurationInSeconds === 0) {
    return {
      totalFrames: 0,
      timelineDurationInMicroseconds: 0,
      remainingFrames: 0,
    };
  }

  // --- 定义常量 ---
  const FRAME_RATE = fps;

  // --- 步骤 1: 计算总帧数 (向下取整) ---
  const totalFrames = Math.ceil(realDurationInSeconds * FRAME_RATE);
  console.log("totalFrames", totalFrames);

  if (totalFrames === 0) {
    return {
      totalFrames: 0,
      timelineDurationInMicroseconds: 0,
      remainingFrames: 0,
    };
  }

  // --- 步骤 2: 基于总帧数，使用补偿模式精确计算轨道时长 ---
  const numCycles = Math.floor(totalFrames / 3);
  const remainingFrames = totalFrames % 3;
  console.log("remainingFrames", remainingFrames);

  let timelineDurationInMicroseconds = numCycles * 100000;

  if (remainingFrames === 1) {
    timelineDurationInMicroseconds += 33333;
  } else if (remainingFrames === 2) {
    timelineDurationInMicroseconds += 66666; // 33333 + 33333
  }

  return {
    totalFrames,
    timelineDurationInMicroseconds,
    remainingFrames,
  };
}

/**
 * 从微秒获取剩余帧数
 * @param {number} microseconds - 微秒数
 * @param {number} [fps=30] - 帧率
 * @returns {number} 剩余帧数
 */
export function getRemainingFramesFromMicroseconds(microseconds, fps = 30) {
  // 参数校验
  if (typeof microseconds !== "number" || microseconds < 0) {
    console.error("输入错误: 时间必须是一个非负数字。");
    return 0;
  }

  if (microseconds === 0) {
    return 0;
  }

  // 常量定义
  const FRAME_RATE = fps;
  const MICROSECONDS_PER_SECOND = 1000000;

  // 将微秒转换为秒
  const seconds = microseconds / MICROSECONDS_PER_SECOND;

  // 计算总帧数（向上取整）
  const totalFrames = Math.ceil(seconds * FRAME_RATE);

  if (totalFrames === 0) {
    return 0;
  }

  // 计算剩余帧数
  const remainingFrames = totalFrames % 3;

  return remainingFrames;
}
/**
 * 根据新规则缩放尺寸，适用于任何宽高比。
 * 规则：
 * 1. 最终宽高都必须大于 1000。
 * 2. 最终宽高至少有一个达到或超过 1920。
 * 3. 尺寸只会放大，不会缩小。
 *
 * @param {number} width - 原始宽度。
 * @param {number} height - 原始高度。
 * @returns {{width: number, height: number}} - 包含新尺寸的对象。
 */
export function scaleDimensions(width, height) {
  // --- 计算满足“规则1”所需的比例 ---
  // 为了确保放大后两个维度都 > 1000，我们必须关注“短边”。
  // 只有把短边放大到 > 1000，才能保证长边也一定 > 1000。
  // 我们使用 1001 作为目标，以确保 ceil 向上取整后结果一定大于 1000。
  const shortestSide = Math.min(width, height);
  const scaleForMinRequirement = 1001 / shortestSide;

  // --- 计算满足“规则2”所需的比例 ---
  // 为了确保放大后至少一个维度 >= 1920，我们必须关注“长边”。
  // 只有把长边放大到 1920，才能用最小的比例满足这个条件。
  const longestSide = Math.max(width, height);
  const scaleForTargetRequirement = 1920 / longestSide;

  // --- 决定最终比例 ---
  // 我们必须同时满足这两个规则，所以需要取两个比例中更大的那个。
  // 这样可以保证，即使满足了规则2后规则1没达成（例如超宽视频），
  // 也会被强制拉升到满足规则1。
  const effectiveScale = Math.max(
    scaleForMinRequirement,
    scaleForTargetRequirement
  );

  // 确保尺寸只放大，不缩小。如果计算出的比例小于1，则保持原样（比例为1）。
  const finalScale = Math.max(1, effectiveScale);

  // 应用最终比例并向上取整
  const newWidth = Math.ceil(width * finalScale);
  const newHeight = Math.ceil(height * finalScale);

  return {
    width: newWidth,
    height: newHeight,
  };
}
