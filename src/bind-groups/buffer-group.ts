import { createBufferBindGroupLayout } from "../bind-group-layouts/buffer-layout";
export const createBufferBindGroup = (device: GPUDevice, buffer: GPUBuffer) => {
  return device.createBindGroup({
    layout: createBufferBindGroupLayout(device),
    entries: [
      {
        binding: 0,
        resource: {
          buffer: buffer,
        },
      },
    ],
  });
};
