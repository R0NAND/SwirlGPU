import vtxOverlayShdr from "../vertex-shaders/vertex-overlay.wgsl";
import renderShdr from "../fragment-shaders/renderer.wgsl";

export const createRenderPipeline = (
  device: GPUDevice,
  canvasFormat: GPUTextureFormat
) => {
  return device.createRenderPipeline({
    layout: "auto",
    vertex: {
      module: device.createShaderModule({ code: vtxOverlayShdr }),
      entryPoint: "vs_main",
    },
    fragment: {
      module: device.createShaderModule({ code: renderShdr }),
      entryPoint: "main",
      targets: [
        {
          format: canvasFormat,
        },
      ],
    },
  });
};
