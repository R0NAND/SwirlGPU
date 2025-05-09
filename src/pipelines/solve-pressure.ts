import solvePressureShdr from "../compute-shaders/solve-pressure.wgsl";
import { createInOutBindGroupLayout } from "../bind-group-layouts/in-out-layout";
import { createSimParamsBindGroupLayout } from "../bind-group-layouts/sim-params-layout";
import { createBufferBindGroupLayout } from "../bind-group-layouts/buffer-layout";

export const createSolvePressurePipeline = (device: GPUDevice) => {
  return device.createComputePipeline({
    label: "solve pressure pipeline",
    layout: device.createPipelineLayout({
      bindGroupLayouts: [
        createSimParamsBindGroupLayout(device),
        createBufferBindGroupLayout(device),
        createInOutBindGroupLayout(device),
      ],
    }),
    compute: {
      module: device.createShaderModule({
        code: solvePressureShdr,
      }),
      entryPoint: "computeMain",
    },
  });
};
