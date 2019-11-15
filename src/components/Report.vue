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
        <button type="button" class="btn btn-primary" v-on:click="capturePage">Capture</button>
        <button type="button" class="btn btn-primary" v-on:click="captureCrop">Crop</button>
      </div>
      <div class="btn-group float-right">
        <button type="button" class="btn btn-dark float-right" v-on:click="captureDownload">
          Download
        </button>
      </div>
      <div class="clearfix"></div>
    </div>
  </div>
</template>

<script>
import config from '../common/Config';
const { PROJECT_PREFIX } = config;

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
      chrome.downloads.download({
        url: imgUrl,
        filename: `${PROJECT_PREFIX}_report.png`,
      });
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
