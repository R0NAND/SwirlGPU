import { createInOutBindGroupLayout } from "../bind-group-layouts/in-out-layout";
export const createInOutBindGroup = (
  device: GPUDevice,
  bufferIn: GPUBuffer,
  out: GPUBuffer
) => {
  return device.createBindGroup({
    layout: createInOutBindGroupLayout(device),
    entries: [
      {
        binding: 0,
        resource: {
          buffer: bufferIn,
        },
      },
      {
        binding: 1,
        resource: {
          buffer: out,
        },
      },
    ],
  });
};
