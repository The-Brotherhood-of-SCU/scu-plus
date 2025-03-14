use ddddocr::Ddddocr;
pub(crate) struct OCR {
    ocr_service:Ddddocr<'static>,
}
impl OCR  {
    pub fn new()->Self{
        let mut ddddocr=ddddocr::ddddocr_classification().unwrap();
        ddddocr.set_ranges(6);//小写字母 a-z + 大写字母A-Z + 整数0-9
        Self {
            ocr_service:ddddocr
        }
    }
    pub fn ocr<I>(&mut self,image:I)->Option<String> where I:AsRef<[u8]>{
        let result= self.ocr_service.classification(image, false);
        match result{
            Ok(v)=>Some(v),
            Err(e)=>None,
        }
    }
}