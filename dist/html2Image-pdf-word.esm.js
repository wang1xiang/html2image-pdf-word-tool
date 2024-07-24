import Html2canvas from 'html2canvas';
import { asBlob } from 'html-docx-js-typescript';
import { saveAs } from 'file-saver';
import JsPDF from 'jspdf';

/** a4纸的尺寸 */
var A4_PAPER_SIZE_ENUM;
(function (A4_PAPER_SIZE_ENUM) {
    A4_PAPER_SIZE_ENUM[A4_PAPER_SIZE_ENUM["width"] = 595.28] = "width";
    A4_PAPER_SIZE_ENUM[A4_PAPER_SIZE_ENUM["height"] = 841.89] = "height";
})(A4_PAPER_SIZE_ENUM || (A4_PAPER_SIZE_ENUM = {}));

// 图片处理
const handleImage = (ele, cloneEle) => {
    const imgClass = '.ProseMirror img:not(.ProseMirror-separator):not(.resizer-img):not(.image-err)[src]';
    const a4Width = A4_PAPER_SIZE_ENUM.width - 140; // word 默认A4纸宽度 - 页边距
    const imgs = ele.querySelectorAll(imgClass);
    const cloneImgs = cloneEle.querySelectorAll(imgClass);
    cloneEle.querySelectorAll('.ProseMirror img').forEach((item) => {
        if (!['ProseMirror-separator', 'image-err', 'resizer-img'].includes(item.className))
            return;
        item.parentElement?.removeChild(item);
    });
    imgs.forEach((img, index) => {
        if (!cloneImgs[index])
            return;
        if (img.clientWidth >= a4Width) {
            cloneImgs[index].setAttribute('width', a4Width.toString());
            const a4ImgHeight = (a4Width / img.clientWidth) * img.clientHeight;
            cloneImgs[index].setAttribute('height', a4ImgHeight.toString());
        }
        else {
            cloneImgs[index].setAttribute('width', img.clientWidth.toString());
            cloneImgs[index].setAttribute('height', img.clientHeight.toString());
        }
    });
};
// word中图片下面会出现一个白框
const removeWhiteBox = (cloneEle) => {
    const separators = cloneEle.querySelectorAll('.ProseMirror-separator');
    separators.forEach((separator) => separator.parentElement?.removeChild(separator));
};
// 表格虚线 向右偏移10px左右
const handleTableStyle = (cloneEle) => {
    cloneEle.querySelectorAll('table').forEach((table) => {
        table.style.borderCollapse = table.style.borderCollapse || 'collapse';
        table.border = table.border || '1';
        table.style.marginLeft = '10px';
    });
};
// 处理脑图 脑图导出word有问题 直接通过html2canvas将脑图转换为图片 导出图片即可
const handleMind = async (ele, cloneEle) => {
    const mindDOM = ele.querySelectorAll(`.mind-snapshot`);
    const promise = [...mindDOM].map((mind) => Html2canvas(mind.firstChild));
    const result = await Promise.allSettled(promise);
    const copyMindDOM = cloneEle.querySelectorAll(`.ProseMirror-mind-node-wrapper`);
    // eslint-disable-next-line
    result.forEach((item, index) => {
        const { status, value } = item;
        if (status === 'fulfilled') {
            const img = document.createElement('img');
            img.src = value.toDataURL('image/jpg');
            const parent = copyMindDOM[index].parentElement;
            copyMindDOM[index].insertAdjacentElement('beforebegin', img);
            parent.removeChild(copyMindDOM[index]);
        }
    });
};
// 列表处理
const handleUlStyle = (cloneEle, uiLevel) => {
    const changeTask2P = (div, parent) => {
        const p = document.createElement('p');
        p.innerHTML = div.innerHTML;
        parent
            ? parent.insertAdjacentElement('afterend', p)
            : div.insertAdjacentElement('afterend', p);
        return p;
    };
    const changeDiv2Ul = (div, uiLevel, parent) => {
        const kind = div.getAttribute('data-list-kind');
        let liOrp = null;
        // 根据checkbox或列表生成不同的标签
        if (kind === 'task') {
            liOrp = changeTask2P(div, parent);
        }
        else {
            const ul = kind === 'ordered'
                ? document.createElement('ol')
                : document.createElement('ul');
            liOrp = document.createElement('li');
            !parent && (ul.style.margin = '0');
            liOrp.innerHTML = div.innerHTML;
            ul.appendChild(liOrp);
            // 将ul添加到后面
            parent
                ? parent.insertAdjacentElement('beforebegin', ul)
                : div.insertAdjacentElement('beforebegin', ul);
        }
        div.parentElement?.removeChild(div);
        liOrp.querySelectorAll('.list-marker').forEach((marker) => {
            if (kind === 'task') {
                const span = document.createElement('span');
                span.innerHTML = `<span style="color:#333333; font-family:'Wingdings 2'; font-size:11pt"></span>`;
                marker.insertAdjacentElement('beforebegin', span);
            }
            marker.parentElement?.removeChild(marker);
        });
        liOrp.querySelectorAll('.list-content').forEach((content) => {
            const span = document.createElement('span');
            span.innerHTML =
                content.firstChild?.innerHTML || '<li></li>';
            liOrp &&
                (liOrp.style.textAlign = content.firstChild?.style?.textAlign);
            content.insertAdjacentElement('beforebegin', span);
            const innerFlatList = content.querySelectorAll(`.prosemirror-flat-list[data-list-level="${uiLevel}"]`);
            if (innerFlatList.length) {
                uiLevel++;
                innerFlatList.forEach((div) => changeDiv2Ul(div, uiLevel, content));
            }
            content.parentElement?.removeChild(content);
        });
    };
    const flatList = cloneEle.querySelectorAll(`.prosemirror-flat-list[data-list-level="${uiLevel}"]`);
    uiLevel++;
    flatList.forEach((div) => changeDiv2Ul(div, uiLevel));
};
// 处理附件 直接改为链接跳转到对应的段落
const handleAttachStyle = (cloneEle) => {
    cloneEle.querySelectorAll('.attachment-node-wrap').forEach((attach) => {
        const title = `请至One文档查看附件《${attach.getAttribute('name')}》`;
        const anchorId = attach.parentElement?.getAttribute('data-id');
        const a = document.createElement('a');
        a.target = '_blank';
        a.href = `${location.href}&anchor=${anchorId}`;
        a.innerHTML = `<span>${title}</span>`;
        attach.insertAdjacentElement('beforebegin', a);
        attach.parentElement?.removeChild(attach);
    });
};
// 处理附件 直接改为链接跳转到对应的段落
const handleIframeStyle = (cloneEle) => {
    cloneEle.querySelectorAll('.iframe-container').forEach((iframe) => {
        const anchorId = iframe?.getAttribute('data-id');
        const a = document.createElement('a');
        a.target = '_blank';
        a.href = `${location.href}&anchor=${anchorId}`;
        a.innerHTML = '<span>请至One文档查看多维表</span>';
        iframe.insertAdjacentElement('beforebegin', a);
        iframe.parentElement?.removeChild(iframe);
    });
};
// 获取远程css资源 转为text文本
const handleCssStream = async (result) => {
    if (!result.body)
        return '';
    const reader = result.body.getReader();
    const stream = await new ReadableStream({
        start(controller) {
            // The following function handles each data chunk
            function push() {
                // "done" is a Boolean and value a "Uint8Array"
                reader.read().then(({ done, value }) => {
                    // If there is no more data to read
                    if (done) {
                        controller.close();
                        return;
                    }
                    // Get the data and send it to the browser via the controller
                    controller.enqueue(value);
                    // Check chunks by logging to the console
                    push();
                });
            }
            push();
        },
    });
    const text = await new Response(stream, {
        headers: { 'Content-Type': 'text/html' },
    }).text();
    return text;
};
/**
 * 处理css
 * 线上环境 <link rel="stylesheet" type="text/css" href="/css/365.f542e1fc.css">
 * 本地环境 <style type="text/css">
 */
const handleCss = async () => {
    const styles = document.head.querySelectorAll('style');
    const links = document.head.querySelectorAll('link[type="text/css"]');
    // eslint-disable-next-line
    const remoteCSSPromise = [...links].map((link) => fetch(link.href));
    const remoteCSSResult = await Promise.allSettled(remoteCSSPromise);
    // eslint-disable-next-line
    const remoteCSSStreamPromise = remoteCSSResult.map((item) => {
        const { status, value } = item;
        if (status === 'fulfilled')
            return handleCssStream(value);
    });
    const remoteCSSStreamResult = await Promise.allSettled(remoteCSSStreamPromise);
    // eslint-disable-next-line
    const cssText = remoteCSSStreamResult.map((item) => {
        const { status, value } = item;
        if (status === 'fulfilled')
            return value;
    });
    styles.forEach((css) => cssText.push(css.innerHTML));
    return cssText;
};
const handleStyle = async (ele, cloneEle) => {
    const uiLevel = 1;
    handleImage(ele, cloneEle);
    removeWhiteBox(cloneEle);
    handleTableStyle(cloneEle);
    // handleLevelStyle(cloneEle);
    await handleMind(ele, cloneEle);
    handleUlStyle(cloneEle, uiLevel);
    handleAttachStyle(cloneEle);
    handleIframeStyle(cloneEle);
    const cssText = await handleCss();
    const cssString = cssText
        .join('')
        // 过滤UI原来的样式
        .replace(/li:before/g, 'xxx_li:before')
        .replace(/\.ul/g, '.xxx_ul')
        .replace(/\.li/g, '.xxx_li')
        .replace(/\.ol/g, '.xxx_ol')
        .replace(/\.ProseMirror ul/g, '.xxx_ul')
        .replace(/\.ProseMirror ol/g, '.xxx_ol')
        .replace(/\.ProseMirror li/g, '.xxx_li');
    const innerHtml = cloneEle.innerHTML
        // strong在word中不生效问题
        .replace(/<strong>/g, '<b>')
        .replace(/<\/strong>/g, '</b>')
        // 背景色不生效问题
        .replace(/<mark/g, '<span')
        .replace(/<\/mark>/g, '</span>')
        // 将上面生成的多个ul/ol组成一个
        .replace(/<\/ol><ol.*?>/g, '')
        .replace(/<\/ul><ul.*?>/g, '');
    // 最终生成的html字符串
    const htmlString = `<!DOCTYPE html>
      <html lang="en">
      <head>
      <style type="text/css">${cssString}</style> 
      </head>
      <body>
      <div id="q-editor">
      ${innerHtml}
      </div>
      </body>
      </html>`;
    return htmlString;
};
/**
 * 导出word
 * @param selector 导出word对应的元素
 * @param filename 导出后文件名称
 * @returns Promise
 */
function exportAsWord(selector, filename) {
    const ele = typeof selector === 'string'
        ? document.querySelector(selector)
        : selector;
    if (!ele)
        return Promise.reject();
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve) => {
        const cloneEle = ele.cloneNode(true);
        const htmlString = await handleStyle(ele, cloneEle);
        const margins = { top: 1440 };
        asBlob(htmlString, { margins }).then((data) => {
            saveAs(data, filename + '.docx');
            resolve();
        });
    });
}

/**
 * 生成水印
 * @returns base64
 */
const createWatermarkBase64 = (watermark) => {
    const defaultObj = {
        text: watermark,
        angle: 25,
        color: 'rgba(0,0,0,.08)',
        fontSize: '14px',
        top: 30,
    };
    // 角度转成负数
    defaultObj.angle = -Math.abs(defaultObj.angle);
    // 创建画布
    const canvas = document.createElement('canvas');
    // 设置画布的长、宽
    canvas.width = 160;
    canvas.height = 120;
    const context = canvas.getContext('2d');
    // 旋转角度（以弧度计）
    context.rotate((defaultObj.angle * Math.PI) / 180);
    context.font = `200 ${defaultObj.fontSize} 微软雅黑`;
    // 设置填充绘画的颜色、渐变或者模式
    context.fillStyle = defaultObj.color;
    context.textAlign = 'left';
    context.textBaseline = 'middle';
    context.fillText(defaultObj.text, 0, canvas.height);
    return canvas.toDataURL('image/png');
};
/** 克隆节点 */
const cloneElement = (selector) => {
    const ele = typeof selector === 'string'
        ? document.querySelector(selector)
        : selector;
    if (!ele)
        return;
    const cloneEle = ele.cloneNode(true);
    const { width, height } = ele.getBoundingClientRect();
    cloneEle.style.width = `${width}px`;
    cloneEle.style.height = `${height}px`;
    cloneEle.style.border = 'none';
    cloneEle.style.boxShadow = 'none';
    return cloneEle;
};
// 处理文字中换行的背景色
const handleMarkTag = (ele) => {
    const markElements = ele.querySelectorAll('mark');
    for (const sel of markElements) {
        const { height } = sel.getBoundingClientRect();
        let parentElement = sel.parentElement;
        while (parentElement?.tagName !== 'P') {
            parentElement = parentElement?.parentElement;
        }
        const { height: parentHeight } = parentElement.getBoundingClientRect();
        // mark的高度没有超过p标签的一半时 则没有换行
        if (height < parentHeight / 2)
            continue;
        // 超过一半时说明换行了 将<mark>测试文案</mark>替换为<mark>测</mark><mark>试</mark><mark>文</mark><mark>案</mark>
        const innerText = sel.innerText;
        const outHtml = sel.outerHTML;
        let newHtml = '';
        innerText.split('')?.forEach((text) => {
            newHtml += outHtml.replace(innerText, text);
        });
        sel.outerHTML = newHtml;
    }
};
/** 对克隆DOM做一些处理 */
const cleanHtml = (ele) => {
    const selectElements = ele.querySelectorAll('select');
    selectElements.forEach((sel) => (sel.style.display = 'none'));
    handleMarkTag(ele);
    const warp = document.createElement('div');
    // 图片、pdf导出背景色不是白色
    warp.style.position = 'absolute';
    warp.style.top = '0';
    warp.style.left = '-100%';
    warp.style.background = '#fff';
    warp.append(ele);
    document.body.append(warp);
    return {
        warp,
        cleanHtmlRecover: () => {
            warp.remove();
        },
    };
};

const generatePDF = (canvas, filename) => {
    // html页面生成的canvas在pdf中图片的宽高
    const contentWidth = canvas.width;
    const contentHeight = canvas.height;
    // 一页pdf显示html页面生成的canvas高度
    const pageHeight = (contentWidth / A4_PAPER_SIZE_ENUM.width) * A4_PAPER_SIZE_ENUM.height;
    // 未生成pdf的html页面高度
    let leftHeight = contentHeight;
    // 页面偏移
    let position = 0;
    const imgWidth = A4_PAPER_SIZE_ENUM.width;
    const imgHeight = (A4_PAPER_SIZE_ENUM.width / contentWidth) * contentHeight;
    const pageData = canvas.toDataURL('image/jpeg', 1.0);
    const PDF = new JsPDF('p', 'pt', 'a4');
    // 当内容未超过pdf一页显示的范围，无需分页
    if (leftHeight < pageHeight) {
        // addImage(pageData, 'JPEG', 左，上，宽度，高度)设置
        PDF.addImage(pageData, 'JPEG', 0, 0, imgWidth, imgHeight);
    }
    else {
        // 超过一页时，分页打印（每页高度841.89）
        while (leftHeight > 0) {
            PDF.addImage(pageData, 'JPEG', 0, position, imgWidth, imgHeight);
            leftHeight -= pageHeight;
            position -= A4_PAPER_SIZE_ENUM.height;
            if (leftHeight > 0) {
                PDF.addPage();
            }
        }
    }
    PDF.save(filename + '.pdf');
};
/**
 * 导出pdf
 * @param selector 导出pdf对应的元素
 * @param filename 导出后文件名称
 * @returns Promise
 */
function exportAsPdf(selector, filename) {
    const cloneEle = cloneElement(selector);
    if (!cloneEle)
        return Promise.reject();
    const { warp, cleanHtmlRecover } = cleanHtml(cloneEle);
    return new Promise((resolve) => {
        Html2canvas(warp, {
            useCORS: true,
            scale: window.devicePixelRatio * 2, // 增加清晰度
        })
            .then((canvas) => generatePDF(canvas, filename))
            .finally(() => {
            cleanHtmlRecover();
            resolve();
        });
    });
}

/**
 * 导出图片
 * @param selector 导出图片对应的元素
 * @param filename 导出后文件名称
 * @param needWatermark 是否需要水印
 * @returns Promise
 */
function exportAsImage(selector, filename, needWatermark) {
    const cloneEle = cloneElement(selector);
    if (!cloneEle)
        return Promise.reject();
    if (needWatermark) {
        const base64 = createWatermarkBase64('水印');
        cloneEle.style.backgroundImage = `url('${base64}')`;
    }
    const { warp, cleanHtmlRecover } = cleanHtml(cloneEle);
    return new Promise((resolve) => {
        Html2canvas(warp, {
            useCORS: true,
            scale: window.devicePixelRatio * 2, // 增加清晰度
        })
            .then((canvas) => {
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

export { exportAsImage, exportAsPdf, exportAsWord };
