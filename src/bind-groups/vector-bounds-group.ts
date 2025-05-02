import { createVectorBoundsBindGroupLayout } from "../bind-group-layouts/vector-bounds-layout";

export const createVectorBoundsBindGroup = (
  device: GPUDevice,
  dimensions: GPUBuffer,
  vector: GPUBuffer
) => {
  return device.createBindGroup({
    layout: createVectorBoundsBindGroupLayout(device),
    entries: [
      {
        binding: 0,
        resource: {
          buffer: dimensions,
        },
      },
      {
        binding: 1,
        resource: {
          buffer: vector,
        },
      },
    ],
  });
};
