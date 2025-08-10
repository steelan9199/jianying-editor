// --- 文件: managers/timeline/TrackManager.js ---

// --- 文件: JianYingEditor.js ---
/**
 * @typedef {import('../../types').Segment} Segment
 */



import { BaseManager } from "../properties/BaseManager.js";
import { getRemainingFramesFromMicroseconds } from "../../helper.js";

/**
 * @class TrackManager
 * @description 用于管理和操作 tracks 对象的类。此类也封装了对轨道内 segments 的操作。
 * @extends {BaseManager<any>} // 使用 any 替代未定义的 Track 类型
 */
export class TrackManager extends BaseManager {
  /**
   * Creates an instance of TrackManager.
   * @param {any[]} initialItems - An array of initial track items.
   */
  constructor(initialItems) {
    super(initialItems);
  }

  // --- Segment 的专用管理方法 ---

  /**
   * 向指定轨道添加一个 segment
   * @param {string} trackId - 目标轨道的 ID
   * @param {Segment} segmentData - 新 segment 的数据
   * @returns {Segment|null} 创建成功的新 segment 对象
   */
  addSegment(trackId, segmentData) {
    const track = this.getItemReference(trackId);
    if (!track) {
      console.warn(`未找到ID为 ${trackId} 的 track，无法添加 segment`);
      return null;
    }
    track.segments.push(segmentData);
    console.log(`已向 track ${trackId} 添加新 segment ${segmentData.id}`);
    return segmentData;
  }

  /**
   * 更新指定轨道中的一个 segment
   * @param {string} trackId - 轨道 ID
   * @param {string} segmentId - 要更新的 segment ID
   * @param {Object} updates - 包含要更新的字段和新值的对象
   * @returns {Segment|null} 更新后的 segment 对象
   */
  updateSegment(trackId, segmentId, updates) {
    const track = this.getItemReference(trackId);
    if (!track) {
      console.warn(`未找到ID为 ${trackId} 的 track`);
      return null;
    }

    const segmentIndex = track.segments.findIndex(
      /** @param {{id: string}} seg */ (seg) => seg.id === segmentId
    );
    if (segmentIndex === -1) {
      console.warn(`在 track ${trackId} 中未找到ID为 ${segmentId} 的 segment`);
      return null;
    }

    track.segments[segmentIndex] = {
      ...track.segments[segmentIndex],
      ...updates,
    };

    return track.segments[segmentIndex];
  }

  getTotalDuration() {
    const tracks = this.get();
    let totalDuration = 0;
    for (const track of tracks) {
      for (const segment of track.segments) {
        if (segment.target_timerange) {
          const currentTotalDuration =
            segment.target_timerange.start + segment.target_timerange.duration;
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
    const track = this.getItemReference(trackId);
    if (!track) {
      console.warn(`未找到ID为 ${trackId} 的 track`);
      return 0;
    }

    let trackDuration = 0;
    for (const segment of track.segments) {
      if (segment.target_timerange) {
        const segmentEnd =
          segment.target_timerange.start + segment.target_timerange.duration;
        if (segmentEnd > trackDuration) {
          trackDuration = segmentEnd;
        }
      }
    }

    return trackDuration;
  }
  /**
   * 根据轨道名称获取轨道对象。
   * @param {string} trackName - 要查找的轨道名称。
   * @returns {object} 匹配的轨道对象。
   */
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
  /**
   * 获取指定轨道的最后一个素材片段剩余帧数。
   * @param {string} trackId - 轨道 ID。
   */
  getLastRemainingFrames(trackId) {
    const track = this.getItemReference(trackId);
    if (!track) {
      console.warn(`未找到ID为 ${trackId} 的 track`);
      return 0;
    }

    const segments = track.segments;

    if (!segments || segments.length === 0) {
      return 0;
    }

    const maxSegment = segments.reduce(
      /**
       * @param {{target_timerange?: {start: number, duration: number}, source_timerange?: {start: number, duration: number}}} maxSegment
       * @param {{target_timerange?: {start: number, duration: number}, source_timerange?: {start: number, duration: number}}} currentSegment
       */
      (maxSegment, currentSegment) => {
        const maxStartTime = maxSegment.target_timerange?.start || 0;

        const currentStartTime = currentSegment.target_timerange?.start || 0;
        return currentStartTime > maxStartTime ? currentSegment : maxSegment;
      }
    );
    console.log("maxSegment", maxSegment);
    const remainingFrames = getRemainingFramesFromMicroseconds(
      maxSegment.source_timerange?.duration // 修复可能的 undefined 访问
    );
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
    const track = this.getItemReference(trackId);
    if (!track) {
      console.warn(`未找到ID为 ${trackId} 的 track`);
      return false;
    }

    const segmentIndex = track.segments.findIndex(
      /** @param {{id: string}} seg */ (seg) => seg.id === segmentId
    );
    if (segmentIndex === -1) {
      console.warn(
        `在 track ${trackId} 中未找到ID为 ${segmentId} 的 segment，无法删除`
      );
      return false;
    }

    track.segments.splice(segmentIndex, 1);
    console.log(`track ${trackId} 中的 segment ${segmentId} 已成功删除`);
    return true;
  }
}
