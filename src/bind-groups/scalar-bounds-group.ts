import { createScalarBoundsBindGroupLayout } from "../bind-group-layouts/scalar-bounds-layout";

export const createScalarBoundsBindGroup = (
  device: GPUDevice,
  dimensions: GPUBuffer,
  scalar: GPUBuffer
) => {
  return device.createBindGroup({
    label: "set density boundaries bind group A",
    layout: createScalarBoundsBindGroupLayout(device),
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
          buffer: scalar,
        },
      },
    ],
  });
};
