import diffuseDensityShader from "../compute-shaders/diffuse-density.wgsl";
import { createInOutBindGroupLayout } from "../bind-group-layouts/in-out-layout";

export const createDiffuseDensityPipeline = (device: GPUDevice) => {
  return device.createComputePipeline({
    layout: device.createPipelineLayout({
      bindGroupLayouts: [createInOutBindGroupLayout(device)],
    }),
    compute: {
      module: device.createShaderModule({
        code: diffuseDensityShader,
      }),
      entryPoint: "computeMain",
    },
  });
};
