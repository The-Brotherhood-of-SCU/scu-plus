export async function ocr_external(imageElement: HTMLImageElement, provider: string): Promise<string> {
    const width = imageElement.naturalWidth || imageElement.width;
    const height = imageElement.naturalHeight || imageElement.height;
    if (!width || !height) {
      throw new Error('Captcha image size is invalid');
    }

    // 获取图片的base64编码
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not create canvas context');
    }
    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(imageElement, 0, 0, width, height);
    const imageData = canvas.toDataURL('image/png');
  
    // 去除base64前缀
    const base64String = imageData.split(',')[1];
    if (!base64String || base64String.length < 32) {
      throw new Error('Captcha base64 payload is invalid');
    }
  
    // 构造请求体
    const body = JSON.stringify({
      img: base64String
    });
  
    try {
      // 发送POST请求到服务器
      const response = await fetch(provider, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: body,
      });
  
      // 解析响应
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      const text = String(result?.result ?? result?.data ?? "").trim();
      return text;
    } catch (error) {
      throw error;
    }
  }
  
