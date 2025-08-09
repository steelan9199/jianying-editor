import { BaseManager } from "../properties/BaseManager.js";

/**
 * @class SubtitleManager
 * @description 用于管理和操作 subtitle 对象的类
 * @extends BaseManager
 */
export class SubtitleManager extends BaseManager {
  #defaultTemplate = {}

  constructor(initialItems = []) {
    super(initialItems);
  }

  create(itemData = {}) {
    return this._create(itemData, this.#defaultTemplate);
  }
}
