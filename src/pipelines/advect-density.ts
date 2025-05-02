import advectDensityShader from "../compute-shaders/advect-density.wgsl";
import { createInInOutBindGroupLayout } from "../bind-group-layouts/in-in-out-layout";

export const createAdvectDensityPipeline = (device: GPUDevice) => {
  return device.createComputePipeline({
    layout: device.createPipelineLayout({
      bindGroupLayouts: [createInInOutBindGroupLayout(device)],
    }),
    compute: {
      module: device.createShaderModule({
        code: advectDensityShader,
      }),
      entryPoint: "computeMain",
    },
  });
};
