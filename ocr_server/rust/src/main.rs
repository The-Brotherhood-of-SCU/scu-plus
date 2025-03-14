use base64::{Engine as _, engine::general_purpose};
use http_body_util::{BodyExt, Full, combinators::BoxBody};
use hyper::body::{Bytes, Incoming};
use hyper::server::conn::http1;
use hyper::service::service_fn;
use hyper::{Method, Request, Response};
use hyper_util::{rt::TokioIo, server::graceful::GracefulShutdown};
use image;
use lazy_static::lazy_static;
use ocrs::{ImageSource, OcrEngine, OcrEngineParams};
use rten::Model;
#[allow(unused)]
use rten_tensor::prelude::*;
use serde_json::{Value, json};
use std::net::SocketAddr;
use std::path::PathBuf;
use tokio::net::TcpListener;

const DETECTION_MODEL_PATH: &str = "ocr_models/text-detection.rten";
const RECOGNITION_MODEL_PATH: &str = "ocr_models/text-recognition.rten";

lazy_static! {
    static ref ocr_engine: OcrEngine = {
        let detection_model = Model::load_file(get_path(DETECTION_MODEL_PATH)).unwrap();
        let recognition_model = Model::load_file(get_path(RECOGNITION_MODEL_PATH)).unwrap();
        OcrEngine::new(OcrEngineParams {
            detection_model: Some(detection_model),
            recognition_model: Some(recognition_model),
            ..Default::default()
        })
        .unwrap()
    };
}

macro_rules! create_error_response {
    ($error_message:expr) => {
        create_error_response!($error_message, 500)
    };
    ($error_message:expr, $status_code:expr) => {
        Response::builder().status($status_code).body(make_body((json!({"error":$error_message})).to_string())).unwrap()
    }
}

#[tokio::main]
async fn main() {
    let addr = SocketAddr::from(([0, 0, 0, 0], 8497));
    let listener = TcpListener::bind(addr).await.unwrap();
    #[allow(unused_mut)]
    let mut http_server = http1::Builder::new();
    let graceful = GracefulShutdown::new();
    let mut signal = std::pin::pin!(shutdown_signal());

    println!("Server has started at {}!", addr.to_string());
    loop {
        tokio::select! {
            Ok((stream, _)) = listener.accept() => {
                let io = TokioIo::new(stream);
                let connection = http_server.serve_connection(io, service_fn(handle_ocr));
                let future = graceful.watch(connection);
                tokio::task::spawn(async move {
                if let Err(err) = future.await{
                        eprintln!("error handling connection: {}", err);
                    }
                });
            },

            _ = &mut signal => {
                eprintln!("signal received, shutting down");
                break;
            }
        }
    }

    tokio::select! {
        _ = graceful.shutdown() => {
            eprintln!("shutdown complete");
        },
        _ = tokio::time::sleep(tokio::time::Duration::from_secs(10)) => {
            eprintln!("timed out waiting for all connections to close");
        }
    }
}

async fn handle_ocr(
    request: Request<Incoming>,
) -> Result<Response<BoxBody<Bytes, hyper::Error>>, hyper::Error> {
    //println!("received request: {:?}", request);
    match (request.method(), request.uri().path()) {
        (&Method::OPTIONS, _) => Ok(Response::builder()
            .status(200)
            .header("Access-Control-Allow-Origin", "*")
            .header("Access-Control-Allow-Methods", "POST, OPTIONS")
            .header("Access-Control-Allow-Headers", "Content-Type")
            .body(make_body(String::from("")))
            .unwrap()),
        (&Method::GET, _) => Ok(Response::builder()
            .status(200)
            .header("Content-type", "application/json")
            .body(make_body(String::from("hanfeng makes SCU great again!")))
            .unwrap()),
        (&Method::POST, "/ocr") => {
            let content_length = match request.headers()["Content-Length"].to_str() {
                Ok(length) => match length.parse::<usize>() {
                    Ok(length) => length,
                    Err(err) => {
                        return Ok(create_error_response!(format!(
                            "invalid Content-Length: {}",
                            err
                        )));
                    }
                },
                Err(err) => return Ok(create_error_response!(err.to_string())),
            };
            let body_text = match String::from_utf8(request.collect().await?.to_bytes().to_vec()) {
                Ok(text) => text,
                Err(err) => {
                    return Ok(create_error_response!(format!(
                        "Invalid body: {}",
                        err.to_string()
                    )));
                }
            };
            let post_json = match serde_json::from_str::<Value>(&body_text[0..content_length]) {
                Ok(data) => data,
                Err(err) => {
                    return Ok(create_error_response!(format!(
                        "failed to handle the json: {}",
                        err.to_string()
                    )));
                }
            };
            let image_data = match post_json.get("img") {
                Some(img) => match img.as_str() {
                    Some(data) => data,
                    None => return Ok(create_error_response!("invalid img")),
                },
                None => {
                    return Ok(create_error_response!(
                        "Require a Json Object which contains an attribute named \"img\""
                    ));
                }
            };
            let captcha_image = match general_purpose::STANDARD.decode(&image_data) {
                Ok(raw_data) => match image::load_from_memory(&raw_data).map(|i| i.into_rgb8()) {
                    Ok(image_data) => image_data,
                    Err(err) => {
                        return Ok(create_error_response!(format!(
                            "invalid image data: {}",
                            err
                        )));
                    }
                },
                Err(err) => return Ok(create_error_response!(format!("invalid base64: {}", err))),
            };
            let ocr_input =
                match ImageSource::from_bytes(captcha_image.as_raw(), captcha_image.dimensions()) {
                    Ok(data) => match ocr_engine.prepare_input(data) {
                        Ok(input) => input,
                        Err(err) => {
                            return Ok(create_error_response!(format!(
                                "invalid ocr input: {}",
                                err
                            )));
                        }
                    },
                    Err(err) => {
                        return Ok(create_error_response!(format!(
                            "invalid captcha image: {}",
                            err
                        )));
                    }
                };
            let captcha_text = match ocr_engine.get_text(&ocr_input) {
                Ok(text) => text,
                Err(err) => {
                    return Ok(create_error_response!(format!(
                        "failed to obtain captcha text: {}",
                        err
                    )));
                }
            };
            Ok(Response::builder()
                .status(200)
                .header("Content-Type", "application/json")
                .header("Access-Control-Allow-Origin", "*")
                .body(make_body(json!({"result":captcha_text}).to_string()))
                .unwrap())
        }
        _ => Ok(Response::builder()
            .status(404)
            .body(make_body(String::from("404 Not Found")))
            .unwrap()),
    }
}

fn get_path(path: &str) -> String {
    let mut file_path = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    file_path.push(path);
    file_path.to_str().unwrap().to_string()
}

async fn shutdown_signal() {
    tokio::signal::ctrl_c()
        .await
        .expect("failed to install CTRL+C signal handler");
}

fn make_body<T: Into<Bytes>>(text: T) -> BoxBody<Bytes, hyper::Error> {
    Full::new(text.into()).map_err(|err| match err {}).boxed()
}
