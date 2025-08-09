import { BaseManager } from "../properties/BaseManager.js";

/**
 * @class LyricsTaskInfoManager
 * @description 用于管理和操作 LyricsTaskInfo 对象的类
 * @extends BaseManager
 */
export class LyricsTaskInfoManager extends BaseManager {
  #defaultTemplate = {}

  constructor(initialItems = []) {
    super(initialItems);
  }

  create(itemData = {}) {
    return this._create(itemData, this.#defaultTemplate);
  }
}
