// --- 文件: managers/timeline/TrackManager.js ---
import { BaseManager } from "../properties/BaseManager.js";
import { getRemainingFramesFromMicroseconds } from "../../helper.js";

/**
 * @class TrackManager
 * @description 用于管理和操作 tracks 对象的类。此类也封装了对轨道内 segments 的操作。
 * @extends {BaseManager<Object>} // 使用 Object 替代未定义的 Track 类型
 */
export class TrackManager extends BaseManager {
  constructor(initialItems = []) {
    super(initialItems);
  }

  /**
   * 新增一个 track 对象
   * @param {object} [itemData={}]
   * @returns
   */
  create(itemData = {}) {
    const defaultTemplate = {
      attribute: 0,
      flag: 0,
      is_default_name: true,
      name: "",
      segments: []
      // type 由 itemData 传入，保持通用性
    };
    return this._create(itemData, defaultTemplate);
  }

  // --- Segment 的专用管理方法 ---

  /**
   * 向指定轨道添加一个 segment
   * @param {string} trackId - 目标轨道的 ID
   * @param {Object} segmentData - 新 segment 的数据
   * @returns {Object|null} 创建成功的新 segment 对象
   */
  addSegment(trackId, segmentData) {
    const track = this._getItemReference(trackId);
    if (!track) {
      console.warn(`未找到ID为 ${trackId} 的 track，无法添加 segment`);
      return null;
    }

    const defaultSegmentTemplate = {
      clip: { alpha: 1, flip: { horizontal: false, vertical: false }, rotation: 0, scale: { x: 1, y: 1 }, transform: { x: 0, y: 0 } },
      common_keyframes: [],
      enable_adjust: true,
      extra_material_refs: [],
      speed: 1,
      volume: 1,
      visible: true,
      source_timerange: { duration: 0, start: 0 },
      target_timerange: { duration: 0, start: 0 }
    };

    const newSegment = { ...defaultSegmentTemplate, ...segmentData };
    track.segments.push(newSegment);

    console.log(`已向 track ${trackId} 添加新 segment ${newSegment.id}`);
    return JSON.parse(JSON.stringify(newSegment));
  }

  /**
   * 更新指定轨道中的一个 segment
   * @param {string} trackId - 轨道 ID
   * @param {string} segmentId - 要更新的 segment ID
   * @param {Object} updates - 包含要更新的字段和新值的对象
   * @returns {Object|null} 更新后的 segment 对象
   */
  updateSegment(trackId, segmentId, updates) {
    const track = this._getItemReference(trackId);
    if (!track) {
      console.warn(`未找到ID为 ${trackId} 的 track`);
      return null;
    }

    const segmentIndex = track.segments.findIndex((seg) => seg.id === segmentId);
    if (segmentIndex === -1) {
      console.warn(`在 track ${trackId} 中未找到ID为 ${segmentId} 的 segment`);
      return null;
    }

    track.segments[segmentIndex] = { ...track.segments[segmentIndex], ...updates };

    console.log(`track ${trackId} 中的 segment ${segmentId} 已更新`);
    return JSON.parse(JSON.stringify(track.segments[segmentIndex]));
  }

  getTotalDuration() {
    const tracks = this.get();
    let totalDuration = 0;
    for (const track of tracks) {
      for (const segment of track.segments) {
        if (segment.target_timerange) {
          const currentTotalDuration = segment.target_timerange.start + segment.target_timerange.duration;
          if (currentTotalDuration > totalDuration) {
            totalDuration = currentTotalDuration;
          }
        }
      }
    }
    return totalDuration;
  }

  /**
   * 获取指定轨道上所有素材片段的总时长
   * @param {string} trackId - 轨道 ID
   * @returns {number} 指定轨道上所有素材片段的总时长（单位与 target_timerange.duration 一致，通常为微秒）
   */
  getTrackDuration(trackId) {
    const track = this._getItemReference(trackId);
    if (!track) {
      console.warn(`未找到ID为 ${trackId} 的 track`);
      return 0;
    }

    let trackDuration = 0;
    for (const segment of track.segments) {
      if (segment.target_timerange) {
        const segmentEnd = segment.target_timerange.start + segment.target_timerange.duration;
        if (segmentEnd > trackDuration) {
          trackDuration = segmentEnd;
        }
      }
    }

    return trackDuration;
  }
  getTrackByTrackName(trackName) {
    const tracks = this.get();

    let targetTrack;
    for (const track of tracks) {
      if (track.name === trackName) {
        targetTrack = track;
        break;
      }
    }
    if (!targetTrack) {
      throw new Error(`Track ${trackName} not found`);
    }
    return targetTrack;
  }
  getLastRemainingFrames(trackId) {
    const track = this._getItemReference(trackId);
    if (!track) {
      console.warn(`未找到ID为 ${trackId} 的 track`);
      return 0;
    }

    const segments = track.segments;

    if (!segments || segments.length === 0) {
      return 0;
    }
    const maxSegment = segments.reduce((maxSegment, currentSegment) => {
      const maxStartTime = maxSegment.target_timerange?.start || 0;
      const currentStartTime = currentSegment.target_timerange?.start || 0;
      return currentStartTime > maxStartTime ? currentSegment : maxSegment;
    });
    console.log("maxSegment", maxSegment);
    const remainingFrames = getRemainingFramesFromMicroseconds(maxSegment.source_timerange.duration);
    console.log("remainingFrames", remainingFrames);
    return remainingFrames;
  }
  /**
   * 从指定轨道中删除一个 segment
   * @param {string} trackId - 轨道 ID
   * @param {string} segmentId - 要删除的 segment ID
   * @returns {boolean} 如果成功删除则返回 true
   */
  removeSegment(trackId, segmentId) {
    const track = this._getItemReference(trackId);
    if (!track) {
      console.warn(`未找到ID为 ${trackId} 的 track`);
      return false;
    }

    const segmentIndex = track.segments.findIndex((seg) => seg.id === segmentId);
    if (segmentIndex === -1) {
      console.warn(`在 track ${trackId} 中未找到ID为 ${segmentId} 的 segment，无法删除`);
      return false;
    }

    track.segments.splice(segmentIndex, 1);
    console.log(`track ${trackId} 中的 segment ${segmentId} 已成功删除`);
    return true;
  }
}
