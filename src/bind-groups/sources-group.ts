import { createSourcesBindGroupLayout } from "../bind-group-layouts/sources-layout";

export const createSourcesBindGroup = (
  device: GPUDevice,
  dimension: GPUBuffer,
  sourceCount: GPUBuffer,
  sources: GPUBuffer,
  velocityOut: GPUBuffer,
  densityOut: GPUBuffer
) => {
  return device.createBindGroup({
    layout: createSourcesBindGroupLayout(device),
    entries: [
      {
        binding: 0,
        resource: {
          buffer: dimension,
        },
      },
      {
        binding: 1,
        resource: {
          buffer: sourceCount,
        },
      },
      {
        binding: 2,
        resource: {
          buffer: sources,
        },
      },
      {
        binding: 3,
        resource: {
          buffer: velocityOut,
        },
      },
      {
        binding: 4,
        resource: {
          buffer: densityOut,
        },
      },
    ],
  });
};
