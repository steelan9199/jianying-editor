import fs from "fs";
import path from "path";
import crypto from "crypto";

/**
 * @file 创建新的剪映项目
 * @description 该模块提供创建新剪映项目的功能
 */

// --- 用户配置 ---

// 1. 模板工程的路径 (请使用你的模板文件夹)
const TEMPLATE_PROJECT_PATH = path.join(import.meta.dirname, "./JianYingTemplateProject");

function getNewProjectName() {
  // 2. 新工程的名称
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  const NEW_PROJECT_NAME = `${month}${day}_${hours}${minutes}${seconds}`;
  return NEW_PROJECT_NAME;
}

/**
 * 递归地复制文件夹内容
 * @param {string} src 源路径
 * @param {string} dest 目标路径
 */
function copyDirRecursive(src, dest) {
  const exists = fs.existsSync(src);
  if (!exists) {
    return;
  }
  const stats = fs.statSync(src);
  const isDirectory = stats.isDirectory();
  if (isDirectory) {
    // 忽略 .backup 文件夹
    if (path.basename(src) === ".backup") {
      return;
    }
    fs.mkdirSync(dest, { recursive: true });
    fs.readdirSync(src).forEach((childItemName) => {
      copyDirRecursive(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else {
    // 忽略 .bak 文件
    if (path.extname(src) === ".bak") {
      return;
    }
    fs.copyFileSync(src, dest);
  }
}

/**
 * 创建一个新的剪映项目
 *
 * @param {string} [draftLocation] - 剪映草稿基础路径（可选）
 * @returns {{projectRootDir: string, draftContentPath: string, projectId: string}} 项目元数据
 * @property {string} projectRootDir - 项目根目录路径
 * @property {string} draftContentPath - 项目内容文件路径
 * @property {string} projectId - 新生成的项目ID
 *
 * @example
 * const projectMetaData = createNewProject("C:/Users/Username/AppData/Local/JianyingPro/User Data/Projects/com.lveditor.draft");
 * console.log(projectMetaData.projectRootDir); // 新项目路径
 * console.log(projectMetaData.draftContentPath); // 项目内容文件路径
 * console.log(projectMetaData.projectId); // 项目ID
 */
export function createNewProject(draftLocation) {
  if (!draftLocation) {
    throw new Error("请提供剪映草稿位置");
  }

  // 生成新工程的名称和完整路径
  const NEW_PROJECT_NAME = getNewProjectName();
  const projectRootDir = path.join(draftLocation, NEW_PROJECT_NAME);

  // 创建新工程文件夹
  fs.mkdirSync(projectRootDir, { recursive: true });

  // 复制模板工程的内容到新工程文件夹
  copyDirRecursive(TEMPLATE_PROJECT_PATH, projectRootDir);

  // 构造 draft_content.json 的完整路径
  const DRAFT_CONTENT_FILE_PATH = path.join(projectRootDir, "draft_content.json");

  // 生成新的项目 ID (使用 crypto.randomUUID())
  const newProjectId = crypto.randomUUID().toUpperCase();
  const newDraftId = crypto.randomUUID().toUpperCase();
  // 剪映使用带6位小数的unix时间戳 (微秒)
  const currentTimestamp = BigInt(Date.now()) * 1000n;

  // 读取 draft_content.json 文件
  let draftContent = JSON.parse(fs.readFileSync(DRAFT_CONTENT_FILE_PATH, "utf-8"));

  // 更新项目 ID
  draftContent.id = newProjectId;

  // 写回修改后的 draft_content.json
  fs.writeFileSync(DRAFT_CONTENT_FILE_PATH, JSON.stringify(draftContent));

  const draftMetaPath = path.join(projectRootDir, "draft_meta_info.json");
  const metaData = JSON.parse(fs.readFileSync(draftMetaPath, "utf-8"));
  // 注意：剪映在这里使用正斜杠 /
  metaData.draft_fold_path = `${draftLocation}/${NEW_PROJECT_NAME}`;
  metaData.draft_name = NEW_PROJECT_NAME;
  metaData.draft_id = newDraftId;
  metaData.draft_root_path = draftLocation;
  // BigInt 需要转换为字符串或数字进行JSON序列化
  metaData.tm_draft_create = Number(currentTimestamp);
  metaData.tm_draft_modified = Number(currentTimestamp);
  fs.writeFileSync(draftMetaPath, JSON.stringify(metaData));

  // 返回新工程的元数据
  return {
    projectRootDir: projectRootDir,
    draftContentPath: DRAFT_CONTENT_FILE_PATH,
    projectId: newProjectId
  };
}
