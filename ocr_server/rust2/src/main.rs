use serde::{Deserialize, Serialize};
use warp::{http::StatusCode, Rejection, Reply};
use base64::{ engine::GeneralPurpose, prelude::BASE64_STANDARD, Engine};
mod ocr;
use std::{fs::{self, File}, io::{self, Write}, sync::{Arc, Mutex}};

use warp::Filter;

static BASE64_ENGINE: GeneralPurpose =BASE64_STANDARD;

#[tokio::main]
async fn main() {
    let config = load_config().unwrap_or_else(|err| {
        eprintln!("Failed to load config: {}", err);
        std::process::exit(1);
    });
    serve(&config).await;
}
fn load_config() -> Result<Config, io::Error> {
    match fs::read_to_string("config.json") {
        Ok(json_str) => {
            let config: Config = serde_json::from_str(&json_str)?;
            Ok(config)
        }
        Err(_) => {
            let default_config = Config {
                port: 80,
                host: "0.0.0.0".to_string(),
                https_enable: false,
                https_cert: "".to_string(),
                https_key: "".to_string(),
            };
            let json_str = serde_json::to_string_pretty(&default_config)?;
            let mut file = File::create("config.json")?;
            file.write_all(json_str.as_bytes())?;
            println!("config.json文件创建成功");
            Ok(default_config)
        }
    }
}
async fn serve(config: &Config) {
    use std::net::Ipv4Addr;
    let host_parts: Vec<u8> = config.host.split('.')
        .filter_map(|part| part.parse::<u8>().ok())
        .collect();
    assert!(host_parts.len() == 4);
    let ip = Ipv4Addr::new(host_parts[0], host_parts[1], host_parts[2], host_parts[3]);

    let ocr_service=Arc::new(Mutex::new(ocr::OCR::new()));

    let cors = warp::cors().allow_any_origin().allow_methods(vec!["GET", "POST"]).allow_header("Content-Type");
    let routes = warp::get()
        .and(warp::path::end())
        .map(|| warp::reply::html("server is running"))
        .or(
            warp::post()
                .and(warp::path("ocr"))
                .and(warp::body::json())
                .and_then(move|request|{handle_post(request,Arc::clone(&ocr_service))})
        )
        .recover(handle_rejection).with(cors);

    println!("server is running on {}:{}", config.host, config.port);

    if config.https_enable {
        // 启动 HTTPS 服务器
        warp::serve(routes)
           .tls()
           .cert_path(&config.https_cert)
           .key_path(&config.https_key)
           .run((ip, config.port))
           .await;
    } else {
        // 启动 HTTP 服务器
        warp::serve(routes)
           .run((ip, config.port))
           .await;
    }
}
// 处理 POST 请求的函数
async fn handle_post(request: OcrRequest,ocr_service:Arc<Mutex<ocr::OCR>>) -> Result<impl Reply, Rejection> {
    match BASE64_ENGINE.decode(&request.img) {
        Ok(bytes) => {
            let mut service= ocr_service.lock().unwrap();
            let result=service.ocr(&bytes);
            match result{
                Some(v)=>{
                    let ocr_result=OcrResult{result:v};
                    let json=serde_json::to_string(&ocr_result).unwrap();
                    return Ok(warp::reply::with_status(json, StatusCode::OK));
                },
                None=>{
                    return Ok(warp::reply::with_status("ocr error".to_string(), StatusCode::BAD_REQUEST));
                }
            }
        }
        Err(err) => {
            return Ok(warp::reply::with_status(format!("base64 error:{}",err.to_string()), StatusCode::BAD_REQUEST));
        }
    }
}

// 处理路由错误的函数
async fn handle_rejection(err: Rejection) -> Result<impl Reply, std::convert::Infallible> {
    let code;
    let message;

    if err.is_not_found() {
        code = StatusCode::NOT_FOUND;
        message = "Not Found";
    } else if let Some(_) = err.find::<warp::reject::MethodNotAllowed>() {
        code = StatusCode::METHOD_NOT_ALLOWED;
        message = "Method Not Allowed";
    } else {
        // 其他错误返回内部服务器错误
        code = StatusCode::INTERNAL_SERVER_ERROR;
        message = "Server Error";
    }

    Ok(warp::reply::with_status(message, code))
}

#[derive(Debug, Deserialize, Serialize)]
struct Config {
    port: u16,
    host: String,
    https_enable: bool,
    https_cert: String,
    https_key: String,
}

#[derive(Deserialize)]
struct OcrRequest {
    img: String,
}
#[derive(Debug, Serialize)]
struct  OcrResult{
    result:String,
}