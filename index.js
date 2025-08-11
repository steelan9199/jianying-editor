// index.js
export { JianYingEditor } from './JianYingEditor.js';
export { createNewProject } from './create_jianying_project.js';
export { 
  parseSrtFileToMicroseconds, 
  srtTimeToMicroseconds,
  getMediaMetadata,
  generateId,
  calculateJianyingTimelineMetrics
} from './helper.js';

// 导出管理器
export {
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
  MaterialAnimationManager
} from './managers/index.js';