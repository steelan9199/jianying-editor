import { BaseManager } from "../properties/BaseManager.js";

/**
 * @class LyricsTaskInfoManager
 * @description 用于管理和操作 LyricsTaskInfo 对象的类
 * @extends {BaseManager<any>} // 使用 any 替代未定义的 Track 类型
 */
export class LyricsTaskInfoManager extends BaseManager {
  /**
   * Creates an instance of LyricsTaskInfoManager.
   * @param {any[]} [initialItems=[]] - An array of initial LyricsTaskInfo items.
   */
  constructor(initialItems = []) {
    super(initialItems);
  }
}
