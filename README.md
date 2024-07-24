# HTML to Image, PDF, and Word Tool

这是一个用于将 HTML 转换为图片、PDF 和 Word 格式的工具包。你可以按需导入并使用其中的三个方法：`exportAsImage`、`exportAsPdf`、`exportAsWord`。

## 依赖安装

在使用该工具包之前，请确保你已安装以下依赖：

- `html2canvas`
- `jspdf`
- `html-docx-js-typescript`
- `file-saver`

你可以使用以下命令安装这些依赖：

```bash
npm install html2canvas jspdf html-docx-js-typescript file-saver --save
# or yarn
yarn add html2canvas jspdf html-docx-js-typescript file-saver
```

**注意：如果只需要导出图片功能，只需要安装 `html2canvas` 依赖**  
**注意：如果只需要导出 PDF 功能，需要同时安装 `html2canvas` 和 `jspdf` 依赖**  
**注意：如果只需要导出 Word 功能，需要同时安装 `html2canvas`、`html-docx-js-typescript` 和 `file-saver` 依赖**

## 安装此工具

```bash
npm install html2image-pdf-word --save
# or yarn
yarn add html2image-pdf-word
```

## 方法说明

### `exportAsImage`

将 HTML 转换为图片格式

```js
exportAsImage(
  selector: HTMLElement | string,
  filename: string,
  watermarkText: string
): Promise<void>
```

- `selector`: 需要转换的 HTML 元素或其选择器。
- `filename`: 导出的文件名。
- `watermarkText`: 水印文字（可选）。

### `exportAsPdf`

将 HTML 转换为 PDF 格式

```js
exportAsPdf(
  selector: HTMLElement | string,
  filename: string
): Promise<void>

```

- `selector`: 需要转换的 HTML 元素或其选择器。
- `filename`: 导出的文件名。

### `exportAsWord`

将 HTML 转换为 Word 格式

```js
exportAsWord(
  selector: HTMLElement | string,
  filename: string
): Promise<void>
```

- `selector`: 需要转换的 HTML 元素或其选择器。
- `filename`: 导出的文件名。

## 支持按需引入

你可以按需导入以下三个方法：

`exportAsImage`

示例代码：

```js
import { exportAsImage } from 'html2image-pdf-word';

const dom = document.querySelector('#myElement');
const filename = 'test';
await exportAsImage(dom, filename, '我是水印');
```

`exportAsPdf`

示例代码

```js
import { exportAsPdf } from 'html2image-pdf-word';

const dom = document.querySelector('#myElement');
const filename = 'test';
await exportAsPdf(dom, filename);
```

`exportAsWord`

示例代码

```js
import { exportAsWord } from 'html2image-pdf-word';

const dom = document.querySelector('#myElement');
const filename = 'test';
await exportAsWord(dom, filename);
```

## 贡献

如果你发现任何问题或有改进建议，请提交 issue 或 pull request。
