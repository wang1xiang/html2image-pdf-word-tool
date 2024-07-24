/**
 * 生成水印
 * @returns base64
 */
export declare const createWatermarkBase64: (watermark: string) => string;
/** 克隆节点 */
export declare const cloneElement: (selector: HTMLElement | string) => HTMLElement | undefined;
/** 对克隆DOM做一些处理 */
export declare const cleanHtml: (ele: HTMLElement) => {
    warp: HTMLDivElement;
    cleanHtmlRecover: () => void;
};
//# sourceMappingURL=tools.d.ts.map