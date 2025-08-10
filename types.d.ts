/**
 * 音频元数据
 */
export type AudioMetadata = {
  duration: number; // 音频时长 (秒)
  sampleRate: number; // 采样率
  channels: number; // 声道数
  bitRate: number; // 比特率 (bps)
  codecName: string; // 音频编码器名称
};

/**
 * 视频元数据
 */
export type VideoMetadata = {
  hasAudio: boolean; // 是否包含音频流
  duration: number; // 视频时长 (秒)
  width: number; // 视频宽度 (像素)
  height: number; // 视频高度 (像素)
  codecName: string; // 视频编码器名称
  formatName: string; // 格式名称
  bitRate: number; // 比特率 (bps)
  frameRate: number; // 帧率 (fps)
  sampleRate: number; // 音频采样率 (Hz)
  channels: number; // 音频声道数
  channelLayout: string; // 音频声道布局
};

/**
 * 图片元数据，常用来检测图片
 */
export type ImageMetadata = {
  width: number; // 图片宽度 (像素)
  height: number; // 图片高度 (像素)
  codecName: string; // 图片编码器名称
};

/**
 * 不支持的媒体类型元数据
 */
export type UnsupportedMetadata = {
  error: string; // 错误信息字符串
};

/**
 * 媒体元数据结果
 */
export type MediaMetadataResult = {
  type: "video" | "audio" | "image" | "unsupported"; // 媒体类型
  metadata: VideoMetadata | AudioMetadata | ImageMetadata | UnsupportedMetadata; // 具体元数据，类型取决于 type
};

/**
 * Represents a track in the Jianying project.
 */
export type Track = {
  id: string; // The unique identifier of the track
  segments: Array<Segment>; // The list of segments on the track
};

/**
 * Represents a segment on a track.
 */
export type Segment = {
  // 给Segment添加id属性
  id: string; // 新 segment 的 ID
  target_timerange: { start: number; duration: number }; // 片段在时间轴上的目标时间范围，包含起始时间和持续时间（单位：微秒）。
  // Add other segment properties as needed
};
