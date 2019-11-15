/* Copyright (C) 2019 Team SaveTheLogin <https://savethelogin.world/> */
import Inspect from './Inspect';
import { browser } from '../../common/Utils';

browser.tabs.onRemoved.addListener(Inspect.onRemoved);
browser.webRequest.onResponseStarted.addListener(
  Inspect.onResponseStarted,
  { urls: ['https://*/*', 'http://*/*'] },
  ['responseHeaders']
);
