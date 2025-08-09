// --- 文件: managers/properties/SpeedManager.js ---
import { BaseManager } from './BaseManager.js';

/**
 * @class SpeedManager
 * @description 用于管理和操作 speeds 对象的类
 * @extends BaseManager
 */
export class SpeedManager extends BaseManager {
  #defaultTemplate = {
    curve_speed: null,
    mode: 0,
    speed: 1,
    type: "speed"
  };

  constructor(initialItems = []) {
    super(initialItems);
  }

  /**
   * 新增一个 speed 对象
   * @param {Object} [itemData={}] - 新的 item 对象的数据 (可选)
   * @returns {Object} 新创建的 item 对象
   */
  create(itemData = {}) {
    return this._create(itemData, this.#defaultTemplate);
  }
}