import {
  Button,
  Form,
  FloatingLabel,
  Dropdown,
  DropdownButton,
  Modal,
} from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";
import React, { useState, useRef, useEffect } from "react";
import axios from "axios";

import hero from "./img/hero.png";
import "bootstrap/dist/css/bootstrap.min.css";
import { MdVideoCall } from "react-icons/md";
import { BsCheckCircleFill } from "react-icons/bs";
import SparkMD5 from "spark-md5";

import NavBar from "./component/NavBar";

function App() {
  const [file, setFile] = useState(null);
  //const [hash, setHash] = useState(null);
  const [convertSize, setConvertSize] = useState("Choose a resolution...");
  const [resURL, setResURL] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Modal
  const [show, setShow] = useState(false);
  const handleClose = () => setShow(false);

  const inputRef = useRef(null);

  //const baseURL = "http://54.66.189.126:3000";
  const baseURL =
    "http://n10966790a2-1578001391.ap-southeast-2.elb.amazonaws.com";

  // Upload with URL
  const handleVideoURL = () => {
    let videoURL = inputRef.current.value;
    console.log("tiktok", videoURL);
    var spark = new SparkMD5();
    spark.append(videoURL);
    var hash = spark.end();
    console.log(hash);  
    if (videoURL !== null && convertSize !== "Choose a resolution...") {
      setError(null);
      setLoading(true);
      axios
        .post(`${baseURL}/video/checkOnline`, {
          url: videoURL,
          hash: hash,
          size: convertSize,
        })
        .then((res) => {
          if (res.status === 202) {
            setShow(false);
            setError(res.data);
            setResURL(null);
          } else {
            setError(false);
            setResURL(res.data);
            setShow(true);
          }
          console.log(res);
          console.log("res", res.data);
          console.log("resURL", resURL);
          setLoading(false);
        });
    } else {
      setError(
        "Please ensure that you have provided a video and chosen a resolution"
      );
      setShow(false);
      setResURL(null);
    }
  }; // End of upload with url

  // Upload with file
  const changeHandler = (event) => {
    console.log(event.target.files)
    setFile(event.target.files[0]);
  };


  const getFileMD5 = () => {
  return new Promise((resolve,reject)=>{
    console.log(file)
      var blobSlice =
          File.prototype.slice ||
          File.prototype.mozSlice ||
          File.prototype.webkitSlice,
        chunkSize = 2097152, // Read in chunks of 2MB
        chunks = Math.ceil(file.size / chunkSize),
        currentChunk = 0,
        spark = new SparkMD5.ArrayBuffer(),
        fileReader = new FileReader();
       fileReader.onload = function(e) {
        console.log("read chunk nr", currentChunk + 1, "of", chunks);
        spark.append(e.target.result); // Append array buffer
        currentChunk++;
        if (currentChunk < chunks) {
          loadNext();
        } else {
          resolve(spark.end())
        }
      };
      fileReader.onerror = function() {
        console.warn("oops, something went wrong.");
      };
      function loadNext() {
        var start = currentChunk * chunkSize,
          end = start + chunkSize >= file.size ? file.size : start + chunkSize;
        fileReader.readAsArrayBuffer(blobSlice.call(file, start, end));
      }
      loadNext();
  })     
  };

  const handleSubmission = async (event) => {
    event.preventDefault()
    const hash=await getFileMD5()
    console.log("hash: " + hash)
    try {
      setLoading(true);
      setError(null);
      axios({
        method: "get",
        url: `${baseURL}/video/checkUpload`,
        params: {
          hash: hash,
          size: convertSize,
          filetype: file.type,
        },
      }).then(function(res) {
        console.log(res);
        if (res.status === 200) {
          if (res.data.hasOwnProperty("PresignedURL")) {
            axios
              .put(res.data.PresignedURL, file, {
                headers: {
                  "Content-Type": file.type,
                },
              })
              .then(function(res) {
                if (res.status === 200) {
                  axios
                    .get(`${baseURL}/video/convertNewUpload`, {
                      params: {
                        hash: hash,
                        size: convertSize,
                      },
                    })
                    .then(function(result) {
                      console.log("result", result);
                      if (result.status === 200) {
                        // upload new video
                        setResURL(result.data);
                        setShow(true);
                        setError(false);
                        setLoading(false);
                      }
                    });
                } else {
                  setError("Video upload fail. Please try again.");
                  setLoading(false);
                }
              });
          } else {
            // upload old video
            setResURL(res.data);
            setShow(true);
            setError(false);
            setLoading(false);
          }
        } else {
          setError("Process fail. Please try again.");
        }
      });
    } catch (error) {
      console.log(error);
    }
  }; //End of upload with file

  return (
    <div className="App">
      <NavBar />
      <div class="container">
        <h1 class="py-5">
          Convert Video <br></br>To Any Size!
        </h1>
        
        <img src={hero} height="280px"></img>
        <p class="label mb-5">
          <BsCheckCircleFill className="icon-padding" />
          Unlimited download
          <span class="mx-4"></span>
          <span>
            <BsCheckCircleFill className="icon-padding" />
            No watermark
          </span>
        </p>
        <p class="instruction">Step 1: Choose an output size</p>
        <DropdownButton id="dropdown-item-button" title={convertSize}>
          <Dropdown.Item
            as="button"
            onClick={() => {
              setConvertSize("640x360");
            }}
          >
            360P
          </Dropdown.Item>
          <Dropdown.Item
            as="button"
            onClick={() => {
              setConvertSize("854x480");
            }}
          >
            480P
          </Dropdown.Item>
          <Dropdown.Item
            as="button"
            onClick={() => {
              setConvertSize("1280x720");
            }}
          >
            720P
          </Dropdown.Item>
          <Dropdown.Item
            as="button"
            onClick={() => {
              setConvertSize("1920x1080");
            }}
          >
            1080P
          </Dropdown.Item>
        </DropdownButton>

        <p class="instruction">
          Step 2: Upload a video with URL or choose file (only mp4)
        </p>
        <div class="d-flex">
          <FloatingLabel
            controlId="floatingInput"
            label="Paste the video URL here..."
            className="mb-3 mx-5"
            id="video-floating-label"
          >
            <Form.Control
              id="video-url"
              type="text"
              placeholder="Paste the video URL here..."
              ref={inputRef}
            />
          </FloatingLabel>

          <Button id="process-video" onClick={handleVideoURL} variant="warning">
            <span class="icon-padding">
              <MdVideoCall fontSize="24px" />
            </span>
            Process URL
          </Button>
        </div>
        <p>or</p>

        <div class="d-flex">
          <input
            onChange={changeHandler}
            class="form-control  mx-5"
            type="file"
            accept=".mp4"
            id="formFile"
          />

          <Button
            id="process-video"
            onClick={(event) => {
              if (
                file === null ||
                file === undefined ||
            
                convertSize === "Choose a resolution..." 
              ) {
                setError(
                  "Please ensure that you have uploaded a file or selected a resolution"
                );
              } else {
                //getFileMD5(event);
                handleSubmission(event)
              }
            }}
            variant="warning"
          >
            <span class="icon-padding">
              <MdVideoCall fontSize="24px" />
            </span>
            Process File
          </Button>
        </div>

        {error ? (
          <div>
            <p class="my-3 error">{error}</p>
          </div>
        ) : (
          <></>
        )}
      </div>

      {loading ? (
        <div class="spinner-grow my-3" role="status">
          <span class="sr-only"></span>
        </div>
      ) : (
        <></>
      )}

      {show ? (
        <div>
          <Modal
            show={show}
            onHide={handleClose}
            backdrop="static"
            keyboard={false}
            centered
            size="lg"
          >
            <Modal.Header closeButton>
              <Modal.Title>Your video is ready for download!</Modal.Title>
            </Modal.Header>
            <Modal.Body class="mx-auto my-5">
              <iframe src={resURL} title="ProcessedVideo"></iframe>
            </Modal.Body>
            <Modal.Footer>
              <a href={resURL} target="_blank" rel="noopener noreferrer">
                <Button className="btn btn-dark">View Now</Button>
              </a>
              <Button variant="secondary" onClick={handleClose}>
                Close
              </Button>
            </Modal.Footer>
          </Modal>
        </div>
      ) : (
        <> </>
      )}

      <div className="m-5 pt-5"> Copyright by MeowConvert 2022</div>
    </div>
  );
}

export default App;
