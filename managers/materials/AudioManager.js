// --- 文件: managers/materials/VideoManager.js ---
import { BaseManager } from "../properties/BaseManager.js";

/**
 * @class AudioManager
 * @description 用于管理和操作 audio 对象的类
 * @extends BaseManager
 */
export class AudioManager extends BaseManager {
  #defaultTemplate = {}

  constructor(initialItems = []) {
    super(initialItems);
  }

  create(itemData = {}) {
    return this._create(itemData, this.#defaultTemplate);
  }
}
