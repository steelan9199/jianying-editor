import { BaseManager } from "../properties/BaseManager.js";

/**
 * @class ImageManager
 * @description 用于管理和操作 image 对象的类
 * @extends {BaseManager<any>} // 使用 any 替代未定义的 Track 类型

 */
export class ImageManager extends BaseManager {
  /**
   * Creates an instance of TrackManager.
   * @param {any[]} initialItems - An array of initial track items.
   */
  constructor(initialItems) {
    super(initialItems);
  }
}
