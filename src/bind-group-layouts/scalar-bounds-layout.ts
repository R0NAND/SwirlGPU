export const createScalarBoundsBindGroupLayout = (device: GPUDevice) => {
  return device.createBindGroupLayout({
    label: "scalar bounds bind group layout",
    entries: [
      {
        // grid_size
        binding: 0,
        visibility: GPUShaderStage.COMPUTE,
        buffer: {
          type: "uniform",
        },
      },
      {
        // scalars
        binding: 1,
        visibility: GPUShaderStage.COMPUTE,
        buffer: {
          type: "storage",
        },
      },
    ],
  });
};
