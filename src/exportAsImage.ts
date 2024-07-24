import Html2canvas from 'html2canvas';
import { cleanHtml, cloneElement, createWatermarkBase64 } from './tools';

/**
 * 导出图片
 * @param selector 导出图片对应的元素
 * @param filename 导出后文件名称
 * @param watermarkText 水印文案
 * @returns Promise
 */
export function exportAsImage(
  selector: HTMLElement | string,
  filename: string,
  watermarkText?: string
) {
  const cloneEle = cloneElement(selector);
  if (!cloneEle) return Promise.reject();
  if (watermarkText) {
    const base64 = createWatermarkBase64(watermarkText);
    cloneEle.style.backgroundImage = `url('${base64}')`;
  }

  const { warp, cleanHtmlRecover } = cleanHtml(cloneEle);

  return new Promise<void>((resolve) => {
    Html2canvas(warp, {
      useCORS: true,
      scale: window.devicePixelRatio * 2, // 增加清晰度
    })
      .then((canvas: HTMLCanvasElement) => {
        const a = document.createElement('a');
        const event = new MouseEvent('click');
        a.download = filename;
        a.href = canvas.toDataURL('image/jpg');
        a.dispatchEvent(event);
      })
      .finally(() => {
        cleanHtmlRecover();
        resolve();
      });
  });
}
