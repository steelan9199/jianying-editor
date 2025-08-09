// --- 文件: managers/properties/VocalSeparationManager.js ---
import { BaseManager } from "./BaseManager.js";

/**
 * @class VocalSeparationManager
 * @description 用于管理和操作 vocal_separations 对象的类
 * @extends {BaseManager<any>} // 使用 any 替代未定义的 Track 类型
 */
export class VocalSeparationManager extends BaseManager {
  /**
   * Creates an instance of TrackManager.
   * @param {any[]} initialItems - An array of initial track items.
   */
  constructor(initialItems) {
    super(initialItems);
  }
}
