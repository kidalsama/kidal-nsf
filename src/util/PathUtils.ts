import * as path from "path"

export default {
  /**
   * 原path
   */
  path,
  /**
   * 替换扩展名
   */
  replaceExt(p: string, ext: string): string {
    const parsed = path.parse(p)
    return path.format({
      root: parsed.root,
      dir: parsed.dir,
      base: parsed.base,
      ext,
      name: parsed.name,
    })
  },
}
