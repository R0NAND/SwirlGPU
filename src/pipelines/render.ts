import vtxOverlayShdr from "../vertex-shaders/vertex-overlay.wgsl";
import renderShdr from "../fragment-shaders/renderer.wgsl";
import { createInOutBindGroupLayout } from "../bind-group-layouts/in-out-layout";
import { createSimParamsBindGroupLayout } from "../bind-group-layouts/sim-params-layout";

export const createRenderPipeline = (
  device: GPUDevice,
  canvasFormat: GPUTextureFormat
) => {
  return device.createRenderPipeline({
    label: "render pipeline",
    layout: device.createPipelineLayout({
      bindGroupLayouts: [
        createSimParamsBindGroupLayout(device),
        createInOutBindGroupLayout(device),
      ],
    }),
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
