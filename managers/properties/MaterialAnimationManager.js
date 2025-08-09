import { BaseManager } from "./BaseManager.js";

/**
 * @class MaterialAnimationManager
 * @description 用于管理和操作 material_animations 对象的类
 * @extends BaseManager
 */
export class MaterialAnimationManager extends BaseManager {
  #defaultTemplate = {};

  constructor(initialItems = []) {
    super(initialItems);
  }

  create(itemData = {}) {
    return this._create(itemData, this.#defaultTemplate);
  }
}
