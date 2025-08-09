// const ffmpeg = require('fluent-ffmpeg');
// 改为import
import ffmpeg from "fluent-ffmpeg";
import { path as ffmpegPath } from "@ffmpeg-installer/ffmpeg";
import { path as ffprobePath } from "@ffprobe-installer/ffprobe";

// 设置 fluent-ffmpeg 的路径，指向我们通过 npm 安装的可执行文件
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);


/**
 * 获取视频元数据
 * @param {string} filePath - 视频文件绝对路径
 * @returns {Promise<{durationInMicroseconds: number, width: number, height: number}>} 视频元数据
 */
export default async function getVideoMetadata(filePath) {
  try {
    const metadata = await new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, data) => {
        if (err) reject(err);
        resolve(data);
      });
    });

    const duration = metadata.format.duration;
    const durationInMicroseconds = Math.floor(duration * 1000000);

    const videoStream = metadata.streams.find((stream) => stream.codec_type === "video");

    if (!videoStream) {
      throw new Error("未找到有效的视频流");
    }

    return {
      durationInMicroseconds,
      width: videoStream.width,
      height: videoStream.height,
    };
  } catch (err) {
    console.error("无法读取视频信息，请确保文件路径正确且文件未损坏。", err);
    throw err;
  }
}

// ----- 现在你的代码和之前完全一样，但它已经不依赖全局安装的 FFmpeg了 -----
const videoPath = String.raw`F:\scripts\work-sop\19剪映yashu\09JianYingEditor\素材\汽车尾气6秒.mp4`;

const videoInfo = await getVideoMetadata(videoPath);
console.log("videoInfo", videoInfo);