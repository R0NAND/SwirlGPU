export const createBufferBindGroupLayout = (device: GPUDevice) => {
  return device.createBindGroupLayout({
    label: "buffer bind group layout",
    entries: [
      {
        // field data
        binding: 0,
        visibility: GPUShaderStage.COMPUTE,
        buffer: {
          type: "storage",
        },
      },
    ],
  });
};
