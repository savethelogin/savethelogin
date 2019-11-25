function stripTags(string) {
  return string.replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function nl2br(string) {
  return string.replace(/\r?\n/g, '<br>');
}

function map(arr, callback) {
  let i;
  let ret = [];
  for (i = 0; i < arr.length; ++i) {
    ret.push(callback(arr[i]));
  }
  return ret;
}

function r1(match, p1, offset, string) {
  return nl2br(chrome.i18n.getMessage(p1.trim()));
}

function r2(match, p1, offset, string) {
  return stripTags(this.data[p1.trim()]);
}

// Constructor
export default class SimpleTemplate {
  constructor(obj) {
    if (!obj || !obj.target) return;

    this.data = obj.data;

    let i;
    let p1 = /\{\{\s([^\{\}]+?)\s\}\}/g;
    let p2 = /\$\{\s([^\}]+?)\s\}/g;
    let target = document.querySelector(obj.target);
    let innerHTML = target.innerHTML;
    if (!innerHTML.match(p1) && !innerHTML.match(p2)) return;

    innerHTML = innerHTML.replace(p1, r1);
    target.innerHTML = innerHTML.replace(p2, r2.bind(this));
  }
}

if (typeof window !== 'undefined') {
  window.SimpleTemplate = SimpleTemplate;
}
