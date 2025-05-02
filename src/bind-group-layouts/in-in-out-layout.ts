export const createInInOutBindGroupLayout = (device: GPUDevice) => {
  return device.createBindGroupLayout({
    label: "in-in-out bind group layout",
    entries: [
      {
        // grid_size
        binding: 0,
        visibility: GPUShaderStage.COMPUTE,
        buffer: {},
      },
      {
        // field data 1 in
        binding: 1,
        visibility: GPUShaderStage.COMPUTE,
        buffer: {
          type: "read-only-storage",
        },
      },
      {
        // field data 2 in
        binding: 2,
        visibility: GPUShaderStage.COMPUTE,
        buffer: {
          type: "read-only-storage",
        },
      },
      {
        // field data out
        binding: 3,
        visibility: GPUShaderStage.COMPUTE,
        buffer: {
          type: "storage",
        },
      },
    ],
  });
};
