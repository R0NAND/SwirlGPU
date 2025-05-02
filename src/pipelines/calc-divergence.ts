import calcDivergenceShader from "../compute-shaders/calc-divergence.wgsl";
import { createCalcDivergenceBindGroupLayout } from "../bind-group-layouts/calc-divergence-layout";

export const createCalcDivergencePipeline = (device: GPUDevice) => {
  return device.createComputePipeline({
    layout: device.createPipelineLayout({
      bindGroupLayouts: [createCalcDivergenceBindGroupLayout(device)],
    }),
    compute: {
      module: device.createShaderModule({
        code: calcDivergenceShader,
      }),
      entryPoint: "computeMain",
    },
  });
};
