# Shen Majun Portfolio

Personal portfolio of Shen Majun (Applied Data Science, Monash University Malaysia). Plain HTML, CSS and JavaScript, with no build step, ready for GitHub Pages.

## 文件结构

| 文件 | 作用 |
| --- | --- |
| `index.html` | 页面内容（所有文字都在这里改） |
| `assets/style.css` | 样式、配色、深色模式 |
| `assets/main.js` | 交互：门口计数动画、登革热周病例图、流程步骤、NHANES 森林图、主题切换、复制邮箱 |
| `.nojekyll` | 让 GitHub Pages 原样发布文件，不经过 Jekyll 处理 |

## 发布到 GitHub Pages

1. 登录 https://github.com ，右上角 **+ → New repository**。
2. 仓库名填 `你的用户名.github.io`（例如用户名是 `majunshen`，就填 `majunshen.github.io`），选 **Public**，点 **Create repository**。
3. 进入仓库，点 **Add file → Upload files**，把解压后 `shen-majun-portfolio` 文件夹 **里面的全部内容**（`index.html`、`assets` 文件夹、`README.md`、`.nojekyll`）拖进去，点 **Commit changes**。
   - 注意：要上传文件夹里面的内容，不要把外层 `shen-majun-portfolio` 文件夹本身传上去，否则 `index.html` 不在仓库根目录。
   - Windows 默认隐藏以 `.` 开头的文件；如果看不到 `.nojekyll`，不上传也能正常显示。
4. 打开 **Settings → Pages**，Source 选 **Deploy from a branch**，Branch 选 **main**，文件夹选 **/(root)**，点 **Save**。
5. 等 1–3 分钟，访问 `https://你的用户名.github.io`。

## 常见修改

- **申请的岗位**：在 `index.html` 里搜索 `Applying for`，改成新的公司或职位；面完 FootfallCam 后也可以整行删掉。
- **“Why FootfallCam” 一节**：搜索 `id="fit"`，可以改成针对其他公司的内容，或整节删掉。
- **技能**：搜索 `class="skill"`。带 `data-used="..."` 的技能会显示圆点，鼠标悬停时显示它出现在哪个项目里；没有项目佐证的技能不加这个属性。
- **邮箱**：搜索 `shenmajun683@gmail.com`，共 2 处。

## 说明

- NHANES 项目是合作研究，作者顺序为 Zhan X, Shen M, Zhang Y, Mao X；预印本 DOI 10.64898/2026.10.09.26365176，尚未经过同行评审。
- 首页的门口计数动画是演示用的模拟数据，不是真实客流。
- 登革热周病例数据来自 OpenDengue V1.3（CC BY 4.0）。
