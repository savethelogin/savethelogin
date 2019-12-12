/* Copyright (C) 2019 Team SaveTheLogin <https://savethelogin.world/> */
import Inspect from './Inspect';

chrome.tabs.onRemoved.addListener(Inspect.onRemoved);
chrome.webRequest.onResponseStarted.addListener(
  Inspect.onResponseStarted,
  { urls: ['https://*/*', 'http://*/*'] },
  ['responseHeaders']
);
