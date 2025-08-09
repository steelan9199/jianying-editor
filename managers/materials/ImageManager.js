import { BaseManager } from "../properties/BaseManager.js";

/**
 * @class ImageManager
 * @description 用于管理和操作 image 对象的类
 * @extends BaseManager
 */
export class ImageManager extends BaseManager {
  #defaultTemplate = {}

  constructor(initialItems = []) {
    super(initialItems);
  }

  create(itemData = {}) {
    return this._create(itemData, this.#defaultTemplate);
  }
}
