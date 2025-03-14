# ocr服务有多种实现
- python: 由ddddocr提供OCR能力
- rust: 由rten提供OCR能力

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


