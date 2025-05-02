import solvePressureShdr from "../compute-shaders/solve-pressure.wgsl";
import { createSolvePressureBindGroupLayout } from "../bind-group-layouts/solve-pressure-layout";

export const createSolvePressurePipeline = (device: GPUDevice) => {
  return device.createComputePipeline({
    layout: device.createPipelineLayout({
      bindGroupLayouts: [createSolvePressureBindGroupLayout(device)],
    }),
    compute: {
      module: device.createShaderModule({
        code: solvePressureShdr,
      }),
      entryPoint: "computeMain",
    },
  });
};
