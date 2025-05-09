import sourcesShader from "../compute-shaders/sources.wgsl";
import { createSourcesBindGroupLayout } from "../bind-group-layouts/sources-layout";
import { createSimParamsBindGroupLayout } from "../bind-group-layouts/sim-params-layout";
import { createBufferBindGroupLayout } from "../bind-group-layouts/buffer-layout";

export const createSourcesPipeline = (device: GPUDevice) => {
  return device.createComputePipeline({
    label: "sources pipeline",
    layout: device.createPipelineLayout({
      bindGroupLayouts: [
        createSimParamsBindGroupLayout(device),
        createSourcesBindGroupLayout(device),
        createBufferBindGroupLayout(device),
        createBufferBindGroupLayout(device),
      ],
    }),
    compute: {
      module: device.createShaderModule({
        code: sourcesShader,
      }),
      entryPoint: "computeMain",
    },
  });
};
