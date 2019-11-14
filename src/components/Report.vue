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
    <div class="btn-group mt-3">
      <button type="button" class="btn btn-primary" v-on:click="capturePage">Capture</button>
      <button type="button" class="btn btn-primary" v-on:click="captureCrop">Crop</button>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      capture: '',
    };
  },
  methods: {
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
    captureCrop: function() {
      this.$refs.cropper.getCroppedCanvas().toBlob(blob => {
        const reader = new FileReader();
        reader.onloadend = () => {
          this.captureSetImage(reader.result);
        };
        reader.readAsDataURL(blob);
      });
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
  },
};
</script>

<style>
#capture img {
  max-width: 100%;
  max-height: 300px;
}
</style>
