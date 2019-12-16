/** @copyright (C) 2019 Team SaveTheLogin <https://savethelogin.world/> */
import config from '@/common/Config';
import Phishing from './Phishing';

const { API_URL } = config;

chrome.tabs.onUpdated.addListener(Phishing.onUpdated);
chrome.runtime.onConnect.addListener(Phishing.onConnect);
