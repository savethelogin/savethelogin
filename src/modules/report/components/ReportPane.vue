<!-- Copyright (C) 2019 Team SaveTheLogin <https://savethelogin.world/> -->
<template>
  <div class="col-12 mb-3">
    <h4 class="mb-2 mt-3">Report</h4>
    <div v-if="capture">
      <vue-cropper
        ref="cropper"
        id="capture"
        v-bind:viewMode="2"
        v-bind:ready="captureReady"
        dragMode="move"
        v-bind:src="capture"
        alt="Source Image"
        v-bind:guides="false"
        v-bind:minContainerWidth="520"
        v-bind:minContainerHeight="300"
      />
    </div>
    <div class="mt-3">
      <div class="btn-group float-left">
        <BaseButton theme="primary" v-bind:callback="capturePage" v-chrome-i18n>
          __MSG_capture__
        </BaseButton>
        <BaseButton
          theme="primary"
          v-bind:callback="captureCrop"
          v-bind:disabled="capture === ''"
          v-chrome-i18n
        >
          __MSG_crop__
        </BaseButton>
      </div>
      <div class="btn-group float-right">
        <BaseButton
          theme="dark"
          class="float-right"
          v-bind:callback="captureDownload"
          v-bind:disabled="capture === ''"
          v-chrome-i18n
        >
          __MSG_download__
        </BaseButton>
      </div>
      <div class="clearfix"></div>
    </div>
  </div>
</template>

<script>
import config from '@/common/Config';
const { PROJECT_PREFIX } = config;

import { getBrowser, openDefaultPort } from '@/common/Utils';

export default {
  data() {
    return {
      capture: '',
    };
  },
  methods: {
    _getCroppedImage: function() {
      return new Promise((resolve, reject) => {
        this.$refs.cropper.getCroppedCanvas().toBlob(blob => {
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve(reader.result);
          };
          reader.readAsDataURL(blob);
        });
      });
    },
    captureSetImage: function(dataUrl) {
      this.capture = dataUrl;
      this.$nextTick(() => {
        this.$refs.cropper.replace(dataUrl);
      });
    },
    capturePage: function() {
      chrome.tabs.captureVisibleTab(undefined, { format: 'png' }, dataUrl => {
        this.captureSetImage(dataUrl);
      });
    },
    captureCrop: async function() {
      let croppedImage = await this._getCroppedImage();
      this.captureSetImage(croppedImage);
    },
    captureReady: function(e) {
      const canvasData = this.$refs.cropper.getCanvasData();
      const cropBoxData = this.$refs.cropper.getCropBoxData();

      cropBoxData.left = canvasData.left;
      cropBoxData.top = canvasData.top;
      cropBoxData.width = canvasData.width;
      cropBoxData.height = canvasData.height;

      this.$refs.cropper.setCropBoxData(cropBoxData);
    },
    captureDownload: async function(e) {
      let imgUrl = await this._getCroppedImage();
      let options = {
        url: imgUrl,
        filename: `${PROJECT_PREFIX}_report.png`,
      };
      if (getBrowser() !== 'firefox') {
        chrome.downloads.download(options);
      } else {
        let port = openDefaultPort();
        port.postMessage({
          type: 'download_firefox',
          data: options,
        });
      }
    },
  },
};
</script>

<style>
#capture img {
  max-width: 100%;
  max-height: 300px;
}
</style>
