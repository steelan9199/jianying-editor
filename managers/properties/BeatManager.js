// --- 文件: managers/materials/VideoManager.js ---
import { BaseManager } from "./BaseManager.js";

/**
 * @class VideoManager
 * @description 用于管理和操作 video 对象的类
 * @extends BaseManager
 */
export class BeatManager extends BaseManager {
  #defaultTemplate = {}

  constructor(initialItems = []) {
    super(initialItems);
  }

  create(itemData = {}) {
    return this._create(itemData, this.#defaultTemplate);
  }
}
