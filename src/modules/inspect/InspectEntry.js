/* Copyright (C) 2019 Team SaveTheLogin <https://savethelogin.world/> */
import Inspect from './Inspect';

chrome.webRequest.onResponseStarted.addListener(
  Inspect.onResponseStarted,
  { urls: ['https://*/*', 'http://*/*'] },
  ['responseHeaders']
);
