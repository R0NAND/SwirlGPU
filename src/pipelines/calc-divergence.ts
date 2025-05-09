import calcDivergenceShader from "../compute-shaders/calc-divergence.wgsl";
import { createInOutBindGroupLayout } from "../bind-group-layouts/in-out-layout";
import { createSimParamsBindGroupLayout } from "../bind-group-layouts/sim-params-layout";
import { createBufferBindGroupLayout } from "../bind-group-layouts/buffer-layout";

export const createCalcDivergencePipeline = (device: GPUDevice) => {
  return device.createComputePipeline({
    label: "calc divergence pipeline",
    layout: device.createPipelineLayout({
      bindGroupLayouts: [
        createSimParamsBindGroupLayout(device),
        createInOutBindGroupLayout(device),
        createBufferBindGroupLayout(device),
        createBufferBindGroupLayout(device),
      ],
    }),
    compute: {
      module: device.createShaderModule({
        code: calcDivergenceShader,
      }),
      entryPoint: "computeMain",
    },
  });
};
