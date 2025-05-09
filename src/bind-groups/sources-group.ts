import { createSourcesBindGroupLayout } from "../bind-group-layouts/sources-layout";

export const createSourcesBindGroup = (
  device: GPUDevice,
  sourceCount: GPUBuffer,
  sources: GPUBuffer
) => {
  return device.createBindGroup({
    layout: createSourcesBindGroupLayout(device),
    entries: [
      {
        binding: 0,
        resource: {
          buffer: sourceCount,
        },
      },
      {
        binding: 1,
        resource: {
          buffer: sources,
        },
      },
    ],
  });
};
