# ocr服务有多种实现

|名称|OCR库|Note|
|:---:|:---:|:---|
|python|ddddocr||
|rust|rten|速度慢，效果差，不推荐|
|rust2|ddddocr-rust||

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


