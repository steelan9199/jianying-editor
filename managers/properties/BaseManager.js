/**
 * @class BaseManager
 * @description 一个通用的基类，用于管理包含唯一ID的项数组。
 *              它处理通用的CRUD（创建、读取、更新、删除）操作。
 * @template {BaseItem} T - 项的类型，必须包含 id 字段（string 类型）
 */
export class BaseManager {
  /**
   * @typedef {Object} BaseItem
   * @property {string} id - 唯一标识符
   */

  /**
   * @param {Array<T>} initialItems - 初始的 items 数组
   */
  constructor(initialItems = []) {
    /** @type {T[]} */
    this.#items = initialItems;
  }

  /** @type {T[]} */
  #items;

  /**
   * 创建一个值的深拷贝副本，防止外部意外修改内部数据。
   * @template U
   * @param {U} value 要拷贝的值（可以是单个对象，也可以是数组）
   * @returns {U} 值的深拷贝副本
   */
  #deepCopy(value) {
    return JSON.parse(JSON.stringify(value));
  }

  /**
   * 通过ID查找 item 在数组中的索引。
   * @param {string} id - 要查找的 item 的 ID
   * @returns {number} 索引，未找到则返回 -1
   */
  findIndexById(id) {
    if (!id || typeof id !== "string") {
      throw new Error("请提供有效的ID");
    }
    return this.#items.findIndex((item) => item.id === id);
  }

  /**
   * 通过ID查找并返回真实的 item 引用（非副本）。
   * 仅供需要直接修改子对象的子类（如 TrackManager）使用。
   * @param {string} id - 要查找的 item 的 ID
   * @returns {T|null} 真实的 item 对象引用，或 null
   */
  getItemReference(id) {
    const index = this.findIndexById(id);
    return index > -1 ? this.#items[index] : null;
  }

  /**
   * 创建一个新的 item 并添加到数组中。
   * @param {T} itemData - 要创建的 item 数据
   */
  create(itemData) {
    console.debug("🚀 ~ BaseManager ~ create ~ itemData:", itemData)
    if (!itemData || typeof itemData !== "object") {
      throw new Error("无效的 item 数据");
    }

    if (!itemData.id || typeof itemData.id !== "string") {
      throw new Error("Item 必须包含有效的 id 字段");
    }

    // 检查是否已存在相同 ID 的项
    if (this.findIndexById(itemData.id) !== -1) {
      throw new Error(`ID 为 ${itemData.id} 的 item 已存在`);
    }
    const newItem = itemData;
    this.#items.push(newItem);
    return newItem;
  }

  /**
   * 读取一个或所有 item 对象。
   * @param {string} [id] - 可选参数，要读取的 item 的 ID。如果未提供，则返回所有 items。
   * @returns {T|T[]|null} item 或 item 数组的深拷贝副本
   */
  get(id) {
    if (id) {
      const item = this.getItemReference(id);
      return item;
    } else {
      return this.#items;
    }
  }

  /**
   * 更新一个已存在的 item 对象。
   * @param {string} id - 要更新的 item 的 ID
   * @param {Partial<T>} updates - 包含要更新的字段和新值的对象
   */
  update(id, updates) {
    if (!updates || typeof updates !== "object") {
      throw new Error("无效的更新数据");
    }
    const index = this.findIndexById(id);

    if (index === -1) {
      console.warn(`未找到ID为 ${id} 的 item，无法更新`);
      return null;
    }
    // 防止更新 id 字段
    const { id: updatesId, ...safeUpdates } = updates;
    if (updatesId && updatesId !== id) {
      console.warn("不允许通过 update 方法更改 item 的 id");
    }
    const updatedItem = { ...this.#items[index], ...safeUpdates };
    this.#items[index] = updatedItem;

    console.log(`ID为 ${id} 的 item 已更新`);
    return updatedItem;
  }

  /**
   * 删除一个 item 对象。
   * @param {string} id - 要删除的 item 的 ID
   * @returns {boolean} 如果成功删除则返回 true
   */
  remove(id) {
    const index = this.findIndexById(id);
    if (index === -1) {
      console.warn(`未找到ID为 ${id} 的 item，无法删除`);
      return false;
    }
    this.#items.splice(index, 1);
    console.log(`ID为 ${id} 的 item 已成功删除`);
    return true;
  }
  /**
   * 获取 items 数组的长度
   * @returns {number} items 数组的长度
   */
  get length() {
    return this.#items.length;
  }

  /**
   * 检查是否存在指定 ID 的 item
   * @param {string} id - 要检查的 item 的 ID
   * @returns {boolean} 如果存在返回 true，否则返回 false
   */
  has(id) {
    return this.findIndexById(id) !== -1;
  }
}
