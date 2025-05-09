import advectDensityShader from "../compute-shaders/advect-density.wgsl";
import { createInOutBindGroupLayout } from "../bind-group-layouts/in-out-layout";
import { createSimParamsBindGroupLayout } from "../bind-group-layouts/sim-params-layout";

export const createAdvectDensityPipeline = (device: GPUDevice) => {
  return device.createComputePipeline({
    label: "advect density pipeline",
    layout: device.createPipelineLayout({
      bindGroupLayouts: [
        createSimParamsBindGroupLayout(device),
        createInOutBindGroupLayout(device),
        createInOutBindGroupLayout(device),
      ],
    }),
    compute: {
      module: device.createShaderModule({
        code: advectDensityShader,
      }),
      entryPoint: "computeMain",
    },
  });
};
