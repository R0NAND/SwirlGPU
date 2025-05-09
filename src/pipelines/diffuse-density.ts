import diffuseDensityShader from "../compute-shaders/diffuse-density.wgsl";
import { createInOutBindGroupLayout } from "../bind-group-layouts/in-out-layout";
import { createSimParamsBindGroupLayout } from "../bind-group-layouts/sim-params-layout";

export const createDiffuseDensityPipeline = (device: GPUDevice) => {
  return device.createComputePipeline({
    label: "diffuse density pipeline",
    layout: device.createPipelineLayout({
      bindGroupLayouts: [
        createSimParamsBindGroupLayout(device),
        createInOutBindGroupLayout(device),
      ],
    }),
    compute: {
      module: device.createShaderModule({
        code: diffuseDensityShader,
      }),
      entryPoint: "computeMain",
    },
  });
};
