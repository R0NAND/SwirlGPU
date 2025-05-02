import sourcesShader from "../compute-shaders/sources.wgsl";
import { createSourcesBindGroupLayout } from "../bind-group-layouts/sources-layout";

export const createSourcesPipeline = (device: GPUDevice) => {
  return device.createComputePipeline({
    layout: device.createPipelineLayout({
      bindGroupLayouts: [createSourcesBindGroupLayout(device)],
    }),
    compute: {
      module: device.createShaderModule({
        code: sourcesShader,
      }),
      entryPoint: "computeMain",
    },
  });
};
