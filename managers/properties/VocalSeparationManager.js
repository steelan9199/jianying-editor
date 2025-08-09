// --- 文件: managers/properties/VocalSeparationManager.js ---
import { BaseManager } from './BaseManager.js';

/**
 * @class VocalSeparationManager
 * @description 用于管理和操作 vocal_separations 对象的类
 * @extends BaseManager
 */
export class VocalSeparationManager extends BaseManager {
  #defaultTemplate = {
    choice: 0,
    production_path: "",
    time_range: null,
    type: "vocal_separation"
  };

  constructor(initialItems = []) {
    super(initialItems);
  }

  create(itemData = {}) {
    return this._create(itemData, this.#defaultTemplate);
  }
}