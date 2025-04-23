export async function ocr_external(imageElement: HTMLImageElement, provider: string): Promise<string> {
    // 获取图片的base64编码
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not create canvas context');
    }
    canvas.width = imageElement.width;
    canvas.height = imageElement.height;
    ctx.drawImage(imageElement, 0, 0);
    const imageData = canvas.toDataURL('image/png');
  
    // 去除base64前缀
    const base64String = imageData.split(',')[1];
  
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
      return result.result;
    } catch (error) {
      console.error('Error during OCR request:', error);
      throw error;
    }
  }
  