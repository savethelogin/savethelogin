<!-- Copyright (C) 2019 Team SaveTheLogin <https://savethelogin.world/> -->
<template>
  <div class="col-12 mb-3">
    <div v-if="capture">
      <vue-cropper
        id="capture"
        v-bind:ready="captureReady"
        ref="cropper"
        dragMode="move"
        v-bind:src="capture"
        alt="Source Image"
      />
    </div>
    <button type="button" v-on:click="capturePage">Capture test</button>
    <button type="button" v-on:click="captureCrop">Crop</button>
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
      this.$refs.cropper.replace(dataUrl);
      const image = document.querySelector('#capture img');
    },
    capturePage: function() {
      chrome.tabs.captureVisibleTab(undefined, { format: 'png' }, dataUrl => {
        this.captureSetImage(dataUrl);
      });
    },
    captureCrop: function() {
      this.$refs.cropper.getCroppedCanvas().toBlob(blob => {
        var reader = new FileReader();
        reader.onloadend = () => {
          console.log(reader.result);
          this.captureSetImage(reader.result);
          console.log(this.$refs.cropper.getData(true));
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

<style scoped></style>
