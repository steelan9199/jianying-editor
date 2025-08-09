import { BaseManager } from "../properties/BaseManager.js";

/**
 * @class TitleManager
 * @description 用于管理和操作 title 对象的类
 * @extends BaseManager
 */
export class TitleManager extends BaseManager {
  #defaultTemplate = {}

  constructor(initialItems = []) {
    super(initialItems);
  }

  create(itemData = {}) {
    return this._create(itemData, this.#defaultTemplate);
  }
}
