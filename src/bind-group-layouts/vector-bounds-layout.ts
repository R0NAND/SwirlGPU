export const createVectorBoundsBindGroupLayout = (device: GPUDevice) => {
  return device.createBindGroupLayout({
    label: "vector bounds bind group layout",
    entries: [
      {
        // vectors
        binding: 0,
        visibility: GPUShaderStage.COMPUTE,
        buffer: {
          type: "storage",
        },
      },
    ],
  });
};
