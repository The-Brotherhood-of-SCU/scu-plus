# ocr服务有多种实现

|名称|OCR库|HTTP版本|SSL支持|Note|
|:---:|:---:|:---:|:---:|:---|
|python|ddddocr|1.0|✅|简单易部署|
|rust|rten|1.1|❌|速度慢，效果差，不推荐|
|rust2|ddddocr-rust|2|✅|效率高速度快|

# HTTP协议
客户端发起POST请求
- POST /ocr

body
```json
{
    "img":"<base64>"
}
```
response
```json
{
    "result":"<ocr result>"
}
```


