// --- 文件: managers/materials/VideoManager.js ---
import { BaseManager } from "../properties/BaseManager.js";

/**
 * @class AudioManager
 * @description 用于管理和操作 audio 对象的类
 * @extends {BaseManager<any>} // 使用 any 替代未定义的 Track 类型

 */
export class AudioManager extends BaseManager {
  /**
   * Creates an instance of TrackManager.
   * @param {any[]} initialItems - An array of initial track items.
   */
  constructor(initialItems) {
    super(initialItems);
  }

  create(itemData = {}) {
    return this._create(itemData);
  }
}
